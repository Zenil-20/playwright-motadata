/**
 * Per-report validation — port of validate_reports.py's `check_report`.
 *
 * Opens one report, waits (up to REPORT_READY_TIMEOUT, default 10s) for its data
 * to render, captures the preview shape, exports the PDF, parses it in memory,
 * and decides pass/fail. Three layers of check:
 *   1. timeout  — data never rendered inside the budget            → timeout
 *   2. no-data  — preview OR pdf shows a "No data" marker          → faulty
 *   3. shape    — (opt-in) preview vs pdf row×col mismatch         → faulty
 *
 * The 10s budget is a CAP, not a wait: a report whose grid paints in 1.4s costs
 * 1.4s. It covers the report's own data render only — the PDF export is a
 * server-side queue and keeps its long async wait (PDF_DOWNLOAD_TIMEOUT_MS).
 *
 * Every report — pass or fail — yields a screenshot and preview/PDF row×col
 * counts, which the HTML reporter (_core/html-reporter.js) renders. Set
 * REPORT_SCREENSHOTS=fail to shoot only failures, or =off for none.
 */
const fs = require('node:fs');
const path = require('node:path');
const { comparePair } = require('./compare.js');
const { pdfTextAndTables } = require('./pdf.js');
const {
  READY_TIMEOUT_MS,
  EXPORT_WAIT_MS,
  APP_SHELL_SEL,
  gotoBooted,
  reportUrl,
  safeName,
  waitForReportReady,
  extractPreviewRows,
  previewHasChart,
  setTimeline,
  exportPdf,
} = require('./report.helpers.js');

const SAVE_ARTIFACTS = ['1', 'true', 'yes'].includes((process.env.REPORT_SAVE_ARTIFACTS || '').toLowerCase());
// all (default) | fail | off
const SCREENSHOTS = (process.env.REPORT_SCREENSHOTS || 'all').toLowerCase();

const EMPTY_SHAPE = { rows: 0, cols: 0 };
const EMPTY_PARSE = { text: '', header: [], cols: 0, dataRows: [] };
// Grace re-read of the preview when the PDF has data but the preview shows none:
// heavy Kendo grids can satisfy "ready" on their scaffold a beat before the rows
// paint. A bounded DOM re-read, never an export — so it cannot hang.
const PREVIEW_RECHECK_MS = Number(process.env.REPORT_PREVIEW_RECHECK || 2500);
const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;

/**
 * @typedef {Object} Verdict
 * @property {'ok'|'timeout'|'faulty'|'no_pdf'|'error'} status
 * @property {''|'preview'|'pdf'|'both'} where     which side was empty
 * @property {string} reason                        human-readable "why", shown in the HTML report
 * @property {{rows:number, cols:number}} preview   UI preview row/col count
 * @property {{rows:number, cols:number}} pdf       exported-PDF row/col count
 * @property {boolean|null} shapeMatch              null when there was nothing to compare
 * @property {number} loadMs                        how long the data actually took to render
 * @property {string|null} screenshot               absolute path, when captured
 */

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {number|string} rid
 * @param {string} name
 * @param {{ timeline?: object|null, compareShape?: boolean }} opts
 * @returns {Promise<Verdict>}
 */
/**
 * Public entry. Runs the check and RETRIES ONCE when the first pass is empty on
 * BOTH sides or errors. Under 4-worker load a report often paints its scaffold a
 * beat before the data arrives (a false "no data"), or the context hiccups — a
 * single reload + re-read settles both. A GENUINELY empty report stays empty on
 * the retry, so this never masks a real defect, it only removes load-induced flake.
 */
async function checkReport(page, testInfo, rid, name, opts = {}) {
  const transient = (v) => v && (v.status === 'error' || v.where === 'both');
  const v = await attemptCheck(page, testInfo, rid, name, opts);
  if (!transient(v)) return v;
  const again = await attemptCheck(page, testInfo, rid, name, opts).catch(() => null);
  if (again && !transient(again)) return again; // the retry found data → trust it
  if (again && again.status !== 'error') return again; // prefer a clean empty verdict over an error
  return v;
}

