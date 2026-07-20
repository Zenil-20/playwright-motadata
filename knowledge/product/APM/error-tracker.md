---
screen: Apm · error-tracker
module: APM
route: "/apm/error-tracker"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/apm_error_tracker.json · screenshots/APM.png (BUILD 8.2.5) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Apm · error-tracker

## 1. Purpose
The **Error Tracker** tab of APM — an **exception/error aggregation** view. Its grid (`Issue /
Exception Name · Language · Services Name · Category · Status Code · Occurrences · Last Seen`) rolls up
application errors so a user can see which exceptions are happening, in which service/language, how
often, and when they were last seen.

- **Business objective:** surface and prioritise application errors — group repeated exceptions into
  issues, rank by occurrence count and recency, and trace each back to a service.
- **Screen description:** the APM shell (tab bar + time-range picker) over an **errors grid**. It adds a
  **Search** box and a **"filter by name…"** input, plus a **Show/Hide columns** control
  (`#btn-show-hide-columns`).
- **Primary use cases:** find the most frequent / newest exceptions, filter by name/service, customize
  columns, and drill into an issue.
- **Who uses it:** developers / SRE triaging production errors.
- **Dependencies:** error/exception telemetry reporting to APM for the selected range; APM license.

## 2. Navigation
```
APM → Error Tracker
```
- **Tabs:** Services · Explorer · Error Tracker (active) · Compare.
- **URL:** `/apm/error-tracker`.

## 3. Actions
- **Search** — `input[placeholder="Search"]`.
- **Filter by name** — `input[placeholder="filter by name…"]` to narrow the issue list.
- **Show / Hide columns** — `#btn-show-hide-columns`.
- **Set time range** — shared quick-range scopes the errors.
- **Open an issue** — click a row for exception detail (stack/occurrences over time). TODO(source:
  KG/docs) — confirm the drill-in.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Tab bar | Services · Explorer · Error Tracker (active) · Compare |
| Search | `input[placeholder="Search"]` (name `search`) |
| Filter-by-name input | `input[placeholder="filter by name…"]` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Errors grid | Issue / Exception Name · Language · Services Name · Category · Status Code · Occurrences · Last Seen |
| Time-range picker | shared quick-range |

_Locators: see `knowledge/locators/catalog/apm_error_tracker.json`. `#btn-show-hide-columns` is stable;
promote to `selector-cookbook.md` (APM > Error Tracker)._

## 5. Permissions
- Requires APM module/license + APM-capable role. TODO(source: KG/docs) — role specifics.

## 6. Entry Conditions
- Logged in; APM licensed; error telemetry exists in the selected range (else empty / "No data found").

## 7. Exit Conditions
- Search / filter / column / time-range changes re-query and repaint the grid.
- Opening an issue navigates to its detail (TODO: confirm route).

## 8. Validations
- **Search** / **filter by name…** — free text; no observed constraint.
- **Time range** — from ≤ to.

## 9. Business Rules
- Errors are **aggregated into issues** keyed by exception name (repeat exceptions increment
  **Occurrences**; **Last Seen** tracks recency) — inferred from the Occurrences/Last Seen columns.
- The grid is **time-scoped** by the range picker.
- TODO(source: Motadata KG) — how issues are grouped/deduplicated, what **Category** and **Status Code**
  enumerate, and error retention.

## 10. Known Bugs
- No Error-Tracker-specific defects recorded in the customer-issue KB for this screen.
- (Module-level) APM licensing count confusion — see `apm.md` / kb §12 (PQD-36926).

## 11. Edge Cases
- Empty range → no errors.
- A single exception with very high Occurrences (formatting/sort).
- Non-HTTP errors (blank/NA Status Code).
- Mixed languages/services in one issue name.
- Filter-by-name no-match / special characters.
- "Last Seen" straddling the range boundary.
- Hide all columns; rapid time-range switching mid-query.
