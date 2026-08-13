#!/usr/bin/env node
/*
 * cases — Jira ID in, TFS test cases out.
 *
 *   npm run cases -- MOTADATA-9593              # author + validate + emit, STOP at the gate
 *   npm run cases -- MOTADATA-9593 --publish    # ...and push into plan 79797 (Sprint 8.2.8)
 *   npm run cases -- MOTADATA-9593 --dry        # everything except the TFS write
 *   npm run cases -- MOTADATA-9593 --resume     # re-emit/publish from an existing manual-cases.json
 *
 * Stages
 *   1 fetch     Jira REST v2 -> workspace/<KEY>/ticket.json          (deterministic)
 *   2 context   match knowledge/** + tests/** to the ticket           (deterministic)
 *   3 author    one `claude -p` call: KG + knowledge -> manual-cases.json
 *   4 validate  schema + taxonomy + grounding checks                  (deterministic, fails loud)
 *   5 emit      the 10-column TFS-import CSV                          (deterministic)
 *   6 gate      print coverage + gaps, then STOP unless --publish     (human gate)
 *   7 publish   ado-publish -> suite MOTADATA-<id> in AZURE_TEST_PLAN_ID
 *
 * Authoring runs through the Claude Code CLI rather than the raw API on purpose: the CLI
 * already has motadata-kg + ui-kg wired up for this project and uses the existing login,
 * so no ANTHROPIC_API_KEY and no MCP client code. Stage 3 is the only non-deterministic
 * stage — swap it for a direct API call without touching stages 1, 2, 4-7.
 *
 * Env: JIRA_BASE_URL, JIRA_TOKEN, AZURE_* / TFS_* (see .env.example).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config();

/* ---------------------------------------------------------------- args */
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const has = (n) => args.includes(n);
const VALUE_FLAGS = ['--model', '--area', '--assigned-to', '--limit', '--timeout'];
const positionals = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));

const raw = positionals[0];
if (!raw) {
  console.error('usage: node scripts/cases.mjs <MOTADATA-id> [--publish] [--dry] [--resume]');
  console.error('                              [--model <id>] [--area <path>] [--limit N] [--timeout <min>]');
  process.exit(2);
}
const KEY = /^MOTADATA-/i.test(raw) ? raw.toUpperCase() : `MOTADATA-${raw}`;
const WS = path.join('workspace', KEY);
const TAXONOMY_PATH = 'knowledge/taxonomy/scenario-taxonomy.json';
const TIMEOUT_MIN = Number(flag('--timeout')) || 30;

const step = (n, msg) => console.log(`\n[${n}/7] ${msg}`);
/* Throw rather than process.exit: an in-flight undici keep-alive socket from the Jira fetch
 * makes a hard exit trip a libuv handle assertion on Windows. The top-level catch exits cleanly. */
class Abort extends Error {}
const die = (msg) => { throw new Abort(msg); };

fs.mkdirSync(WS, { recursive: true });
const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'));
const ALL_TAGS = [
  ...Object.keys(taxonomy.core),
  ...Object.keys(taxonomy.negative_security),
  ...Object.keys(taxonomy.surface),
  ...Object.keys(taxonomy.quality),
];
// A case must carry at least one of these — a bare surface tag ("UI", "API") says where the
// case lands, not what kind of check it is.
const CORE_TAGS = [
  ...Object.keys(taxonomy.core),
  ...Object.keys(taxonomy.negative_security),
  ...Object.keys(taxonomy.quality),
];
const SOURCES = Object.keys(taxonomy.grounding_sources);

