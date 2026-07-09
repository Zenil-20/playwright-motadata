#!/usr/bin/env node
/*
 * Daily orchestration pipeline — JS port of observeops-qa framework/core/orchestration
 * (workflow.py + daily_stages.py). 14 defensive stages: each SKIPS (not fails) when
 * its inputs are absent, so the pipeline runs end-to-end even with partial data.
 *
 *   node framework/core/orchestration/daily-pipeline.mjs           # run
 *   node framework/core/orchestration/daily-pipeline.mjs --dry     # plan only, no test execution
 *   node framework/core/orchestration/daily-pipeline.mjs --project discovery_data_driven
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadRegression, promote } from '../testcase-store/store.js';
import { detectChanges, impactedDevices } from '../../integrations/vcs.js';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const projectIdx = args.indexOf('--project');
const PROJECT = projectIdx >= 0 ? args[projectIdx + 1] : null;

const bag = {};
const results = [];
const ok = (name, message) => ({ name, ok: true, message });
const skip = (name, message) => ({ name, ok: true, message: `skip — ${message}` });

const STAGES = [
  function read_testcases() {
    const suite = loadRegression();
    bag.suite = suite;
    return ok('read_testcases', `${suite.length} regression case(s) loaded`);
  },
  function automate() {
    if (!bag.suite?.length) return skip('automate', 'no cases yet');
    return ok('automate', 'automation = data-driven scenarios (see docs/COVERAGE.md)');
  },
  function execute() {
    if (DRY) return skip('execute', '--dry');
    try {
      const cmd = `npx playwright test${PROJECT ? ` --project ${PROJECT}` : ''}`;
      execSync(cmd, { stdio: 'inherit' });
      bag.testRc = 0;
    } catch (e) { bag.testRc = e.status ?? 1; }
    return ok('execute', `playwright exit ${bag.testRc}`);
  },
  function screenshots() {
    const dir = path.resolve('test-results');
    const n = fs.existsSync(dir) ? countFiles(dir, '.png') : 0;
    return ok('screenshots', `${n} screenshot(s)`);
  },
  function logs() {
    const f = path.resolve('reports/failures.json');
    return ok('logs', fs.existsSync(f) ? 'failures.json present' : 'no failures.json');
  },
  function report() {
    fs.mkdirSync('reports', { recursive: true });
    const md = [
      `# Daily Report`,
      ``,
      `- regression cases: ${bag.suite?.length ?? 0}`,
      `- playwright exit: ${bag.testRc ?? '(not run)'}`,
      `- changes detected: ${bag.changes?.length ?? 0}`,
    ].join('\n');
    fs.writeFileSync('reports/daily_report.md', md + '\n');
    return ok('report', 'reports/daily_report.md');
  },
  function detect_changes() {
    bag.changes = detectChanges(process.env.SINCE_REF);
    return ok('detect_changes', `${bag.changes.length} change set(s)`);
  },
  function analyze_impact() {
    if (!bag.changes?.length) return skip('analyze_impact', 'no changes');
    const keys = (bag.suite || []).map((c) => c.id).filter(Boolean);
    bag.impact = impactedDevices(bag.changes.flatMap((c) => c.paths), keys);
    return ok('analyze_impact', `${bag.impact.length} impacted item(s)`);
  },
  function generate_cases() {
    if (!bag.changes?.length) return skip('generate_cases', 'no changes');
    return skip('generate_cases', 'authoring is agent-driven (the pipeline) — no offline gen');
  },
  function store_csv() {
    if (!bag.generatedSlug) return skip('store_csv', 'nothing generated');
    return ok('store_csv', bag.generatedSlug);
  },
  function generate_scripts() {
    if (!bag.generatedSlug) return skip('generate_scripts', 'nothing generated');
    return ok('generate_scripts', 'delegate to spec-writer agent');
  },
  function execute_generated() {
    if (!bag.generatedSlug) return skip('execute_generated', 'nothing generated');
    return ok('execute_generated', 'run generated project');
  },
  function report_generated() {
    if (!bag.generatedSlug) return skip('report_generated', 'nothing generated');
    return ok('report_generated', 'reported');
  },
  function promote_regression() {
    if (!bag.generatedSlug) return skip('promote_regression', 'nothing to promote');
    const dst = promote(bag.generatedSlug);
    return ok('promote_regression', `promoted → ${path.relative(process.cwd(), dst)}`);
  },
];

function countFiles(dir, ext) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) n += countFiles(p, ext);
    else if (e.name.endsWith(ext)) n++;
  }
  return n;
}

console.log(`\n=== daily pipeline ${DRY ? '(dry) ' : ''}===`);
for (const stage of STAGES) {
  let res;
  try { res = stage(); } catch (e) { res = { name: stage.name, ok: false, message: `error: ${e.message}` }; }
  results.push(res);
  console.log(`${res.ok ? '✓' : '✗'} ${res.name.padEnd(20)} ${res.message}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length} stages, ${failed.length} failed.`);
process.exit(failed.length ? 1 : 0);
