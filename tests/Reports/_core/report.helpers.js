/**
 * Report-view browser driving — port of validate_reports.py's Playwright helpers.
 *
 * Specs already start authenticated via storageState (playwright.config.ts →
 * 'setup' project), so the Python `login()` is gone. Everything else — waiting
 * for the preview to settle, scraping preview text + table shape, flipping the
 * time range, and exporting the PDF — is preserved here.
 */
const { baseUrl } = require('./env.js');

// Report exports are async (socket event `ui.notification.csv.export.ready`);
// some large reports take minutes to generate. Keep generous.
const PDF_DOWNLOAD_TIMEOUT_MS = 300_000;

// How long a report's DATA gets to render before we call it a timeout. This is
// a *cap*, not a wait: waitForReportReady polls and returns the instant the
// grid/chart (or a genuine empty-state) is on screen, so a report that renders
// in 1.5s costs 1.5s. Only a report that is still spinning at the cap fails,
// with reason `timeout`. The PDF export is NOT under this clock — it is a
// server-side queue and has its own PDF_DOWNLOAD_TIMEOUT_MS.
const READY_TIMEOUT_MS = Math.max(1, Number(process.env.REPORT_READY_TIMEOUT || 10)) * 1000;
const READY_POLL_MS = 200;
// Tiny paint settle once data is detected, so charts are on the canvas for the
// screenshot. Not part of the timeout budget.
const READY_SETTLE_MS = Number(process.env.REPORT_READY_SETTLE || 300);

function reportUrl(rid) {
  return `${baseUrl()}/reports/view/${rid}`;
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

  let lastText = '';
  let lastState = 'no response from page';
  let ready = false;
  let emptyMarker = false;

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
      lastState = !state.hasExportBtn
        ? 'report view not loaded yet (no Export button)'
        : state.spinnerVisible
          ? 'spinner still visible'
          : state.onlyLoading
            ? 'still on "Loading..."'
            : 'no widget/table/chart rendered yet';
    }

    const left = deadline - Date.now();
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
async function exportPdf(page) {
  const btn = page.locator('button[title="Export As PDF"]').first();
  if ((await btn.count()) === 0) return null;
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: PDF_DOWNLOAD_TIMEOUT_MS }),
      btn.click(),
    ]);
    return download;
  } catch {
    return null;
  }
}

module.exports = {
  PDF_DOWNLOAD_TIMEOUT_MS,
  READY_TIMEOUT_MS,
  reportUrl,
  safeName,
  waitForReportReady,
  extractPreviewText,
  extractPreviewRows,
  setTimeline,
  exportPdf,
};
