---
screen: Flow Explorer · explorer
module: Flow
route: "/flow/explorer"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/flow_explorer.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Flow Explorer · explorer

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/flow/explorer` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Counter
- Aggregation
- Flow Source
- Result by

**Inputs**
- `?` — _Select_ (text)
- `?` — _Select_ (text)
- `?` — _ _ (text)
- `?` — _Select_ (text)

**Radios / checkboxes**
7 radio

**Tabs**
- Dashboard
- Flow Analytics
- Explorer

**Buttons**
- Save as Widget

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

**data-testid hooks**
- `[data-testid='flow-top-tab-bar']`

_Locators: see `knowledge/locators/catalog/flow_explorer.json` (raw sweep) — promote verified ones into the cookbook._

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
