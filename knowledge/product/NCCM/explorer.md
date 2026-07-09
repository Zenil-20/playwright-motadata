---
screen: NCCM · explorer
module: NCCM
route: "/nccm/explorer"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/nccm_explorer.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# NCCM · explorer

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/nccm/explorer` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `search` — _Search_ (text)

**Radios / checkboxes**
40 checkbox

**Tabs**
- Overview
- Compliance
- Explorer

**Grid columns**
- Device
- IP
- Current Version
- Config Conflict
- Last Performed Action
- Last Backup Status
- Last Firmware Upgrade Stat
- Last Backup Time
- Last Action Time
- Current Firmware
- Latest Firmware
- Baseline Version
- Actions

**Buttons**
- Compare
- Backup Successful
- Conflict Detected
- Backup Failed

**Button ids**
- `#btn-show-hide-columns`
- `#btn-tag-inventory`
- `#compare-btn`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/nccm_explorer.json` (raw sweep) — promote verified ones into the cookbook._

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
