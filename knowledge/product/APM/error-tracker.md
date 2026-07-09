---
screen: Apm · error-tracker
module: APM
route: "/apm/error-tracker"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/apm_error_tracker.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Apm · error-tracker

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/apm/error-tracker` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `search` — _Search_ (text)
- `?` — _filter by name…_ (text)

**Tabs**
- Services
- Explorer
- Error Tracker
- Compare

**Grid columns**
- Issue / Exception Name
- Language
- Services Name
- Category
- Status Code
- Occurrences
- Last Seen

**Button ids**
- `#btn-show-hide-columns`

_Locators: see `knowledge/locators/catalog/apm_error_tracker.json` (raw sweep) — promote verified ones into the cookbook._

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
