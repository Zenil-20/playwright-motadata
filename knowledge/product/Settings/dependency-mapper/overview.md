---
screen: Ai (section landing)
module: Settings
category: ai
route: "/settings/ai/"
build: 8.2.6
status: draft
sources: [catalog, kb]   # settings_ai.json · customer-issue-kb §8. No matching screenshot.
verified: 2026-07-10
---

# AI — Section Landing

## 1. Purpose
The **landing route for the AI Settings area**. It hosts the correlation/relationship configuration —
primarily the **Dependency Mapper**, which models parent→child monitor relationships that drive
root-cause correlation and alarm suppression.

- **Business objective:** single entry point for the AI/correlation configuration.
- **Screen description:** the section root resolves to its default child. The captured catalog for
  `/settings/ai/` is **identical to Dependency Mapper** (same `#filter-btn`, `role-search`, "Create
  Relationship" button, 39 per-row switches, and the Parent Monitor … Actions columns), so the landing
  appears to render the Dependency Mapper grid. TODO(source: KG/live) — confirm the default child and
  whether other AI sub-screens exist.
- **Primary use cases:** reach Dependency Mapper; manage correlation topology.
- **Who uses it:** monitoring/observability admins.
- **Dependencies:** the AI/correlation module; provisioned monitors and topology data.

## 2. Navigation
```
Settings → (AI) → Dependency Mapper
```
- **URL:** `/settings/ai/`
- **Child:** Dependency Mapper (`…/dependency-mapper`)

## 3. Actions
As captured (Dependency Mapper view): **Create Relationship**, **Filter** (`#filter-btn`), **Search**
(`role-search`), per-row **ON/OFF** toggles, row actions (`[data-cy='grid-action']`).

## 4. Components
Captured content mirrors **Dependency Mapper**:
| Component | Control |
|---|---|
| Search | `input[name='role-search']` |
| Filter | `#filter-btn` |
| Create Relationship | button "Create Relationship" |
| Per-row enable toggle | ant-switch per row (catalog counted 39) |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns:** Parent Monitor · Parent Interface · Child Monitor · Child Interface · Type · Link
Layer · Status · Actions

> Authoritative documentation for these controls lives in `dependency-mapper.md`.

_Locators: see `dependency-mapper.md`._

## 5. Permissions
- AI/correlation administration — admin-level. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in; AI/correlation module enabled; Settings reachable; monitors provisioned.

## 7. Exit Conditions
- Lands on the default AI child (Dependency Mapper per the capture; TODO confirm).

## 8. Validations
- None at landing level (see the child form).

## 9. Business Rules
- AI Settings centralizes dependency/correlation configuration. TODO(source: KG) — confirm full child set.

## 10. Known Bugs
No landing-specific defects recorded. See `dependency-mapper.md` §10 and
`knowledge/known_issues/customer-issue-kb.md` §8 (Topology & Dependency Mapper).

## 11. Edge Cases
- Direct-navigating to `/settings/ai/` — confirm it resolves to a valid child, not a blank page.
- Deep-link vs. SPA routing.
