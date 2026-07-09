---
screen: Flow · flow-settings
module: Settings
category: flow-settings
route: "/settings/flow-settings/flow-settings"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_flow_settings_flow_settings.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Flow · flow-settings

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/flow-settings/flow-settings` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- sFlow Port
- Netflow Port
- Aggregation Time (Min)
- sFlow v5 Traffic Direction
- BGP Port Enable

**Inputs**
- `?` — _Search_ (text)
- `port`
- `port`

**Switches / toggles**
1

**Radios / checkboxes**
2 radio

**Buttons**
- OFF
- Update Flow Settings

**Button ids**
- `#smtp-server-requires-authentication-btn-`
- `#btn-save-my-profile`

_Locators: see `knowledge/locators/catalog/settings_flow_settings_flow_settings.json` (raw sweep) — promote verified ones into the cookbook._

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
