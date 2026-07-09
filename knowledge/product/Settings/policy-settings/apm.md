---
screen: Policy Settings · apm
module: Settings
category: policy-settings
route: "/settings/policy-settings/apm"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_policy_settings_apm.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Policy Settings · apm

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/policy-settings/apm` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `search` — _Search_ (text)

**Switches / toggles**
7

**Grid columns**
- Policy Name
- Used Count
- Apm Policy Type
- Tag
- Severity
- Threshold Value
- Status
- Action

**Buttons**
- Create Policy
- Filter
- ON

**Button ids**
- `#btn-show-hide-columns`
- `#filter-btn`
- `#create-policy-btn`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_policy_settings_apm.json` (raw sweep) — promote verified ones into the cookbook._

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
