---
screen: Flow Explorer · analytics-detail
module: Flow
route: "/flow/analytics/detail"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/flow_analytics_detail.json · screenshots/Flow.png (BUILD 8.2.5, parent module) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Flow Explorer · analytics-detail

## 1. Purpose
The **detail view** for a Flow Analytics KPI — opened by clicking a card on `/flow/analytics`. It breaks
one KPI down across a rich **tab bar** (`Summary · Traffic · Interface · Application · Source ·
Destination · Conversion · AS Details`), so a network user can analyse a flow subject from every angle:
overall summary, raw traffic, per-interface, per-application, by source/destination endpoint,
conversation pairs, and autonomous-system detail.

- **Business objective:** deep, multi-dimensional analysis of a single flow KPI/subject — the drill-down
  destination of Flow Analytics.
- **Screen description:** a detail page whose only captured control is the **tab bar**
  (`data-testid='flow-analytics-detail-tab-bar'`) with eight tabs. Each tab renders its own
  charts/tables for that dimension (inherited Flow shell + time range).
- **Primary use cases:** move across Summary → Traffic → Interface → Application → Source → Destination
  → Conversion → AS Details to investigate the selected KPI.
- **Who uses it:** network / NOC engineers investigating a specific flow subject. TODO(source: KG/docs)
  — role gating.
- **Dependencies:** arriving from a Flow Analytics card (a KPI/subject in context); flow data for the
  range; Flow license.

## 2. Navigation
```
Flow → Flow Analytics → click a KPI card → /flow/analytics/detail
```
- **Tab bar (detail):** Summary · Traffic · Interface · Application · Source · Destination · Conversion ·
  AS Details (`data-testid='flow-analytics-detail-tab-bar'`).
- **URL:** `/flow/analytics/detail`.
- **Back:** returns to `/flow/analytics`.

## 3. Actions
- **Switch dimension tab** — Summary / Traffic / Interface / Application / Source / Destination /
  Conversion / AS Details.
- **Set time range** — shared Flow quick-range picker (inherited; not separately captured here).
- TODO(source: KG/docs) — per-tab controls (search, export, drill-through) were not captured in the
  sweep; confirm live.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Detail tab bar | `[data-testid='flow-analytics-detail-tab-bar']` |
| Tabs | Summary · Traffic · Interface · Application · Source · Destination · Conversion · AS Details |

> Only the tab bar was captured. Each tab's charts/tables/filters were not swept (they render after a
> KPI/subject is in context from the card). Confirm per-tab controls live.

_Locators: see `knowledge/locators/catalog/flow_analytics_detail.json`. The detail tab bar `data-testid`
is stable; scope individual tabs by their label text. Promote to `selector-cookbook.md`
(Flow > Analytics Detail)._

## 5. Permissions
- Requires Flow module/license + a Flow-capable role. TODO(source: KG/docs) — role specifics.

## 6. Entry Conditions
- Logged in; Flow licensed; arrived from a Flow Analytics card (a KPI/subject is in context — deep
  linking straight to `/flow/analytics/detail` without a selected subject may show no data).
- Flow data exists in the selected range.

## 7. Exit Conditions
- Selecting a tab renders that dimension's charts/tables.
- Changing the time range re-queries the current tab.
- Navigating back returns to the card catalog.

## 8. Validations
- No input fields were captured on this view. TODO(source: KG/docs) — per-tab search/filter validations.
- **Time range** — from ≤ to.

## 9. Business Rules
- The eight tabs are **dimensions of one KPI/subject** in context — the view is meaningless without a
  subject selected upstream.
- All tabs are **time-scoped** by the shared Flow range picker.
- TODO(source: Motadata KG) — what each dimension shows (esp. **Conversion** and **AS Details**) and
  whether tabs support their own drill-through.

## 10. Known Bugs
- **Flow data mismatch or absent** (kb §7, PQD-30304 [MOTADATA-6334], PQD-36645, PQD-39746, PQD-29136):
  detail tabs inherit any flow-source gap — 0-byte volumes from unparsed ASA/PaloAlto bi-directional
  templates (`tmp_asa_bi_flow`, **8.0.22**), NetFlow version mismatches, or wrong exporter config.
  Fixes: enable `tmp_asa_bi_flow`, align versions, reconfigure exporters. Verify on 8.2.6.

## 11. Edge Cases
- Landing on `/flow/analytics/detail` without a selected subject (deep link) → empty view.
- A tab (e.g. AS Details / Conversion) with no data for the KPI → empty tab.
- Switching all eight tabs rapidly before data loads.
- Very large range aggregation/perf.
- Flow data absent/0-byte (the ASA/PaloAlto case) → all tabs empty.
- Time-range change mid-render.
