/**
 * Report creation MATRIX — the new creation automation. Creates 5–8 reports
 * per report type (every category on the create page's step-1 grid), each
 * with a different scenario (counters, monitor counts, source-filter kinds,
 * forecast types/ranges, severities, thresholds, …), and records every
 * backend-assigned report id.
 *
 * This is separate from report-creation.spec.js (the original 3-category
 * creator) — nothing existing is touched.
 *
 * One test per category; categories fan out across workers (same
 * REPORT_CONCURRENCY slot gate as validation, so the server stays healthy).
 * Scenarios inside a category run serially through the wizard.
 *
 * Created ids are appended to _data/created-report-ids.local.json (or
 * CREATE_OUT). Validate the batch with the DEFAULT validator afterwards:
 *
 *   npx playwright test --project=reports report-creation-matrix.spec.js
 *   REPORT_CATALOG=tests/Reports/_data/created-report-ids.local.json \
 *     npx playwright test --project=reports report-validation.spec.js
 *
 * …or chain both in one run with CREATE_VALIDATE=1 (each category test
 * validates its own creations right after creating them — preview + PDF
 * export, the same checkReport the default validator uses).
 *
 * Env knobs:
 *   CREATE_CATEGORIES  'all' (default) | comma list of category keys
 *   CREATE_LIMIT       cap scenarios per category (e.g. 1 = smoke)
 *   CREATE_SOFT        comma list of categories whose failures don't fail the
 *                      test (default: the instance/data-dependent ones marked
 *                      soft in categories.js). 'none' disables softness.
 *   CREATE_OUT         ids output file (default _data/created-report-ids.local.json)
 *   CREATE_STAMP       name suffix (default run stamp) — names look like
 *                      auto-<category>-<scenario>-<stamp>
 *   CREATE_VALIDATE    '1' → validate each created report in the same test
 */
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

const { CATEGORIES } = require('./_core/creation/categories.js');
const { createOne, TileMissingError, SkipScenarioError } = require('./_core/creation/wizard.js');
const { appendIds } = require('./_core/creation/ids-store.js');
const { checkReport } = require('./_core/validate.js');
const { acquireSlot, releaseSlot, CONCURRENCY } = require('./_core/slots.js');

const stamp = process.env.CREATE_STAMP || String(Date.now()).slice(-6);
const limit = Number(process.env.CREATE_LIMIT || 0);
const chainValidate = ['1', 'true', 'yes'].includes((process.env.CREATE_VALIDATE || '').toLowerCase());

function wantedCategories() {
  const raw = (process.env.CREATE_CATEGORIES || 'all').trim();
  if (raw === 'all') return Object.keys(CATEGORIES);
  const keys = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = keys.filter((k) => !CATEGORIES[k]);
  if (unknown.length) throw new Error(`Unknown CREATE_CATEGORIES key(s): ${unknown.join(', ')}. Known: ${Object.keys(CATEGORIES).join(', ')}`);
  return keys;
}

function softSet() {
  const raw = process.env.CREATE_SOFT;
  if (raw === 'none') return new Set();
  if (raw != null && raw.trim() !== '') return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
  return new Set(Object.keys(CATEGORIES).filter((k) => CATEGORIES[k].soft));
}

const keys = wantedCategories();
const soft = softSet();

// Fan categories out across workers (the global config is fullyParallel:false,
// which would otherwise pin them all to one worker).
test.describe.configure({ mode: 'parallel' });