/* ---------------------------------------------------------------- 1. fetch */
async function fetchTicket() {
  step(1, `Fetching ${KEY} from Jira`);
  const base = process.env.JIRA_BASE_URL;
  const token = process.env.JIRA_TOKEN;
  if (!base || !token) die('JIRA_BASE_URL / JIRA_TOKEN not set (copy .env.example -> .env)');

  const fields = 'summary,description,issuetype,status,priority,components,labels,reporter,'
    + 'issuelinks,comment,fixVersions,attachment';
  const res = await fetch(`${base.replace(/\/$/, '')}/rest/api/2/issue/${KEY}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) die(`Jira HTTP ${res.status} for ${KEY}`);
  const text = await res.text();
  if (text.trimStart().startsWith('<')) die('Jira returned HTML — the token is likely invalid or expired');
  const j = JSON.parse(text);
  const f = j.fields || {};
  const desc = f.description || '';

  const ticket = {
    key: j.key,
    title: f.summary || '',
    type: f.issuetype?.name || '',
    status: f.status?.name || '',
    priority: f.priority?.name || '',
    components: (f.components || []).map((c) => c.name),
    labels: f.labels || [],
    fixVersions: (f.fixVersions || []).map((v) => v.name),
    reporter: { name: f.reporter?.name || null, displayName: f.reporter?.displayName || null },
    description: desc,
    figma_links: [...desc.matchAll(/https?:\/\/(?:www\.)?figma\.com\/[^\s\]|)]+/g)].map((m) => m[0]),
    attachments: (f.attachment || []).map((a) => a.filename),
    linked: (f.issuelinks || [])
      .map((l) => l.outwardIssue || l.inwardIssue)
      .filter(Boolean)
      .map((i) => ({ key: i.key, title: i.fields?.summary || '' })),
    comments: (f.comment?.comments || []).map((c) => ({ author: c.author?.displayName, body: c.body })),
  };
  // The gate needs to know what the ticket does NOT say.
  ticket.completeness = { gaps: [] };
  if (!desc.trim()) ticket.completeness.gaps.push('description is empty');
  if (desc.length < 300) ticket.completeness.gaps.push('description is very short — expect a thin case set');
  if (ticket.figma_links.length) ticket.completeness.gaps.push(`references Figma (${ticket.figma_links.length} link(s)) — design-derived expectations cannot be verified from the ticket alone`);
  if (ticket.attachments.length) ticket.completeness.gaps.push(`has ${ticket.attachments.length} attachment(s) that were NOT fetched (screenshots may carry the real spec)`);
  if (!/expected|acceptance|should|must/i.test(desc)) ticket.completeness.gaps.push('no explicit expected-result / acceptance wording found');

  fs.writeFileSync(path.join(WS, 'ticket.json'), JSON.stringify(ticket, null, 1));
  console.log(`  ${ticket.type} · ${ticket.status} · components [${ticket.components.join(', ') || '-'}] · fixVersions [${ticket.fixVersions.join(', ') || '-'}]`);
  console.log(`  ${ticket.title}`);
  console.log(`  reporter ${ticket.reporter.name || '(none)'} · ${ticket.figma_links.length} figma · ${ticket.attachments.length} attachments · ${ticket.comments.length} comments`);
  if (ticket.completeness.gaps.length) console.log(`  gaps: ${ticket.completeness.gaps.length} (see the gate at stage 6)`);
  return ticket;
}

/* ---------------------------------------------------------------- 2. context */
// Deterministic keyword match so the authoring call starts from the right files
// instead of grepping the whole repo. Cheap, and it makes the run reproducible.
const STOP = new Set(['does', 'not', 'match', 'the', 'for', 'and', 'with', 'from', 'this', 'that',
  'when', 'then', 'have', 'has', 'are', 'was', 'were', 'its', 'into', 'via', 'per', 'all', 'new',
  'added', 'support', 'design', 'issue', 'bug', 'ui', 'page', 'screen', 'unify', 'across']);

function buildContext(ticket) {
  step(2, 'Matching product knowledge and existing suites');
  const terms = [...new Set(
    `${ticket.title} ${ticket.description}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w)),
  )];

  const walk = (dir, out = []) => {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, out);
      else out.push(p);
    }
    return out;
  };

  const score = (file) => {
    const hay = `${file} ${(() => { try { return fs.readFileSync(file, 'utf8').slice(0, 20000).toLowerCase(); } catch { return ''; } })()}`;
    return terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
  };

  const pick = (dir, exts, n) => walk(dir)
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .map((f) => ({ f, s: score(f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => `${x.f}  (${x.s} term hits)`);

  const ctx = {
    product: pick('knowledge/product', ['.md'], 8),
    catalogs: pick('knowledge/locators/catalog', ['.json'], 6),
    rules: pick('knowledge/business_rules', ['.md'], 4),
    known: pick('knowledge/known_issues', ['.md'], 3),
    suites: pick('tests', ['.spec.js'], 6),
  };
  const total = Object.values(ctx).flat().length;
  fs.writeFileSync(path.join(WS, 'context-bundle.json'), JSON.stringify({ terms: terms.slice(0, 40), ...ctx }, null, 1));
  for (const [k, v] of Object.entries(ctx)) console.log(`  ${k.padEnd(9)} ${v.length} file(s)`);
  if (!total) console.log('  (no keyword matches — the authoring stage will fall back to the KGs)');
  return ctx;
}

/* ---------------------------------------------------------------- 3. author */
function buildPrompt(ticket, ctx) {
  const list = (a) => (a.length ? a.map((x) => `  - ${x}`).join('\n') : '  (none matched)');
  const tagDoc = (o) => Object.entries(o).map(([k, v]) => `  - ${k}: ${v}`).join('\n');

  return `You are the mt-manual-test-author agent for the Motadata AIOps QA pipeline.
Author manual test cases for Jira ticket ${KEY} and write them to ${path.join(WS, 'manual-cases.json').replace(/\\/g, '/')}.

Follow the role, rules and guardrails in agents/testcase-generator/prompt.md — read it first.

## The ticket
Parsed and normalised at ${path.join(WS, 'ticket.json').replace(/\\/g, '/')} — READ IT. Summary:
  ${ticket.key} [${ticket.type}/${ticket.status}] ${ticket.title}
  components: ${ticket.components.join(', ') || '(none)'} · fixVersions: ${ticket.fixVersions.join(', ') || '(none)'}
  figma: ${ticket.figma_links.join(' ') || '(none)'}

## Product knowledge pre-matched to this ticket (read what is relevant, ignore the rest)
product docs:
${list(ctx.product)}
live locator catalogs (a real DOM sweep — field ids, labels, control counts):
${list(ctx.catalogs)}
business rules:
${list(ctx.rules)}
known issues:
${list(ctx.known)}
existing specs (mine these for proven step ordering and naming):
${list(ctx.suites)}

## Knowledge graphs — USE THESE, they are the highest-value source
Two MCP servers expose the shipped source:
  - ui-kg        the Vue frontend (screens, forms, v-if conditions, field order, labels, API modules)
  - motadata-kg  the backend
Workflow that works: search_nodes with mode:"regex" on a FILE name fragment (e.g. "mail-server",
"policy-form") to find the file node, then read_source on that node id with a large context_lines to
read the actual template and helpers. Fuzzy search over concept words tends to return unrelated
function nodes — go via the file. Use get_neighbors / impact_analysis to find what else consumes a
thing (that is how you ground the "Impacted" cases).
Read the real field order, the real conditional-render rules, the real payload keys, the real
endpoints. Assert against those, not against what the ticket claims.

## Output contract — ${path.join(WS, 'manual-cases.json').replace(/\\/g, '/')}
A JSON array. Each case:
{
  "id": "TC-001",
  "title": "<imperative, one line, unique>",
  "tags": ["Functional", "UI"],
  "steps": [
    { "action": "<one action; bake login+navigation into step 1>",
      "expected": "<observable, specific outcome>",
      "source": "kg" }
  ]
}

Tag vocabulary — use ONLY these. Every case needs >= 1 core/negative-security tag, plus any
surface tags that apply.
Core:
${tagDoc(taxonomy.core)}
Negative / Security:
${tagDoc(taxonomy.negative_security)}
Quality:
${tagDoc(taxonomy.quality)}
Surface area (add alongside a core tag — these say WHERE the case lands, not what kind of check it is):
${tagDoc(taxonomy.surface)}

Every step needs a "source" from: ${SOURCES.join(', ')}
${Object.entries(taxonomy.grounding_sources).map(([k, v]) => `  - ${k}: ${v}`).join('\n')}

## Hard rules
1. NEVER invent an expected string. If a toast/label/option list is not in the KG, a catalog, a doc
   or the ticket, write what you can verify and tag the step "inferred" or "figma". Those tags are
   the human gate's review queue — using them honestly is correct, hiding a guess as "kg" is not.
2. Ground everything you can in the KG. A case asserting the real payload contract or the real
   conditional-render rule is worth ten generic ones.
3. Cover the whole taxonomy where it genuinely applies to this ticket — positive AND negative,
   validation, RBAC/permissions, XSS/injection/secret-masking, boundary and unicode and concurrency
   edges, the downstream Impacted surfaces, the REST API, audit, and non-functional
   (responsive/zoom, keyboard+labels, cross-browser, load budget). Do not pad a tag that does not
   apply — say so in your final message instead.
4. Count is not a target. Cover the applicable matrix cells; that sets the count.
5. If static review of the shipped source reveals an actual defect (duplicate DOM id, a validation
   rule that contradicts the docs, a payload key written when its field is hidden), write a case
   that asserts the CORRECT behaviour and say in the step's expected text that it is expected to
   fail until fixed. Call these out in your final message.
6. One action per step. Max ${taxonomy.rules.max_bytes_per_step} bytes per step field. Bake
   "Login as admin (admin/admin); navigate <path>" into step 1 — there is no preconditions column.
7. Titles must be unique — the TFS publisher skips on duplicate title.

Write the file, then reply with: the case count, the count per tag, the count per source, any
defects you found by reading the source, and any gap that blocks verification (a missing Figma
option list, an unfetched screenshot, an unknown role matrix). Keep the reply under 25 lines.`;
}

function author(ticket, ctx) {
  step(3, `Authoring cases (claude -p, up to ${TIMEOUT_MIN} min)`);
  const prompt = buildPrompt(ticket, ctx);
  const promptPath = path.join(WS, 'authoring-prompt.md');
  fs.writeFileSync(promptPath, prompt);
  console.log(`  prompt: ${promptPath} (${(Buffer.byteLength(prompt) / 1024).toFixed(1)} KB)`);

  // The prompt goes in on STDIN, not argv: Windows caps a command line at ~8 KB and this
  // prompt is bigger than that. `claude -p` with no positional prompt reads stdin.
  const cliArgs = [
    '-p',
    '--output-format', 'json',
    '--permission-mode', 'acceptEdits',
    '--allowed-tools', 'Read,Grep,Glob,Write,mcp__ui-kg,mcp__motadata-kg',
  ];
  const model = flag('--model');
  if (model) cliArgs.push('--model', model);

  const t0 = Date.now();
  const r = spawnSync('claude', cliArgs, {
    input: prompt,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: TIMEOUT_MIN * 60 * 1000,
    // `claude` is a .cmd shim on Windows, so it needs a shell to resolve. Safe here because
    // cliArgs are all literals — the prompt (the only untrusted-length input) goes via stdin.
    shell: process.platform === 'win32',
  });
  const mins = ((Date.now() - t0) / 60000).toFixed(1);

  if (r.error) {
    if (r.error.code === 'ETIMEDOUT') die(`authoring timed out after ${TIMEOUT_MIN} min — raise it with --timeout <min>`);
    die(`claude CLI failed to start: ${r.error.message}\nIs Claude Code on PATH? (claude --version)`);
  }

  // The CLI reports task-level failures INSIDE its JSON (is_error) and can still exit 0,
  // so check the payload — not just the exit status.
  let out = null;
  try { out = JSON.parse(r.stdout); } catch { /* non-JSON handled below */ }

  if (out?.is_error || out?.subtype === 'error_during_execution') {
    const msg = out.result || out.terminal_reason || 'unknown CLI error';
    if (/authenticat|oauth|api key|credit balance/i.test(msg)) {
      die(`the authoring stage could not authenticate:\n    ${msg}\n\n`
        + '  The stage runs `claude -p` as a subprocess, which reads credentials from disk.\n'
        + '  Fix one of these, then re-run:\n'
        + '    - refresh the Claude Code login:  run `claude`, then /login\n'
        + '    - or export ANTHROPIC_API_KEY in this shell\n'
        + '  Verify with:  echo "say OK" | claude -p');
    }
    die(`authoring failed: ${msg}`);
  }
  if (r.status !== 0) die(`claude CLI exited ${r.status}\n${(r.stderr || '').slice(0, 2000)}`);

  let summary = '';
  if (out) {
    summary = out.result || '';
    if (out.total_cost_usd) console.log(`  cost $${Number(out.total_cost_usd).toFixed(2)} · ${mins} min`);
    else console.log(`  ${mins} min`);
  } else {
    summary = (r.stdout || '').slice(-4000);
    console.log(`  (non-JSON CLI output; ${mins} min)`);
  }
  fs.writeFileSync(path.join(WS, 'authoring-report.md'), summary);
  console.log(`\n${'-'.repeat(70)}\n${summary.trim()}\n${'-'.repeat(70)}`);
}

/* ---------------------------------------------------------------- 4. validate */
function validate() {
  step(4, 'Validating');
  const p = path.join(WS, 'manual-cases.json');
  if (!fs.existsSync(p)) die(`the authoring stage wrote no ${p}`);
  let cases;
  try { cases = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { die(`${p} is not valid JSON: ${e.message}`); }
  if (!Array.isArray(cases)) cases = cases.cases || [];
  if (!cases.length) die(`${p} holds no cases`);

  const errs = [];
  const seen = new Map();
  for (const [i, c] of cases.entries()) {
    const at = `case ${i + 1} (${c.id || 'no id'})`;
    if (!c.title || !String(c.title).trim()) errs.push(`${at}: no title`);
    else {
      const k = String(c.title).trim().toLowerCase();
      if (seen.has(k)) errs.push(`${at}: duplicate title of case ${seen.get(k) + 1} — the publisher would skip it`);
      else seen.set(k, i);
    }
    const tags = Array.isArray(c.tags) ? c.tags : [];
    if (!tags.length) errs.push(`${at}: no tags`);
    for (const t of tags) if (!ALL_TAGS.includes(t)) errs.push(`${at}: unknown tag "${t}" (not in ${TAXONOMY_PATH})`);
    if (taxonomy.rules.require_at_least_one_core_tag && !tags.some((t) => CORE_TAGS.includes(t))) {
      errs.push(`${at}: needs at least one core/negative-security tag (${CORE_TAGS.join(' | ')})`);
    }
    const steps = Array.isArray(c.steps) ? c.steps : [];
    if (steps.length < taxonomy.rules.min_steps_per_case) errs.push(`${at}: no steps`);
    for (const [k, s] of steps.entries()) {
      const sat = `${at} step ${k + 1}`;
      if (!s.action || !String(s.action).trim()) errs.push(`${sat}: no action`);
      if (!s.expected || !String(s.expected).trim()) errs.push(`${sat}: no expected`);
      if (taxonomy.rules.require_source_tag && !SOURCES.includes(s.source)) {
        errs.push(`${sat}: source "${s.source ?? '(missing)'}" not one of ${SOURCES.join(', ')}`);
      }
      for (const fld of ['action', 'expected']) {
        const len = Buffer.byteLength(String(s[fld] ?? ''));
        if (len > taxonomy.rules.max_bytes_per_step) errs.push(`${sat}: ${fld} is ${len} bytes (max ${taxonomy.rules.max_bytes_per_step})`);
      }
    }
  }
  if (errs.length) {
    console.error(`\n  ${errs.length} validation error(s):`);
    for (const e of errs.slice(0, 40)) console.error(`   - ${e}`);
    if (errs.length > 40) console.error(`   ... and ${errs.length - 40} more`);
    die('cases did not validate — nothing was emitted or published');
  }

  const byTag = {}; const bySrc = {};
  let steps = 0;
  for (const c of cases) {
    for (const t of c.tags) byTag[t] = (byTag[t] || 0) + 1;
    for (const s of c.steps) { steps++; bySrc[s.source] = (bySrc[s.source] || 0) + 1; }
  }
  console.log(`  OK — ${cases.length} cases, ${steps} steps, all tags and sources valid`);
  return { cases, steps, byTag, bySrc };
}

/* ---------------------------------------------------------------- 5. emit */
function emit(cases) {
  step(5, 'Emitting the TFS-import CSV');
  const area = flag('--area') || process.env.AZURE_AREA_PATH || 'Motadata\\Settings';
  const assignee = flag('--assigned-to') || process.env.CSV_ASSIGNED_TO || '';
  const state = process.env.AZURE_STATE || 'Design';
  const cell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

  const rows = [taxonomy.rules.csv_columns.map(cell).join(',')];
  for (const c of cases) {
    rows.push(['', 'Test Case', c.title, '', '', '', area, assignee, state, c.tags.join('; ')].map(cell).join(','));
    c.steps.forEach((s, i) => rows.push(['', '', '', String(i + 1), s.action, s.expected, '', '', '', ''].map(cell).join(',')));
  }
  const out = path.join(WS, `${KEY}_testcases.csv`);
  fs.writeFileSync(out, '﻿' + rows.join('\r\n') + '\r\n');
  console.log(`  ${out}`);
  return out;
}

/* ---------------------------------------------------------------- 6. gate */
function gate(ticket, v, csv) {
  step(6, 'Human gate');
  const pct = (n) => `${((n / v.steps) * 100).toFixed(0)}%`;
  const unverified = (v.bySrc.inferred || 0) + (v.bySrc.figma || 0);

  const lines = [
    `# ${KEY} — coverage gate`,
    '',
    `**${ticket.title}**`,
    `${ticket.type} · ${ticket.status} · components ${ticket.components.join(', ') || '-'} · fixVersions ${ticket.fixVersions.join(', ') || '-'}`,
    '',
    `Cases **${v.cases.length}** · steps **${v.steps}**`,
    '',
    '## By tag',
    ...Object.entries(v.byTag).sort((a, b) => b[1] - a[1]).map(([t, n]) => `- ${t}: ${n}`),
    '',
    '## Grounding of step expectations',
    ...Object.entries(v.bySrc).sort((a, b) => b[1] - a[1])
      .map(([s, n]) => `- ${s}: ${n} (${pct(n)}) — ${taxonomy.grounding_sources[s]}`),
    '',
    `**${unverified} step(s) (${pct(unverified)}) are NOT verified anywhere** (inferred/figma) — this is the review queue.`,
    '',
    '## Ticket gaps',
    ...(ticket.completeness.gaps.length ? ticket.completeness.gaps.map((g) => `- ${g}`) : ['- none detected']),
    '',
    '## Authoring report',
    fs.existsSync(path.join(WS, 'authoring-report.md')) ? fs.readFileSync(path.join(WS, 'authoring-report.md'), 'utf8') : '(none)',
  ];
  const out = path.join(WS, 'coverage-gate.md');
  fs.writeFileSync(out, lines.join('\n'));

  console.log(`\n  cases ${v.cases.length} · steps ${v.steps}`);
  console.log(`  tags   ${Object.entries(v.byTag).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(' · ')}`);
  console.log(`  source ${Object.entries(v.bySrc).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} ${n}`).join(' · ')}`);
  console.log(`  unverified (inferred+figma): ${unverified}/${v.steps} steps`);
  if (ticket.completeness.gaps.length) {
    console.log('  ticket gaps:');
    for (const g of ticket.completeness.gaps) console.log(`   - ${g}`);
  }
  console.log(`\n  gate report: ${out}`);
  console.log(`  csv:         ${csv}`);
  return out;
}

/* ---------------------------------------------------------------- 7. publish */
function publish() {
  step(7, `Publishing to plan ${process.env.AZURE_TEST_PLAN_ID || '(AZURE_TEST_PLAN_ID unset)'}`);
  const pubArgs = ['scripts/ado-publish.mjs', KEY, '--cases', path.join(WS, 'manual-cases.json')];
  if (has('--dry')) pubArgs.push('--dry');
  const lim = flag('--limit');
  if (lim) pubArgs.push('--limit', lim);
  const r = spawnSync(process.execPath, pubArgs, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  process.stdout.write(r.stdout || '');
  if (r.status !== 0) { process.stderr.write(r.stderr || ''); die('publish failed'); }
}

/* ---------------------------------------------------------------- run */
try {
  const ticket = await fetchTicket();
  if (!has('--resume')) {
    const ctx = buildContext(ticket);
    author(ticket, ctx);
  } else {
    step(2, 'skipped (--resume)');
    step(3, 'skipped (--resume) — reusing the existing manual-cases.json');
  }
  const v = validate();
  const csv = emit(v.cases);
  gate(ticket, v, csv);

  if (has('--publish') || has('--dry')) {
    publish();
  } else {
    console.log('\nSTOPPED at the gate — nothing was written to TFS.');
    console.log('Review the two files above, then publish with:');
    console.log(`  npm run cases -- ${KEY} --resume --publish`);
  }
} catch (err) {
  if (err instanceof Abort) console.error(`\nFAILED: ${err.message}`);
  else console.error(`\nFAILED: ${err.stack || err.message}`);
  process.exitCode = 1;
}
