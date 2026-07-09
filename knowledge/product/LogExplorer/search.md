---
screen: Log Search · search
module: LogExplorer
route: "/log/search"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/log_search.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Log Search · search

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/log/search` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `search` — _Search_ (text)
- `search` — _Search_ (text)

**Radios / checkboxes**
7 radio · 2 checkbox

**Tabs**
- Overview
- Log Search
- Type
- Group
- Event Log
- Log Pattern

**Buttons**
- Save Query
- Execute
- Save as Report

**Button ids**
- `#btn-show-hide-columns`

_Locators: see `knowledge/locators/catalog/log_search.json` (raw sweep) — promote verified ones into the cookbook._

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
