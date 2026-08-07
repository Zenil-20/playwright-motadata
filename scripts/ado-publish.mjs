#!/usr/bin/env node
/*
 * ado-publish — push a ticket's manual test cases into Azure DevOps Test Plans,
 * inside a suite named `MOTADATA-<jiraId>` under the configured plan.
 *
 *   node scripts/ado-publish.mjs MOTADATA-7506            # publish
 *   node scripts/ado-publish.mjs MOTADATA-7506 --dry      # map + validate, write nothing
 *   node scripts/ado-publish.mjs MOTADATA-7506 --cases <path>   # non-default input
 *
 * Input : workspace/<jiraId>/manual-cases.json  (the pipeline's authoring output)
 * Output: one Test Case work item per case, linked into the MOTADATA-<jiraId> suite.
 *
 * Idempotent — re-running a ticket reuses its suite and skips cases whose title is
 * already there, so the pipeline can call this on every run.
 *
 * Env: AZURE_ORG_URL, AZURE_PROJECT, AZURE_PAT, AZURE_TEST_PLAN_ID
 *      (falls back to TFS_BASE_URL / TFS_PROJECT / TFS_PAT — same server)
 *      AZURE_AREA_PATH, AZURE_ASSIGNED_TO, AZURE_STATE  — the three metadata columns.
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { publishManualCases, cfg } from '../framework/integrations/azure-testplans.js';

dotenv.config();

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes('--dry');
const VALUE_FLAGS = ['--cases', '--plan', '--area', '--assigned-to', '--limit'];
const positionals = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));

const raw = positionals[0];
if (!raw) {
  console.error('usage: node scripts/ado-publish.mjs <MOTADATA-id> [--dry] [--cases <path>] [--plan <id>]');
  process.exit(2);
}
const jiraId = /^MOTADATA-/i.test(raw) ? raw.toUpperCase() : `MOTADATA-${raw}`;

const casesPath = flag('--cases') || path.join('workspace', jiraId, 'manual-cases.json');
if (!fs.existsSync(casesPath)) {
  console.error(`No manual cases at ${casesPath}`);
  console.error('Run the authoring stage first, or pass --cases <path>.');
  process.exit(2);
}

const parsed = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
let cases = Array.isArray(parsed) ? parsed : parsed.cases || [];
if (!cases.length) {
  console.error(`${casesPath} holds no cases`);
  process.exit(2);
}

// --limit N: publish only the first N. Used for a smoke test against a real plan.
const limit = Number(flag('--limit')) || 0;
const total = cases.length;
if (limit > 0) cases = cases.slice(0, limit);

const planId = flag('--plan') || cfg().planId;
if (!planId) {
  console.error('AZURE_TEST_PLAN_ID not set and no --plan given.');
  console.error('Find it in the plan URL: .../_testPlans/execute?planId=41621');
  process.exit(2);
}

if (!DRY && (!cfg().org || !cfg().pat)) {
  console.error('Azure DevOps not configured. Set these before a live run:');
  console.error('  AZURE_ORG_URL   e.g. https://ad-motadata:8443/Motadata  (or TFS_BASE_URL)');
  console.error('  AZURE_PROJECT   e.g. Motadata                           (or TFS_PROJECT)');
  console.error('  AZURE_PAT       Personal Access Token with Test Plans read/write');
  process.exit(2);
}

const res = await publishManualCases({
  jiraId,
  cases,
  planId,
  areaPath: flag('--area'),
  assignedTo: flag('--assigned-to'),
  dryRun: DRY,
});

const tag = DRY ? '[dry] ' : '';
console.log(`${tag}plan ${res.planId} → suite ${res.suite.name}${res.suite.created ? ' (created)' : ''}`);
console.log(`${tag}assigned to: ${res.assignee.value || '(unset)'} — via ${res.assignee.via}`);
console.log(`${tag}${cases.length} case(s) from ${casesPath}${limit > 0 ? ` (--limit ${limit} of ${total})` : ''}`);
for (const c of res.created) console.log(`${tag}  + ${c.id ? `#${c.id} ` : ''}${c.title}`);
for (const c of res.skipped) console.log(`${tag}  = already in suite: ${c.title}`);
console.log(`${tag}created ${res.created.length}, skipped ${res.skipped.length}`);
