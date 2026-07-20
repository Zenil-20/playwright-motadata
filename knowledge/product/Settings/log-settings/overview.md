---
screen: Log Settings
module: Settings
category: log-settings
route: "/settings/log-settings/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_log_settings.json (live Vue-router sweep 2026-07-02); customer-issue-kb.md §7
verified: 2026-07-09
---

# Log Settings

## 1. Purpose
The landing screen of the **Log Settings** area — the configuration hub for Motadata ObserveOps'
log-analytics pipeline. The captured controls are identical to **Log Inventory**
(`settings_log_settings.json` route `/settings/log-settings/` mirrors `.../log-inventory`), so the
default tab **is** the log-source inventory: the grid of every source (device, agent, application)
that ships logs into the platform, the parser(s) assigned to each, and its category/group.

- **Business objective:** give an admin one place to control how raw logs are ingested, parsed,
  organized and forwarded — so log search, log-based alerting and compliance/audit reporting all
  work against clean, correctly-parsed data.
- **Screen description:** a searchable/filterable grid (Source · Source Type · Assigned Parsers ·
  Category · Group · Actions) with **Create Log Inventory** and **Filter** toolbar actions, sitting
  alongside sibling screens Log Inventory, Log Parsers, Log Collection Profile, Log Forwarder and
  Directory Paths.
- **Primary use cases:** review which sources are sending logs, confirm each has the right parser,
  add a new source, jump into the parser/forwarder/directory sub-screens.
- **Who uses it:** platform/log administrators. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** log ingestion enabled/licensed · a running collector/agent forwarding logs ·
  parsers (Log Parsers) · groups & tags (System Settings).

## 2. Navigation
```
Settings → Log Settings   (left-nav)
```
- **Breadcrumb:** Settings › Log Settings
- **Sibling screens:** Log Inventory · Log Parsers · Log Collection Profile · Log Forwarder ·
  Directory Paths (TODO(source: KG/docs) — confirm exact sub-nav order/labels).
- **URL:** `/settings/log-settings/` (SPA route; open the full URL so Vue-router loads the page).

## 3. Actions
- **Create Log Inventory** — add a new log source (`#create-group-btn`).
- **Filter** — open the filter panel to narrow the grid (`#filter-btn`).
- **Search** — free-text filter over the grid (`input[name="search"]`, placeholder _Search_).
- **Per-row actions** — `[data-cy='grid-action']` (edit / delete / assign parser). TODO(source:
  KG/docs) — exact action menu items.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search"]` (text, placeholder _Search_) + a second unnamed _Search_ input |
| Grid | columns **Source · Source Type · Assigned Parsers · Category · Group · Actions** |
| Create Log Inventory | button `#create-group-btn` |
| Filter | button `#filter-btn` |
| Row actions | `[data-cy='grid-action']` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_log_settings.json`; promote verified
ones into `knowledge/locators/selector-cookbook.md` (Settings > Log Settings)._

> **Note:** the overview route and Log Inventory expose the same grid/ids (`#create-group-btn`,
> `#filter-btn`). Scope tests by route, not by id alone, to avoid cross-screen matches.

## 5. Permissions
- Configuration screen — expected **Admin / log-admin** to create/edit; Operator/Viewer read-only.
  Generic-but-reasoned; TODO(source: KG/docs) — exact RBAC roles and the log-module license gate.

## 6. Entry Conditions
- User logged in with a valid session; Settings reachable.
- Log ingestion is licensed/enabled and at least one collector/agent is forwarding logs (otherwise
  the grid is empty). TODO(source: docs) — confirm feature-flag/license name.

## 7. Exit Conditions
- Grid renders the current source inventory; navigating a row action or **Create Log Inventory**
  transitions to the corresponding form. TODO(source: docs) — success toasts on create/edit.

## 8. Validations
- Grid/search are read paths — no field validation here.
- Create/edit validations belong to Log Inventory. TODO(source: docs).

## 9. Business Rules
- **Parser assignment is per source** (see Log Inventory) — a source with no/incorrect parser lands
  logs in **"Others"** and they become unparsed/unsearchable (KB §7). TODO(source: KG) — confirm
  default-parser fallback behavior.

## 10. Known Bugs
_Log-pipeline defects that surface here (via the inventory/parser data behind this screen), from
`customer-issue-kb.md` §7 "Log / Flow / Trap Explorers":_
- **Logs land in "Others" / not parsed / not searchable** — parser assignment is per source-IP, so
  dynamic dual-WAN IPs break it; `windows.event.provider` was non-indexable (hotfix + config param
  to index fields, 8.1.3); only Event/Application/Security event sources enabled by default; Linux
  AuditD parser became default in **8.2.2**. (PQD-35659, PQD-38164 [MOTADATA-8029], PQD-36867,
  PQD-41651.)
- **Log licensing/quota & pipeline** — daily log quota not reset at midnight; verticles not started
  until the service is restarted after applying the license (PQD-34767, PQD-35039).
> Verify each still reproduces on build 8.2.6 before treating as open. Do not invent bugs.

## 11. Edge Cases
- Empty inventory (no source forwarding yet) — grid shows zero rows.
- Source with **no assigned parser** → logs to "Others".
- Same source IP reused by two devices (dual-WAN) → parser mis-assignment.
- Very large inventory (pagination/search performance).
- Filter + search combined; clearing filters.
- Row action on a source that is mid-ingest (concurrent edit).
