---
screen: Log Explorer · Log Search
module: LogExplorer
route: "/log/search"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/log_search.json · screenshots/"log search - type.png","log search - group .png" · known_issues §7
verified: 2026-07-09
---

# Log Explorer · Log Search

## 1. Purpose
The investigative workbench of the Log Explorer — run ad-hoc queries over ingested logs, facet the
results, visualize the volume over time, and save the query or promote it to a report.

- **Business objective:** let an analyst find specific events (an audit failure, a login, a device
  message) across millions of logs, narrow by facets, and turn a useful query into a saved query or
  scheduled report — the core forensic/troubleshooting loop of the log product.
- **Screen description:** a top **view switcher** (List · Chart · Grid · Top N · Gauge) over a
  time-bucketed histogram of matching events; a query bar with **Execute / Pause / Abort**; a left
  **Type/Group** source tree with per-source counts; a **field-facet** panel (checkbox facets such as
  `event.category`, `linux.auditd.user.id`, `linux.auditd.parent.process.id` with per-value counts);
  and a results area under **Event Log / Log Pattern** tabs showing timestamp + message rows, a live
  **Search Events Count**, a **Raw Log** toggle, and **Save as Report**.
- **Primary use cases:** search logs by keyword/field; facet-drill by category/user/process; switch
  to Chart/Grid/Top N/Gauge; save the query; export as a report.
- **Who uses it:** SOC/NOC analysts, auditors, admins. TODO(source: KG/docs) — role gating.
- **Dependencies:** logs ingested and parsed; a time range; the search backend (datastore) online.

## 2. Navigation
```
Log Explorer → Log Search tab   (— or —)   Overview → click a source/bubble → Log Search
```
- **Tabs (top):** Overview · Log Search
- **URL:** `/log/search`
- The catalog also lists `Type · Group · Event Log · Log Pattern` — per the screenshots, **Type/Group**
  are the left source-tree toggle and **Event Log/Log Pattern** are the results-panel sub-tabs, not
  top-level page tabs.

## 3. Actions
- Choose a **view**: List · Chart · Grid · Top N · Gauge.
- Type a query in the **Search** bar and **Execute**; **Pause** / **Abort** a running query.
- Toggle the source tree **Type ↔ Group**; **search** the tree.
- Check/uncheck **field facets** to narrow results; each shows a per-value count.
- Switch results sub-tab **Event Log ↔ Log Pattern**.
- Toggle **Raw Log** to see raw vs parsed message form.
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Save Query** — persist the current query/filters.
- **Save as Report** — promote the query to a report.
- Expand a result row to view the full parsed message. Full-screen the results (expand icon).

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| View switcher | List · Chart · Grid · Top N · Gauge (captured `radios: 7` — the view set + result-panel radios) |
| Query bar | `input[placeholder="Search"]` + **Execute** / **Pause** / **Abort** |
| Save Query | button (top-right) |
| Time histogram | event-count-over-time bar chart for the range |
| Source tree | **Type** / **Group** toggle + tree search (`input[placeholder="Search"]`) |
| Field-facet panel | per-field expandable facets with checkbox values + counts (`checkboxes: 2` captured in default state) |
| Results tabs | **Event Log** / **Log Pattern** |
| Results grid | TIMESTAMP · MESSAGE columns (parsed JSON messages) |
| Search Events Count | live match count (e.g. "90151") |
| Raw Log | checkbox toggle |
| Save as Report | button |
| Show/hide columns | `#btn-show-hide-columns` |

_Buttons captured: **Save Query**, **Execute**, **Save as Report**. `selects:0, switches:0,
radios:7, checkboxes:2`._

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Log Explorer > Log Search)._

## 5. Permissions
- Requires the Log module enabled and a log-search role. Saving a **Report** likely requires the
  **Query** permission (KB §4 shows read-only users blocked from report download without it).
  TODO(source: KG/docs) — exact RBAC for search vs. save-query vs. save-as-report.

## 6. Entry Conditions
- Logged in; Log module enabled; logs present for the selected range.
- A time range is selected (defaults to `today`).
- Search backend/datastore reachable.

## 7. Exit Conditions
- **Execute** returns a result set: histogram + rows render, **Search Events Count** updates.
- **Abort** stops a long query without navigating away; **Pause** halts streaming updates.
- **Save Query** → success toast, query persisted and re-openable.
- **Save as Report** → report created (appears under Reports). TODO(source: docs) — confirm target.
- Empty result → zero count + empty grid, not an error.

## 8. Validations
- **Query syntax** — TODO(source: docs) — the query language/operators and how a malformed query is
  reported. Field facets combine as AND across fields, OR within a field (typical). TODO(source: KG).
- **Time range** — from < to; long ranges cross the raw→aggregated retention boundary (KB §4/§10).
- **Save Query / Save as Report** — likely require a unique name. TODO(source: docs).

## 9. Business Rules
- Results are **time-range scoped**; the histogram buckets matches over that window.
- **Facet counts** reflect the current query + already-applied facets (drill-down narrowing).
- **Raw Log** shows the unparsed line; parsed view shows extracted fields — a message that failed to
  parse still appears but under the "Other" category (KB §7 defect class).
- Queries older than raw retention are auto-routed to the aggregation layer (KB §4, 8.0.24+);
  numbers can differ from a raw-range query for the same window. TODO(source: KG) — confirm.

## 10. Known Bugs
From `customer-issue-kb.md` §7 (Log / Flow / Trap Explorers):
- **Filter/search dead in the Log module / logs not searchable** (PQD-38164 [MOTADATA-8029],
  PQD-36867): non-indexable `windows.event.provider` made fields unsearchable — fixed via **8.1.3**
  patch plus a config parameter to index the field. Parser-assignment-by-source-IP means logs from a
  changed IP silently miss their parser and become hard to find (fall to "Other").
- **Log alert fires but no logs found** (PQD-37669 [MOTADATA-7925]): a default numeric-event-ID alert
  matched any log containing that value; the default alert was **removed in 8.2.0**.
- Related retention/consistency behavior (KB §4/§10): the same query over a long range can return
  different counts depending on whether it lands on the raw or aggregated layer.

## 11. Edge Cases
- Query that matches millions of rows → must stream/paginate, and **Abort** must actually stop it.
- Empty result set; query returning only "Other"-bucketed (unparsed) logs.
- Rapid facet toggling while a query is still executing (Pause/Abort race).
- Very long / deeply-nested JSON messages truncated in the MESSAGE column.
- Time range spanning the raw→aggregated boundary (count divergence).
- Save Query / Save as Report with a duplicate name or empty name.
- Switching view (List→Chart→Top N→Gauge) mid-query; Raw Log toggle mid-stream.
- Special characters / injection attempts in the query bar.
- Show/hide columns persistence across view switches.
