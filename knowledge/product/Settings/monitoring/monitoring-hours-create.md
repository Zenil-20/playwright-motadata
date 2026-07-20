---
screen: Monitoring · Create Monitoring Hour
module: Settings
category: monitoring
route: "/settings/monitoring/monitoring-hours/create"
build: 8.2.6
status: draft
sources: [catalog, screenshot]   # knowledge/locators/catalog/settings_monitoring_monitoring_hours_create.json (live sweep 2026-07-02); knowledge/screenshots/Monitorinh Hour Create .png
verified: 2026-07-09
---

# Monitoring — Create Monitoring Hour

## 1. Purpose
The create form for a **Monitoring Hour** — a named business-hour window. The user names the window
and selects, on a **7-day × 24-hour grid**, exactly which hourly slots the window is active. The
saved window can then be attached to monitors/policies to scope *when* monitoring/alerting applies.

- **Business objective:** define a reusable active-time schedule down to the hour and day of week
  (e.g. Mon–Fri 09–18 business hours, or all cells for 24×7).
- **Screen description:** a single form titled **Create Monitoring Hour** with a required
  **Monitoring Hour Name** text field, and below it a weekly time-slot grid — rows **Sunday →
  Saturday**, columns **00 → 23** (hours). Each row has a leading day-level checkbox (a select-all
  for that day), each column header (00–23) has a checkbox (select-all for that hour), and every
  day×hour intersection is an individual checkbox. **Reset** and **Create Monitoring Hour** buttons
  are bottom-right.
- **Primary use cases:** create a new named window by name + hour/day selection; use row/column
  checkboxes to bulk-select a full day or a full hour-of-week; Reset to clear.
- **Who uses it:** monitoring administrators. TODO(source: KG/docs) — exact role names.
- **Dependencies:** reached from the Monitoring Hour list (`create-business-hour-btn`); the saved
  window is consumed by monitors/policies.

## 2. Navigation
```
Settings → Monitor Settings → Monitoring Hour → Create Monitoring Hour
```
- **Breadcrumb / header:** a back chevron + **Create Monitoring Hour** title (top-left).
- **URL:** `/settings/monitoring/monitoring-hours/create`
- **Entry:** the **Create Monitoring Hour** button (`#create-business-hour-btn`) on the list screen.

## 3. Actions
- **Enter Monitoring Hour Name** — required text field (`#business-hour-name-id`).
- **Select hourly slots** — click individual day×hour checkboxes in the grid.
- **Select a whole day** — the leading checkbox on a day row (Sunday…Saturday) toggles all 24 hours
  for that day. TODO(source: KG/docs) — confirm row-checkbox semantics.
- **Select a whole hour-of-week** — the checkbox under an hour header (00…23) toggles that hour
  across all 7 days. TODO(source: KG/docs) — confirm column-checkbox semantics.
- **Reset** — clear the form/selection (`#reset-btn`).
- **Create Monitoring Hour** — save the window (`#create-business-hour-btn-id`).

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Monitoring Hour Name * | `input#business-hour-name-id` (text, `name='business-hour-name'`), placeholder _Monitoring Hour Name_, label marked required (`*`) |
| Weekly time-slot grid | 7 day rows (Sunday–Saturday) × 24 hour columns (00–23) of checkboxes |
| Day select-all (per row) | leading checkbox on each day row |
| Hour select-all (per column) | checkbox under each hour header (00–23) |
| Reset | `#reset-btn` (label "Reset") |
| Create Monitoring Hour (primary) | `#create-business-hour-btn-id` (label "Create Monitoring Hour") |

> **Checkbox count.** The grid is a 7×24 matrix = **168 hourly cells**, plus 7 day-row select-all
> checkboxes and 24 hour-column select-all checkboxes (= 199 logical controls). The raw sweep
> reported **398** checkboxes — roughly double — because ant-design/Vue renders paired input+visual
> nodes (and hidden duplicates) per checkbox, so the DOM count is not the logical selection count.
> Automation should target checkboxes by their day/hour position, not by index into 398.
> TODO(source: KG/docs) — confirm per-cell checkbox ids / a stable `data-*` addressing scheme.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Create Monitoring Hour)._

## 5. Permissions
- **Create:** a monitoring-admin-class role (same as the list screen's create action).
- TODO(source: KG/docs) — exact RBAC role names and any license/module gating.

## 6. Entry Conditions
- User is logged in; Settings and Monitor Settings are reachable.
- Arrived via Create on the Monitoring Hour list.
- Form renders with an empty name and a fully **unchecked** grid (screenshot shows all cells clear).

## 7. Exit Conditions
- **On Create (success):** success toast; navigates back to the Monitoring Hour list; the new window
  appears with Used Count 0.
- **On Reset:** name cleared and all grid selections cleared; no server call; stays on the form.
- **On back chevron:** returns to the list, discarding unsaved edits. TODO(source: KG/docs) — confirm
  whether a discard prompt appears.

## 8. Validations
- **Monitoring Hour Name** — required (`*`); expected unique across windows (duplicate → inline
  error). TODO(source: KG/docs) — confirm uniqueness and max length.
- **Slot selection** — TODO(source: KG/docs) — whether at least one hour must be selected before
  Create is allowed (an all-unchecked window may be rejected or saved as "never active").
- TODO(source: KG/docs) — name character/format restrictions.

## 9. Business Rules
- **A window = name + set of selected day×hour slots**; selected cells mark the active hours.
  TODO(source: KG/docs) — confirm whether selected = active (monitoring on) or selected = suppressed.
- **Row/column checkboxes are bulk-select helpers** — a day-row checkbox selects all 24 hours of
  that day; an hour-column checkbox selects that hour across all 7 days (24×7 = check every cell).
  TODO(source: KG/docs) — confirm exact toggle/partial-state behavior.
- Hours are in the appliance/user timezone. TODO(source: KG/docs) — confirm timezone basis.

## 10. Known Bugs
_None recorded for this screen._
> The §5 alert poller-interval vs. occurrence/flap-window pattern concerns policy timing math, not
> the business-hour window definition, so it is not attributed here. Do not invent bugs.

## 11. Edge Cases
- Create with a **duplicate name** → uniqueness error.
- **Empty name** → Create blocked (required field).
- **No slots selected** → assert whether Create is blocked or a "never active" window is saved.
- **All slots selected** (equivalent to `24*7`) → assert it saves and behaves like 24×7.
- Toggle a day-row checkbox, then uncheck one cell → assert the row checkbox shows a partial/indeterminate state.
- Select an hour column across all days, then Reset → all clear.
- Very long name; Unicode / `*` in name (matches the `24*7` naming convention).
- Rapidly toggling many cells (grid re-render performance with ~168 checkboxes).
- Navigate away (back chevron) with unsaved selections → discard behavior.
