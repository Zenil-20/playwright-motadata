---
screen: Log Explorer · Overview
module: LogExplorer
route: "/log/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/log.json · screenshots/log.png · known_issues §7
verified: 2026-07-09
---

# Log Explorer · Overview

## 1. Purpose
The landing screen of the **Log Explorer** module — a real-time view of the log/event ingestion
pipeline. It answers "what logs am I receiving right now, from where, and in what volume?" before a
user drills into individual events on **Log Search**.

- **Business objective:** give SOC / NOC operators an at-a-glance health read of log ingestion —
  throughput, total retained volume, and the mix of log sources (parsers) — so a drop or spike in a
  source is noticed immediately.
- **Screen description:** three KPI tiles across the top — **Events Per Second**, **Total Events**,
  **Last Hour Event Counts** — over a packed-bubble chart that groups incoming logs by category
  (Other, Linux, Windows, Syslog, Router, Switch) and by the parser inside each category (e.g.
  "syslog event", "Linux Syslog", "Windows Event Collector"). A left rail toggles the same data
  between a **Type** tree and a **Group** tree, each with counts and a search box.
- **Primary use cases:** confirm logs are flowing; spot a source that stopped or flooded; read the
  per-parser event counts; jump into **Log Search** or **Start Live Trail** for the live stream.
- **Who uses it:** security/operations analysts and admins monitoring log sources. TODO(source:
  KG/docs) — exact role gating.
- **Dependencies:** the log-collector / datastore pipeline must be up; log sources must be
  configured and their parsers assigned; a selected **time range** (screenshot shows a `today` /
  `Last Month` picker) scopes the KPIs and chart.

## 2. Navigation
```
Left icon rail → Log Explorer  →  Overview (default tab)
```
- **Tabs (top):** Overview · Log Search
- **URL:** `/log/` (redirects to the Overview view of the Log Explorer)
- **Related:** top-right **Start Live Trail** opens the live-tail stream (`/log/live-tail`).

> The 2026-07-02 sweep listed tabs as `Overview / Log Search / Type / Group`. Per `log.png`, only
> **Overview** and **Log Search** are top tabs; **Type** and **Group** are the left-rail toggle, not
> page tabs. Treat them as the source-tree mode selector.

## 3. Actions
- Switch top tab **Overview ↔ Log Search**.
- Toggle the source tree **Type ↔ Group** (left rail).
- **Search** the source tree (`input[placeholder="Search"]`) to filter parsers/groups.
- Expand/collapse a category node to see its parsers and per-parser event counts.
- Change the **time range** (`today` / `Last Month` / custom) — rescopes KPIs + bubble chart.
- **Start Live Trail** — open the live streaming tail.
- Click a bubble/parser to drill into that source. TODO(source: KG/docs) — confirm the exact
  drill-through target (Log Search pre-filtered by that parser?).

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Top tabs | Overview · Log Search |
| Source-tree toggle | **Type** / **Group** (left rail) |
| Tree search | `input[placeholder="Search"]` (two captured — one per tree mode) |
| KPI — Events Per Second | numeric tile |
| KPI — Total Events | numeric tile (e.g. "3.79 M") |
| KPI — Last Hour Event Counts | numeric tile |
| Category bubble chart | packed bubbles by category → parser, with legend (Other/Linux/Windows/Syslog/Router/Switch) |
| Time-range picker | `today` / `Last Month` + explicit from/to timestamps |
| Start Live Trail | button (top-right) → `/log/live-tail` |

_No `buttonIds`, `gridHeaders`, `selects`, `switches`, `radios`, or `checkboxes` were captured for
this route (`selects:0, switches:0, radios:0, checkboxes:0`)._

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Log Explorer > Overview)._

## 5. Permissions
- Viewing the Log Explorer requires the **Log module** to be licensed/enabled and the user to hold a
  log-viewing role. TODO(source: KG/docs) — exact RBAC (Admin/Operator/Viewer) and whether a
  **Query** permission is needed (note: §4 of the KB shows report download needs a "Query"
  permission — a similar gate may apply here).
- License/quota gating: the Log module is quota-metered (see Known Bugs). TODO(source: docs).

## 6. Entry Conditions
- Logged in; Log module enabled/licensed.
- At least one log source configured and forwarding; the collector/datastore pipeline is up.
- A time range is selected (defaults to `today`).

## 7. Exit Conditions
- KPI tiles and the bubble chart render with non-null counts when logs are flowing.
- Selecting a different time range re-renders the tiles/chart for that window.
- **Start Live Trail** transitions to the live-tail stream.
- Empty state (no logs in range) shows zero counts / empty chart rather than an error.

## 8. Validations
- **Tree search** — free text; filters the visible parser/group nodes (no format rule observed).
- **Time range** — "from" must precede "to"; TODO(source: docs) — max span and the raw-vs-aggregated
  retention boundary (KB §4/§10 note that long ranges cross retention layers).
- No editable form fields on this screen, so no input-format validations. TODO(source: docs).

## 9. Business Rules
- Every ingested log is bucketed to a **parser** within a **category/group**; unmatched logs fall to
  **"Other"** (visible as the large "Other" bubble). This is the same routing that produces the
  "logs land in Others" defect class (Known Bugs).
- **Type** groups by parser/source type; **Group** groups by source grouping (device/network/server
  group). Both are views of the same event set for the selected time range.
- KPIs are time-range scoped; "Total Events" reflects retained events in the datastore, subject to
  log retention/quota. TODO(source: KG) — confirm retention model.
- TODO(source: KG/docs) — how a parser is assigned to a source (per-source-IP, per KB §7).

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` §7 (Log / Flow / Trap Explorers) — apply to the
Log Explorer as a whole:
- **Logs land in "Other" / not parsed / not searchable** (PQD-35659, PQD-38164 [MOTADATA-8029],
  PQD-36867, PQD-41651). Parser assignment is **per source-IP**, so dynamic dual-WAN IPs break it;
  `windows.event.provider` was non-indexable (fixed via 8.1.3 patch + index config param); by default
  only Event/Application/Security event sources are enabled — others must be added with their event
  IDs in agent settings. Linux **AuditD** parser is default from **8.2.2**. Workaround: verify
  forwarding with `tcpdump` at both ends (PQD-41047).
- **Log licensing / quota & pipeline** (PQD-34767, PQD-35039, PQD-37669 [MOTADATA-7925]): daily log
  quota not reset at midnight (scheduler stalled); log verticles not started because the service was
  not restarted after applying the license; a default numeric-event-ID alert matched any log
  containing that value (default alert removed in **8.2.0**). Workaround: **restart services after
  applying a log license**.

## 11. Edge Cases
- No logs in the selected range → zero KPIs / empty bubble chart (must not error).
- A source stops forwarding mid-window (visible as a shrinking/absent bubble).
- Huge "Other" bubble = large volume of unparsed logs (parser-assignment defect signal).
- Very high Events-Per-Second (flood) — chart/KPI must remain responsive.
- Time range crossing the raw→aggregated retention boundary (count discrepancies, KB §10).
- Tree search with no matches; special characters in a parser/group name.
- Log license expired or quota exhausted mid-day (counts freeze — see Known Bugs).
- Switching Type↔Group must preserve the selected time range.
