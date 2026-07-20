---
screen: Digital Experience Monitoring (section landing)
module: Settings
category: digital-experience-monitoring
route: "/settings/digital-experience-monitoring/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_digital_experience_monitoring.json · "RUM.png" (consumer dashboard, related) · customer-issue-kb (none specific)
verified: 2026-07-10
---

# Digital Experience Monitoring — Section Landing

## 1. Purpose
The **landing route for Digital Experience Monitoring (DEM) Settings**. It hosts the configuration that
feeds the Real User Monitoring module — primarily **RUM Applications**, where front-end apps are
registered so their real end-user telemetry is captured and shown in RUM.

- **Business objective:** single entry point for DEM/RUM configuration.
- **Screen description:** the section root resolves to its default child. The captured catalog for
  `/settings/digital-experience-monitoring/` is **identical to RUM Applications** (same
  `#create-rum-application-btn-id`, `search-rum-application`, column chooser, and the Application Name …
  Tags / Action columns), so the landing appears to render the RUM Applications grid. TODO(source:
  KG/live) — confirm the default child and whether other DEM sub-screens exist.
- **Primary use cases:** reach RUM Applications; manage DEM onboarding.
- **Who uses it:** DEM/observability admins.
- **Dependencies:** DEM/RUM module + license.

## 2. Navigation
```
Settings → Digital Experience Monitoring
```
- **URL:** `/settings/digital-experience-monitoring/`
- **Child:** RUM Applications (`…/rum-applications`)
- **Consumer module:** the top-level **Real User Monitoring** dashboard (`RUM.png`).

## 3. Actions
As captured (RUM Applications view): **Create Application** (`#create-rum-application-btn-id`),
**Search**, **Show/hide columns** (`#btn-show-hide-columns`), row actions (`[data-cy='grid-action']`).

## 4. Components
Captured content mirrors **RUM Applications**:
| Component | Control |
|---|---|
| Search | `input[name='search-rum-application']` |
| Column chooser | `#btn-show-hide-columns` |
| Create Application | `#create-rum-application-btn-id` |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns:** Application Name · Application Type · Version · Environment · Session Sample Rate ·
Privacy · Last Event Received at · Application Status · Tags · Action

> Authoritative documentation for these controls lives in `rum-applications.md`.

_Locators: see `rum-applications.md`._

## 5. Permissions
- DEM/RUM administration — admin-level. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in; DEM/RUM module enabled; Settings reachable.

## 7. Exit Conditions
- Lands on the default DEM child (RUM Applications per the capture; TODO confirm).

## 8. Validations
- None at landing level (see the child form).

## 9. Business Rules
- DEM Settings centralizes RUM application registration. TODO(source: KG) — confirm full child set.

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`. See `rum-applications.md`
§10. Do not invent bugs.

## 11. Edge Cases
- Direct-navigating to `/settings/digital-experience-monitoring/` — confirm it resolves to a valid
  child, not a blank page.
- Deep-link vs. SPA routing.
