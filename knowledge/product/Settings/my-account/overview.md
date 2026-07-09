---
screen: My Profile
module: Settings
category: my-account
route: "/settings/my-account/"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_my_account.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# My Profile

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/my-account/` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- First Name
- Last Name
- User Name
- Email Address
- Mobile Number
- Change Password

**Inputs**
- `?` — _Search_ (text)
- `first-name` (text)
- `last-name` (text)
- `user-name` — _Must be unique_ (text)
- `email-address` (text)
- `phone-number` (text)

**Switches / toggles**
1

**Buttons**
- OFF
- Reset
- Update My Profile

**Button ids**
- `#change-password-switch`
- `#btn-cancel-my-profile`
- `#btn-save-my-profile`

_Locators: see `knowledge/locators/catalog/settings_my_account.json` (raw sweep) — promote verified ones into the cookbook._

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
