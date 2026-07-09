---
screen: Integration · atlassian-jira
module: Settings
category: integration
route: "/settings/integration/atlassian-jira"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/settings_integration_atlassian_jira.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# Integration · atlassian-jira

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/settings/integration/atlassian-jira` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Form fields (labels)**
- Server URL
- URL Time Out
- Credential Profiles
- Fail Over Email
- If alert re-occurs
- Auto Sync
- Sync Every
- Use Proxy Server

**Inputs**
- `?` — _Search_ (text)
- `?` — _Select_ (text)
- `?` — _ _ (text)
- `?` — _Schedule Every_ (text)

**Switches / toggles**
2

**Radios / checkboxes**
2 radio

**Buttons**
- Create Credential Profile
- ON
- Reset
- Test
- Save

**Button ids**
- `#create-credential-btn-id`
- `#auto-sync-id`
- `#reset-btn`
- `#test-btn`
- `#configure-btn`

**data-cy hooks**
- `[data-cy='dropdown-trigger-input']`

_Locators: see `knowledge/locators/catalog/settings_integration_atlassian_jira.json` (raw sweep) — promote verified ones into the cookbook._

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
