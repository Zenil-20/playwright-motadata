---
screen: Setup · metric
module: Setup
route: "/setup/metric"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/setup_metric.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Setup · metric

## 1. Purpose
The **Metric ingestion** step of the first-run onboarding wizard — where the admin configures (or
skips) metric collection / device discovery during initial setup. It is the metric-focused sibling of
the flow and log setup steps.

- **Business objective:** get metric data / monitored devices flowing into ObserveOps as part of
  guided setup.
- **Screen description:** a wizard step (catalog title _"Motadata ObserveOps | Setup"_). The router
  sweep captured **no controls** — the step's fields/buttons render conditionally on interaction, so
  its exact contents are **unconfirmed** from the catalog. By analogy with the flow/log steps it likely
  offers a Skip and a Next/Finish action. TODO(source: KG/docs) — confirm live.
- **Primary use cases:** configure metric ingestion and finish setup, or skip and finish.
- **Who uses it:** the administrator running first-run setup.
- **Dependencies:** an authenticated session; an in-progress setup wizard (reached via `/setup/`).

## 2. Navigation
```
/setup/log  →  Next  →  /setup/metric  →  (Finish/Next)  →  product
```
- **URL:** `/setup/metric` (open the full URL; SPA routing must load the page).
- **Wizard siblings:** `/setup/` (start) · `/setup/flow` · `/setup/log`
- **Position:** appears to be the final ingestion step of the setup wizard. TODO(source: KG/docs) —
  confirm the step order and the exit action's label (Next vs Finish/Done).

## 3. Actions
TODO(source: KG/docs) — no controls captured in the sweep. Expected but **unconfirmed** (by analogy
with flow/log steps): **Skip Metric Ingestion** and **Next/Finish**, plus metric-config fields. Do not
assume these exist until verified live.

## 4. Components
_No controls captured in the sweep (page may lazy-render on interaction)._ Treat the component set as
**unknown**, not empty — unlike the flow/log steps, even the Skip/Next buttons were not captured here.

_Locators: see `knowledge/locators/catalog/setup_metric.json` (raw sweep) — nothing to promote yet;
harvest live via the explorer skill when this screen is automated._

## 5. Permissions
- Part of the **admin** first-run setup flow.
- TODO(source: KG/docs) — confirm role gating.

## 6. Entry Conditions
- User is logged in and inside the setup wizard (arrived from `/setup/log`).
- TODO(source: docs) — whether reaching `/setup/metric` directly (outside the wizard) is supported.

## 7. Exit Conditions
- Completing/skipping this step exits the wizard into the product (dashboard/landing) and marks setup
  complete. TODO(source: docs) — confirm the exit action, destination, and that setup won't reappear.

## 8. Validations
TODO(source: docs) — unknown; no fields captured. Any metric-config validations must be confirmed live.

## 9. Business Rules
- As the (apparent) final ingestion step, completing it should mark first-run setup **done** so the
  wizard isn't shown again. TODO(source: KG/docs) — confirm.
- Metric ingestion is presumably **optional** at setup time (configurable later via discovery/monitor
  settings). TODO(source: KG/docs) — confirm whether a Skip is offered.

## 10. Known Bugs
None recorded for this screen. (No `customer-issue-kb.md` entry references the first-run metric setup
step; discovery/metric-collection tickets in the KB concern runtime data collection, not this wizard
step.)

## 11. Edge Cases
- Completing/skipping the step, then confirm the wizard does not reappear on next login.
- Direct navigation to `/setup/metric` outside the wizard.
- Back/refresh mid-step — is any entered config preserved?
- Finishing setup with nothing configured across flow/log/metric (fully-skipped wizard) — product
  lands in an empty but usable state.
- Non-admin navigating to `/setup/metric` directly.
