---
screen: Monitoring · NetRoute Settings
module: Settings
category: monitoring
route: "/settings/monitoring/netroute-setting"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_monitoring_netroute_setting.json (live sweep 2026-07-02). NOTE: knowledge/screenshots/netroute.png is the NetRoute EXPLORER/report, NOT this Settings list — not used as a control source.
verified: 2026-07-09
---

# Monitoring — NetRoute Settings

## 1. Purpose
The **NetRoute Settings** screen is the catalog of **NetRoute path monitors** under
`Settings → Monitor Settings`. A NetRoute defines a monitored network path — a source, a
destination, and a port — so the platform can track reachability/latency along that route
(hop-by-hop path monitoring). This settings list is where routes are created, enabled/disabled, and
managed; the collected results are viewed in the separate **NetRoute Explorer** (a report screen —
not this page).

- **Business objective:** monitor whether a specific path (source → destination:port) stays reachable
  and healthy, independent of the endpoints' own device monitors — useful for WAN links, upstream
  dependencies, and inter-site paths.
- **Screen description:** a searchable, paginated grid with columns **Route Name**, **Source**,
  **Destination**, **Port**, **Tag**, **Manage Status**, and **Actions**, plus a global **ON/OFF**
  switch and a **Create NetRoute** button.
- **Primary use cases:** review configured routes, create a route, enable/disable a route (or all
  routes via the global switch), search/tag, and edit/delete via row actions.
- **Who uses it:** network/monitoring administrators. TODO(source: KG/docs) — exact role names.
- **Dependencies:** the poller/probe that traces the route · the source and destination reachability ·
  the NetRoute Explorer/report that consumes the collected path data.

## 2. Navigation
```
Settings → Monitor Settings → NetRoute Settings
```
- **Breadcrumb:** Settings › Monitor Settings › NetRoute Settings
- **Left-nav group:** Monitor Settings (sibling of Monitor Templates, Monitoring Hour, Topology
  Scanner…).
- **URL:** `/settings/monitoring/netroute-setting`
- **Related (different screen):** NetRoute **Explorer**/report — where route results are viewed; it
  is not this settings list. Do not conflate its controls with this page.

## 3. Actions
- **Create NetRoute** — open the create-route flow (`#create-netroute-btn`).
- **Global ON/OFF** — the single switch (button labeled "ON") toggles NetRoute monitoring on/off.
  TODO(source: KG/docs) — confirm whether it is a global master switch or a bulk enable, and its id.
- **Search** — filter routes (`input[name='netroute-search']`, placeholder _Search_).
- **Manage Status (per row)** — enable/disable an individual route (the `Manage Status` column).
- **Row actions** — per-row `[data-cy='grid-action']` menu; typically Edit / Delete.
  TODO(source: KG/docs) — confirm the exact action set.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Settings global search | `input` (text), placeholder _Search_ — shared Settings shell |
| NetRoute search box | `input[name='netroute-search']` (text), placeholder _Search_ |
| Global ON/OFF switch | one `switch` (button labeled "ON") — master enable/disable |
| Create NetRoute (primary) | `#create-netroute-btn` (label "Create NetRoute") |
| Grid column — Route Name | grid header `Route Name` |
| Grid column — Source | grid header `Source` |
| Grid column — Destination | grid header `Destination` |
| Grid column — Port | grid header `Port` |
| Grid column — Tag | grid header `Tag` |
| Grid column — Manage Status | grid header `Manage Status` (per-route enable/disable) |
| Grid column — Actions | grid header `Actions` → per-row `[data-cy='grid-action']` |

> The create-route form (Route Name, Source, Destination, Port, Tag inputs) was not part of this
> sweep. TODO(source: KG/docs) — the create-form field set and control ids.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > NetRoute Settings)._

## 5. Permissions
- **View:** roles with access to Monitor Settings can view the route list.
- **Create / Edit / Delete / toggle:** a network-monitoring-admin-class role.
- TODO(source: KG/docs) — exact RBAC role names and any license/module gating (NetRoute may be a
  separately licensed capability).

## 6. Entry Conditions
- User is logged in; Settings and Monitor Settings are reachable.
- NetRoute capability is enabled for the role/license.
- The route list loads (existing routes render, or an empty state).

## 7. Exit Conditions
- **On Create (success):** success toast; the new route appears in the grid, with its Manage Status
  reflecting enabled/disabled.
- **On global ON→OFF:** NetRoute monitoring stops for the covered routes; the switch reflects the
  new state. TODO(source: KG/docs) — confirm scope (all routes vs. feature-level).
- **On Delete:** row removed.
- **On Search:** grid filters to matching routes.

## 8. Validations
- **Route Name** — expected required and unique. TODO(source: KG/docs).
- **Source / Destination** — expected valid host/IP. TODO(source: KG/docs) — format rules.
- **Port** — expected a valid port number (1–65535). TODO(source: KG/docs).
- **Tag** — optional, likely lowercased (see §1 tag-handling note in Known Bugs). TODO(source: KG/docs).

## 9. Business Rules
- **A route is source + destination + port** — the monitored path is defined by these three plus a
  name and optional tag.
- **Two levels of enablement** — a per-route **Manage Status** and a global **ON/OFF** switch;
  behavior when the global switch is OFF but a route is individually enabled is
  TODO(source: KG/docs).
- TODO(source: KG/docs) — uniqueness scope (name only, or source+dest+port tuple), and how NetRoute
  results are surfaced in the Explorer/report.

## 10. Known Bugs
_None recorded for this screen._
> The §4 Reports note that "reachability supports only result-by-monitor" (a custom-report gap,
> PQD-34124 class) concerns the NetRoute/reachability *report*, not this settings list, so it is not
> attributed here. The §1 tag-handling defects (auto-lowercasing of CSV tags, PQD-32287) are
> tangential to the per-route Tag field. Do not invent bugs; add cited entries if the KG later maps
> a defect to this screen.

## 11. Edge Cases
- Create a route with a **duplicate name** (or duplicate source+dest+port) → assert uniqueness rule.
- Invalid **Port** (0, 65536, non-numeric) → validation error.
- Invalid **Source/Destination** (bad hostname/IP, unreachable) → assert create is allowed but route
  reports unreachable, vs. blocked at save.
- Global switch OFF while a route is individually enabled → assert which wins.
- Search/tag with special characters or mixed case (tag lowercasing).
- Delete a route being viewed in the Explorer concurrently.
- Very long Route Name / Tag; Unicode.
- Pagination boundary with many routes.