async function attemptCheck(page, testInfo, rid, name, opts = {}) {
  const stem = `${safeName(name)}__${rid}`;
  const url = reportUrl(rid);
  /** @type {Verdict} */
  const verdict = {
    status: 'error',
    where: '',
    reason: '',
    url, // deep link to the report in the app — the HTML report turns this into a one-click repro
    preview: { ...EMPTY_SHAPE },
    pdf: { ...EMPTY_SHAPE },
    pdfDelivered: true, // set false when the async export never delivered a file
    shapeMatch: null,
    loadMs: 0,
    screenshot: null,
  };

  try {
    // Navigate AND wait for the SPA to mount before anything else. The old loop
    // retried only when goto() itself threw, which never happened for the failure
    // that actually bites here: the document loads, its JS chunks are dropped, and
    // the page sits blank. That was being reported as the REPORT timing out ("no
    // Export button") instead of the app never booting. gotoBooted re-navigates
    // until the shell is up, so what follows measures the report, not the bundle.
    const boot = await gotoBooted(page, url);
    if (!boot.booted) {
      // Honest, self-describing verdict: this is an environment/transport failure,
      // NOT a report defect — and it is kept distinct from `timeout` so the HTML
      // report never blames a report for an app that never loaded.
      verdict.status = 'error';
      verdict.reason =
        `App shell never mounted (${APP_SHELL_SEL} not visible) after ${boot.attempts} navigation attempt(s) ` +
        `in ${secs(boot.waitedMs)} — the SPA bundle failed to load, so the report was never reachable. ` +
        `Last error: ${boot.error ? boot.error.message.split('\n')[0] : 'unknown'}`;
      await capture(testInfo, page, verdict, stem, false).catch(() => {});
      return verdict;
    }
    verdict.shellBootMs = boot.waitedMs;
    verdict.shellAttempts = boot.attempts;

    if (opts.timeline) {
      try {
        await page.waitForSelector('.time-range-picker-input', { state: 'visible', timeout: 10_000 });
        await setTimeline(page, opts.timeline);
      } catch {
        /* report has no time range (inventory/config) — use its default */
      }
    }

    // ---- 1. data-ready, with the 10s cap. Returns the moment data is there. ----
    const ready = await waitForReportReady(page, READY_TIMEOUT_MS);
    verdict.loadMs = ready.waitedMs;

    if (!ready.ready) {
      verdict.status = 'timeout';
      verdict.reason = `Timed out after ${secs(READY_TIMEOUT_MS)} — report data never rendered (${ready.lastState})`;
      await capture(testInfo, page, verdict, stem, false);
      return verdict;
    }

    // Row/col counts are collected for EVERY report, pass or fail — they are the
    // evidence in the HTML report, not just an input to the opt-in assertion.
    let previewRows = await extractPreviewRows(page).catch(() => []);
    // Chart presence is captured now, while the report is still on screen (before
    // the export). Paired with the PDF row count below to tell a chart-with-data
    // apart from an empty grid — both have zero DOM table rows.
    const hasChart = await previewHasChart(page);

    // ---- 2. export + parse the PDF (async server job — its own long clock) ------
    // Exports are SERIALIZED fleet-wide (the server starves concurrent export
    // jobs), so each export holds a shared slot. A report whose preview already
    // has data gets the full export budget; one with an empty preview gets a
    // short bounded wait — it is almost certainly genuinely empty, and making it
    // hold the slot for the full budget would throttle every other worker.
    const previewHasDataPre = previewRows.length > 0 || hasChart;
    const pdf = await exportAndParse(page, {
      timeoutMs: previewHasDataPre ? EXPORT_WAIT_MS : Math.min(EXPORT_WAIT_MS, 15_000),
    });

    // Export did NOT deliver a browser download. Motadata's export is an async
    // server job; heavy reports deliver very slowly or via the notification path,
    // which this browser download listener can't see. A slow/async export is NOT a
    // report defect, so we FALL BACK to the preview (the primary signal) instead of
    // mis-flagging "no PDF": if the preview has data, the report passes (with the
    // PDF marked undelivered + an accurate reason); only a report that is empty on
    // BOTH sides — or whose view never loaded — is a real failure.
    if (pdf.status !== 'downloaded') {
      const previewHasData = previewRows.length > 0 || hasChart;
      verdict.preview = shapeOf(previewRows);
      verdict.pdf = { ...EMPTY_SHAPE };
      verdict.pdfDelivered = false;
      if (previewHasData) {
        verdict.status = 'ok';
        verdict.reason =
          pdf.status === 'async_pending'
            ? `Preview has data (${previewRows.length || 'chart'}); PDF export is an async server job that did not deliver within ${secs(EXPORT_WAIT_MS)} — not a report defect.`
            : pdf.status === 'click_failed'
              ? `Preview has data (${previewRows.length || 'chart'}); the Export button was present but not clickable (${pdf.detail || 'click timed out'}) — export not exercised, verify manually.`
              : `Preview has data (${previewRows.length || 'chart'}); the PDF export produced no download — verify export manually.`;
        await capture(testInfo, page, verdict, stem, true);
        return verdict;
      }
      // Empty preview AND no PDF — cannot corroborate. Report honestly.
      verdict.where = 'both';
      verdict.status = pdf.status === 'no_button' ? 'timeout' : 'faulty';
      verdict.reason =
        pdf.status === 'no_button'
          ? 'Report view never fully loaded (no Export button), and the preview is empty.'
          : pdf.status === 'click_failed'
            ? `The preview is empty and the Export button was present but not clickable (${pdf.detail || 'click timed out'}) — export could not corroborate.`
            : `No data in the preview and the async PDF export did not deliver within ${secs(EXPORT_WAIT_MS)} — likely genuinely empty, or the export stalled server-side.`;
      await capture(testInfo, page, verdict, stem, false);
      return verdict;
    }

    const parsed = pdf.parsed;
    const pdfBuf = pdf.buf;
    const pdfEmpty = parsed.dataRows.length === 0;

    // Preview lagging the export: the PDF tabulated data but the preview shows no
    // rows and it isn't a chart. Heavy Kendo grids can satisfy "ready" on their
    // scaffold a beat before the data paints, so re-read the preview ONCE after a
    // short settle before trusting a "UI-side" verdict. A cheap DOM re-read — never
    // an export, so unlike a re-export it cannot hang on the download queue.
    if (!pdfEmpty && previewRows.length === 0 && !hasChart) {
      await page.waitForTimeout(PREVIEW_RECHECK_MS);
      const again = await extractPreviewRows(page).catch(() => []);
      if (again.length > 0) previewRows = again;
    }

    const compare = comparePair(previewRows, parsed, true);
    verdict.preview = { rows: compare.previewRows, cols: compare.previewCols };
    verdict.pdf = { rows: compare.pdfRows, cols: compare.pdfCols };
    verdict.shapeMatch = compare.reason === 'no_data' ? null : compare.status === 'pass';
    verdict.srNoColumn = compare.pdfSrNo;

    // ---- 3. verdict — decide emptiness from real DATA ROWS, not text -----------
    // A report's header/scaffold text is ALWAYS present (title, category, column
    // definitions), so a text heuristic calls a data-less report "full" and mints
    // false "export bug"s. The exported PDF always tabulates real data — even a
    // chart's underlying series — so its data-row count is the ground truth. The
    // preview counts table rows PLUS a rendered chart, but only when the PDF
    // confirms data exists (an empty chart still paints axes; the PDF corroborates
    // whether that chart actually carries data).
    const previewEmpty = compare.previewRows === 0 && !(hasChart && !pdfEmpty);

    // A defect is a DISAGREEMENT between the two sides — one has data, the other
    // doesn't. Both empty means the report genuinely has no data for this range (a
    // data condition, reported as `both`, not a UI/export defect).
    if (previewEmpty && pdfEmpty) verdict.where = 'both';
    else if (previewEmpty) verdict.where = 'preview';
    else if (pdfEmpty) verdict.where = 'pdf';

    const shapeFail = opts.compareShape && verdict.shapeMatch === false;

    if (!verdict.where && !shapeFail) {
      verdict.status = 'ok';
      verdict.reason = '';
      await capture(testInfo, page, verdict, stem, true);
      return verdict;
    }

    verdict.status = 'faulty';
    verdict.reason = verdict.where ? noDataReason(verdict.where) : shapeReason(compare);

    if (SAVE_ARTIFACTS) {
      await saveArtifact(testInfo, `${stem}/preview.txt`, Buffer.from(ready.text, 'utf-8'));
      if (pdfBuf.length) await saveArtifact(testInfo, `${stem}/${stem}.pdf`, pdfBuf);
    }
    await capture(testInfo, page, verdict, stem, false);
    return verdict;
  } catch (e) {
    verdict.status = 'error';
    verdict.reason = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    await capture(testInfo, page, verdict, stem, false).catch(() => {});
    return verdict;
  }
}

