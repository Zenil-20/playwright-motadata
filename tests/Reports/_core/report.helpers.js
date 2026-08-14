/**
 * Report-view browser driving — port of validate_reports.py's Playwright helpers.
 *
 * Specs already start authenticated via storageState (playwright.config.ts →
 * 'setup' project), so the Python `login()` is gone. Everything else — waiting
 * for the preview to settle, scraping preview text + table shape, flipping the
 * time range, and exporting the PDF — is preserved here.
 */
const { baseUrl } = require('./env.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ---- cross-worker export mutex -------------------------------------------------
// The Motadata export server only services a SMALL number of concurrent export
// jobs (measured: ~2). Beyond that, excess jobs are starved and never deliver —
// so with N Playwright workers each clicking "Export", some exports hang forever
// while others succeed. That is a SERVER concurrency ceiling, not a report defect
// and not a per-report race. We therefore serialize export clicks across ALL
// worker processes with a filesystem mutex (atomic mkdir), so at most
// EXPORT_CONCURRENCY exports are ever in flight. Each export then delivers in
// ~1-3s and pdfDelivered is reliable regardless of worker count.
const EXPORT_CONCURRENCY = Math.max(1, Number(process.env.REPORT_EXPORT_CONCURRENCY || 1));
const EXPORT_LOCK_ROOT = process.env.REPORT_EXPORT_LOCK_DIR || path.join(os.tmpdir(), 'mtd-report-export-locks');
// A held slot older than this is treated as abandoned (worker crashed mid-export)
// and reclaimed, so a dead worker can never deadlock the fleet.
const EXPORT_LOCK_STALE_MS = Number(process.env.REPORT_EXPORT_LOCK_STALE || 120) * 1000;
// Cap on how long we queue for a slot before proceeding best-effort (unlocked).
// Sized to outlast a full serialized run: with ~100+ reports exporting one-at-a-
// time, the last worker in line can legitimately wait many minutes, and falling
// through to an UNLOCKED export would re-introduce the very concurrency stall the
// mutex exists to prevent. Generous so the queue always drains in-order; the
// stale-slot reclaim (not this cap) is what recovers from a crashed holder.
const EXPORT_LOCK_MAX_WAIT_MS = Number(process.env.REPORT_EXPORT_LOCK_MAXWAIT || 1200) * 1000;

/** Run `fn` while holding one of EXPORT_CONCURRENCY export slots. Slots are lock
 *  directories under EXPORT_LOCK_ROOT; mkdir is atomic across processes. Stale
 *  slots (crashed workers) are reclaimed by age. Always releases in `finally`. */
async function withExportSlot(fn) {
  try {
    fs.mkdirSync(EXPORT_LOCK_ROOT, { recursive: true });
  } catch {
    /* ignore — proceed best-effort if the lock root can't be created */
  }
  const start = Date.now();
  let held = null;
  while (held === null && Date.now() - start < EXPORT_LOCK_MAX_WAIT_MS) {
    for (let slot = 0; slot < EXPORT_CONCURRENCY; slot++) {
      const dir = path.join(EXPORT_LOCK_ROOT, `slot-${slot}`);
      try {
        fs.mkdirSync(dir); // atomic acquire
        held = dir;
        break;
      } catch {
        // occupied — reclaim if abandoned
        try {
          if (Date.now() - fs.statSync(dir).mtimeMs > EXPORT_LOCK_STALE_MS) {
            fs.rmdirSync(dir);
          }
        } catch {
          /* raced with another worker — just retry */
        }
      }
    }
    if (held === null) await new Promise((r) => setTimeout(r, 200 + Math.floor(Math.random() * 200)));
  }
  try {
    return await fn();
  } finally {
    if (held) {
      try {
        fs.rmdirSync(held);
      } catch {
        /* already reclaimed */
      }
    }
  }
}

// Report exports are async (socket event `ui.notification.csv.export.ready`);
// some large reports take minutes to generate. Keep generous.
const PDF_DOWNLOAD_TIMEOUT_MS = 300_000;

// How long a report's DATA gets to render before we call it a timeout. This is
// a *cap*, not a wait: waitForReportReady polls and returns the instant the
// grid/chart (or a genuine empty-state) is on screen, so a report that renders
// in 1.5s costs 1.5s. Only a report that is still spinning at the cap fails,
// with reason `timeout`. The PDF export is NOT under this clock — it is a
// server-side queue and has its own PDF_DOWNLOAD_TIMEOUT_MS.
const READY_TIMEOUT_MS = Math.max(1, Number(process.env.REPORT_READY_TIMEOUT || 20)) * 1000;

/*
 * Hard ceiling for a report that is STILL VISIBLY WORKING past READY_TIMEOUT_MS.
 *
 * A fixed budget cannot tell "this report is broken" from "this report is heavy". On a
 * shared server a legitimately slow report was being failed as a timeout — the single
 * largest source of false failures in this suite. The budget is now progress-aware:
 * a report whose spinner is still up keeps its slot up to this ceiling, while one that
 * has gone idle with nothing on screen fails immediately at READY_TIMEOUT_MS instead of
 * sitting out the rest of the clock.
 *
 * This is NOT a retry — nothing is re-run. It only stops the stopwatch from firing while
 * the server is demonstrably still producing the report.
 */
const READY_MAX_MS = Math.max(1, Number(process.env.REPORT_READY_MAX || 90)) * 1000;

/** "12.5s" — for readable timeout diagnostics. */
function secsOf(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}
// How long to wait for the ASYNC PDF export to deliver a browser download before
// the caller falls back to the preview-based verdict. Generous by default so slow
// server-side export jobs still get validated, but bounded so a stalled export
// cannot hang a worker. Tune with REPORT_EXPORT_WAIT (seconds).
const EXPORT_WAIT_MS = Math.max(5, Number(process.env.REPORT_EXPORT_WAIT || 45)) * 1000;
// Upper bound for the "Export As PDF" CLICK itself (not the export job). Without this the
// click inherits Playwright's unbounded auto-wait — see the note in exportPdf().
const EXPORT_CLICK_TIMEOUT_MS = Math.max(5, Number(process.env.REPORT_EXPORT_CLICK_TIMEOUT || 30)) * 1000;
const READY_POLL_MS = 200;
// Tiny paint settle once data is detected, so charts are on the canvas for the
// screenshot. Not part of the timeout budget.
const READY_SETTLE_MS = Number(process.env.REPORT_READY_SETTLE || 300);

function reportUrl(rid) {
  return `${baseUrl()}/reports/view/${rid}`;
}

/*
 * ---- app-shell boot ----------------------------------------------------------
 *
 * Every report test gets a FRESH browser context, so every navigation is a COLD
 * SPA boot: Chromium re-fetches ~62 JS chunks over one HTTP/2 connection. Measured
 * on this instance, that boot alone costs ~15-16s when it works, and roughly 1 in 4
 * concurrent boots does not finish at all (either chunks come back
 * ERR_CONNECTION_CLOSED and the page stays blank, or the boot simply overruns).
 *
 * Two bugs came out of that, both fixed by booting EXPLICITLY before any report
 * logic runs:
 *
 *   1. A blank shell was mis-diagnosed. page.goto() does NOT throw here — the HTML
 *      document loads fine, only its sub-resources are dropped — so the old
 *      goto-retry never fired. Validation then blamed the REPORT ("no Export
 *      button") and creation blamed the INSTANCE ("category not available"), when
 *      the truth was that the app never mounted. A reload fixes it in ~3s.
 *   2. The ready budget was being spent on the wrong thing. READY_TIMEOUT_MS is
 *      documented as the budget for the report's DATA, but the shell's ~15s boot
 *      was inside it, leaving ~5s for the data itself and timing out healthy
 *      reports. Waiting for the shell here means that budget now measures only
 *      what it claims to.
 *
 * #user-avatar is the repo's canonical "app shell is up" hook (see
 * fixtures/auth.js) — it renders once the SPA has mounted its header.
 * Deliberately NOT a report-specific element: this proves the APP booted, and
 * leaves "did the report render" to waitForReportReady.
 */
const APP_SHELL_SEL = '#user-avatar';
const SHELL_BOOT_MS = Math.max(5, Number(process.env.REPORT_SHELL_BOOT || 60)) * 1000;
const SHELL_BOOT_TRIES = Math.max(1, Number(process.env.REPORT_SHELL_BOOT_TRIES || 3));

/**
 * Navigate to `url` and return only once the SPA has actually mounted. Re-navigates
 * (up to `tries`) when the shell doesn't come up — the retry is cheap because the
 * chunks that DID arrive are cached, so a recovery costs ~3s rather than a lost test.
 *
 * This is a transport-level retry, NOT a report-level one: it re-runs nothing except
 * the page load, so it cannot mask a report defect. A report that renders no data
 * still fails afterwards on its own budget.
 *
 * @returns {Promise<{booted:boolean, attempts:number, waitedMs:number, error:Error|null}>}
 */
async function gotoBooted(page, url, { tries = SHELL_BOOT_TRIES, bootMs = SHELL_BOOT_MS } = {}) {
  const started = Date.now();
  let lastErr = null;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      // waitUntil:'commit', NOT 'domcontentloaded'. Measured on this instance: /reports/create
      // intermittently never fires DOMContentLoaded at all — even at concurrency 1 — because a
      // stalled blocking script in <head> holds the parser open, so goto() sat out its full
      // timeout while curl fetched the same URL in 0.07s. 'commit' resolves as soon as the
      // response starts, and the shell wait below is the real readiness gate, so a stalled
      // sub-resource can no longer make navigation itself the bottleneck.
      await page.goto(url, { waitUntil: 'commit', timeout: 45_000 });
      await page.locator(APP_SHELL_SEL).first().waitFor({ state: 'visible', timeout: bootMs });
      return { booted: true, attempts: attempt, waitedMs: Date.now() - started, error: null };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      // Give the server a beat before re-requesting the bundle.
      await page.waitForTimeout(1500).catch(() => {});
    }
  }
  return { booted: false, attempts: tries, waitedMs: Date.now() - started, error: lastErr };
}

