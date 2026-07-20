---
screen: Log Settings · log-parsers
module: Settings
category: log-settings
route: "/settings/log-settings/log-parsers"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_log_settings_log_parsers.json (live Vue-router sweep 2026-07-02); customer-issue-kb.md §7
verified: 2026-07-09
---

# Log Settings · Log Parsers

## 1. Purpose
Manages the **log parsers** — the rule sets that turn raw log lines into structured, searchable
fields. Each parser has a **type** and a **Used Counts** figure (how many sources reference it), so
an admin can see which parsers exist, which are in use, and create new ones. Correct parsing is the
precondition for log search, log dashboards and log-based alerting.

- **Business objective:** maintain the library of parsers so every ingested log format is extracted
  into fields rather than dumped as raw text in "Others".
- **Screen description:** a searchable, filterable grid (**Log Parser Name · Used Counts · Log ·
  Log Parser Type · Actions**) with **Create Log Parser** and **Filter** actions.
- **Primary use cases:** review parsers and their usage, create a parser (built-in vendor or
  uploaded), edit/delete a parser, filter by type.
- **Who uses it:** log/platform administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** log ingestion licensed/enabled · sources to assign parsers to (Log Inventory).

## 2. Navigation
```
Settings → Log Settings → Log Parsers
```
- **Breadcrumb:** Settings › Log Settings › Log Parsers
- **URL:** `/settings/log-settings/log-parsers` (SPA route; open the full URL).
- **Create sub-route:** `/settings/log-settings/log-parsers/create` (see log-parsers-create.md).

## 3. Actions
- **Create Log Parser** — open the create form (route `.../log-parsers/create`).
- **Filter** — open the filter panel (`#filter-btn`).
- **Search** — free-text filter (placeholder _Search_).
- **Per-row Actions** — `[data-cy='grid-action']` (edit / delete / view usage). TODO(source:
  KG/docs) — exact menu; deleting a parser with **Used Counts > 0** likely blocked (see Business
  Rules).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | two unnamed _Search_ text inputs |
| Grid | columns **Log Parser Name · Used Counts · Log · Log Parser Type · Actions** |
| Create Log Parser | button (no id captured; routes to `.../create`) |
| Filter | button `#filter-btn` |
| Row actions | `[data-cy='grid-action']` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_log_settings_log_parsers.json`;
promote verified ones into the cookbook (Settings > Log Parsers). The Create button had no captured
id — harvest live._

## 5. Permissions
- Expected **Admin / log-admin** to create/edit/delete; others read-only. TODO(source: KG/docs) —
  exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Log Settings reachable; log ingestion licensed/enabled.
- Built-in/default parsers ship with the product; the grid is non-empty on a fresh install
  (TODO(source: docs) — confirm the default parser set).

## 7. Exit Conditions
- **On create (success):** new parser row appears with type and **Used Counts = 0**; expected
  success toast. TODO(source: docs).
- **On delete:** row removed (only if unused — see Business Rules).

## 8. Validations
- **Log Parser Name** — required and likely unique. TODO(source: docs).
- Type-specific validation belongs to the create form. TODO(source: docs).

## 9. Business Rules
- **Used Counts** reflects how many sources reference a parser; a parser in use is expected to be
  **undeletable** until unassigned. TODO(source: KG) — confirm the guard.
- **Linux AuditD** parser is a default from **8.2.2** (KB §7).
- TODO(source: KG) — built-in vs custom parser precedence, editability of built-ins, versioning.

## 10. Known Bugs
From `customer-issue-kb.md` §7 (parser-related):
- **Logs bypass the assigned parser** when parser→source mapping is keyed on a dynamic/dual-WAN IP
  (PQD-35659) — surfaces as data in "Others" despite a parser existing.
- **Non-indexable parsed field** (`windows.event.provider`) made search/filter dead until a hotfix +
  config parameter indexed it (**8.1.3**). (PQD-38164 [MOTADATA-8029].)
> These are parser-assignment/indexing issues rather than defects in this list screen itself. Verify
> against build 8.2.6. Do not invent bugs.

## 11. Edge Cases
- Delete a parser with **Used Counts > 0** (should be blocked or warn).
- Duplicate parser name.
- Editing a built-in/default parser (allowed?).
- Parser that matches nothing → source still logs to "Others".
- Two parsers that both match a source's lines (precedence/ordering).
- Large parser library — search/filter/pagination.
