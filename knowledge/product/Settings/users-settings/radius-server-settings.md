---
screen: Users Settings · radius-server-settings
module: Settings
category: users-settings
route: "/settings/users-settings/radius-server-settings"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_users_settings_radius_server_settings.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Users Settings · radius-server-settings

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/users-settings/radius-server-settings` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Server IP
- Authentication Port
- Server Secret
- Protocol

**Inputs**
- `?` — _Search_ (text)
- `server-ip` — _e.g. 172.16.18.11_ (text)
- `authentication-port` (text)
- `server-secret` (text)
- `?` — _Select_ (text)

**Buttons**
- Reset
- Save Radius Server

**Button ids**
- `#reset-btn`
- `#save-radius-server-btn`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_users_settings_radius_server_settings.json` (raw sweep) — promote verified ones into the cookbook._

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
