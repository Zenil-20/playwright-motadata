---
screen: Integration · integration-profile
module: Settings
category: integration
route: "/settings/integration/integration-profile"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_integration_integration_profile.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Integration · integration-profile

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/integration/integration-profile` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `?` — _Search_ (text)

**Radios / checkboxes**
12 checkbox

**Grid columns**
- Profile Name
- Description
- Integration Type
- Used Count
- Actions

**Buttons**
- Create Integration Profile
- Filter

**Button ids**
- `#btn-show-hide-columns`
- `#filter-btn`
- `#create-user-btn`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_integration_integration_profile.json` (raw sweep) — promote verified ones into the cookbook._

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
