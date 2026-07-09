---
screen: Trap Explorer · trap-explorer
module: TrapExplorer
route: "/trap-explorer/"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/trap_explorer.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Trap Explorer · trap-explorer

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/trap-explorer/` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `search` — _Search_ (text)

**Grid columns**
- Trap Name
- Trap OID
- Source
- Count
- Message
- Timestamp
- Acknowledged
- Action

**Buttons**
- Live Trap Viewer
- Filter

**Button ids**
- `#btn-show-hide-columns`
- `#filter-btn`

_Locators: see `knowledge/locators/catalog/trap_explorer.json` (raw sweep) — promote verified ones into the cookbook._

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
