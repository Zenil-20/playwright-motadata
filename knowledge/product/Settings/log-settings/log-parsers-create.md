---
screen: Log Settings · log-parsers-create
module: Settings
category: log-settings
route: "/settings/log-settings/log-parsers/create"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_log_settings_log_parsers_create.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Log Settings · Log Parsers — Create

## 1. Purpose
The form for creating a new **log parser**. The admin names the parser, chooses a **Log Parser Type**
and (for vendor/known formats) a **Type** and **Vendor**, optionally supplies a **Log File** and a
sample **Log**, and saves — either **Create Log Parser** or **Create Log Parser & Upload** (the
latter uploads an accompanying parser/definition file). The result is a reusable parser selectable
in Log Inventory.

- **Business objective:** let admins add coverage for a log format Motadata doesn't already parse —
  by picking a built-in vendor definition or uploading a custom one — so those logs become
  structured/searchable instead of landing in "Others".
- **Screen description:** a form with fields **Log Parser Name · Log Parser Type · Type · Vendor ·
  Log File · Log** and actions **Reset**, **Create Log Parser**, **Create Log Parser & Upload**.
- **Primary use cases:** create a vendor parser (pick Type/Vendor), create a custom parser by
  uploading a definition + sample log, test against a sample line.
- **Who uses it:** log/platform administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** log ingestion licensed/enabled · (for upload) a valid parser-definition file.

## 2. Navigation
```
Settings → Log Settings → Log Parsers → Create Log Parser
```
- **Breadcrumb:** Settings › Log Settings › Log Parsers › Create
- **URL:** `/settings/log-settings/log-parsers/create` (SPA route; reached via **Create Log Parser**
  on the Log Parsers list).

## 3. Actions
- **Create Log Parser** — save the parser (no file upload).
- **Create Log Parser & Upload** — save and upload the accompanying definition/log file.
- **Reset** — clear the form to defaults.
- **Select Type / Vendor / Log Parser Type** — dropdowns (`[data-cy='dropdown-trigger-input']`).

## 4. Components
| Field / control | Detail (from catalog) |
|---|---|
| Log Parser Name | text input (placeholder _Text_) — the free-text name field |
| Log Parser Type | dropdown (placeholder _Select_) |
| Type | dropdown (placeholder _Select_) |
| Vendor | dropdown (placeholder _Select Vendor_) |
| Log File | dropdown/file control (placeholder _Select_) — TODO(source: docs) file picker vs select |
| Log | sample-log text area — TODO(source: docs) confirm |
| Reset | button |
| Create Log Parser | button |
| Create Log Parser & Upload | button |
| Dropdown trigger | `[data-cy='dropdown-trigger-input']` (shared across the selects) |

_Locators: raw sweep in `knowledge/locators/catalog/settings_log_settings_log_parsers_create.json`.
No stable per-field ids were captured — the five inputs share the generic dropdown-trigger hook and
distinguish only by placeholder/label. Harvest scoped locators live before writing a spec._

> **Automation caveat:** four of the five inputs are dropdowns reachable only via
> `[data-cy='dropdown-trigger-input']`; disambiguate by surrounding label (Log Parser Type / Type /
> Vendor / Log File) via the explorer, not by index.

## 5. Permissions
- Expected **Admin / log-admin** to create; others no access. TODO(source: KG/docs) — exact RBAC +
  license gate.

## 6. Entry Conditions
- Logged in; Log Settings reachable; log ingestion licensed/enabled.
- Arrived from Log Parsers → Create. For an upload flow, a valid definition file is prepared.

## 7. Exit Conditions
- **On Create (success):** parser saved, returns to the Log Parsers list with the new row
  (Used Counts = 0); expected success toast. TODO(source: docs) — confirm toast + redirect.
- **On Create & Upload:** as above, after the file uploads. TODO(source: docs) — behavior on upload
  failure.
- **On Reset:** form cleared; no server call.

## 8. Validations
- **Log Parser Name** — required. TODO(source: docs) — uniqueness, length.
- **Log Parser Type** — required selection. TODO(source: docs) — enumerate types.
- **Type / Vendor** — required when the parser type is a vendor/known format; likely dependent
  (Vendor list filtered by Type). TODO(source: docs).
- **Log File / Log** — for **& Upload**, a file is required; the sample **Log** may be required to
  validate the parser. TODO(source: docs) — accepted file types/size, required-ness.

## 9. Business Rules
- Two save paths: with-upload vs without — the **& Upload** variant attaches a definition file, so
  the plain **Create** is for parsers fully defined by the Type/Vendor selection. TODO(source: KG) —
  confirm which fields each path requires.
- **Vendor** is expected to depend on **Type** (cascading dropdown). TODO(source: KG).
- TODO(source: KG) — how a created parser is then matched to sources (per-IP assignment per KB §7).

## 10. Known Bugs
None recorded for this create screen in `customer-issue-kb.md`.
> Parser *assignment*/indexing defects (per-IP mapping, non-indexable fields) are tracked on Log
> Inventory / Log Parsers (KB §7), not on the create form. Do not invent bugs.

## 11. Edge Cases
- Save with required dropdowns empty (Type/Vendor/Log Parser Type).
- **Create Log Parser & Upload** with no file / wrong file type / oversized file.
- Vendor list not filtered by Type (or empty for a Type).
- Duplicate parser name.
- Sample **Log** that the parser fails to match (validation feedback?).
- Reset after partial entry.
- Very long name; Unicode in name.
