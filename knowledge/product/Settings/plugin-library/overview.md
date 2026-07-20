---
screen: Plugin Library
module: Settings
category: plugin-library
route: "/settings/plugin-library/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library

## 1. Purpose
The **Plugin Library** is the central store of reusable, admin-authored plugins that extend Motadata's
built-in monitoring, log-parsing, automation, and topology capabilities. Where a stock metric template,
log parser, or topology walk doesn't cover a specific vendor device, OS output, or log format, an
engineer authors a plugin here once and reuses it across many monitors.

- **Business objective:** close the gap between default collection and real-world device/OS/log
  heterogeneity without a product release — the KB shows this is the single biggest source of
  "data missing / data wrong" tickets (Section 1, ~72 issues), routinely resolved by "ship a custom
  plugin" or "migrate the custom script".
- **Screen description:** a Settings section with four plugin families, each its own list + create flow:
  **Metrics** (`/metrics`), **Log Parsers** (`/log-parsers`), **Runbooks** (`/runbooks`), and
  **Topology Plugins** (`/topology-plugins`). The bare `/settings/plugin-library/` route resolves to the
  **Runbooks** grid (its catalog carries the runbook columns and `#create-runbook-btn`).
- **Primary use cases:** browse existing plugins, see how many monitors reference each (Used Count),
  create a new plugin, run/schedule a runbook, filter/search a family.
- **Who uses it:** administrators / monitoring engineers who extend collection. TODO(source: KG/docs) —
  exact role gate (expected admin-only, since plugins execute scripts on devices).
- **Dependencies:** the monitor store (plugins bind to monitors), credential profiles (script plugins
  authenticate to devices), the plugin execution engine (Go/Python — see Known Bugs), and for runbooks
  the scheduler.

## 2. Navigation
```
Settings → Plugin Library → { Metrics · Log Parsers · Runbooks · Topology Plugins }
```
- **Breadcrumb:** Settings › Plugin Library › (family)
- **Landing:** `/settings/plugin-library/` — resolves to the **Runbooks** list (default sub-screen).
- **URL:** `/settings/plugin-library/` (open the full URL; SPA routing must load the page).
- **Sibling family screens:** `metrics`, `log-parsers`, `runbooks`, `topology-plugins` (each documented
  separately in this folder).

## 3. Actions
- **Search** a plugin family (`input[placeholder="Search"]`, also `input[name="search"]`).
- **Filter** the grid — `#filter-btn` (present on the Runbooks/Metrics families).
- **Create Runbook Plugin** — `#create-runbook-btn` (the landing family).
- **Run** a runbook row — `[data-cy='run']`.
- **Row actions** (edit / delete / clone / run) — `[data-cy='grid-action']` per row.
- Switch plugin family via the Plugin Library sub-navigation.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` and `input[name="search"]` (two search inputs captured) |
| Filter | `#filter-btn` |
| Create Runbook Plugin (primary) | `#create-runbook-btn` |
| Runbook grid | columns: Runbook Name · Description · Used Count · Runbook Type · Runbook Category · Scheduler · Last Run Result · Actions |
| Per-row actions | `[data-cy='grid-action']` |
| Run runbook | `[data-cy='run']` |
| Settings left-nav + Search | shared Settings shell |

> The landing route's catalog is identical to `runbooks.md` — the Plugin Library home defaults to the
> Runbooks family. See the per-family docs for Metrics / Log Parsers / Topology Plugins controls.

_Locators: see `knowledge/locators/catalog/settings_plugin_library.json`; promote verified ones into
`knowledge/locators/selector-cookbook.md`._

## 5. Permissions
- Plugins execute scripts against monitored devices, so this section is expected to be **admin/operator
  privileged**, not viewer-facing. TODO(source: KG/docs) — confirm the exact RBAC role and any license/
  module gate.

## 6. Entry Conditions
- User is logged in with a valid session and Settings is reachable (`/settings/`).
- The plugin store loads (existing plugins list; Used Count populates from monitor bindings).
- TODO(source: docs) — whether any module/feature flag must be enabled to see all four families.

## 7. Exit Conditions
- Navigating into a family shows its grid; **Create** opens the family's create form.
- **Run** (runbook) triggers execution and updates the row's **Last Run Result**.
- TODO(source: docs) — audit-trail entry on plugin create/edit/delete.

## 8. Validations
- Search filters the grid client-side/server-side by name. TODO(source: docs) — exact match semantics.
- Field-level validations live on the per-family create screens (see those docs).

## 9. Business Rules
- **Used Count** reflects how many monitors/policies reference a plugin — a plugin with Used Count > 0 is
  in active use; deleting it likely affects those monitors. TODO(source: KG) — confirm whether delete is
  blocked while Used Count > 0.
- The library is organized by plugin **family** (Metric / Log Parser / Runbook / Topology), each with its
  own schema and execution semantics.
- TODO(source: KG/docs): plugin name uniqueness scope (per family vs global), import/export of plugins.

## 10. Known Bugs
The KB does not record defects on the Plugin Library **list/landing** UI itself. The recurring defects
sit in what plugins *do* and are documented on the create screens:
- Custom Go plugin scripts spawning processes/cron jobs caused datastore/app **OOM kills**; fix path was
  to **migrate custom Go scripts to Python** (Section 3, PQD-38278 / MOTADATA-8024; hotfixes 8.1.3–8.2.0).
- Logs bypassing an assigned parser landing in **"Others"** (Section 7) — see `log-parsers-create.md`.
- Topology parser misclassification of names/IPs (Section 8) — see `topology-plugins-create.md`.

None recorded for the library landing screen specifically. Do not invent bugs.

## 11. Edge Cases
- Empty library (no plugins authored yet) — grid shows zero rows.
- Search with no matches; search special characters / very long strings.
- Plugin with high Used Count — attempt delete (should warn/block per Business Rules TODO).
- Landing route deep-linked directly (`/settings/plugin-library/`) — confirm it lands on Runbooks.
- Concurrent edit of the same plugin from two admin sessions (last-write-wins?).
