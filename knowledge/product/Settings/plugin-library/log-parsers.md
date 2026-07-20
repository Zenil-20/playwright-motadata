---
screen: Plugin Library · Log Parsers
module: Settings
category: plugin-library
route: "/settings/plugin-library/log-parsers"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library_log_parsers.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library · Log Parsers

## 1. Purpose
The **Log Parser Plugins** list — reusable scripts that turn raw incoming log lines into structured,
searchable fields. When a log source's format isn't recognized, its events fall into **"Others"** and
become hard to search/alert on; a custom log parser plugin fixes that (KB Section 7).

- **Business objective:** make non-standard log formats parseable and searchable so log
  filters/alerts/dashboards work.
- **Screen description:** a searchable grid of log-parser plugins with **Create Log Parser Plugin**.
- **Primary use cases:** review parsers, search by name, open to edit, create a new parser.
- **Who uses it:** log/monitoring engineers / admins. TODO(source: KG/docs) — exact RBAC gate.
- **Dependencies:** the log ingestion pipeline and parser-assignment (per source-IP — see Known Bugs).

## 2. Navigation
```
Settings → Plugin Library → Log Parsers
```
- **Breadcrumb:** Settings › Plugin Library › Log Parsers
- **URL:** `/settings/plugin-library/log-parsers`
- **Create:** `/settings/plugin-library/log-parsers/create` (see `log-parsers-create.md`).

## 3. Actions
- **Search** parsers — two `input[placeholder="Search"]` boxes captured.
- **Create Log Parser Plugin** → opens the create form (no dedicated button id captured;
  TODO(source: KG) — confirm id).
- **Row actions** (edit / delete) via the Actions column. (No `[data-cy='grid-action']` was captured on
  this family; TODO(source: KG) — confirm the row-action hook.)

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box(es) | two `input[placeholder="Search"]` |
| Create Log Parser Plugin (primary) | button — id not captured (TODO) |
| Grid | columns: Name · Actions (minimal grid) |

_Locators: see `knowledge/locators/catalog/settings_plugin_library_log_parsers.json`; promote verified
ones into the selector-cookbook._

## 5. Permissions
- Expected **admin/operator** (parsers run in the ingestion pipeline). TODO(source: KG/docs) — confirm.

## 6. Entry Conditions
- Logged in; Settings reachable; Log Parsers family selected.
- The parser-plugin store loads.
- TODO(source: docs) — whether the Log module/license must be enabled.

## 7. Exit Conditions
- **Create** navigates to the create form.
- Deleting a parser removes it. TODO(source: KG) — effect on sources currently assigned to it.
- TODO(source: docs) — audit entry on create/edit/delete.

## 8. Validations
- Search filters by **Name**. TODO(source: docs) — match semantics.
- Field validations live on the create screen.

## 9. Business Rules
- **Parser assignment is per source-IP** (KB Section 7) — a parser applies to logs from specific source
  IP(s); dynamic/dual-WAN IPs can break the mapping.
- TODO(source: KG): parser name uniqueness, precedence when multiple parsers could match, and how a
  parser is bound to a source.

## 10. Known Bugs
- **Logs bypass the assigned parser → land in "Others" / not searchable** (Section 7, e.g. PQD-35659,
  PQD-38164 / MOTADATA-8029, PQD-36867). Root causes: parser assignment keyed on source-IP (dynamic dual-WAN
  IPs break it), and non-indexable fields like `windows.event.provider`. Fixes: hotfix + config parameter
  to index fields (8.1.3 patch); name-based grouping requested; verify forwarding with tcpdump at both ends
  (PQD-41047).

None recorded for the Log Parsers list UI itself beyond the above pipeline issues. Do not invent bugs.

## 11. Edge Cases
- Empty list (no custom parsers).
- Search with no matches; special characters.
- Delete a parser currently assigned to a live source.
- Source IP changes (dual-WAN) after a parser was bound by IP (KB "Others" class).
- Very long parser names.
