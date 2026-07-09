---
screen: All · inventory
module: Monitors
route: "/inventory/"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/inventory.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# All · inventory

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/inventory/` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `search-snmp-device-catalog` — _Search_ (text)

**Tabs**
- Inventory
- Network
- SDN
- Server & Apps
- Storage
- Virtualization
- HCI
- Database
- Container Orchestration
- Cloud
- Interface
- WAN Link
- Process
- Container
- Service
- Service Check

**Grid columns**
- Monitor
- IP
- Type
- Group
- Collector IP
- Host
- Tags
- Active Alerts
- status

**Buttons**
- Filter

**Button ids**
- `#btn-show-hide-columns`
- `#btn-tag-inventory`
- `#btn-filter-agent`

_Locators: see `knowledge/locators/catalog/inventory.json` (raw sweep) — promote verified ones into the cookbook._

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
