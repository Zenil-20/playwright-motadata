---
screen: Column Mappers · column-mappers
module: Dashboards
route: "/dashboard/column-mappers"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/dashboard_column_mappers.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Column Mappers · column-mappers

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/dashboard/column-mappers` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)

**Radios / checkboxes**
1 radio

**Grid columns**
- Key
- mapper.plugin.ids
- mapper.status
- mapper.data.categories
- mapper.instance
- mapper.plugin.name
- Plugin ID → Name
- Actions

**Button ids**
- `#btn-show-hide-columns`
- `#btn-filter-mappers`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/dashboard_column_mappers.json` (raw sweep) — promote verified ones into the cookbook._

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
