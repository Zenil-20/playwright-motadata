---
screen: Flow Explorer · analytics
module: Flow
route: "/flow/analytics"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/flow_analytics.json · screenshots/Flow.png (BUILD 8.2.5, parent module) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Flow Explorer · analytics

## 1. Purpose
The **Flow Analytics** tab of the Flow module — a searchable set of **KPI cards** (`data-testid
='flow-analytics-card'`) summarising flow metrics, with a card/grid presentation toggle. It sits
between the fixed Dashboard widgets and the free-form Explorer: a curated KPI catalog the user can
search and switch between card and grid layouts, then drill into a detail view.

- **Business objective:** let network users browse and search the available flow **KPIs** (top
  applications, protocols, sources, conversations, AS, etc.) and open one for detailed analysis.
- **Screen description:** the Flow shell (tab bar `data-testid='flow-top-tab-bar'`) with a KPI **Search**
  box (`data-testid='flow-analytics-kpi-search-input'`, input name `search-flow-analytics-kpi`), a
  **switch-to-grid** toggle (`data-testid='flow-analytics-switch-to-grid'`) and a set of KPI **cards**
  (`data-testid='flow-analytics-card'`).
- **Primary use cases:** search for a KPI, toggle card/grid view, click a card to open its detail
  (`/flow/analytics/detail`).
- **Who uses it:** network / NOC engineers. TODO(source: KG/docs) — role gating.
- **Dependencies:** flow data reporting for the range; Flow license.

## 2. Navigation
```
Flow → Flow Analytics
```
- **Tabs:** Dashboard · Flow Analytics (active) · Explorer (`data-testid='flow-top-tab-bar'`).
- **URL:** `/flow/analytics`.
- **Drill-in:** a card → `/flow/analytics/detail` (see `analytics-detail.md`).

## 3. Actions
- **Search KPIs** — `input[name="search-flow-analytics-kpi"]` /
  `[data-testid='flow-analytics-kpi-search-input']`.
- **Switch to grid** — `[data-testid='flow-analytics-switch-to-grid']` toggles card ↔ grid layout.
- **Open a KPI** — click a `[data-testid='flow-analytics-card']` to open the analytics detail.
- **Set time range** — shared quick-range picker scopes the KPIs. (Inherited from the Flow shell; not
  separately captured in this tab's catalog.)

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Tab bar | Dashboard · Flow Analytics (active) · Explorer — `[data-testid='flow-top-tab-bar']` |
| KPI search | `input[name="search-flow-analytics-kpi"]` = `[data-testid='flow-analytics-kpi-search-input']` |
| Card/grid toggle | `[data-testid='flow-analytics-switch-to-grid']` |
| KPI cards | `[data-testid='flow-analytics-card']` (multiple) |

_Locators: see `knowledge/locators/catalog/flow_analytics.json`. These `data-testid`s are stable — promote
directly to `selector-cookbook.md` (Flow > Analytics). For a specific card, scope
`[data-testid='flow-analytics-card']` by its title text._

## 5. Permissions
- Requires Flow module/license + a Flow-capable role. TODO(source: KG/docs) — role specifics.

## 6. Entry Conditions
- Logged in; Flow licensed; flow data exists in the selected range (else cards render empty).

## 7. Exit Conditions
- Clicking a card navigates to `/flow/analytics/detail` for that KPI.
- The card/grid toggle changes layout in place.
- Search re-filters the visible cards.

## 8. Validations
- **KPI search** — free text; no observed constraint (filters cards by name).
- TODO(source: docs) — time-range max look-back / retention.

## 9. Business Rules
- Flow Analytics is the **card catalog** layer; each card opens a detail view keyed to that KPI.
- The **switch-to-grid** toggle changes only presentation, not the data.
- KPIs are **time-scoped** by the shared Flow range picker.
- TODO(source: Motadata KG) — the full KPI list and what each card measures.

## 10. Known Bugs
- **Flow data mismatch or absent** (kb §7, PQD-30304 [MOTADATA-6334], PQD-36645, PQD-39746, PQD-29136):
  0-byte volumes / size mismatch / "not supported" from unparsed bi-directional ASA/PaloAlto templates
  (`tmp_asa_bi_flow`, productized **8.0.22**), NetFlow version mismatches, or wrong exporter config —
  KPI cards inherit any such gaps. Fixes: enable `tmp_asa_bi_flow`, align versions, reconfigure
  exporters. Verify on 8.2.6.

## 11. Edge Cases
- KPI search with no match / special characters.
- Toggle card↔grid rapidly (state persistence).
- Cards empty because flow data is 0-byte / absent (the ASA/PaloAlto case).
- Open a card whose KPI has no data in the range (empty detail).
- Very large KPI set (scroll/perf).
- Rapid time-range switching while cards load.
