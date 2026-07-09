---
screen: Flow Explorer · analytics
module: Flow
route: "/flow/analytics"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/flow_analytics.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Flow Explorer · analytics

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/flow/analytics` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `search-flow-analytics-kpi` — _Search_ (text)

**Tabs**
- Dashboard
- Flow Analytics
- Explorer

**data-testid hooks**
- `[data-testid='flow-top-tab-bar']`
- `[data-testid='flow-analytics-kpi-search-input']`
- `[data-testid='flow-analytics-switch-to-grid']`
- `[data-testid='flow-analytics-card']`

_Locators: see `knowledge/locators/catalog/flow_analytics.json` (raw sweep) — promote verified ones into the cookbook._

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
