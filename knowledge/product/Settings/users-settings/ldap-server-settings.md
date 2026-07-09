---
screen: Users Settings · ldap-server-settings
module: Settings
category: users-settings
route: "/settings/users-settings/ldap-server-settings"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_users_settings_ldap_server_settings.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Users Settings · ldap-server-settings

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/users-settings/ldap-server-settings` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `search` — _Search_ (text)

**Grid columns**
- ip/Host
- fqdn
- LDAP Groups
- Last Sync At
- Sync
- Actions

**Buttons**
- Add LDAP Server

**Button ids**
- `#btn-show-hide-columns`
- `#create-user-btn`
- `#start-rediscovery`

**data-cy hooks**
- `[data-cy='grid-action']`

**data-testid hooks**
- `[data-testid='ldap-grid-container']`
- `[data-testid='ldap-search-input']`
- `[data-testid='ldap-column-selector']`
- `[data-testid='ldap-export-pdf-btn']`
- `[data-testid='ldap-export-csv-btn']`
- `[data-testid='ldap-create-btn']`
- `[data-testid='ldap-sync-trigger']`

_Locators: see `knowledge/locators/catalog/settings_users_settings_ldap_server_settings.json` (raw sweep) — promote verified ones into the cookbook._

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
