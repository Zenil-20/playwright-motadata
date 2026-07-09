---
screen: System Settings · sms-server-settings
module: Settings
category: system-settings
route: "/settings/system-settings/sms-server-settings"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_system_settings_sms_server_settings.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# System Settings · sms-server-settings

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/system-settings/sms-server-settings` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- SMS Gateway URL
- Use Proxy Server

**Inputs**
- `?` — _Search_ (text)
- `sms-gateway-url` (text)

**Switches / toggles**
1

**Buttons**
- OFF
- Reset
- Test
- Save SMS Server Settings

**Button ids**
- `#auto-sync-id`
- `#reset-btn`
- `#test-btn`
- `#save-btn`

_Locators: see `knowledge/locators/catalog/settings_system_settings_sms_server_settings.json` (raw sweep) — promote verified ones into the cookbook._

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
