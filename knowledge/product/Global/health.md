---
screen: Health · health
module: Global
route: "/health/"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/health.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Health · health

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/health/` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Motadata Application

**Inputs**
- `?` — _Select_ (text)
- `search-rpe` — _Search_ (text)
- `search` — _Search_ (text)
- `?` — _filter by name…_ (text)

**Tabs**
- Health Overview
- Application
- Database
- Live Session
- Alert
- Upgrade
- Restore

**Grid columns**
- Server
- IP
- Type
- Deployment
- Duration
- State
- Datastore
- Pending Events
- Queued Events
- Finished Events
- Engine Type
- Pending Events
- Queued Events
- Finished Events
- Dropped Events
- Engine Type
- Pending Events
- Dropped Events

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/health.json` (raw sweep) — promote verified ones into the cookbook._

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
