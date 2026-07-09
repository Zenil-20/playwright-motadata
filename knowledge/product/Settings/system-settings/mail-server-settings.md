---
screen: System Settings · mail-server-settings
module: Settings
category: system-settings
route: "/settings/system-settings/mail-server-settings"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_system_settings_mail_server_settings.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# System Settings · mail-server-settings

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/system-settings/mail-server-settings` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- SMTP Server
- Use Proxy Server
- Security Type
- SMTP Server Port
- Authentication Type
- From Email
- Authentication Requires

**Inputs**
- `?` — _Search_ (text)
- `smtp-server` — _e.g. smtp.google.com_ (text)
- `smtp-server-port` (text)
- `email` — _Valid email address_ (text)

**Switches / toggles**
2

**Radios / checkboxes**
5 radio

**Buttons**
- OFF
- Reset
- Test
- Save Mail Server Settings

**Button ids**
- `#auto-sync-id`
- `#smtp-server-requires-authentication-btn-`
- `#reset-btn`
- `#test-btn`
- `#configure-btn`

_Locators: see `knowledge/locators/catalog/settings_system_settings_mail_server_settings.json` (raw sweep) — promote verified ones into the cookbook._

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
