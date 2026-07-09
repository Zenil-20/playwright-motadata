---
screen: NCCM Settings · device-template-create
module: Settings
category: nccm-settings
route: "/settings/nccm-settings/device-template/create"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_nccm_settings_device_template_create.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# NCCM Settings · device-template-create

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/nccm-settings/device-template/create` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Device Template Name
- Description
- Vendor
- OS Type
- Delay Time (ms)
- Command
- Timeout (ms)
- Prompt
- Prompt Command

**Inputs**
- `?` — _Vendor_ (text)
- `?` — _Write text here_ (text)
- `?` — _Select_ (text)
- `?` — _Select_ (text)

**Switches / toggles**
1

**Buttons**
- Add Operation
- SCP/SFTP
- TFTP
- No protocol
- OFF
- Select From Catalog
- Reset
- Save

**Button ids**
- `#remove-metric-group`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_nccm_settings_device_template_create.json` (raw sweep) — promote verified ones into the cookbook._

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
