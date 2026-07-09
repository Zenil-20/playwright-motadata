---
screen: Users Settings · password-settings
module: Settings
category: users-settings
route: "/settings/users-settings/password-settings"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_users_settings_password_settings.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Users Settings · password-settings

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/users-settings/password-settings` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `psw-length` — _6-15 characters_ (text)

**Switches / toggles**
5

**Buttons**
- ON
- Reset to default
- Save Password Settings

**Button ids**
- `#password-expiry`
- `#password-uppercase`
- `#password-lowercase`
- `#password-number`
- `#psw-special-char`
- `#default`
- `#save`

_Locators: see `knowledge/locators/catalog/settings_users_settings_password_settings.json` (raw sweep) — promote verified ones into the cookbook._

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
