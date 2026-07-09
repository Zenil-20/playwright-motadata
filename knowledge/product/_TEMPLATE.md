---
screen: <Canonical Screen Name>          # MUST match the key used by cases + locator cookbook
module: <Module>                          # Dashboards | Global | Alerts | Settings | ...
url: <route or "direct URL">
build: <e.g. 8.2.5>                       # the AIOps build this was verified against
status: verified | draft | todo
sources: [ui-image, cookbook, spec, kg, docs]   # provenance — where each fact came from
verified: <YYYY-MM-DD>
---

# <Screen Name>

> Screen knowledge for the RAG corpus. Consumed by the retriever → context-builder →
> testcase-generator so generation is grounded, not hallucinated. Keep facts CITED; mark
> anything unverified `TODO(source: …)` rather than guessing.

## Purpose
What the screen is for, in one or two sentences.

## Navigation
How a user reaches it (nav path, URL, entry buttons).

## Actions
The things a user can DO here (verb list). These map to reusable flows / test steps.

## Components
The UI controls present (grouped). Locators live in `knowledge/locators/selector-cookbook.md`
under the matching screen key — reference, don't duplicate, them here.

## Permissions
Roles/RBAC that can view/act on this screen.

## Entry Conditions
State that must hold before the screen is usable (logged in, data seeded, feature enabled).

## Exit Conditions
Where the user lands on success / cancel; what state changes.

## Validations
Field/input validations and inline errors the UI enforces.

## Business Rules
Product rules that govern behavior (uniqueness, defaults, dependencies, limits).

## Known Bugs
Documented defects (link the ticket). Empty is fine — never invent.

## Edge Cases
Boundary/negative/timing conditions worth testing.
