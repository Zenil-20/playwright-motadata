# ObserveOps adaptation brief (for authoring skills)

When adapting a generic QA skill into this repo, **manipulate it to ObserveOps** — cite our real
files, flows, and product concepts. A skill that reads generic is a failed adaptation.

## The product under test
Motadata **ObserveOps** (AIOps) — a Vue 3 + **Ant Design** SPA (build 8.2.6). Modules: Dashboards,
Monitors/Inventory, Alerts, SLO, Reports, Topology, NCCM, NetRoute, Metric/Log/APM/RUM/Flow/Trap
Explorers, Audits, and a huge **Settings** area (Discovery, Policies, Users/RBAC, Integrations, …).
Core flows: **network discovery** (SNMP/SSH/WMI → provision monitors), **policy** creation
(availability/metric/log/…), **alerts**, **dashboards**. It has a **Light/Dark/Auto theme** (Settings →
My Account → UI Preference) and many "No data found" empty states.

## Our stack & where things live (cite these)
- Tests: `tests/regression/**` (44 specs) + `tests/scenarios/**` (data-driven) + matrices `tests/data/*.csv`.
- Engine: `framework/playwright/` — `selectors.js` (locator catalog), `resolver.js` (primary→fallback
  self-heal, `count()===1`), `flow.js` (no literal selectors). `framework/core/` (testcase-store,
  reporters, orchestration+run-manifest). `framework/integrations/` (jira/tfs/**vcs**).
- Locator knowledge: `knowledge/locators/selector-cookbook.md` (+ `catalog/*.json` raw sweep, 175 screens).
- Screen knowledge (RAG): `knowledge/product/<Module>/<Screen>.md` — **176 screens**, 11 sections each
  (Purpose/Navigation/Actions/Components/Permissions/Entry/Exit/Validations/Business Rules/Known Bugs/Edge Cases).
- Known bugs: `knowledge/known_issues/customer-issue-kb.md` (real PQD/MOTADATA tickets).
- Gates (anti-hallucination): `governance/validation/` (`runGate`). Pipeline: `pipeline/` (10 stages).
- Agents: `agents/<name>/prompt.md` (16). Screenshots: `knowledge/screenshots/` (83).

## Our conventions (a skill must respect them)
- **Cookbook-first locators**, no positional XPath, `count()===1`, role/label/`data-cy` first, scope
  AntDesign dups to `.ant-drawer-open` / `.ant-popover:visible` / `tr.k-master-row`.
- **Smart waits** only (no `networkidle`, no blind `waitForTimeout`); avatar-visible login check.
- **Max coverage, min automation** — one data-driven scenario × many CSV rows.
- **Provenance / no fabrication**; quarantine-not-mask; every claim cited.

## Skill file format (Claude Code)
```
---
name: <kebab-name>
description: <one line — what it does + when to use, ObserveOps-flavored>
---
# <Title>
<adapted body — concrete ObserveOps examples: discovery/policy/alert flows, AntDesign selectors,
our cookbook/resolver, the 176 screen docs, dark/light theme, "No data found" states, RBAC screens>
## When to use / When NOT
## Procedure (ObserveOps-specific, cite our files)
## Rules & anti-patterns (tie to our conventions)
```
Keep frontmatter lean (name + description). Attribute the origin in one line at the bottom
("Adapted from qaskills/seed-skills/<name>"). Do NOT copy the generic body verbatim — rewrite it
around ObserveOps.
