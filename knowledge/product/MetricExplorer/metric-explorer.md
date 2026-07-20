---
screen: Metric Explorer
module: MetricExplorer
route: "/metric-explorer/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/metric_explorer.json · screenshots/metric explorer.png · known_issues §3/§10
verified: 2026-07-09
---

# Metric Explorer

## 1. Purpose
An **ad-hoc metric charting workbench** — pick a monitor, drag its metrics onto trend panels, and
compare/visualize their time series without building a saved dashboard first. It is the "explore the
raw numbers" counterpart to the log product's Log Search.

- **Business objective:** let an engineer investigate performance/behaviour by plotting arbitrary
  metrics for a monitor over a chosen time range and interval, then optionally **Save View** for
  reuse — fast root-cause charting without dashboard authoring overhead.
- **Screen description:** a left config rail with a **Metric** tab strip (**Metric 1** by default,
  **+** to add more metric contexts) and a **Select Monitor** dropdown; a large canvas of stacked
  **"Drop metric here to view trend"** panels; a top toolbar with **chart-type** icons, a time-range
  picker (`today`/`Last Month`), a **5m** interval control, snapshot/image, columns, and **share**
  actions, and a **Save View** button.
- **Primary use cases:** select a monitor → drop one or more metrics onto trend panels → adjust
  chart type / interval / range → compare series → Save View or share/snapshot.
- **Who uses it:** operations/performance engineers and admins investigating monitors. TODO(source:
  KG/docs) — role gating.
- **Dependencies:** at least one **monitor** discovered with metrics in the datastore; the metric
  query backend online; a selected time range + interval.

## 2. Navigation
```
Left icon rail → Metric Explorer   →  /metric-explorer/
```
- **URL:** `/metric-explorer/`
- **Tabs:** the only "tab" captured is **Metric 1** — an in-page metric-context strip (with **+** to
  add Metric 2, 3, …), not a top-level nav tab.

## 3. Actions
- **Select Monitor** — open the monitor dropdown (`[data-cy='dropdown-trigger-input']`, placeholder
  "Select") and choose a monitor to load its metrics.
- **Add a metric context** — **+** next to the Metric tab strip (Metric 1, Metric 2, …).
- **Drop metric to view trend** — drag a metric onto a trend panel (multiple stacked drop zones).
- **Change chart type** — 4 chart-type toggles in the toolbar (the captured `radios: 4`; the
  screenshot shows line/area-style icons).
- **Set interval** — the **5m** control (data roll-up granularity).
- **Set time range** — `today` / `Last Month` / custom from–to.
- **Snapshot / image**, **columns**, and **share** toolbar actions.
- **Save View** — persist the current monitor + metrics + layout as a reusable view.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Metric context strip | **Metric 1** … + **＋** add-metric button |
| Select Monitor | label "Select Monitor" + dropdown `input[placeholder="Select"]` (`[data-cy='dropdown-trigger-input']`) |
| Trend panels | stacked "Drop metric here to view trend" drop zones |
| Chart-type toggles | 4 icons (`radios: 4`) |
| Interval | **5m** button |
| Time-range picker | `today` / `Last Month` + explicit from/to |
| Snapshot / Columns / Share | toolbar icon actions |
| Save View | primary button (top-right) |

_Buttons captured: **5m**, **Save View**. `labels:["Select Monitor"]`, `selects:0, switches:0,
radios:4, checkboxes:0`. The monitor picker is a custom dropdown (data-cy `dropdown-trigger-input`),
not a native `<select>`._

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Metric Explorer)._

## 5. Permissions
- Requires metric/monitoring data visibility — a monitoring-viewer role at minimum. **Save View** is
  a create action and may need higher rights. TODO(source: KG/docs) — exact RBAC and whether shared
  views are role-scoped.

## 6. Entry Conditions
- Logged in; monitoring module active.
- At least one monitor exists with collected metrics for the chosen range.
- A time range + interval selected (defaults shown: `today`, `5m`).

## 7. Exit Conditions
- Selecting a monitor populates its available metrics; dropping a metric renders a trend chart in
  that panel.
- Changing chart type / interval / range re-renders the plotted series.
- **Save View** → success toast; the view is retrievable later. TODO(source: docs) — where saved
  views are listed.
- Empty panel state shows the "Drop metric here to view trend" placeholder, not an error.

## 8. Validations
- **Select Monitor** — must pick an existing monitor before metrics can be dropped. TODO(source: docs).
- **Interval vs. range** — very short interval over a long range yields many points; TODO(source:
  docs) — any cap / auto-coarsening, and the raw-vs-aggregated retention boundary (KB §10) that can
  change plotted values for older ranges.
- **Save View** — likely requires a unique view name. TODO(source: docs).

## 9. Business Rules
- Metrics are **scoped to the selected monitor**; changing the monitor changes the droppable metric
  set.
- Multiple **Metric** contexts (Metric 1/2/…) let a user compare across monitors/metrics in one view.
- Plotted values depend on **interval (roll-up)** and **range**; older ranges are served from the
  aggregation layer, which can differ from raw (KB §10). TODO(source: KG) — confirm.
- TODO(source: KG/docs) — whether a Saved View is per-user or shareable, and its relationship to
  dashboard widgets.

## 10. Known Bugs
No defect is recorded **specifically for the Metric Explorer screen** in
`knowledge/known_issues/customer-issue-kb.md`. The adjacent, relevant classes (metric visualization /
pipeline) are:
- **Widget shows wrong/empty data after a backend metric rename** (§10; PQD-36959 [MOTADATA-7853]):
  an upgrade renamed `metric` → `state.metric`, breaking the query. Any Metric-Explorer view pinned
  to an old metric name is exposed to the same rename class. Ordering fix landed **8.2.0**.
- **Metric pipeline stalls (queue full / aggregation stall)** (§3; PQD-38255 [MOTADATA-8024],
  PQD-39472): polling data stops or aggregation stalls so metrics never flush — the Explorer would
  then plot flat/empty trends. Fixed in **8.2.0** + datastore memory tuning.

These are pipeline/widget defects that manifest here; none is a Metric-Explorer-specific bug.
Otherwise: **None recorded for this screen.**

## 11. Edge Cases
- Monitor selected but it has **no metrics** for the range → empty/placeholder panels.
- Dropping many metrics onto one panel (overlay legibility) and across multiple metric contexts.
- Very short interval (e.g. seconds) over `Last Month` → large point count / performance.
- Range crossing the raw→aggregated retention boundary (plotted values shift — KB §10).
- Metric whose backend name changed after an upgrade (broken series — KB §10 rename class).
- Save View with a duplicate/empty name; saving with zero metrics dropped.
- Switching chart type with a series already plotted; share/snapshot of an empty view.
- Concurrent monitor deletion while its metrics are plotted here.
