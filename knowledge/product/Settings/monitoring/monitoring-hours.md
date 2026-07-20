---
screen: Monitoring · Monitoring Hour
module: Settings
category: monitoring
route: "/settings/monitoring/monitoring-hours"
build: 8.2.6
status: draft
sources: [catalog, screenshot]   # knowledge/locators/catalog/settings_monitoring_monitoring_hours.json (live sweep 2026-07-02); knowledge/screenshots/Monitoring Hour.png
verified: 2026-07-09
---

# Monitoring — Monitoring Hour

## 1. Purpose
The **Monitoring Hour** screen is the catalog of named business-hour windows under
`Settings → Monitor Settings`. A monitoring hour is a reusable day×time schedule that defines
*when* monitoring/alerting for the objects using it is considered active — so alerting can be
scoped to business hours (or 24×7) rather than firing around the clock for everything.

- **Business objective:** let administrators reuse a small set of named time windows (e.g. `24*7`,
  "Business Hours") and attach them to monitors/policies, so suppression/active-window behavior is
  consistent and centrally maintained.
- **Screen description:** a searchable, paginated grid with two columns — **Monitoring Hour Name**
  and **Used Count** — plus a per-row **Actions** menu. The screenshot shows two rows: `24*7`
  (Used Count 299) and `Test Monitor Hour By Playwright Automation` (Used Count 1). A
  **Create Monitoring Hour** button (top-right) opens the create form; two icon buttons next to it
  export the list (PDF and CSV/XLSX). A `1 – 2 of 2 items` footer with a `50 items per page` selector
  and pager controls sits at the bottom.
- **Primary use cases:** review existing windows, see how many objects use each (Used Count),
  search, create a new window, edit/delete via row actions, export the list.
- **Who uses it:** monitoring administrators who define alerting/active windows.
  TODO(source: KG/docs) — exact role names.
- **Dependencies:** the objects (monitors/policies) that reference a monitoring hour drive its
  Used Count · the alerting/polling engine that honors the active window.

## 2. Navigation
```
Settings → Monitor Settings → Monitoring Hour
```
- **Breadcrumb:** Settings › Monitor Settings › Monitoring Hour
- **Left-nav group:** Monitor Settings (the "Monitoring Hour" item is highlighted in the screenshot;
  siblings include Device Monitor Settings, Cloud Monitor Settings, Monitor Templates, NetRoute
  Settings, Custom Monitoring Field…).
- **URL:** `/settings/monitoring/monitoring-hours`

## 3. Actions
- **Create Monitoring Hour** — open the create form (`#create-business-hour-btn`; label
  "Create Monitoring Hour").
- **Search** — filter the grid by name (`input[name='search-business-hour']`, placeholder _search_).
- **Export** — the two icon buttons left of Create export the grid (one PDF, one CSV/XLSX).
  TODO(source: KG/docs) — confirm exact formats and control ids.
- **Row actions** — per-row `[data-cy='grid-action']` menu (visible as the ⋮ on the second row);
  typically Edit / Delete. TODO(source: KG/docs) — confirm the exact action set.
- **Paginate / page-size** — pager + `50 items per page` selector in the footer.
- **Sort** — the Monitoring Hour Name header shows an active ascending sort arrow.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Settings global search | `input` (text), placeholder _Search_ — shared Settings shell |
| Monitoring-hour search box | `input[name='search-business-hour']` (text), placeholder _search_ |
| Export (PDF) | icon button (top-right, left of Create) — TODO(source: KG/docs) id |
| Export (CSV/XLSX) | icon button (top-right) — TODO(source: KG/docs) id |
| Create Monitoring Hour (primary) | `#create-business-hour-btn` (label "Create Monitoring Hour") |
| Grid column — Monitoring Hour Name | grid header `Monitoring Hour Name` (sortable; ascending in screenshot) |
| Grid column — Used Count | grid header `Used Count` (badge count of objects using the window) |
| Grid column — Actions | grid header `Actions` → per-row `[data-cy='grid-action']` (⋮) |
| Pager / page-size | footer pager + `50 items per page` select |

> The sweep reported 0 selects/switches/radios/checkboxes on this list — those live on the create
> form (`monitoring-hours-create`). Note the `24*7` row in the screenshot shows **no ⋮ Actions
> menu**, while the custom row does — suggesting the built-in `24*7` window may be non-editable /
> non-deletable. TODO(source: KG/docs) — confirm `24*7` is a protected system default.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Monitoring Hour)._

## 5. Permissions
- **View:** roles with access to Monitor Settings can view the list.
- **Create / Edit / Delete:** a monitoring-admin-class role — changing a window affects every object
  using it (high Used Count = broad impact).
- TODO(source: KG/docs) — exact RBAC role names and any license/module gating.

## 6. Entry Conditions
- User is logged in with a valid session; Settings is reachable (`/settings/`).
- Monitor Settings module is available to the role.
- The list loads (at least the built-in `24*7` window is present).

## 7. Exit Conditions
- **On Create (success):** success toast; new window appears in the grid with Used Count 0.
- **On Edit (success):** success toast; changes persist; objects using the window honor the new
  schedule. TODO(source: KG/docs) — confirm apply timing.
- **On Delete:** row removed. TODO(source: KG/docs) — behavior when Used Count > 0 (blocked or
  detached).
- **On Search:** grid filters to matching rows; clearing restores the full list.

## 8. Validations
- **Monitoring Hour Name** — expected required and unique (see create form).
  TODO(source: KG/docs) — confirm uniqueness and max length.
- Deleting a window in use: TODO(source: KG/docs) — whether the system blocks it.

## 9. Business Rules
- **Used Count reflects live consumption** — number of objects currently referencing the window;
  it is the dependency signal for edit/delete impact.
- **`24*7` appears to be a built-in default** (Used Count 299, no row-actions menu in the
  screenshot). TODO(source: KG/docs) — confirm it is a protected system window.
- A monitoring hour scopes *when* monitoring/alerting is active; the day/hour matrix that defines
  the window is set on the create form. TODO(source: KG/docs) — confirm exactly which behaviors
  (polling vs. alerting vs. suppression) the window gates.

## 10. Known Bugs
_None recorded for this screen._
> The §5 "poller interval vs. occurrence/flap-window math" pattern (PQD-28890, PQD-35099) concerns
> alert-policy timing math, not business-hour window scoping, so it is not attributed here. Do not
> invent bugs; add cited entries (`version` · `issue` · `workaround`) if the KG later maps a defect
> to this screen.

## 11. Edge Cases
- Create a window with a **duplicate name** → expect a uniqueness error.
- Edit/delete a window with **Used Count > 0** (e.g. `24*7` at 299) → assert defined behavior.
- Attempt to edit/delete the built-in `24*7` → assert whether it is protected.
- Search with no matches → empty state; search with special characters (`*` as in `24*7`).
- Export an empty/large list.
- Very long Monitoring Hour Name; Unicode.
- Pagination boundary when list exceeds the page size (50).
