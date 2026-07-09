---
screen: Integration · slack
module: Settings
category: integration
route: "/settings/integration/slack"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_integration_slack.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Integration · slack

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/integration/slack` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Application Name
- Credential Profile
- Auto Sync
- Sync Every
- Use Proxy Server

**Inputs**
- `?` — _Search_ (text)
- `?` — _observeops-app-manifest_ (text)
- `?` — _Select_ (text)
- `?` — _Select_ (text)

**Switches / toggles**
2

**Buttons**
- Generate Manifest
- Create Credential Profile
- ON
- OFF
- Reset
- Save

**Button ids**
- `#generate-manifest-btn`
- `#create-credential-btn-id`
- `#auto-sync-id`
- `#proxy-server-id`
- `#reset-btn`
- `#configure-btn`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_integration_slack.json` (raw sweep) — promote verified ones into the cookbook._

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
