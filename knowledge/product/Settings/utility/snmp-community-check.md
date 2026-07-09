---
screen: SNMP Community Check · snmp-community-check
module: Settings
category: utility
route: "/settings/utility/snmp-community-check"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_utility_snmp_community_check.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# SNMP Community Check · snmp-community-check

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/utility/snmp-community-check` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- IP Address/Host Name
- Credential Profile
- Timeout
- SNMP Retries

**Inputs**
- `?` — _Search_ (text)
- `?` — _192.16.14.10_ (text)
- `?` — _Select_ (text)

**Radios / checkboxes**
2 radio

**Buttons**
- Create Credential Profile
- Reset
- Test

**Button ids**
- `#create-credential-btn-id`
- `#utility-snmp-community-check-reset-btn`
- `#utility-snmp-community-check-test-btn`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_utility_snmp_community_check.json` (raw sweep) — promote verified ones into the cookbook._

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
