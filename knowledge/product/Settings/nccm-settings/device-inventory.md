---
screen: NCCM Settings · device-inventory
module: Settings
category: nccm-settings
route: "/settings/nccm-settings/device-inventory"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_nccm_settings_device_inventory.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# NCCM Settings · device-inventory

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/nccm-settings/device-inventory` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `search` — _Search_ (text)

**Switches / toggles**
50

**Radios / checkboxes**
102 checkbox

**Grid columns**
- Device
- IP/Host
- System OID
- Vendor
- Template
- Manage NCCM Status
- Credential Status
- Scheduler
- Type
- Actions

**Buttons**
- Filter
- OFF
- ON
- Failed

**Button ids**
- `#btn-show-hide-columns`
- `#btn-tag-inventory`
- `#filter-btn`
- `#true`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_nccm_settings_device_inventory.json` (raw sweep) — promote verified ones into the cookbook._

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
