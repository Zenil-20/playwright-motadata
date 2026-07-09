---
screen: NCCM · compliance
module: NCCM
route: "/nccm/compliance"
build: 8.2.6
status: generated
sources: [catalog]            # knowledge/locators/catalog/nccm_compliance.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-02
---

# NCCM · compliance

## Purpose
TODO(source: Motadata KG/docs) — what this screen is for.

## Navigation
Route: `/nccm/compliance` (open the full URL; SPA routing must load the page).

## Actions
TODO(source: KG/docs) — the actions available here. Derive from the buttons/controls below.

## Components
**Inputs**
- `search` — _Search_ (text)

**Tabs**
- Overview
- Compliance
- Explorer

**Grid columns**
- Compliance Policy
- Compliance Score
- Device Severity
- Used Count
- Benchmark
- Last Scan At

_Locators: see `knowledge/locators/catalog/nccm_compliance.json` (raw sweep) — promote verified ones into the cookbook._

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
