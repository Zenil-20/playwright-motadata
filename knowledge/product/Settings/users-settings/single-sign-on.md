---
screen: Users Settings · single-sign-on
module: Settings
category: users-settings
route: "/settings/users-settings/single-sign-on"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_users_settings_single_sign_on.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Users Settings · single-sign-on

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/users-settings/single-sign-on` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Service Provider Entity ID
- Redirect URL
- Service Provider Login URL
- Service Provider Logout URL
- Identity Provider
- Identify Provider Configuratio
- Identity Provider Metadata Fil
- Enable User Import

**Inputs**
- `?` — _Search_ (text)
- `?` — _Select_ (text)

**Switches / toggles**
1

**Radios / checkboxes**
2 radio

**Buttons**
- OFF
- Reset
- Save

**Button ids**
- `#reset-btn`
- `#configure-btn`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_users_settings_single_sign_on.json` (raw sweep) — promote verified ones into the cookbook._

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