function safeName(s) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 140) || 'unnamed';
}

/**
 * Poll the report view until its data is on screen. Returns as soon as EITHER
 * substantive content has rendered OR a genuine empty-state marker is present —
 * whichever comes first — so a fast report costs only as long as it took.
 *
 * If neither happens before `timeoutMs` (default 10s), `ready` is false and the
 * caller fails the report with reason `timeout`. Note that an empty-state IS
 * "loaded" — it's a no-data failure, not a timeout; the two are different bugs
 * and the HTML report says which.
 *
 * @returns {Promise<{ready:boolean, emptyMarker:boolean, text:string, waitedMs:number, lastState:string}>}
 */
async function waitForReportReady(page, timeoutMs = READY_TIMEOUT_MS) {
  const started = Date.now();
  const deadline = started + timeoutMs;
  const hardDeadline = started + Math.max(timeoutMs, READY_MAX_MS);

  let lastText = '';
  let lastState = 'no response from page';
  let ready = false;
  let emptyMarker = false;
  // Is the app still visibly producing the report (spinner up / "Loading...")? Drives
  // the progress-aware extension below.
  let lastBusy = false;
  let extended = false;

  while (Date.now() < deadline) {
    const state = await page
      .evaluate(() => {
        const roots = ['.content-inner-panel', '.dashboard-container', '.floto-scroll-view', 'main'];
        let root = null;
        for (const sel of roots) {
          const el = document.querySelector(sel);
          if (el) {
            root = el;
            break;
          }
        }
        if (!root) root = document.body;
        const clone = root.cloneNode(true);
        clone.querySelectorAll('.ant-menu, nav, header, .floto-page-header').forEach((n) => n.remove());
        const text = (clone.innerText || '').trim();
        const tl = text.toLowerCase();
        const onlyLoading = text.length < 40 && /loading/i.test(text);
        const spinnerVisible = Array.from(
          document.querySelectorAll('.v-spinner, .ant-spin-spinning, svg.fa-spinner, .m-loader, .ant-spin-dot'),
        ).some((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        const hasRealContent =
          !!document.querySelector(
            '.vue-grid-item .ant-table, .vue-grid-item canvas, .vue-grid-item svg, ' +
              '.k-grid tbody tr, table tbody tr, .widget-container svg, ' +
              '.chart-container canvas, .widget-container canvas',
          ) || text.length > 200;
        const emptyPhrases = ['no data', 'no record', 'no results', 'nothing to show', 'please select group'];
        const emptyMarker = emptyPhrases.some((p) => tl.includes(p));
        // The report view's toolbar renders the Export button only once the
        // report itself has loaded. It is the one reliable "report is here"
        // signal — the text-length heuristic above false-positives on the app
        // shell's "Loading..." screen because a dev-inspector widget injected
        // into <body> dumps >200 chars of its own text before any report loads.
        const hasExportBtn = !!document.querySelector('button[title="Export As PDF"]');
        return { text, onlyLoading, spinnerVisible, hasRealContent, emptyMarker, hasExportBtn };
      })
      .catch(() => null);

    if (state) {
      lastText = state.text || lastText;
      if (
        state.hasExportBtn &&
        !state.onlyLoading &&
        !state.spinnerVisible &&
        (state.hasRealContent || state.emptyMarker)
      ) {
        ready = true;
        emptyMarker = state.emptyMarker;
        break;
      }
      // "Busy" means the app is demonstrably still working. A missing Export button is
      // deliberately NOT busy: that is equally the signature of a view that is simply
      // stuck, and treating it as busy would hold every broken report to the ceiling.
      lastBusy = state.spinnerVisible || state.onlyLoading;

      lastState = !state.hasExportBtn
        ? 'report view not loaded yet (no Export button)'
        : state.spinnerVisible
          ? 'spinner still visible'
          : state.onlyLoading
            ? 'still on "Loading..."'
            : 'no widget/table/chart rendered yet';
    }

    // Progress-aware budget. Past the soft deadline we branch on whether the app is
    // still demonstrably WORKING:
    //   - spinner up / "Loading..."  -> the server is still building the report. Failing
    //     here is a false negative: the report is healthy, just slower than the budget.
    //     Keep waiting, up to the hard ceiling.
    //   - idle, no content, no empty-state -> it is genuinely stuck. Fail NOW rather
    //     than burning the rest of the budget; this also frees the shared export slot
    //     sooner, which speeds up the whole suite.
    // Net effect: slow-but-healthy reports stop failing, and broken ones fail faster.
    if (Date.now() >= deadline) {
      const stillWorking = !!lastBusy;
      if (!stillWorking) break;
      if (Date.now() >= hardDeadline) {
        lastState += ` (still working at the ${secsOf(READY_MAX_MS)} ceiling)`;
        break;
      }
      if (!extended) {
        extended = true;
        lastState += ` (past ${secsOf(timeoutMs)}, still working — extending)`;
      }
    }

    const left = hardDeadline - Date.now();
    if (left <= 0) break;
    await page.waitForTimeout(Math.min(READY_POLL_MS, left));
  }

  // Measured at the moment the data appeared — the settle below is paint time we
  // choose to spend, not time the report took.
  const waitedMs = Date.now() - started;

  if (ready) {
    await page.waitForTimeout(READY_SETTLE_MS);
    lastText = await extractPreviewText(page).catch(() => lastText);
  }

  return { ready, emptyMarker, text: lastText, waitedMs, lastState };
}

/** Extract visible text from the report preview area, sidebar/nav stripped. */
async function extractPreviewText(page) {
  return page.evaluate(() => {
    const candidates = ['.content-inner-panel', '.dashboard-container', '.floto-scroll-view', '.page-layout__content', 'main'];
    let root = null;
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) {
        root = el;
        break;
      }
    }
    if (!root) root = document.body;
    const cloned = root.cloneNode(true);
    cloned.querySelectorAll('.ant-menu, nav, .floto-page-header, header').forEach((n) => n.remove());
    return (cloned.innerText || '').trim();
  });
}

