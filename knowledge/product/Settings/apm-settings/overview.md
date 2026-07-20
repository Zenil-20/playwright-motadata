---
screen: APM Settings (section landing)
module: Settings
category: apm-settings
route: "/settings/apm-settings/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_apm_settings.json · "APM.png" (consumer APM dashboard, related) · customer-issue-kb §12
verified: 2026-07-10
---

# APM Settings — Section Landing

## 1. Purpose
The **landing route for APM Settings**. It hosts the configuration that feeds the APM (Application
Performance Monitoring) module — primarily **Application Registration**, where instrumented services are
registered so their distributed traces are attributed and shown in APM.

- **Business objective:** single entry point for APM configuration.
- **Screen description:** the section root resolves to its default child. The captured catalog for
  `/settings/apm-settings/` is **identical to Application Registration** (same
  `#create-application-registration-btn-id`, `search-application-registration`, and the Services Name /
  Type / IP / Language / Status / Service Attributes / Last Received Trace / Actions columns), so the
  landing appears to render the Application Registration grid. TODO(source: KG/live) — confirm the
  default child and whether other APM-settings sub-screens exist.
- **Primary use cases:** reach Application Registration; manage APM onboarding.
- **Who uses it:** APM/observability admins.
- **Dependencies:** APM/tracing module + license.

## 2. Navigation
```
Settings → APM Settings
```
- **URL:** `/settings/apm-settings/`
- **Child:** Application Registration (`…/application-registration`)
- **Consumer module:** the top-level **APM** dashboard (`APM.png`).

## 3. Actions
As captured (Application Registration view): **Application Registration**
(`#create-application-registration-btn-id`), **Search**, row actions (`[data-cy='grid-action']`).

## 4. Components
Captured content mirrors **Application Registration**:
| Component | Control |
|---|---|
| Search | `input[name='search-application-registration']` |
| Application Registration | `#create-application-registration-btn-id` |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns:** Services Name · Type · IP · Language · Status · Service Attributes · Last Received
Trace · Actions

> Authoritative documentation for these controls lives in `application-registration.md`.

_Locators: see `application-registration.md`._

## 5. Permissions
- APM administration — admin-level. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in; APM module enabled; Settings reachable.

## 7. Exit Conditions
- Lands on the default APM-Settings child (Application Registration per the capture; TODO confirm).

## 8. Validations
- None at landing level (see the child form).

## 9. Business Rules
- APM Settings centralizes service registration for tracing. TODO(source: KG) — confirm full child set.

## 10. Known Bugs
No landing-specific defects recorded. See `application-registration.md` §10 and
`knowledge/known_issues/customer-issue-kb.md` §12 (APM licensing-count confusion, PQD-36926).

## 11. Edge Cases
- Direct-navigating to `/settings/apm-settings/` — confirm it resolves to a valid child, not a blank page.
- Deep-link vs. SPA routing.
