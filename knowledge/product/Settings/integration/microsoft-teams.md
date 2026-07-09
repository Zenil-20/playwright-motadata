---
screen: Integration · microsoft-teams
module: Settings
category: integration
route: "/settings/integration/microsoft-teams"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_integration_microsoft_teams.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Integration · microsoft-teams

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/integration/microsoft-teams` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Credential Profiles
- Time Out
- Auto Sync
- Sync Every

**Inputs**
- `?` — _Search_ (text)
- `?` — _Select_ (text)
- `?` — _Schedule Every_ (text)

**Switches / toggles**
1

**Buttons**
- Create Credential Profile
- ON
- Reset
- Save

**Button ids**
- `#create-credential-btn-id`
- `#auto-sync-id`
- `#reset-btn`
- `#configure-btn`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_integration_microsoft_teams.json` (raw sweep) — promote verified ones into the cookbook._

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
