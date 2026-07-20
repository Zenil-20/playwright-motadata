---
screen: Report · reports
module: Reports
route: "/reports/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/reports.json · screenshots/report.png · known_issues/customer-issue-kb.md §4
verified: 2026-07-09
---

# Reports — Report List

## 1. Purpose
The **report catalog** — the central list of all saved reports across every data domain, from which users
run, schedule, download, favorite, edit, and manage reports.

- **Business objective:** give users a single place to find and operate every report (availability,
  performance, inventory, alerts, flow, audit, etc.), schedule recurring delivery, and download output.
- **Screen description:** domain tabs (**Metric, Log, Flow, Trap, Audit, NCCM, APM, RUM, NetRoute, Log
  Compliance**); a left **category panel** with its own Search and entries (Favorites, All Reports, Config,
  Inventory, Performance, Flow Reports, WAN Link, Alert, Virtualization, Availability, Wireless, Network,
  Server, SDN, Service Check, Process, WAN LINK Test …, some with an edit pencil); a main **grid** Search,
  quick-filter chips (**Type**, **Report Type**), a **+ Filter** builder, two export icons, and a
  **Create Custom Report** button (top-right). The grid lists reports with a **favorite star**, **Name**,
  **Description**, **Type** (e.g. Availability Flap Summary, Custom Script, Performance, Availability, Active
  Alerts), **Report Type** (Custom / Default), **Schedule** (an **ON/OFF** toggle + a schedule/calendar
  icon), **Download**, and a per-row **Actions** kebab (`[data-cy='grid-action']`). Footer paginates
  (screenshot: 1–50 of 351 items, 50/page).
- **Primary use cases:** find a report, toggle its schedule on/off, download it, favorite it, open the
  actions menu (edit/run/delete/clone), or create a new custom report.
- **Who uses it:** operators, administrators, and report consumers.
- **Dependencies:** the reporting engine · saved report definitions · scheduler + mail server (for
  scheduled delivery) · the data domains being licensed/collected.

## 2. Navigation
```
Left icon rail → Reports (report/book icon)
```
- **Domain tabs:** Metric · Log · Flow · Trap · Audit · NCCM · APM · RUM · NetRoute · Log Compliance
- **URL:** `/reports/` — open the full URL; SPA routing must load the page.

## 3. Actions
- **Create Custom Report** — `#create-report-btn` → opens the create wizard (`/reports/create`).
- **Search** — two search boxes: the **category panel** search and the **grid** search (catalog shows two
  `search` inputs).
- **Quick filters** — **Type** and **Report Type** chips.
- **Advanced filter** — **Filter** button (`#filter-btn`).
- **Toggle schedule** — per-row **ON/OFF** switch (catalog `switches: 50` — one per visible row) enables/
  disables scheduled delivery.
- **Favorite** — star toggle per row (and the Favorites category).
- **Download** — per-row Download column.
- **Row actions** — kebab menu `[data-cy='grid-action']` (edit / run / clone / delete — TODO(source: KG)
  confirm exact items).
- **Edit category** — pencil icons on some left-panel categories.
- **Export** — two toolbar export icons.
- **Open a report** — click Name to view (screenshot status bar shows `/reports/view/<id>?reportCategories=…`).

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Domain tabs | Metric · Log · Flow · Trap · Audit · NCCM · APM · RUM · NetRoute · Log Compliance |
| Category panel | Favorites · All Reports · Config · Inventory · Performance · Flow Reports · WAN Link · Alert · … (+ Search, edit pencils) |
| Grid Search | `input` _Search_ (grid) |
| Category Search | `input` _Search_ (left panel) |
| Type / Report Type filters | quick-filter chips |
| Filter | **Filter** button `#filter-btn` |
| Create Custom Report | `#create-report-btn` |
| Grid columns | ★ · Name · Description · Type · Report Type · Schedule · Download · Actions |
| Schedule toggle | per-row **ON/OFF** `ant-switch` (many row-id switches, e.g. `#10000000010378`) |
| Row actions | kebab `[data-cy='grid-action']` |
| Export | two toolbar export icons |

