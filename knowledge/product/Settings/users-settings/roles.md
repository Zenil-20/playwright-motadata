---
screen: Users Settings · roles
module: Settings
category: users-settings
route: "/settings/users-settings/roles"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_users_settings_roles.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Users Settings · roles

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/users-settings/roles` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `role-search` — _Search_ (text)

**Grid columns**
- Role Name
- Description
- Used Count
- Actions

**Buttons**
- Create Role

**Button ids**
- `#create-role-btn`

**data-testid hooks**
- `[data-testid='roles-search-input']`
- `[data-testid='roles-export-pdf-btn']`
- `[data-testid='roles-export-csv-btn']`
- `[data-testid='roles-create-btn']`

_Locators: see `knowledge/locators/catalog/settings_users_settings_roles.json` (raw sweep) — promote verified ones into the cookbook._

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
