---
screen: Plugin Library · topology-plugins-create
module: Settings
category: plugin-library
route: "/settings/plugin-library/topology-plugins/create"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_plugin_library_topology_plugins_create.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Plugin Library · topology-plugins-create

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/plugin-library/topology-plugins/create` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Name
- Vendor
- Make & Model
- Monitor
- Layer Protocol
- Protocol Type
- Script Language
- Timeout
- Parser Script

**Inputs**
- `topology-name` — _Enter Name_ (text)
- `?` — _Select Vendor_ (text)
- `?` — _Select Make & Model_ (text)
- `?` — _Select_ (text)
- `counter-name` — _e.g. CPU (%)_ (text)
- `oid` — _e.g. 1.3.6.1.4.1.9.2.1.58.0_ (text)
- `timeout` (text)
- `codemirror`

**Radios / checkboxes**
12 radio

**Buttons**
- Choose OID
- Add OID Group
- Add Variable
- Reset
- Test
- Create Topology Plugin

**Button ids**
- `#remove-metric-group`
- `#add-new-metric-group`
- `#reset-btn-id`
- `#test-btn-id`
- `#submit-btn-id`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_plugin_library_topology_plugins_create.json` (raw sweep) — promote verified ones into the cookbook._

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
