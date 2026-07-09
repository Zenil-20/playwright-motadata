---
screen: Monitoring · snmp-device-catalog
module: Settings
category: monitoring
route: "/settings/monitoring/snmp-device-catalog"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_monitoring_snmp_device_catalog.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Monitoring · snmp-device-catalog

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/monitoring/snmp-device-catalog` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `search-snmp-device-catalog` — _Search_ (text)

**Grid columns**
- SNMP Device Catalog Name
- Vendor
- Type
- Used Count
- System OID
- Created By
- Actions

**Buttons**
- Create SNMP Device Catalog
- Filter

**Button ids**
- `#show-filter`
- `#btn-create-snmp-device-catalog`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_monitoring_snmp_device_catalog.json` (raw sweep) — promote verified ones into the cookbook._

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
