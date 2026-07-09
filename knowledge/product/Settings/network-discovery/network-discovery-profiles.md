---
screen: Discovery · network-discovery-profiles
module: Settings
category: network-discovery
route: "/settings/network-discovery/network-discovery-profiles"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_network_discovery_network_discovery_profiles.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Discovery · network-discovery-profiles

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/network-discovery/network-discovery-profiles` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `discovery-search` — _Search_ (text)

**Grid columns**
- Discovery Profile Name
- IP/Host/IP Range/CIDR/CSV
- Type
- Discovered Objects
- Status
- Scheduler
- Actions

**Buttons**
- Create Discovery Profile

**Button ids**
- `#btn-show-hide-columns`
- `#create-network-discovery-profile-btn`

**data-cy hooks**
- `[data-cy='rerun']`
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_network_discovery_network_discovery_profiles.json` (raw sweep) — promote verified ones into the cookbook._

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
