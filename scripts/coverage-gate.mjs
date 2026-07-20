#!/usr/bin/env node
/*
 * coverage-gate — drive the human coverage-approval gate (Flow B, between 04-plan and 05-generate).
 *
 *   node scripts/coverage-gate.mjs propose <plan.json> [--dir workspace/<TICKET>/<run>]
 *        → writes coverage-proposal.{json,md} + a pending coverage-approval.json
 *   node scripts/coverage-gate.mjs allow  <dir> [--by name]
 *   node scripts/coverage-gate.mjs other  <dir> --add "..." [--add "..."]     (request changes)
 *   node scripts/coverage-gate.mjs check  <dir>     → runs the gate; exit 1 if not approved
 *
 * No test cases should be generated (stage 05) until `check` exits 0.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { runGate, formatGate } from '../governance/validation/index.js';

const [cmd, arg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flag = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const flags = (name) => process.argv.reduce((acc, a, i) => (a === name ? [...acc, process.argv[i + 1]] : acc), []);
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2)); };

// deterministic hash of the coverage areas (so an approval binds to THIS plan)
const hashAreas = (areas) => crypto.createHash('sha256').update(JSON.stringify(areas)).digest('hex').slice(0, 12);

function proposalMd(p) {
  const rows = p.areas.map((a) =>
    `| ${a.module}${a.screen ? ' › ' + a.screen : ''} | ${(a.categories || []).join(', ')} | ~${a.estimated_cases ?? '?'} | ${(a.traces_to || []).join(', ')} |`).join('\n');
  return `# Coverage proposal — ${p.ticket}

**${p.totals.areas} areas · ~${p.totals.estimated_cases} cases.** Approve with \`/coverage-gate\` (Allow) or request changes (Other).

| Area | Categories | Est. cases | Traces to |
|---|---|---|---|
${rows}

**Exclusions:** ${(p.exclusions || []).join('; ') || '(none)'}
**Assumptions:** ${(p.assumptions || []).join('; ') || '(none)'}

_hash: ${p.proposal_hash} — no cases are generated until this is approved (Allow)._
`;
}

if (cmd === 'propose') {
  const plan = read(arg);                       // { ticket, areas:[...], exclusions?, assumptions? }
  const dir = flag('--dir') || path.join('workspace', plan.ticket || 'TICKET', 'latest');
  const areas = plan.areas || [];
  const proposal = {
    ticket: plan.ticket || 'TICKET',
    proposal_hash: hashAreas(areas),
    areas,
    exclusions: plan.exclusions || [],
    assumptions: plan.assumptions || [],
    totals: { areas: areas.length, estimated_cases: areas.reduce((s, a) => s + (a.estimated_cases || 0), 0) },
  };
  write(path.join(dir, 'coverage-proposal.json'), proposal);
  fs.writeFileSync(path.join(dir, 'coverage-proposal.md'), proposalMd(proposal));
  write(path.join(dir, 'coverage-approval.json'), { proposal_hash: proposal.proposal_hash, decision: 'pending', additions: [] });
  console.log(proposalMd(proposal));
  console.log(`→ ${dir}  ·  approve with: /coverage-gate  (or) node scripts/coverage-gate.mjs allow ${dir}`);
} else if (cmd === 'allow') {
  const dir = arg; const p = read(path.join(dir, 'coverage-proposal.json'));
  write(path.join(dir, 'coverage-approval.json'), { proposal_hash: p.proposal_hash, decision: 'allow', by: flag('--by') || 'human', additions: [] });
  console.log(`ALLOW recorded for ${p.ticket} (${p.proposal_hash}). Stage 05 may proceed.`);
} else if (cmd === 'other') {
  const dir = arg; const p = read(path.join(dir, 'coverage-proposal.json'));
  const adds = flags('--add');
  write(path.join(dir, 'coverage-approval.json'), { proposal_hash: p.proposal_hash, decision: 'other', by: flag('--by') || 'human', additions: adds });
  console.log(`OTHER recorded: ${adds.join('; ')}. Planner must revise & re-propose.`);
} else if (cmd === 'check') {
  const dir = arg;
  const proposal = read(path.join(dir, 'coverage-proposal.json'));
  const approval = read(path.join(dir, 'coverage-approval.json'));
  const g = runGate('04_coverage_approval', { proposal, approval });
  console.log(formatGate(g));
  process.exit(g.pass ? 0 : 1);
} else {
  console.error('usage: coverage-gate propose <plan.json> | allow <dir> | other <dir> --add "..." | check <dir>');
  process.exit(2);
}