/**
 * Click "Export As PDF", read the download into memory, delete the on-disk file
 * so nothing lingers in the browser temp dir, and parse text + table shape in one
 * pass. Returns { buf, parsed } or null when no download was produced. Shared by
 * the first export and the single export-race retry.
 */
async function exportAndParse(page, { retries = 1, timeoutMs } = {}) {
  let last = { status: 'no_download' };
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await exportPdf(page, timeoutMs ? { timeoutMs } : {});
    if (res.status === 'downloaded') {
      const pdfPath = await res.download.path();
      const buf = pdfPath ? await fs.promises.readFile(pdfPath) : Buffer.alloc(0);
      await res.download.delete().catch(() => {});
      const parsed = await pdfTextAndTables(new Uint8Array(buf)).catch(() => ({ ...EMPTY_PARSE }));
      return { status: 'downloaded', buf, parsed };
    }
    last = res;
    if (res.status === 'no_button') break; // report view isn't up — a retry won't help
    if (attempt < retries) await page.waitForTimeout(2000); // transient click/queue race — retry once
  }
  return last; // { status: 'async_pending' | 'no_download' | 'no_button' }
}

function shapeOf(rows) {
  if (!rows.length) return { ...EMPTY_SHAPE };
  return { rows: rows.length, cols: Math.max(...rows.map((r) => r.length)) };
}

