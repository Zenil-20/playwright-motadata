---
screen: Users Settings
module: Settings
category: users-settings
route: "/settings/users-settings/"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_users_settings.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Users Settings

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/users-settings/` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `search` — _Search_ (text)

**Switches / toggles**
22

**Grid columns**
- User Name
- First Name
- Last Name
- Mobile Number
- Role
- Type
- Groups
- User Profile
- Status
- Email
- Actions

**Buttons**
- Create User
- ON

**Button ids**
- `#btn-show-hide-columns`
- `#create-user-btn`
- `#1234`
- `#2345`
- `#abhishek`
- `#admin`
- `#anant`
- `#ansh`
- `#bhavya`
- `#chaitas`
- `#chandresh`
- `#chandu`
- `#deven`
- `#gaurang`
- `#Manish`
- `#nandini-shah-ldap`
- `#ronak`
- `#rum1`
- `#rum9`
- `#user1`
- `#zenil`
- `#zenil.local.20260630134427`
- `#zenil20`
- `#zenilrad`

**data-cy hooks**
- `[data-cy='grid-action']`

**data-testid hooks**
- `[data-testid='users-search-input']`
- `[data-testid='users-export-pdf-btn']`
- `[data-testid='users-export-csv-btn']`
- `[data-testid='users-create-btn']`

_Locators: see `knowledge/locators/catalog/settings_users_settings.json` (raw sweep) — promote verified ones into the cookbook._

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
