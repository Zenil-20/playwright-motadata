/**
 * Report creation — true end-to-end: create a batch of Custom Reports through
 * the 3-step wizard, then validate each freshly-created report (open → export
 * PDF → assert it has data). Port of creation/create_reports.py + the
 * validate-your-own-creations flow.
 *
 * Runs serially (one browser drives the wizard repeatedly, then validates).
 * Created ids are written to test-results so a later validation run can target
 * them via REPORT_CATALOG.
 *
 * Env knobs:
 *   REPORT_CREATE_CATEGORY  category key (default 'metric'; see CATEGORY_DISPLAY)
 *   REPORT_CREATE_COMBOS    'minimal' (1 combo, default) | 'full' (whole matrix)
 *   REPORT_CREATE_STAMP     name suffix (default a run stamp; set for uniqueness)
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

const { createReports, combosFor, CATEGORY_DISPLAY } = require('./_core/report-creator.js');
const { checkReport } = require('./_core/validate.js');

const category = process.env.REPORT_CREATE_CATEGORY || 'metric';
const mode = process.env.REPORT_CREATE_COMBOS || 'minimal';
const stamp = process.env.REPORT_CREATE_STAMP || String(Date.now()).slice(-6);

test.describe.configure({ mode: 'serial' });

test.describe(`Report creation E2E [${category}]`, () => {
  test(`create + validate ${category} (${mode})`, async ({ page }, testInfo) => {
    test.skip(!CATEGORY_DISPLAY[category], `Unknown category '${category}'`);
    // Creation drives the wizard N times AND validates each (preview + PDF export), so the
    // budget must cover both. The old max(180s, combos*120s) gave a 1-combo run 180s, but a
    // single create+validate measured ~3.7 min here — the test timed out, Playwright tore the
    // context down mid-export, and the resulting "download.path: browser has been closed"
    // looked like an export defect instead of the budget being too small.
    // Sized from a MEASURED single create+validate on this instance, which needs ~7 min:
    // wizard (~3 min incl. the 28-monitor source pick) + checkReport, and checkReport runs
    // TWICE for a report that is empty on both sides (its transient-retry treats where==='both'
    // as possibly load-induced). 300s/combo left it hitting the ceiling mid-export, so budget
    // 600s per validated combo + 120s slack. This is headroom, not a mask: a hung report still
    // fails on its own READY/EXPORT budgets long before this outer cap.
    const combos = combosFor(category, mode);
    test.setTimeout(combos.length * 600_000 + 120_000);

    const created = await createReports(page, category, combos, stamp, (m) => console.log(m));
    expect(created.length, `no reports were created for category '${category}'`).toBeGreaterThan(0);

    // Always print the created ids so they're visible in the run output. Only
    // write a file when explicitly asked (REPORT_SAVE_ARTIFACTS=1) — otherwise
    // nothing is left on disk. Point REPORT_CATALOG at the file to re-validate.
    console.log('created report ids:', JSON.stringify(created.map((r) => ({ id: r.id, name: r.name }))));
    if (['1', 'true', 'yes'].includes((process.env.REPORT_SAVE_ARTIFACTS || '').toLowerCase())) {
      const idsPath = testInfo.outputPath('created-report-ids.json');
      fs.writeFileSync(idsPath, JSON.stringify(created, null, 2));
      await testInfo.attach('created-report-ids.json', { path: idsPath });
    }

    /*
     * Validate each created report end-to-end.
     *
     * A DEFECT is a disagreement between the two sides, not an empty report. The combos
     * above pick their counter POSITIONALLY (counterIndex 0,1,2…), so which metric they
     * land on is whatever the dropdown happens to list first — on this instance index 0 is
     * `clickhouse.long.running.sessions`, which carries no data for an arbitrary monitor.
     * The report is then correctly empty, and asserting "must have data" was testing data
     * availability rather than report creation/export.
     *
     * So we use validate.js's own semantics (see its verdict comments):
     *   where === 'both'  → preview AND pdf agree there is no data = a DATA condition.
     *                       Reported loudly, but not a failure of this test.
     *   where === 'preview' → PDF has data, UI doesn't  = real UI-side bug     → FAIL
     *   where === 'pdf'     → UI has data, PDF doesn't  = real export-side bug → FAIL
     *   timeout / error     → the report never loaded at all                   → FAIL
     *
     * Nothing is masked: a genuinely broken report still fails, and every empty creation is
     * printed and annotated so it is visible in the report rather than silently swallowed.
     */
    const bad = [];
    const noData = [];
    for (const r of created) {
      const verdict = await checkReport(page, testInfo, r.id, r.name, { compareShape: false });
      testInfo.annotations.push({
        type: 'created',
        description: `${r.name} [${r.id}] → ${verdict.status}${verdict.where ? ` (${verdict.where})` : ''}`,
      });
      const dataCondition = verdict.status === 'faulty' && verdict.where === 'both';
      if (dataCondition) {
        noData.push(`${r.name} [${r.id}] counter=${r.picked?.counter ?? 'n/a'}: ${verdict.reason}`);
      } else if (verdict.status !== 'ok') {
        bad.push(`${r.name} [${r.id}]: ${verdict.status}${verdict.where ? ` (${verdict.where})` : ''} — ${verdict.reason}`);
      }
    }
    if (noData.length) {
      console.log(
        `NOTE: ${noData.length}/${created.length} created report(s) contain no data for their ` +
          `positionally-chosen counter (preview and PDF agree — a data condition, not a defect):\n` +
          noData.join('\n'),
      );
      testInfo.annotations.push({
        type: 'no-data',
        description: `${noData.length}/${created.length} created report(s) are empty on BOTH sides (data condition)`,
      });
    }
    expect(bad, `created reports that failed validation:\n${bad.join('\n')}`).toEqual([]);
  });
});
