---
screen: Flow Dashboard · flow
module: Flow
route: "/flow/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/flow.json · screenshots/Flow.png (BUILD 8.2.5) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Flow Dashboard · flow

## 1. Purpose
The landing route of the **Flow** (NetFlow/sFlow/IPFIX traffic-analytics) module. `/flow/` opens the
module shell and lands on its first tab, **Dashboard** (the sweep of `/flow/` and `/flow/dashboard`
returned an identical catalog — the two `Select` dropdowns, a `filter by name…` input, the tab bar —
confirming `/flow/` is an alias that defaults to Dashboard).

- **Business objective:** give network teams visibility into traffic flows — top applications,
  protocols, sources, destinations and conversations by volume — for capacity, security and
  troubleshooting.
- **Screen description:** a full-page module titled **"Flow"** with a top **tab bar** (`Dashboard ·
  Flow Analytics · Explorer`, `data-testid='flow-top-tab-bar'`), a **time-range picker** (screenshot
  shows _Last Month_), two scope dropdowns **Event Source** and **Interface** (both placeholder
  "Select"), an export/image icon, and a grid of traffic **widgets** — each a pie/summary pair (Top
  Application by Traffic, Top Protocols by Traffic, Top Sources by Traffic, …) with its own **"filter by
  name…"**/Search box.
- **Primary use cases:** pick an Event Source + Interface and a time range, then read the top-traffic
  widgets; switch to Flow Analytics or Explorer for deeper analysis.
- **Who uses it:** network / NOC engineers. TODO(source: KG/docs) — role gating.
- **Dependencies:** a flow **exporter** (router/firewall/switch) sending NetFlow/sFlow/IPFIX to
  Motadata; the exporter configured correctly (version, bi-directional templates) — see Known Bugs; a
  time range containing flow data.

## 2. Navigation
```
Left icon rail → Flow → lands on Dashboard
```
- **Header:** `Flow`.
- **Tabs:** Dashboard · Flow Analytics · Explorer (`data-testid='flow-top-tab-bar'`).
- **URL:** `/flow/` (resolves to the Dashboard tab).

## 3. Actions
- **Switch tab** — Dashboard / Flow Analytics / Explorer.
- **Scope by Event Source** — the first `Select` dropdown (choose the exporter/flow source).
- **Scope by Interface** — the second `Select` dropdown (choose an interface on that source).
- **Set time range** — quick-range picker (observed _Last Month_) scopes all widgets.
- **Search within a widget** — each summary widget has a `filter by name…`/Search box.
- **Export** — the image/export icon (top-right). TODO(source: KG/docs) — confirm export format.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Module header | "Flow" |
| Tab bar | Dashboard (active) · Flow Analytics · Explorer — `[data-testid='flow-top-tab-bar']` |
| Event Source dropdown | `input[placeholder="Select"]` (1st) |
| Interface dropdown | `input[placeholder="Select"]` (2nd) |
| Widget search | `input[placeholder="filter by name…"]` (per summary widget) |
| Traffic widgets | pie + summary-grid pairs: Top Application / Protocols / Sources / … by Traffic |
| Summary grid columns | Source.IP · Destination.IP · Application/Protocol · Volume.Bytes.Sum · Ingress.Volume.Bytes.Sum · Egress.Volume.Bytes.Sum (from screenshot) |
| Time-range picker | quick-range (observed _Last Month_) |
| Export icon | right-aligned image/export button |

_Locators: see `knowledge/locators/catalog/flow.json`. The two `Select` dropdowns share the same
placeholder — scope by order (Event Source = 1st, Interface = 2nd) or by adjacent label when automating;
promote to `selector-cookbook.md` (Flow > Dashboard)._

## 5. Permissions
- Requires the Flow module/license enabled and a role with Flow access. TODO(source: KG/docs) — specific
  view vs configure capabilities.

## 6. Entry Conditions
- Logged in; Flow module licensed/enabled.
- A flow exporter is configured and sending data for the selected range (else widgets are empty).

## 7. Exit Conditions
- Selecting a tab changes the URL to `/flow/dashboard|analytics|explorer` and loads that view.
- Changing Event Source / Interface / time range re-queries and repaints the widgets.

## 8. Validations
- **Event Source / Interface** — selection dropdowns; Interface is meaningfully populated only after an
  Event Source is chosen. TODO(source: KG/docs) — confirm the dependency.
- **Time range** — from ≤ to; TODO(source: docs) — max look-back tied to flow retention.

## 9. Business Rules
- `/flow/` defaults to the **Dashboard** tab (route alias — evidenced by identical catalogs).
- Widgets are **scoped** by Event Source + Interface + time range.
- Traffic is measured in **bytes** with ingress/egress/total split (screenshot columns).
- TODO(source: Motadata KG) — flow retention, supported flow versions, and how Event Source ↔ Interface
  cascade.

## 10. Known Bugs
- **Flow data mismatch or absent** (kb §7, PQD-30304 [MOTADATA-6334], PQD-36645, PQD-39746, PQD-29136):
  NetFlow volume shows **0 bytes** or flow size differs from another NMS, or flow "not supported".
  Diagnoses: bi-directional **ASA / Palo Alto** templates (Initiator/Responder octets) unparsed by
  pmacct (needs `tmp_asa_bi_flow`); comparing **NetFlow v5 vs v9** feeds; CloudGenix supports **NetFlow
  v9, not sFlow**; wrong switch flow config. Solutions: enable `tmp_asa_bi_flow` (**productized 8.0.22**);
  align flow versions; reconfigure exporters per vendor standard. Verify on 8.2.6.

## 11. Edge Cases
- Exporter sending 0-byte volumes (the ASA/PaloAlto bi-directional case) → empty/zero widgets.
- Event Source selected but Interface list empty.
- Very large time range (_Last Month_+) → aggregation/perf.
- Mixed flow versions (v5 vs v9) from one source → mismatched totals.
- Widget search with no match / special characters.
- No exporter configured (fresh install) → all widgets empty.
- Rapid Event Source/Interface/time-range switching mid-query.
