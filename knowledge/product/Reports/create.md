---
screen: Report · create
module: Reports
route: "/reports/create"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/reports_create.json · screenshots/custom report create.png · known_issues/customer-issue-kb.md §4
verified: 2026-07-09
---

# Reports — Create Custom Report

## 1. Purpose
The **Create Custom Report wizard** — a guided, 3-step flow to build a new report by picking a report type,
defining its criteria (data source, scope, time range), and setting its properties (name, schedule, format).

- **Business objective:** let users self-serve custom reporting across every data domain without engineering,
  reducing the need for the backend "custom script" reports the KB shows customers historically requested.
- **Screen description:** a left **stepper** — **1 Report Type → 2 Report Criteria → 3 Report Properties** —
  and a body that starts on **Report Type**: a **Search** box over a grid of type tiles. Observed tiles
  (screenshot): **Availability, Performance, Inventory, Active Alerts, Availability Flap Summary, Metric
  Alerts, Audit, Log Events, Trap Events, Log Analytics, Flow Analytics, Custom Script, Polling Data,
  Forecast, Capacity Forecasting, Historical Trend, Compliance, APM, RUM, NetRoute**. A footer link
  **"For more information: Create Custom Report"** opens docs.
- **Primary use cases:** choose a report type, then configure criteria and properties to save/run a report.
- **Who uses it:** operators and administrators who build reports.
- **Dependencies:** the reporting engine and the licensed data domains (a type tile is only useful if its
  module is collecting) · scheduler + mail server (for scheduling on step 3).

## 2. Navigation
```
Reports (/reports/) → Create Custom Report (#create-report-btn) → /reports/create
```
- **Stepper:** 1 Report Type · 2 Report Criteria · 3 Report Properties
- **URL:** `/reports/create` — open the full URL; SPA routing must load the page.
- Back-chevron (top-left) returns to the report list.

## 3. Actions
- **Search report types** — `input` _Search_ filters the type tiles (only input captured in the sweep).
- **Select a report type** — click a tile (Availability, Performance, Custom Script, …) to advance.
- **Advance / go back** — move through steps 1 → 2 → 3 (Report Criteria, Report Properties). TODO(source: KG)
  the exact Next/Back/Save button ids on steps 2–3 (not captured — step-1 sweep only).
- **Open documentation** — footer "Create Custom Report" help link.
- **Save / Run** the report on step 3. TODO(source: KG) confirm control + resulting toast/route.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Stepper | 1 Report Type · 2 Report Criteria · 3 Report Properties |
| Search | `input` _Search_ (over type tiles) |
| Report-type tiles | Availability · Performance · Inventory · Active Alerts · Availability Flap Summary · Metric Alerts · Audit · Log Events · Trap Events · Log Analytics · Flow Analytics · Custom Script · Polling Data · Forecast · Capacity Forecasting · Historical Trend · Compliance · APM · RUM · NetRoute |
| Docs link | "For more information: Create Custom Report" |

> The catalog sweep captured **only the step-1 Search input** (`inputs: [search]`, no buttons/grid) because
> the wizard loads on the Report Type step. Steps 2 (Report Criteria) and 3 (Report Properties) — including
> name, group/monitor scope, time range, schedule, and export format fields — were **not captured**;
> resolve those live. The type tiles come from the screenshot.

_Locators: see `knowledge/locators/catalog/reports_create.json`; promote verified ones into the cookbook
(Reports > Create). Step-2/3 controls need a live harvest._

## 5. Permissions
- **Create:** Admin/Operator (persists a new report definition). Viewers typically cannot create.
  TODO(source: KG/docs) confirm the role gate and whether "Custom Script" type is admin-only (it runs a
  backend script).

## 6. Entry Conditions
- User is logged in with report-create permission; reached via **Create Custom Report** on `/reports/`.
- For a type tile to yield data, its **module must be licensed and collecting** (e.g. Flow Analytics, APM,
  RUM, NetRoute, Compliance).

## 7. Exit Conditions
- **On type select:** stepper advances to Report Criteria.
- **On Save (step 3, success):** the new report appears in the report list (`/reports/`); if scheduled, a
  schedule is registered; an audit entry is written. TODO(source: KG) confirm success toast + redirect.
- **On cancel/back:** returns to the report list without persisting.

## 8. Validations
- **Report Type** — one must be selected to proceed.
- **Report Properties (step 3)** — name required and likely unique; schedule requires a valid cadence and
  (for email delivery) a configured mail server; export format must be chosen. TODO(source: KG/docs) exact
  required fields, name-uniqueness scope, and allowed formats (PDF / XLSX).
- **Report Criteria (step 2)** — data source/scope/time range required. The KB notes a missing **"Between"**
  operator caused wrong ranges (§4) — verify the time-range operators. TODO(source: KG) exact rules.

## 9. Business Rules
- **Report type drives the criteria** available on step 2 (an Availability report exposes different criteria
  than Flow Analytics or Custom Script).
- **Custom Script** reports execute a backend script rather than a built-in query.
- **Time-unit cap:** per KB §4 (PQD, 8.2.1) availability report **time units were capped at Days** for long
  durations — long-range criteria may be constrained.
- TODO(source: KG/docs): whether a report can be both scheduled and ad-hoc, and default format per type.

## 10. Known Bugs
From `customer-issue-kb.md` §4 (Reports) — relevant to what a newly-created report will do:
- **Format selection ignored in scheduler** → scheduled PDF arrived as XLSX (PQD-38909 / MOTADATA-8254).
  Verify the format chosen on step 3 is honored by the scheduler. *Fix:* 8.1.3–8.2.0.
- **Missing "Between" operator caused wrong ranges** (§4 export/format defects) — check the step-2 time-range
  operators.
- **Availability wrong/empty for long ranges** (raw-vs-aggregation, PQD-32430 / MOTADATA-6639,
  PQD-38241 / MOTADATA-8012) — a long-range Availability report created here may hit the retention boundary;
  time units capped at Days (8.2.1).
- **Custom report scripts as stopgap for feature gaps** (PQD-34124 / MOTADATA-7293, PQD-35662 /
  MOTADATA-7509, PQD-39579 / MOTADATA-8368) — some KPIs (Oracle metrics, reachability, VLAN traffic, penalty
  calc) were not available as built-in types and needed backend scripts; a "Custom Script" report here is
  the productized path.

_No defect recorded against the create-wizard UI itself._

## 11. Edge Cases
- Search type tiles with no match (empty grid) / partial match.
- Select a type whose **module is unlicensed** — does step 2 error or show empty criteria?
- Create with **duplicate name** vs an existing report.
- Schedule a report with **no mail server** configured (KB: delivery silently fails).
- Long-range Availability report (month/quarter) — time-unit cap to Days; raw→aggregation boundary.
- **Custom Script** report with an invalid/failing script — surfaced where?
- Abandon mid-wizard (leave on step 2) — nothing persisted.
- Very long report name / description; special characters.
- Choose a format on step 3 and confirm the scheduled output matches (KB PDF→XLSX regression).
