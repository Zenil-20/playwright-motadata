---
screen: Plugin Library · metrics-create
module: Settings
category: plugin-library
route: "/settings/plugin-library/metrics/create"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_plugin_library_metrics_create.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Plugin Library · metrics-create

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/plugin-library/metrics/create` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Metric Plugin Name
- Description
- Type
- Monitors
- Port
- Timeout
- Credential Profile
- SSH Script
- Script Language
- Parsing Script

**Inputs**
- `metric-name` — _Must be unique_ (text)
- `?` — _Select_ (text)
- `?` — _Select_ (text)
- `port` (text)
- `timeout` (text)
- `?` — _Select_ (text)
- `codemirror`
- `codemirror`

**Radios / checkboxes**
5 radio

**Buttons**
- Create Credential Profile
- Add Variable
- Reset
- Test

**Button ids**
- `#create-credential-btn-id`
- `#reset-btn-id`
- `#test-btn-id`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_plugin_library_metrics_create.json` (raw sweep) — promote verified ones into the cookbook._

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
