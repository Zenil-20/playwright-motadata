---
screen: NCCM Settings · device-template
module: Settings
category: nccm-settings
route: "/settings/nccm-settings/device-template"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_nccm_settings_device_template.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# NCCM Settings · device-template

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/nccm-settings/device-template` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `search` — _Search_ (text)

**Radios / checkboxes**
86 checkbox

**Grid columns**
- Template
- Vendor
- OS Type
- Devices
- Actions

**Buttons**
- Create Template
- Filter

**Button ids**
- `#filter-btn`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_nccm_settings_device_template.json` (raw sweep) — promote verified ones into the cookbook._

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
