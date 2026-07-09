---
screen: System Settings · rule-based-tags-list
module: Settings
category: system-settings
route: "/settings/system-settings/rule-based-tags-list"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_system_settings_rule_based_tags_list.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# System Settings · rule-based-tags-list

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/system-settings/rule-based-tags-list` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `?` — _Search_ (text)
- `rule-search` — _Search_ (text)

**Radios / checkboxes**
14 checkbox

**Grid columns**
- Rule Name
- description
- Operation
- Qualified Count
- tag
- Last Ran At
- Actions

**Buttons**
- Create Rule

**Button ids**
- `#btn-create-rule-tag`
- `#start-rediscovery`

**data-cy hooks**
- `[data-cy='grid-action']`

_Locators: see `knowledge/locators/catalog/settings_system_settings_rule_based_tags_list.json` (raw sweep) — promote verified ones into the cookbook._

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
