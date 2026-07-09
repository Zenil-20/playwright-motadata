---
screen: Discovery · network-discovery-profiles-create
module: Settings
category: network-discovery
route: "/settings/network-discovery/network-discovery-profiles/create"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_network_discovery_network_discovery_profiles_create.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Discovery · network-discovery-profiles-create

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/network-discovery/network-discovery-profiles/create` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Discovery Profile Name
- IP/Host
- Collector Type
- Collectors
- Groups
- Credential Profiles
- Tags
- Port
- Ping Check
- Notify

**Inputs**
- `?` — _Search_ (text)
- `profile-name` — _Must be unique_ (text)
- `ip-address` — _e.g. 192.168.1.1 or fd00::1_ (text)
- `?` — _Select_ (text)
- `?` — _Select_ (text)
- `?` — _Select_ (text)
- `?` — _Select_ (text)
- `port`
- `?` — _@User or Email or /Handle or #User Profi_ (text)
- `?` — _Select_ (text)

**Selects (dropdowns)**
1 on the screen

**Switches / toggles**
1

**Radios / checkboxes**
4 radio

**Buttons**
- Create Credential Profile
- ON
- Save and Exit
- Save and Schedule
- Reset
- Save and Run

**Button ids**
- `#create-credential-btn-id`
- `#ping-check-btn`
- `#save-exit-btn-id`
- `#save-schedule-btn-id`
- `#reset-btn-id`
- `#save-run-btn-id`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_network_discovery_network_discovery_profiles_create.json` (raw sweep) — promote verified ones into the cookbook._

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
