#!/usr/bin/env node
/*
 * tfs-import — Flow A "GET TFS TEST CASES": read a TFS/Azure-DevOps-Server test plan's
 * test cases and write them into the testcase-store as a generated suite.
 *
 *   node scripts/tfs-import.mjs <planId> [--suite <substr>] [--out <slug>]
 *
 * --suite   case-insensitive substring filter on suite name (e.g. NCM)
 * --out     output slug (default: plan<planId>_tfs_import, or <suite>_tfs_import)
 *
 * Env: TFS_BASE_URL, TFS_PROJECT, TFS_PAT  (PAT read from env — never hardcoded).
 * Output: tests/generated/<slug>.csv  (via the testcase-store).
 */

import { importPlan } from '../framework/integrations/tfs.js';
import { saveGenerated } from '../framework/core/testcase-store/store.js';

// HARD PIN: this platform reads ONLY plan 41621 ("8.0 New"). Any other plan is refused.
const ALLOWED_PLAN = '41621';
const ALLOWED_PLAN_NAME = '8.0 New';

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const flagAll = (name) => args.reduce((acc, a, i) => (a === name ? [...acc, args[i + 1]] : acc), []);
// Positional args = tokens that are neither a --flag nor the value consumed by one.
const VALUE_FLAGS = ['--suite', '--out', '--root'];
const positionals = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));
const planId = positionals[0] || ALLOWED_PLAN;   // default to the only allowed plan

if (String(planId) !== ALLOWED_PLAN) {
  console.error(`Refused: this platform reads ONLY plan ${ALLOWED_PLAN} ("${ALLOWED_PLAN_NAME}"). Plan ${planId} is not permitted.`);
  process.exit(2);
}

const suiteFilter = flag('--suite');
const subtreeOf = flagAll('--root');   // folder names whose whole subtree to import (repeatable)
const outFlag = flag('--out');

if (!process.env.TFS_BASE_URL || !process.env.TFS_PAT) {
  console.error('TFS not configured. Set these env vars before running:');
  console.error('  TFS_BASE_URL   e.g. https://ad-motadata:8443/Motadata');
  console.error('  TFS_PROJECT    e.g. Motadata');
  console.error('  TFS_PAT        a Personal Access Token (kept in env, never in code)');
  process.exit(2);
}

if (!planId) {
  console.error('usage: node scripts/tfs-import.mjs <planId> [--suite <substr>] [--out <slug>]');
  process.exit(2);
}

const slug = outFlag
  || (suiteFilter ? `${suiteFilter}_tfs_import` : `plan${planId}_tfs_import`);

try {
  const { plan, suites, rows } = await importPlan(planId, { suiteFilter, subtreeOf });

  console.log(`Plan ${plan.id}: ${plan.name}`);
  const matched = suites.filter((s) => s.matched);
  console.log(`Suites matched${suiteFilter ? ` (filter "${suiteFilter}")` : ''}: ${matched.length}/${suites.length}`);
  for (const s of matched) console.log(`  - ${s.name} → ${s.testCaseCount}`);

  const out = saveGenerated(slug, rows);
  console.log(`Total cases written: ${rows.length}`);
  console.log(`Output: ${out}`);
} catch (err) {
  console.error(`tfs-import failed: ${err.message}`);
  process.exit(1);
}
