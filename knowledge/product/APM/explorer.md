---
screen: Apm · explorer
module: APM
route: "/apm/explorer"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/apm_explorer.json · screenshots/APM.png (BUILD 8.2.5) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Apm · explorer

## 1. Purpose
The **Explorer** tab of APM — a **distributed-trace explorer**. Its grid (`Timestamp · Services ·
Duration · Status · Resource · Spans`) is a list of individual traces/requests, so a user can search,
filter, and inspect latency, status and span counts of application transactions.

- **Business objective:** let engineers investigate real requests/transactions — find slow or failing
  traces, see how many spans each has, and pivot from a symptom (latency/error) to the responsible
  service/resource.
- **Screen description:** the APM shell (tab bar + time-range picker) over a **trace grid**. It adds a
  **Search** box, a **Select** dropdown (`data-cy='dropdown-trigger-input'`) and a **"filter by name…"**
  input for scoping, **2 radio** options (a mode/scope toggle), a **Show/Hide columns** control
  (`#btn-show-hide-columns`) and a **Save View** button.
- **Primary use cases:** filter traces by service/status/duration, sort, customize columns, and save a
  reusable view; open a trace to see its spans.
- **Who uses it:** SRE / app-performance engineers triaging latency and errors.
- **Dependencies:** trace data reporting to APM for the selected range; APM license.

## 2. Navigation
```
APM → Explorer
```
- **Tabs:** Services · Explorer (active) · Error Tracker · Compare.
- **URL:** `/apm/explorer`.

## 3. Actions
- **Filter traces** — `Select` dropdown + **"filter by name…"** input + the **Search** box.
- **Scope toggle** — the **2 radios** (e.g. a mode/grouping switch). TODO(source: KG/docs) — exact labels.
- **Show / Hide columns** — `#btn-show-hide-columns` to add/remove grid columns.
- **Save View** — `Save View` button persists the current filter/column layout as a reusable view.
- **Set time range** — shared range picker scopes the traces.
- **Open a trace** — click a row to inspect its spans (Spans column implies a span/waterfall detail).
  TODO(source: KG/docs) — confirm the drill-in.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Tab bar | Services · Explorer (active) · Error Tracker · Compare |
| Search | `input[placeholder="Search"]` (name `search`) |
| Select dropdown | `[data-cy='dropdown-trigger-input']` (placeholder "Select") |
| Filter-by-name input | `input[placeholder="filter by name…"]` |
| Scope radios | 2 radio inputs |
| Show/Hide columns | `#btn-show-hide-columns` |
| Save View | `Save View` button |
| Trace grid | columns: Timestamp · Services · Duration · Status · Resource · Spans |
| Time-range picker | shared quick-range |

_Locators: see `knowledge/locators/catalog/apm_explorer.json`. `#btn-show-hide-columns` and
`[data-cy='dropdown-trigger-input']` are stable; promote to `selector-cookbook.md` (APM > Explorer)._

## 5. Permissions
- Requires APM module/license + APM-capable role. TODO(source: KG/docs) — whether **Save View** is
  gated (e.g. shared vs personal views, who may create).

## 6. Entry Conditions
- Logged in; APM licensed; trace data exists in the selected range (else empty grid / "No data found").

## 7. Exit Conditions
- **Save View (success):** the view persists (expect a success toast + the view becoming selectable).
  TODO(source: KG/docs) — confirm where saved views appear.
- Filter/search/column/time-range changes re-query and repaint the grid.
- Opening a trace navigates to its span detail (TODO: confirm route).

## 8. Validations
- **filter by name…** and **Search** — free text; no observed constraint.
- **Save View** — likely requires a (unique?) view name. TODO(source: KG/docs) — name required/unique?
- **Time range** — from ≤ to.

## 9. Business Rules
- The grid is **time-scoped** by the range picker.
- **Save View** captures the current column set + filters for reuse.
- **Show/Hide columns** lets a user tailor which of Timestamp/Services/Duration/Status/Resource/Spans
  are visible.
- TODO(source: Motadata KG) — default sort, default columns, and trace retention.

## 10. Known Bugs
- No Explorer-specific defects recorded in the customer-issue KB for this screen.
- (Module-level) APM licensing count confusion — see `apm.md` / kb §12 (PQD-36926).

## 11. Edge Cases
- Empty range → no traces.
- Save View with a duplicate/blank name (if name required).
- Hide all columns (should the grid block hiding the last column?).
- Very high span-count traces; extreme durations (0 ms / multi-minute).
- Filter-by-name with no match / special characters.
- Saved view referencing a service that no longer reports.
- Rapid time-range changes while a query is in flight.
