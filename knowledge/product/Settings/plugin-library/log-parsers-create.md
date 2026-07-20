---
screen: Plugin Library · Create Log Parser Plugin
module: Settings
category: plugin-library
route: "/settings/plugin-library/log-parsers/create"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library_log_parsers_create.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library · Create Log Parser Plugin

## 1. Purpose
The authoring form for a **custom log parser plugin** — a script that transforms raw log lines from a
source into structured fields the Log module can index, search, and alert on. This is the fix for the
KB's "logs land in Others / not parsed" pattern (Section 7).

- **Business objective:** parse a non-standard log format correctly so downstream search/alert/dashboards
  work instead of dumping events into "Others".
- **Screen description:** a minimal form — a **Name** and a single **Script** (CodeMirror) — with
  **Reset** and **Save & Run**.
- **Primary use cases:** author a parser and immediately run it (Save & Run) to validate parsing.
- **Who uses it:** log/monitoring engineers / admins. TODO(source: KG/docs) — exact RBAC gate.
- **Dependencies:** the log ingestion pipeline; sample log data to validate against (via Save & Run).

## 2. Navigation
```
Settings → Plugin Library → Log Parsers → Create Log Parser Plugin
```
- **Breadcrumb:** Settings › Plugin Library › Log Parsers › Create
- **URL:** `/settings/plugin-library/log-parsers/create`
- **Back:** the Log Parsers list.

## 3. Actions
- Enter **Name**.
- Author the **Script** in the CodeMirror editor.
- **Save & Run** — persist and execute the parser (validate parsing in one step).
- **Reset** — clear the form.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Name * | text input (label "Name") |
| Script | CodeMirror editor (label "Script") |
| Reset | button |
| Save & Run (primary) | button |

> **Automation caveat:** the **Script** field is a **CodeMirror** editor — set content via the CodeMirror
> API / `.cm-content`, not `fill()`. No stable ids were captured for Name/Reset/Save & Run; scope by label
> and button text, and TODO(source: KG) — promote verified ids into the cookbook.

_Locators: see `knowledge/locators/catalog/settings_plugin_library_log_parsers_create.json`; promote
verified ones into the selector-cookbook._

## 5. Permissions
- Expected **admin/operator** (parser runs in the ingestion pipeline). TODO(source: KG/docs) — confirm.

## 6. Entry Conditions
- Logged in; reached from the Log Parsers list **Create**.
- TODO(source: docs) — whether **Save & Run** needs live/sample log data present to exercise the parser.

## 7. Exit Conditions
- **On Save & Run (success):** parser is saved and executed; parsed output is shown / it appears in the
  Log Parsers list. TODO(source: docs) — exact success signal + audit entry.
- **On Reset:** form clears; no server write.

## 8. Validations
- **Name** — required (and likely unique). TODO(source: docs) — uniqueness/format rules.
- **Script** — required and must be valid (a parse/runtime error should surface on Save & Run).
  TODO(source: docs) — script language/syntax expected.

## 9. Business Rules
- **Save & Run** combines persist + execute — the parser is validated against real/sample input at save
  time, not just saved blindly. TODO(source: KG) — what input it runs against.
- A parser is later **assigned per source-IP** (see `log-parsers.md` / KB Section 7) — authoring here does
  not by itself bind it to a source.
- TODO(source: KG): script language, field-extraction/index directives, name uniqueness.

## 10. Known Bugs
- **Non-indexable extracted fields** (e.g. `windows.event.provider`) made parsed logs unsearchable until a
  config parameter enabled indexing (Section 7, PQD-38164 / MOTADATA-8029; 8.1.3 patch). Relevant to which
  fields a parser emits.
- **Parser-assignment by source-IP** causes correctly-authored parsers to be bypassed when the source IP
  is dynamic (dual-WAN) → events fall to "Others" (Section 7). The parser script itself may be correct;
  the binding is the failure point.

Do not invent bugs beyond the above cited patterns.

## 11. Edge Cases
- Empty **Name** or empty **Script** → Save & Run blocked.
- Script with a syntax/runtime error → error on Save & Run.
- Parser that extracts a **non-indexable** field name (KB `windows.event.provider` class).
- Very large script; unicode/control characters in sample log lines.
- Save & Run with no matching log input available.
- Duplicate parser name.
