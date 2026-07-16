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
async function checkReport(page, testInfo, rid, name, opts = {}) {
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
    shapeMatch: null,
    loadMs: 0,
    screenshot: null,
  };

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

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

    // ---- 2. export + parse the PDF (its own, much longer, server-side clock) ----
    const pdf = await exportAndParse(page);
    if (!pdf) {
      verdict.status = 'no_pdf';
      verdict.preview = shapeOf(previewRows);
      verdict.reason = 'Export As PDF produced no download (button missing, or the export queue never delivered)';
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
async function exportAndParse(page) {
  const download = await exportPdf(page);
  if (!download) return null;
  const pdfPath = await download.path();
  const buf = pdfPath ? await fs.promises.readFile(pdfPath) : Buffer.alloc(0);
  await download.delete().catch(() => {});
  const parsed = await pdfTextAndTables(new Uint8Array(buf)).catch(() => ({ ...EMPTY_PARSE }));
  return { buf, parsed };
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
