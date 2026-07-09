---
screen: System Settings · motadata-collector
module: Settings
category: system-settings
route: "/settings/system-settings/motadata-collector"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_system_settings_motadata_collector.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# System Settings · motadata-collector

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/system-settings/motadata-collector` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `search-rpe` — _Search_ (text)

**Grid columns**
- Hostname
- Type
- Deployment
- IP
- State
- Used Count
- Duration
- Actions

**Button ids**
- `#btn-show-hide-columns`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_system_settings_motadata_collector.json` (raw sweep) — promote verified ones into the cookbook._

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
