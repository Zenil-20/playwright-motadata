/**
 * Report regression — validate every report in the catalog.
 *
 * One test per report id, so Playwright's own worker pool parallelizes the run
 * (this replaces the Python run_parallel.py + watchdog.py entirely):
 *   - parallelism   → `workers` in playwright.config.ts (or --workers N)
 *   - per-report cap → test.setTimeout(PER_REPORT_TIMEOUT)
 *   - stalled report → the timeout fails just that test; the worker moves on
 *   - resume a crash → `npx playwright test --last-failed`
 *
 * Each report: open /reports/view/<id>, wait up to REPORT_READY_TIMEOUT (10s) for
 * the data to render — returning the moment it does — then export the PDF and
 * assert neither the preview nor the PDF shows a "No data" marker. A report whose
 * data never renders inside the budget fails with reason `timeout`. Preview and
 * PDF row/col counts are recorded for every report, pass or fail; set
 * REPORT_COMPARE_SHAPE=1 to additionally *assert* they match.
 *
 * Every verdict (status, reason, counts, screenshot) is attached to the test, and
 * _core/html-reporter.js turns the run into a single browsable HTML report.
 *
 * Env knobs:
 *   REPORT_CATALOG        path to the ids JSON (default _data/report-ids.json)
 *   REPORT_IDS            comma-separated subset of ids to run
 *   REPORT_LIMIT          only the first N ids
 *   REPORT_START          skip the first N ids
 *   REPORT_TIMELINE       override time range (e.g. this.month, -24h, 1w)
 *   REPORT_READY_TIMEOUT  seconds for data to render before `timeout` (default 10)
 *   REPORT_COMPARE_SHAPE  '1' → also assert row/col shape (default: report only)
 *   REPORT_SCREENSHOTS    all (default) | fail | off
 *   REPORT_HTML_DIR       where the HTML report goes
 *   PER_REPORT_TIMEOUT    hard cap per test, incl. PDF export (default 360s)
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

const { checkReport } = require('./_core/validate.js');
const { resolveTimeline, timelineChoices } = require('./_core/timeline.js');
const { acquireSlot, releaseSlot, CONCURRENCY } = require('./_core/slots.js');

function loadCatalog() {
  const file = process.env.REPORT_CATALOG
    ? path.resolve(process.cwd(), process.env.REPORT_CATALOG)
    : path.join(__dirname, '_data', 'report-ids.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Report catalog not found: ${file}. Run \`npm run reports:extract\` or point REPORT_CATALOG at one.`);
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
  if (!Array.isArray(raw)) throw new Error(`${file} is not a JSON array`);
  // Accept flat [id,...] or [{id,name},...].
  const entries = raw.map((it) => (typeof it === 'object' && it && 'id' in it ? it : { id: it }));

  const only = (process.env.REPORT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  let filtered = only.length ? entries.filter((e) => only.includes(String(e.id))) : entries;
  const start = Number(process.env.REPORT_START || 0);
  if (start > 0) filtered = filtered.slice(start);
  const limit = Number(process.env.REPORT_LIMIT || 0);
  if (limit > 0) filtered = filtered.slice(0, limit);
  return filtered;
}

const catalog = loadCatalog();
const timeline = resolveTimeline(process.env.REPORT_TIMELINE);
if (process.env.REPORT_TIMELINE && !timeline) {
  console.warn(`Warning: REPORT_TIMELINE=${process.env.REPORT_TIMELINE} did not match a known option. Valid: ${timelineChoices()}`);
}
const compareShape = ['1', 'true', 'yes'].includes((process.env.REPORT_COMPARE_SHAPE || '').toLowerCase());
const perReportSec = Number(process.env.PER_REPORT_TIMEOUT || 360);

/* The global config sets fullyParallel:false, which would pin all report tests
 * to a SINGLE worker (tests in one file run serially by default). Opt this file
 * into parallel mode so the reports fan out across workers. Each test still gets
 * its own fresh browser context (Playwright's default per-test isolation).
 *
 * Concurrency is NOT left to the global worker count: `acquireSlot()` gates each
 * check so at most REPORT_CONCURRENCY (default 4 — our proven-safe value) run at
 * once, no matter how many workers the full framework run uses. See _core/slots.js. */
test.describe.configure({ mode: 'parallel' });

test.describe(`Report regression (max ${CONCURRENCY} concurrent)`, () => {
  for (const entry of catalog) {
    const name = entry.name || `report_${entry.id}`;
    test(`${name} [${entry.id}]`, async ({ page }, testInfo) => {
      test.setTimeout(perReportSec * 1000);
      // Hold to the report module's own tested concurrency, independent of the
      // global worker count — this is what keeps the PDF-export queue healthy
      // when reports run as part of the whole suite.
      const slot = await acquireSlot();
      let verdict;
      try {
        verdict = await checkReport(page, testInfo, entry.id, name, { timeline, compareShape });
      } finally {
        releaseSlot(slot);
      }

      testInfo.annotations.push({
        type: 'verdict',
        description: `${verdict.status}${verdict.where ? ` (${verdict.where})` : ''}`,
      });
      testInfo.annotations.push({
        type: 'shape',
        description: `preview=${verdict.preview.rows}x${verdict.preview.cols} pdf=${verdict.pdf.rows}x${verdict.pdf.cols}`,
      });

      // The HTML reporter reads this attachment — it is how each worker's verdict
      // (status, reason, row/col counts, screenshot) reaches the final report.
      await testInfo.attach('report-verdict', {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify({ id: entry.id, name, ...verdict }), 'utf-8'),
      });

      expect(verdict.status, verdict.reason || `report ${entry.id} verdict was ${verdict.status}`).toBe('ok');
    });
  }
});