test.describe(`Report creation matrix (max ${CONCURRENCY} concurrent)`, () => {
  for (const key of keys) {
    const cat = CATEGORIES[key];
    const scenarios = limit > 0 ? cat.scenarios.slice(0, limit) : cat.scenarios;
    const isSoft = soft.has(key);

    test(`create matrix: ${key} — ${scenarios.length} scenario(s)${isSoft ? ' [soft]' : ''}`, async ({ page }, testInfo) => {
      // Wizard + preview per scenario, PDF export per scenario when chained.
      test.setTimeout(scenarios.length * (chainValidate ? 300_000 : 150_000) + 120_000);

      const slot = await acquireSlot();
      const created = [];
      const failed = [];
      const skipped = [];
      const results = []; // one record per scenario, for the creation HTML reporter
      try {
        for (const s of scenarios) {
          const name = `auto-${key}-${s.name}-${stamp}`;
          const shotPath = testInfo.outputPath(`create-${slugify(key)}-${slugify(s.name)}.png`);
          console.log(`[${key}] creating: ${name}`);
          try {
            const { id, picked } = await createOne(page, cat, s, name, { shotPath });
            if (id) {
              created.push({ id, name, category: key, scenario: s.name, picked });
              results.push({ category: key, scenario: s.name, name, id, status: 'created', picked, shotPath });
              console.log(`[${key}]   id=${id}  ${Object.entries(picked).map(([k, v]) => `${k}=${v}`).join(', ')}`);
            } else {
              const reason = 'no id captured (POST /visualization/reports never returned an id — likely a step-3 validation error)';
              failed.push(`${s.name}: ${reason}`);
              await attachShot(page, testInfo, `${key}-${s.name}`, shotPath);
              results.push({ category: key, scenario: s.name, name, id: null, status: 'failed', reason, picked: {}, shotPath });
            }
          } catch (e) {
            if (e instanceof TileMissingError) {
              if (!created.length && !failed.length && !skipped.length) {
                // Category not on this instance — record EVERY scenario as not-available so the
                // report shows the full matrix (all categories), then skip the test cleanly.
                for (const sc of scenarios) {
                  results.push({ category: key, scenario: sc.name, name: `auto-${key}-${sc.name}-${stamp}`, id: null, status: 'skipped', reason: e.message, picked: {}, shotPath: null });
                }
                await testInfo.attach('creation-results', {
                  contentType: 'application/json',
                  body: Buffer.from(JSON.stringify(results, null, 2), 'utf-8'),
                });
                testInfo.annotations.push({ type: 'skipped', description: e.message });
                test.skip(true, e.message);
              }
              // Tile was there for earlier scenarios — transient page glitch:
              // record the failure but keep the ids already created.
              failed.push(`${s.name}: ${e.message}`);
              await attachShot(page, testInfo, `${key}-${s.name}`, shotPath);
              results.push({ category: key, scenario: s.name, name, id: null, status: 'failed', reason: e.message, picked: {}, shotPath });
              continue;
            }
            if (e instanceof SkipScenarioError) {
              skipped.push(`${s.name}: ${e.message}`);
              results.push({ category: key, scenario: s.name, name, id: null, status: 'skipped', reason: e.message, picked: {}, shotPath: null });
              console.log(`[${key}]   skipped: ${e.message}`);
              continue;
            }
            const reason = e instanceof Error ? e.message : String(e);
            failed.push(`${s.name}: ${reason}`);
            await attachShot(page, testInfo, `${key}-${s.name}`, shotPath);
            results.push({ category: key, scenario: s.name, name, id: null, status: 'failed', reason, picked: {}, shotPath });
          }
        }

        if (created.length) {
          const file = appendIds(created);
          console.log(`[${key}] created ${created.length}/${scenarios.length} → ${file}`);
          await testInfo.attach(`created-${key}.json`, {
            contentType: 'application/json',
            body: Buffer.from(JSON.stringify(created, null, 2), 'utf-8'),
          });
        }
        for (const s of skipped) testInfo.annotations.push({ type: 'scenario-skipped', description: s });
        for (const f of failed) testInfo.annotations.push({ type: 'scenario-failed', description: f });
        testInfo.annotations.push({ type: 'created', description: `${created.length}/${scenarios.length} scenario(s) produced ids` });

        // Optional chained validation — same checkReport the default validator runs.
        if (chainValidate && created.length) {
          const bad = [];
          for (const r of created) {
            const verdict = await checkReport(page, testInfo, r.id, r.name, { compareShape: false });
            testInfo.annotations.push({ type: 'validated', description: `${r.name} [${r.id}] → ${verdict.status}` });
            const rec = results.find((x) => x.id === r.id);
            if (rec) {
              rec.validation = verdict.status;
              rec.validationReason = verdict.reason || '';
              // full evidence so the report-regression HTML shows preview/PDF/where/url for created+validated reports
              rec.preview = verdict.preview;
              rec.pdf = verdict.pdf;
              rec.where = verdict.where || '';
              rec.url = verdict.url || '';
              if (verdict.screenshot) rec.shotPath = verdict.screenshot;
            }
            if (verdict.status !== 'ok') bad.push(`${r.name} [${r.id}]: ${verdict.status}${verdict.where ? ` (${verdict.where})` : ''}`);
          }
          if (bad.length && isSoft) console.log(`[${key}] soft category — validation failures:\n${bad.join('\n')}`);
          if (!isSoft) expect(bad, `created reports that failed validation:\n${bad.join('\n')}`).toEqual([]);
        }
      } finally {
        // The creation HTML reporter builds its run report from this attachment.
        await testInfo.attach('creation-results', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(results, null, 2), 'utf-8'),
        });
        releaseSlot(slot);
      }

      if (skipped.length === scenarios.length) {
        test.skip(true, `all scenarios skipped:\n${skipped.join('\n')}`);
      }
      if (isSoft) {
        // Instance/data-dependent category: report, don't fail the run.
        if (failed.length) console.log(`[${key}] soft category — creation failures:\n${failed.join('\n')}`);
        expect(created.length + skipped.length, `soft category '${key}' produced nothing at all:\n${failed.join('\n')}`).toBeGreaterThan(0);
      } else {
        expect(failed, `scenarios that failed to create:\n${failed.join('\n')}`).toEqual([]);
        expect(created.length, 'no reports were created').toBeGreaterThan(0);
      }
    });
  }
});

/**
 * Screenshot the page as it looks at the moment of failure. Reuses the
 * scenario's shot path (overwriting any earlier step-2 shot) so the HTML
 * reporter always shows the state that explains the failure.
 */
async function attachShot(page, testInfo, tag, shotPath = null) {
  try {
    const file = shotPath || testInfo.outputPath(`create-fail-${tag}.png`);
    await page.screenshot({ path: file, fullPage: true });
    await testInfo.attach(`create-fail-${tag}.png`, { path: file, contentType: 'image/png' });
  } catch {
    /* screenshot is best-effort */
  }
}

function slugify(s) {
  return String(s).replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'x';
}
