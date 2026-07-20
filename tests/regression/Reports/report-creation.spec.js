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
    // Creation drives the wizard N times + validates each — give it room.
    const combos = combosFor(category, mode);
    test.setTimeout(Math.max(180_000, combos.length * 120_000));

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

    // Validate each created report end-to-end.
    const bad = [];
    for (const r of created) {
      const verdict = await checkReport(page, testInfo, r.id, r.name, { compareShape: false });
      testInfo.annotations.push({ type: 'created', description: `${r.name} [${r.id}] → ${verdict.status}` });
      if (verdict.status !== 'ok') bad.push(`${r.name} [${r.id}]: ${verdict.status}${verdict.where ? ` (${verdict.where})` : ''}`);
    }
    expect(bad, `created reports that failed validation:\n${bad.join('\n')}`).toEqual([]);
  });
});
