---
screen: Users Settings · personal-access-token
module: Settings
category: users-settings
route: "/settings/users-settings/personal-access-token"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_users_settings_personal_access_token.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Users Settings · personal-access-token

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/users-settings/personal-access-token` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `access-token-search` — _Search_ (text)

**Grid columns**
- Name
- Description
- User Name
- Validity
- Actions

**Buttons**
- Create Token

**Button ids**
- `#create-access-token-btn`

**data-testid hooks**
- `[data-testid='pat-search-input']`
- `[data-testid='pat-export-pdf-btn']`
- `[data-testid='pat-export-csv-btn']`
- `[data-testid='pat-create-btn']`

_Locators: see `knowledge/locators/catalog/settings_users_settings_personal_access_token.json` (raw sweep) — promote verified ones into the cookbook._

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
