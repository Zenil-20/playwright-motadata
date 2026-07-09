---
screen: NCCM
module: NCCM
route: "/nccm/overview"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/nccm_overview.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# NCCM

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/nccm/overview` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _filter by name…_ (text)

**Tabs**
- Overview
- Compliance
- Explorer

**Grid columns**
- Type
- Vendor
- Os Type
- Number of Devices
- Host Name
- IP
- Type
- Vendor
- Last Backup Time
- Device
- Type
- Vendor
- Last Backup Time

_Locators: see `knowledge/locators/catalog/nccm_overview.json` (raw sweep) — promote verified ones into the cookbook._

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