/**
 * Count rows+cols in every preview table, virtual-scroll-safe. Kendo grids
 * recycle rows as you scroll, so we derive the row count from the grid's
 * scroll geometry (scrollHeight / rowHeight); plain/ant tables are enumerated
 * normally. Returns rows as string[][] (first row of each table is the header;
 * the compare cares only about shape).
 */
async function extractPreviewRows(page) {
  return page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    await sleep(600);
    const rows = [];

    // ---- Kendo Vue grids (virtualized) ----
    document.querySelectorAll('.k-grid').forEach((grid) => {
      const headerTr = grid.querySelector('thead tr:last-child');
      const headerCells = headerTr ? Array.from(headerTr.querySelectorAll('th')) : [];
      const headerText = headerCells
        .map((c) => (c.innerText || c.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const colCount = Math.max(headerCells.length, headerText.length);
      if (colCount < 2) return;

      const scroller = grid.querySelector('.k-grid-content, .k-virtual-content');
      const rendered = grid.querySelectorAll('tbody tr').length;
      const firstDataRow = grid.querySelector('tbody tr');
      const rowH = firstDataRow ? firstDataRow.getBoundingClientRect().height : 0;
      const scrollH = scroller ? scroller.scrollHeight : 0;
      const clientH = scroller ? scroller.clientHeight : 0;
      const isVirtualized = scrollH > clientH + Math.max(rowH, 20);
      const dataRows = isVirtualized && rowH > 4 ? Math.max(1, Math.round(scrollH / rowH)) : rendered;
      for (let i = 0; i < dataRows; i++) rows.push(new Array(colCount).fill('x'));
    });

    // ---- Plain HTML tables and Ant tables (not inside a k-grid) ----
    const seenHtml = new Set();
    document.querySelectorAll('table, .ant-table-row').forEach((node) => {
      if (node.closest('.k-grid')) return;
      const trList = node.tagName === 'TABLE' ? Array.from(node.querySelectorAll('tr')) : [node];
      trList.forEach((tr) => {
        const cellNodes = Array.from(tr.querySelectorAll('td, th, [role="cell"], [role="columnheader"]'));
        if (!cellNodes.length) return;
        const allHeader = cellNodes.every((c) => c.tagName === 'TH' || c.getAttribute('role') === 'columnheader');
        if (allHeader) return;
        const cells = cellNodes
          .map((c) => (c.innerText || c.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
        if (cells.length < 2) return;
        const key = cells.join('|');
        if (seenHtml.has(key)) return;
        seenHtml.add(key);
        rows.push(cells);
      });
    });

    return rows;
  });
}

/**
 * True if the report preview contains a rendered chart/graph (a sized canvas or
 * svg widget). Chart data lives in canvas pixels the DOM can't read, so this only
 * tells us a chart is PRESENT — the caller pairs it with the PDF's row count to
 * decide whether that chart actually carries data (an empty chart still paints
 * axes). Kept separate from extractPreviewRows, which counts only table rows.
 */
async function previewHasChart(page) {
  return page
    .evaluate(() => {
      const sel =
        '.vue-grid-item canvas, .vue-grid-item svg, .widget-container canvas, ' +
        '.widget-container svg, .chart-container canvas, .chart-container svg';
      return Array.from(document.querySelectorAll(sel)).some((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 20 && r.height > 20;
      });
    })
    .catch(() => false);
}

async function waitForReportLoaderIdle(page, settleMs = 1500, timeoutMs = 60_000) {
  const loaderSel =
    '.content-inner-panel .v-spinner, .content-inner-panel .ant-spin-spinning, ' +
    '.content-inner-panel .k-loading-mask, .content-inner-panel .loader-wrapper, ' +
    '.dashboard-container .v-spinner, .dashboard-container .ant-spin-spinning, ' +
    '.widget-container .v-spinner, .widget-container .ant-spin-spinning, ' +
    '.vue-grid-item .v-spinner, .vue-grid-item .ant-spin-spinning, .vue-grid-item .k-loading-mask';
  try {
    await page.waitForSelector(loaderSel, { state: 'visible', timeout: settleMs });
  } catch {
    await page.waitForTimeout(400);
    return;
  }
  await page.waitForSelector(loaderSel, { state: 'hidden', timeout: timeoutMs }).catch(() => {});
  await page.waitForTimeout(800);
}

/**
 * Open the report's time-range picker and select `option`. Returns false if the
 * picker is absent (inventory/config reports have none) or the option is missing.
 */
async function setTimeline(page, option) {
  const trigger = page.locator('.time-range-picker-input').first();
  if ((await trigger.count().catch(() => 0)) === 0) return false;
  try {
    await trigger.click();
  } catch {
    return false;
  }
  try {
    await page.waitForSelector('.timerange-dropdown-overlay .range-item', { state: 'visible', timeout: 5000 });
  } catch {
    return false;
  }
  const item = page
    .locator(`.timerange-dropdown-overlay .range-item a:has(span:text-is("${option.text}"))`)
    .first();
  if ((await item.count()) === 0) {
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }
  try {
    await item.click();
  } catch {
    return false;
  }
  await page.waitForSelector('.timerange-dropdown-overlay', { state: 'hidden', timeout: 5000 }).catch(() => {});
  // Let the re-query's spinner clear so the ready-poll can't latch onto the
  // previous range's rows. Bounded by the same data budget, not the old 60s.
  await waitForReportLoaderIdle(page, 1500, READY_TIMEOUT_MS);
  return true;
}

/**
 * Click "Export As PDF" and wait for the async socket-driven download. Returns
 * the saved Download, or null if the button is missing / the export times out.
 */
/** True if an export toast ("Exporting <name>…") appeared within `ms` — i.e. the
 *  async export job actually started, so we can tell a slow job from a dead button. */
async function exportStarted(page, ms = 8000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const seen = await page
      .evaluate(() =>
        Array.from(
          document.querySelectorAll('.ant-notification-notice, .ant-message-notice, [class*="notification-notice"]'),
        ).some((e) => /export/i.test(e.textContent || '')),
      )
      .catch(() => null);
    if (seen) return true;
    if (seen === null) return false; // page/context gone — bail instead of throwing
    try {
      await page.waitForTimeout(300);
    } catch {
      return false; // page closed mid-wait — treat as "not confirmed started"
    }
  }
  return false;
}

/**
 * Trigger the report's PDF export and wait for the file.
 *
 * Motadata report export is an ASYNC SERVER JOB: clicking "Export As PDF" enqueues
 * a job that streams progress over the websocket (ui.notification.report.progress)
 * and, on completion, delivers the file as a browser download. Small/fast reports
 * download within seconds; heavy ones take much longer or (rarely) stall. So we
 * confirm the job actually STARTED (the "Exporting…" toast) to tell a slow job
 * from a dead button, wait up to `timeoutMs` for the download, and return a STATUS
 * — never a bare null — so the caller can fall back to the preview instead of
 * mis-reporting a slow async export as "no PDF".
 *
 * @returns {Promise<{status:'downloaded', download:import('@playwright/test').Download}
 *                  | {status:'no_button'|'async_pending'|'no_download'}>}
 */
async function exportPdf(page, { timeoutMs = EXPORT_WAIT_MS } = {}) {
  const btn = page.locator('button[title="Export As PDF"]').first();
  if ((await btn.count()) === 0) return { status: 'no_button' };
  // Serialize the export click across ALL workers: the server starves concurrent
  // export jobs beyond its small ceiling, so we hold an export slot for the whole
  // click→download window. Inside the slot at most EXPORT_CONCURRENCY exports run,
  // so the download reliably arrives in seconds instead of stalling forever.
  return withExportSlot(async () => {
    if (page.isClosed?.()) return { status: 'no_download' };
    // Arm the download listener BEFORE clicking so a fast delivery can't race us.
    const downloadP = page.waitForEvent('download', { timeout: timeoutMs }).catch(() => null);
    /*
     * BOUNDED click. This used to be a bare btn.click(), and no actionTimeout is configured,
     * so Playwright's auto-wait had NO upper bound: whenever the Export button was present but
     * not clickable (a spinner or an Ant toast covering it fails the "receives events" check),
     * the click waited until the TEST timeout killed the worker. Measured: one create+validate
     * burned 11 of its 12 minutes inside this single click, and the `.catch(() => {})` below
     * never ran because the promise never settled — the failure surfaced instead as
     * "locator.click: Test timeout exceeded", which reads like an export defect.
     * Bounding it means an unclickable button costs seconds and falls back to the preview verdict.
     */
    const clickErr = await btn
      .click({ timeout: EXPORT_CLICK_TIMEOUT_MS })
      .then(() => null)
      .catch((e) => e);
    if (clickErr) {
      // Don't leave the armed listener dangling — it is already .catch()'d, so just report.
      return { status: 'click_failed', detail: String(clickErr.message || clickErr).split('\n')[0] };
    }
    const started = await exportStarted(page, 8000);
    const download = await downloadP;
    if (download) return { status: 'downloaded', download };
    return { status: started ? 'async_pending' : 'no_download' };
  });
}

module.exports = {
  EXPORT_WAIT_MS,
  PDF_DOWNLOAD_TIMEOUT_MS,
  READY_TIMEOUT_MS,
  APP_SHELL_SEL,
  SHELL_BOOT_MS,
  gotoBooted,
  reportUrl,
  safeName,
  waitForReportReady,
  extractPreviewText,
  extractPreviewRows,
  previewHasChart,
  setTimeline,
  exportPdf,
};