> The long list of numeric **button ids** (`#10000000010378`, `#110357093148`, …) are **per-row element
> ids** (report record ids), not stable global controls — scope by row, don't hard-code them.

_Locators: see `knowledge/locators/catalog/reports.json`; promote verified ones into the cookbook
(Reports > Report List)._

## 5. Permissions
- **View / run / download:** roles with report access. The KB records that a **read-only user could not
  download reports** until granted the **"Query" permission** (§4, PQD-38798) — download is permission-gated.
- **Create / edit / schedule / delete:** Admin/Operator. TODO(source: KG/docs) confirm the exact role matrix
  and whether scheduling requires mail-server config.

## 6. Entry Conditions
- User is logged in with report access.
- Report definitions exist (else empty grid); the active domain tab's module is licensed/collecting.
- For scheduled delivery to work, the **mail server** must be configured (Settings → System → Mail Server).

## 7. Exit Conditions
- **Grid loads** the reports for the active tab/category; footer count reflects filters.
- **On schedule toggle:** the row's ON/OFF persists; scheduled runs begin/stop; audit entry written.
- **On download:** a file downloads in the report's format.
- **On Create Custom Report:** navigates to `/reports/create`.
- **On favorite:** the star fills and the report appears under Favorites.

## 8. Validations
- **Search / filters** — free-text; empty is a no-op.
- **Schedule toggle** — enabling a schedule for a report with no schedule defined should prompt for one, or
  be blocked. TODO(source: KG) confirm.
- Report-definition validations (name uniqueness, criteria) live in the create/edit flow (`/reports/create`).

## 9. Business Rules
- **Report Type = Custom vs Default** — Default reports are shipped/system; Custom are user-built (and
  Custom Script reports run a backend script).
- **Schedule is per-report** (ON/OFF) — a report can be scheduled independently of being downloadable.
- **Favorites** is a saved view of starred reports; categories on the left scope the grid.
- **Domain tab scopes** the report set (Metric reports vs Log vs Audit …).
- TODO(source: KG/docs): whether disabling a schedule deletes its delivery config or just pauses it; report
  name uniqueness scope.

## 10. Known Bugs
From `customer-issue-kb.md` §4 (Reports) — a hotspot; cite for regression:
- **Export / format defects** (PQD-38909 / MOTADATA-8254, PQD-37595 / MOTADATA-7908, PQD-36889 /
  MOTADATA-7839, PQD-32782): **scheduled PDF arrived as XLSX** (format selection ignored in scheduler);
  exported group list showed **tag IDs instead of values**; multiple suffixes in availability export;
  missing serial-number column/ordering. *Fixes:* 8.1.3–8.2.0; ascending-order 8.0.26. → Test the
  **Schedule** toggle + format end-to-end.
- **Availability/trend data wrong or missing for longer ranges** (PQD-32430 / MOTADATA-6639,
  PQD-38241 / MOTADATA-8012, PQD-27377, PQD-39031 / MOTADATA-8274): raw-vs-aggregation retention mismatch;
  tag-filtered interface report ignored the filter; monthly/quarterly report empty. *Fixes:* auto-route to
  aggregation (8.0.24), 8.2.0; time units capped at Days (8.2.1).
- **Report content/permission gotchas** (PQD-38798, PQD-38219): **read-only user can't download** (missing
  "Query" permission); parent group doesn't include child groups (explicit-selection by design).

## 11. Edge Cases
- **Large catalog** (screenshot: 351 items) — pagination, sort, filter, and select performance.
- Toggle Schedule **ON** for a report with no schedule config, or with mail server unconfigured.
- Download as a **read-only** user without Query permission (KB PQD-38798).
- Report whose domain/module is **unlicensed** — empty tab, not error.
- Duplicate report names; very long names/descriptions — grid truncation.
- Custom Script report failing at run time — surfaced how in Actions/Download?
- Favorite/unfavorite rapidly — star state race.
- Export the grid filtered vs unfiltered; export honors active Type/Report Type filters.
- Monthly/quarterly availability report crossing the raw→aggregation retention boundary (KB §4).
