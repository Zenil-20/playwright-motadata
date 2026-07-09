---
screen: Compliance Settings · rules
module: Settings
category: compliance-settings
route: "/settings/compliance-settings/rules"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_compliance_settings_rules.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Compliance Settings · rules

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/compliance-settings/rules` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `rule-search` — _Search_ (text)

**Grid columns**
- Rule
- description
- tag
- Rule Type
- Actions

**Buttons**
- Create Rule

**Button ids**
- `#btn-create-rule`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_compliance_settings_rules.json` (raw sweep) — promote verified ones into the cookbook._

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
