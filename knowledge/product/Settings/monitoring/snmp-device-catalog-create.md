---
screen: Monitoring · snmp-device-catalog-create
module: Settings
category: monitoring
route: "/settings/monitoring/snmp-device-catalog/create"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_monitoring_snmp_device_catalog_create.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Monitoring · snmp-device-catalog-create

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/monitoring/snmp-device-catalog/create` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- System OID
- Name
- Vendor
- Type
- Metric Group Name

**Inputs**
- `system-oid` — _e.g. .1.3.6.1.4.1.47387_ (text)
- `catalog-name` — _Name_ (text)
- `?` — _Select_ (text)
- `?` — _Select_ (text)
- `metric-group-name` — _Must be unique within the catalog_ (text)
- `counter-name` — _e.g. system.cpu.percent_ (text)
- `oid` — _e.g. 1.3.6.1.4.1.116.5.11.4.1.1.5_ (text)

**Radios / checkboxes**
2 radio

**Buttons**
- Test OID Group
- Choose OID
- Assign Key-Value
- Add Metric Group
- Reset
- Create SNMP Device Catalog

**Button ids**
- `#btn-test-oid`
- `#remove-metric-group`
- `#add-new-metric-group`
- `#reset-btn`
- `#create-snmp-device-catalog-btn`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_monitoring_snmp_device_catalog_create.json` (raw sweep) — promote verified ones into the cookbook._

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
