---
screen: Alert Dashboard · alerts
module: Alerts
route: "/alerts/"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/alerts.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Alert Dashboard · alerts

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/alerts/` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Tabs**
- Metric
- Log
- Flow
- Trap
- NetRoute
- APM
- Network Config
- Real User Monitoring

**Buttons**
- Reload everything (counts 
- Reload pie · alert overvie
- Reload column · by policy 
- Reload historic · today tr
- ALL parallel

_Locators: see `knowledge/locators/catalog/alerts.json` (raw sweep) — promote verified ones into the cookbook._

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
