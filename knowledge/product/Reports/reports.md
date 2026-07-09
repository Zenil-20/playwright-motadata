---
screen: Report · reports
module: Reports
route: "/reports/"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/reports.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Report · reports

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/reports/` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `search` — _Search_ (text)
- `search` — _Search_ (text)

**Switches / toggles**
50

**Tabs**
- Metric
- Log
- Flow
- Trap
- Audit
- NCCM
- APM
- RUM
- NetRoute
- Log Compliance

**Grid columns**
- Name
- Description
- Type
- Report Type
- Schedule
- Download
- Actions

**Buttons**
- Create Custom Report
- Filter
- OFF
- ON

**Button ids**
- `#create-report-btn`
- `#filter-btn`
- `#10000000010378`
- `#10000000010362`
- `#10000000010350`
- `#10000000010382`
- `#10000000010379`
- `#10000000000055`
- `#10000000000081`
- `#10000000010348`
- `#10000000010356`
- `#10000000010349`
- `#10000000000022`
- `#10000000000010`
- `#10000000010359`
- `#10000000010353`
- `#10000000010380`
- `#10000000010372`
- `#10000000010381`
- `#10000000010364`
- `#10000000000084`
- `#100000000103106`
- `#100000000103109`
- `#110357093148`
- `#110357093589`
- `#110357093153`
- `#10000000000034`
- `#100000000103105`
- `#100000000103108`
- `#10000000000104`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/reports.json` (raw sweep) — promote verified ones into the cookbook._

## Permissions
TODO(source: docs) — roles that can view/act.

## Entry Conditions
Logged in. TODO(source: docs) — any feature flag / seeded data.

## Exit Conditions
TODO(source: docs).

## Validations
TODO(source: docs) — field validations + inline errors.

## Business Rules
TODO(source: Motadata KG) — uniqueness, defaults, dependencies, limits.

## Known Bugs
See `knowledge/known_issues/customer-issue-kb.md` for related customer issues, if any.

## Edge Cases
TODO — boundary / negative / timing cases.
