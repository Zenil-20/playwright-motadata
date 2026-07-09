---
screen: Approval · ncm-approval
module: NCCM
route: "/ncm-approval"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/ncm_approval.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Approval · ncm-approval

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/ncm-approval` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `search` — _Search_ (text)

**Grid columns**
- Approvals
- Device Name
- Device Type
- Approver
- Status
- Type
- Requested On
- Actions

**Buttons**
- Filter

**Button ids**
- `#btn-show-hide-columns`
- `#filter-btn`

_Locators: see `knowledge/locators/catalog/ncm_approval.json` (raw sweep) — promote verified ones into the cookbook._

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
