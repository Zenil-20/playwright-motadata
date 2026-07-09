---
screen: SNMP Walk · snmp-walk
module: Settings
category: utility
route: "/settings/utility/snmp-walk"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_utility_snmp_walk.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# SNMP Walk · snmp-walk

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/utility/snmp-walk` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- IP Address/Host Name
- Credential Profile
- OID
- Timeout

**Inputs**
- `?` — _Search_ (text)
- `?` — _172.31.11.52_ (text)
- `?` — _Select_ (text)
- `?` — _1.3.6.1.2.1_ (text)

**Buttons**
- Create Credential Profile
- Reset
- Test

**Button ids**
- `#create-credential-btn-id`
- `#utility-snmp-walk-reset-btn`
- `#utility-snmp-walk-run-btn`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_utility_snmp_walk.json` (raw sweep) — promote verified ones into the cookbook._

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
