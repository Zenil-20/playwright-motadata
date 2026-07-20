---
screen: Flow Dashboard · dashboard
module: Flow
route: "/flow/dashboard"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/flow_dashboard.json · screenshots/Flow.png (BUILD 8.2.5) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Flow Dashboard · dashboard

## 1. Purpose
The **Dashboard** tab of the Flow module — the default landing view. It presents pre-built **top-traffic
widgets** (each a pie chart + a searchable summary grid) so a network user can immediately see which
applications, protocols, sources and destinations dominate traffic for the chosen exporter, interface
and time range. (Its catalog is identical to `/flow/`, confirming `/flow/` lands here.)

- **Business objective:** an at-a-glance traffic overview — top talkers by volume — without building
  anything, as the entry point to Flow Analytics and Explorer.
- **Screen description:** the Flow shell (tab bar + time-range picker) with two scope dropdowns
  **Event Source** and **Interface** (both placeholder "Select"), an export/image icon, and a grid of
  widgets. `Flow.png` shows **Top Application by Traffic**, **Top Protocols by Traffic** and **Top
  Sources by Traffic**, each as a pie + a **Summary** grid (Source.IP · Destination.IP ·
  Application/Protocol · Volume.Bytes.Sum · Ingress.Volume.Bytes.Sum · Egress.Volume.Bytes.Sum) with its
  own **"filter by name…"**/Search box and paging (e.g. "1/2").
- **Primary use cases:** choose Event Source + Interface + range; read the widgets; search within a
  widget's summary; page through results.
- **Who uses it:** network / NOC engineers. TODO(source: KG/docs) — role gating.
- **Dependencies:** a correctly configured flow exporter sending data for the range; Flow license.

## 2. Navigation
```
Flow → Dashboard  (default tab)
```
- **Tabs:** Dashboard (active) · Flow Analytics · Explorer (`data-testid='flow-top-tab-bar'`).
- **URL:** `/flow/dashboard` (also reachable as `/flow/`).

## 3. Actions
- **Scope by Event Source** — first `Select` dropdown.
- **Scope by Interface** — second `Select` dropdown.
- **Set time range** — quick-range picker (observed _Last Month_).
- **Search within a widget** — each widget's `filter by name…`/Search box.
- **Page** — per-widget pager (e.g. "1/2 ▼").
- **Export** — the image/export icon. TODO(source: KG/docs) — format.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Tab bar | Dashboard (active) · Flow Analytics · Explorer — `[data-testid='flow-top-tab-bar']` |
| Event Source dropdown | `input[placeholder="Select"]` (1st) |
| Interface dropdown | `input[placeholder="Select"]` (2nd) |
| Widget search | `input[placeholder="filter by name…"]` (per widget) |
| Traffic widgets | pie + summary grid: Top Application / Protocols / Sources by Traffic (+ more on scroll) |
| Summary grid columns | Source.IP · Destination.IP · Application/Protocol · Volume.Bytes.Sum · Ingress · Egress (Bytes.Sum) |
| Time-range picker | quick-range (observed _Last Month_) |
| Export icon | right-aligned image/export button |

_Locators: see `knowledge/locators/catalog/flow_dashboard.json`. Same two same-placeholder dropdowns as
`/flow/` — scope by order (Event Source = 1st, Interface = 2nd). Promote to `selector-cookbook.md`
(Flow > Dashboard)._

## 5. Permissions
- Requires Flow module/license + a Flow-capable role. TODO(source: KG/docs) — view vs configure split.

## 6. Entry Conditions
- Logged in; Flow licensed; a flow exporter sending data for the selected range.

## 7. Exit Conditions
- Changing Event Source / Interface / time range / widget search re-queries and repaints the widgets.
- Switching tab navigates to Flow Analytics / Explorer.

## 8. Validations
- **Event Source / Interface** — dropdowns; Interface depends on Event Source (TODO: confirm cascade).
- **Widget search** — free text; no observed constraint.
- **Time range** — from ≤ to.

## 9. Business Rules
- Dashboard is the **default** Flow tab.
- Widgets are **scoped** by Event Source + Interface + time range; traffic shown in **bytes** with
  ingress/egress/total split.
- Each widget paginates its own top-N list.
- TODO(source: Motadata KG) — the full default widget set, top-N size, and flow retention.

## 10. Known Bugs
- **Flow data mismatch or absent** (kb §7, PQD-30304 [MOTADATA-6334], PQD-36645, PQD-39746, PQD-29136):
  0-byte NetFlow volumes / size differing from another NMS / "not supported". Causes: unparsed
  bi-directional ASA/Palo Alto templates (`tmp_asa_bi_flow`, **productized 8.0.22**), NetFlow v5-vs-v9
  comparison, CloudGenix NetFlow-v9-not-sFlow, wrong exporter config. Solutions: enable
  `tmp_asa_bi_flow`, align flow versions, reconfigure exporters. Verify on 8.2.6.

## 11. Edge Cases
- Widgets empty because the exporter sends 0-byte volumes (ASA/PaloAlto case).
- Event Source with no interfaces; Interface list not repopulating after changing source.
- Widget search no-match / special characters; paging past the last page.
- Very large range (_Last Month_+) aggregation/perf.
- No exporter configured → all widgets empty.
- Rapid scope/time changes mid-query.
