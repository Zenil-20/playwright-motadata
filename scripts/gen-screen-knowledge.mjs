#!/usr/bin/env node
/*
 * gen-screen-knowledge — emit one knowledge/product/<Module>/<Screen>.md per harvested screen.
 *
 * SOURCE: knowledge/locators/catalog/*.json (175 screens harvested live from the Vue router,
 * each with title/labels/inputs/buttons/selects/switches/tabs/gridHeaders/route).
 *
 * DETERMINISTIC + GROUNDED: Navigation (route) and Components (real controls) are filled from the
 * catalog; the reasoning sections (Purpose/Actions/Permissions/Validations/Business Rules/Known
 * Bugs/Edge Cases) are left as TODO(source) so nothing is fabricated. Re-runnable (idempotent):
 * `npm run gen:screens`. Do NOT hand-edit generated files without moving them out of the sweep.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAT = path.join(root, 'knowledge', 'locators', 'catalog');
const OUT = path.join(root, 'knowledge', 'product');

const MODULES = {
  dashboard: 'Dashboards', inventory: 'Monitors', alerts: 'Alerts', slo: 'SLO', reports: 'Reports',
  topology: 'Topology', nccm: 'NCCM', ncm: 'NCCM', netroute: 'NetRoute', 'metric-explorer': 'MetricExplorer',
  log: 'LogExplorer', apm: 'APM', rum: 'RUM', flow: 'Flow', 'trap-explorer': 'TrapExplorer',
  audit: 'Audits', notifications: 'Global', login: 'Global', health: 'Global', settings: 'Settings',
  setup: 'Setup', upgrade: 'Global', 'ncm-approval': 'NCCM', unauthorized: 'Global',
};

const kebab = (s) => String(s || '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
const titleOf = (j, fallback) => (j.title || '').replace(/^Motadata ObserveOps \|\s*/i, '').trim() || fallback;

function classify(route, slug) {
  const segs = String(route || '/' + slug.replace(/_/g, '/')).split('/').filter(Boolean);
  const top = segs[0] || slug.split('_')[0];
  const module = MODULES[top] || 'Other';
  if (module === 'Settings') {
    const category = segs[1] || 'general';
    const rest = segs.slice(2).map(kebab).filter(Boolean);
    return { module, subdir: kebab(category), base: rest.join('-') || 'overview' };
  }
  const rest = segs.slice(1).map(kebab).filter(Boolean);
  return { module, subdir: '', base: rest.join('-') || kebab(top) };
}

// Screens with a curated, richer hand-written file — the generator must not overwrite them.
const CURATED = new Set(['/login', '/dashboard', '/dashboard/']);

function list(arr, fmt, cap = 40) {
  const a = (arr || []).filter(Boolean);
  if (!a.length) return null;
  const shown = a.slice(0, cap).map(fmt);
  const extra = a.length > cap ? `\n- …(+${a.length - cap} more)` : '';
  return shown.map((x) => `- ${x}`).join('\n') + extra;
}

function components(j) {
  const parts = [];
  const add = (h, body) => body && parts.push(`**${h}**\n${body}`);
  add('Form fields (labels)', list(j.labels, (l) => `${l}`));
  add('Inputs', list(j.inputs, (i) => `\`${i.name || i.id || '?'}\`${i.placeholder ? ` — _${i.placeholder}_` : ''}${i.type ? ` (${i.type})` : ''}`));
  add('Selects (dropdowns)', j.selects ? `${j.selects} on the screen` : null);
  add('Switches / toggles', j.switches ? `${j.switches}` : null);
  add('Radios / checkboxes', [j.radios ? `${j.radios} radio` : '', j.checkboxes ? `${j.checkboxes} checkbox` : ''].filter(Boolean).join(' · ') || null);
  add('Tabs', list(j.tabs, (t) => `${t}`));
  add('Grid columns', list(j.gridHeaders, (g) => `${g}`));
  add('Buttons', list(j.buttons, (b) => `${b}`));
  add('Button ids', list(j.buttonIds, (b) => `\`#${b}\``));
  add('data-cy hooks', list(j.dataCy, (d) => `\`[data-cy='${d}']\``));
  add('data-testid hooks', list(j.dataTestid, (d) => `\`[data-testid='${d}']\``));
  return parts.length ? parts.join('\n\n') : '_No controls captured in the sweep (page may lazy-render on interaction)._';
}

const files = fs.readdirSync(CAT).filter((f) => f.endsWith('.json') && f !== '_index.json');
let n = 0;
const perModule = {};
for (const f of files) {
  const slug = f.replace(/\.json$/, '');
  const j = JSON.parse(fs.readFileSync(path.join(CAT, f), 'utf8'));
  const route = j.route || '/' + slug.replace(/_/g, '/');
  if (CURATED.has(route)) continue; // keep the hand-written Login.md / Dashboard.md
  const { module, subdir, base } = classify(route, slug);
  const rawName = titleOf(j, base);
  // many sweep titles are generic per category ("Policy Settings"); disambiguate by the specific screen
  const name = base === 'overview' ? rawName : `${rawName} · ${base}`;
  const dir = path.join(OUT, module, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${base}.md`);
  // Never clobber a hand-curated screen: skip if the existing file is marked verified/draft.
  if (fs.existsSync(outPath) && /^status:\s*(verified|draft)\b/m.test(fs.readFileSync(outPath, 'utf8'))) continue;
  const md = `---
screen: ${name}
module: ${module}${subdir ? `\ncategory: ${subdir}` : ''}
route: "${route}"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/${f} (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# ${name}

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: \`${route}\` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
${components(j)}

_Locators: see \`knowledge/locators/catalog/${f}\` (raw sweep) — promote verified ones into the cookbook._

## Permissions
TODO(source: docs) — roles that can view/act.

## Entry Conditions
Logged in. TODO(source: docs) — any feature flag / seeded data.

## Exit Conditions
TODO(source: docs).

## Validations
TODO(source: docs) — field validations + inline errors.

## Business Rules
TODO(source: Motadata KG) — uniqueness, defaults, dependencies, limits.

## Known Bugs
See \`knowledge/known_issues/customer-issue-kb.md\` for related customer issues, if any.

## Edge Cases
TODO — boundary / negative / timing cases.
`;
  fs.writeFileSync(outPath, md);
  perModule[module] = (perModule[module] || 0) + 1;
  n++;
}

console.log(`generated ${n} screen files across ${Object.keys(perModule).length} modules:`);
for (const [m, c] of Object.entries(perModule).sort((a, b) => b[1] - a[1])) console.log(`  ${m.padEnd(16)} ${c}`);