function noDataReason(where) {
  if (where === 'both') return 'No data — the UI preview and the exported PDF are both empty';
  if (where === 'preview') return 'No data in the UI preview, but the exported PDF has data (UI-side bug)';
  return 'No data in the exported PDF, but the UI preview shows data (export-side bug)';
}

function shapeReason(c) {
  const what = { rows: 'row counts differ', cols: 'column counts differ', rows_cols: 'row and column counts differ' }[
    c.reason
  ] || c.reason;
  return `Preview vs export mismatch — ${what}: preview ${c.previewRows}x${c.previewCols}, PDF ${c.pdfRows}x${c.pdfCols}`;
}

/**
 * Screenshot the report and hand it to the reporter. Taken for passes too — the
 * HTML report shows the rendered report next to its verdict, which is what makes
 * a pass reviewable instead of just asserted.
 */
async function capture(testInfo, page, verdict, stem, passed) {
  if (SCREENSHOTS === 'off') return;
  if (SCREENSHOTS === 'fail' && passed) return;
  const dest = testInfo.outputPath('report-shots', `${stem}.png`);
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const buf = await page.screenshot({ fullPage: true, path: dest }).catch(() => null);
  if (!buf) return;
  verdict.screenshot = dest;
  await testInfo.attach('report-screenshot', { path: dest, contentType: 'image/png' }).catch(() => {});
}

async function saveArtifact(testInfo, rel, data) {
  if (!data.length) return;
  const dest = testInfo.outputPath('faulty', rel);
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.writeFile(dest, data);
  await testInfo.attach(rel, { path: dest });
}

module.exports = { checkReport };
