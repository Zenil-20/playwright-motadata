---
screen: Flow Explorer · explorer
module: Flow
route: "/flow/explorer"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/flow_explorer.json · screenshots/Flow.png (BUILD 8.2.5, parent module) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Flow Explorer · explorer

## 1. Purpose
The **Explorer** tab of the Flow module — a **build-your-own flow query** view. Unlike the fixed
Dashboard widgets and the curated Analytics cards, Explorer lets a user compose an ad-hoc query from
four inputs — **Counter · Aggregation · Flow Source · Result by** — plus a set of options (**7 radios**),
render the result, and **Save as Widget** for reuse on a dashboard.

- **Business objective:** answer bespoke traffic questions ("top talkers by egress bytes on this
  exporter, grouped by application") without waiting for a pre-built widget, and persist useful queries
  as dashboard widgets.
- **Screen description:** the Flow shell (tab bar `data-testid='flow-top-tab-bar'`) with a query form:
  labelled fields **Counter**, **Aggregation**, **Flow Source**, **Result by** (three are `Select`
  dropdowns via `data-cy='dropdown-trigger-input'`, one is a free/blank input), **7 radio** options (a
  result-type / chart-type / direction toggle group), and a **Save as Widget** button.
- **Primary use cases:** pick a counter + aggregation + flow source + result-by dimension, choose a
  radio option, view the result, then Save as Widget.
- **Who uses it:** network analysts / NOC engineers building custom flow views. TODO(source: KG/docs) —
  role gating.
- **Dependencies:** flow data reporting for the range; Flow license; (for Save as Widget) a dashboard to
  host the widget.

## 2. Navigation
```
Flow → Explorer
```
- **Tabs:** Dashboard · Flow Analytics · Explorer (active) — `[data-testid='flow-top-tab-bar']`.
- **URL:** `/flow/explorer`.

## 3. Actions
- **Set Counter** — the `Counter` field (metric to count, e.g. bytes/packets). `Select` dropdown.
- **Set Aggregation** — the `Aggregation` field (e.g. sum/avg). `Select` dropdown.
- **Set Flow Source** — the `Flow Source` field (which exporter). `Select` dropdown.
- **Set Result by** — the `Result by` field (grouping dimension, e.g. Application/Source). `Select`
  dropdown.
- **Choose an option** — the **7 radios** (a result/chart/direction toggle group). TODO(source: KG/docs)
  — exact labels.
- **Save as Widget** — `Save as Widget` button persists the query as a dashboard widget.
- **Set time range** — shared Flow quick-range picker.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Tab bar | Dashboard · Flow Analytics · Explorer (active) — `[data-testid='flow-top-tab-bar']` |
| Counter | labelled field → `Select` dropdown (`[data-cy='dropdown-trigger-input']`) |
| Aggregation | labelled field → `Select` dropdown |
| Flow Source | labelled field → `Select` dropdown |
| Result by | labelled field → input (one input had a blank placeholder) |
| Options | 7 radio inputs (toggle group) |
| Save as Widget | `Save as Widget` button |

_Locators: see `knowledge/locators/catalog/flow_explorer.json`. The four dropdowns share
`[data-cy='dropdown-trigger-input']` — scope each by its adjacent label (Counter/Aggregation/Flow
Source/Result by) when automating. Promote to `selector-cookbook.md` (Flow > Explorer)._

## 5. Permissions
- Requires Flow module/license + a Flow-capable role. **Save as Widget** (persisting to a dashboard) is
  a write action likely gated to Admin/Operator. TODO(source: KG/docs) — confirm who may save widgets.

## 6. Entry Conditions
- Logged in; Flow licensed; flow data exists for the chosen source/range.

## 7. Exit Conditions
- With the query fields set, the result renders (chart/table) for the range.
- **Save as Widget (success):** the query is saved as a widget (expect a success toast + it appearing on
  the target dashboard). TODO(source: KG/docs) — confirm the save dialog (name / target dashboard).
- Changing any field / the time range re-runs the query.

## 8. Validations
- **Counter / Aggregation / Flow Source / Result by** — likely all required before a result can render;
  TODO(source: KG/docs) — confirm which are mandatory.
- **Save as Widget** — likely requires a (unique?) widget name and a target dashboard. TODO(source:
  KG/docs).
- **Time range** — from ≤ to.

## 9. Business Rules
- Explorer is the **ad-hoc query** layer of Flow; Save as Widget bridges it to dashboards.
- A valid result generally needs **Counter + Aggregation + Flow Source + Result by** set together.
- Queries are **time-scoped** by the shared Flow range picker.
- TODO(source: Motadata KG) — the enumerations for Counter/Aggregation/Result by, what the 7 radios
  represent, and where saved widgets land.

## 10. Known Bugs
- **Flow data mismatch or absent** (kb §7, PQD-30304 [MOTADATA-6334], PQD-36645, PQD-39746, PQD-29136):
  Explorer queries return 0/short data when the flow source is misconfigured — unparsed bi-directional
  ASA/PaloAlto templates (`tmp_asa_bi_flow`, **productized 8.0.22**), NetFlow version mismatch, or wrong
  exporter config. Fixes: enable `tmp_asa_bi_flow`, align versions, reconfigure exporters. Verify on
  8.2.6.

## 11. Edge Cases
- Save as Widget with a duplicate/blank name (if name required).
- Run a query with one field unset (should it be blocked / show nothing?).
- Incompatible Counter + Aggregation combination.
- Flow Source with 0-byte / absent data (the ASA/PaloAlto case) → empty result.
- Result-by dimension with very high cardinality (top-N truncation/perf).
- Changing radios/fields mid-query (race).
- Save as Widget to a dashboard the user can't access (permission).
