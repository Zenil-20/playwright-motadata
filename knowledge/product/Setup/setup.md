---
screen: Setup · setup
module: Setup
route: "/setup/"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/setup.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Setup · setup

## 1. Purpose
The **first-run onboarding wizard entry point** — the landing step a fresh Motadata ObserveOps install
shows to guide the admin through initial configuration (e.g. ingestion setup for flow / log / metric).

- **Business objective:** shorten time-to-value on a new install by walking the admin through the
  minimum setup rather than dropping them into an empty product.
- **Screen description:** a welcome/start step (catalog title _"Motadata ObserveOps | Setup"_) with
  **two checkboxes** and two buttons: **Let's start** and **Skip setup**. It is the root of the
  `/setup/*` wizard (siblings: `/setup/flow`, `/setup/log`, `/setup/metric`).
- **Primary use cases:** begin guided setup ("Let's start") or bypass it entirely ("Skip setup"); the
  two checkboxes let the admin choose what to configure. TODO(source: KG/docs) — confirm the exact
  checkbox labels (not captured in the sweep).
- **Who uses it:** the administrator performing the initial post-install configuration.
- **Dependencies:** an authenticated session; a fresh/unconfigured deployment (the wizard is typically
  shown on first login).

## 2. Navigation
```
Direct route → /setup/   (shown on first login of a fresh install)
```
- **URL:** `/setup/` (open the full URL; SPA routing must load the page).
- **Wizard siblings:** `/setup/flow` · `/setup/log` · `/setup/metric`
- **Menu path:** typically auto-launched on first run rather than reached from the nav. TODO(source:
  KG/docs) — confirm whether it can be re-opened later from Settings.

## 3. Actions
- **Let's start** — begin the guided setup wizard (advances into the flow/log/metric steps).
- **Skip setup** — bypass onboarding and go straight into the product.
- Toggle the **two checkboxes** — select which parts of setup to run. TODO(source: KG/docs) — exact
  labels and what each enables.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Checkboxes (×2) | 2 checkbox inputs (labels not captured) |
| Let's start (primary) | `button` labeled _Let's start_ |
| Skip setup | `button` labeled _Skip setup_ |

_Locators: see `knowledge/locators/catalog/setup.json` (raw sweep). No stable button/checkbox ids were
captured — scope by accessible name (_Let's start_, _Skip setup_) when automating, or harvest verified
locators via the explorer skill._

## 5. Permissions
- The onboarding wizard is an **admin** first-run task.
- TODO(source: KG/docs) — confirm role gating and whether non-admins ever see `/setup/`.

## 6. Entry Conditions
- User is logged in (typically the first admin login after install).
- The deployment is unconfigured / setup has not yet been completed or skipped.
- TODO(source: docs) — the exact condition that makes the wizard appear (a "setup incomplete" flag).

## 7. Exit Conditions
- **Let's start:** advances to the next wizard step (`/setup/flow`).
- **Skip setup:** exits the wizard into the main app (dashboard/landing). TODO(source: docs) — confirm
  the destination and that the "setup done/skipped" state persists so it isn't shown again.

## 8. Validations
- TODO(source: docs) — whether at least one checkbox must be selected before **Let's start** is
  enabled, or whether it proceeds regardless.

## 9. Business Rules
- The wizard is a **first-run** flow — once completed or skipped it should not reappear on subsequent
  logins. TODO(source: KG/docs) — confirm the persistence rule and whether setup can be re-run.
- The two checkboxes gate which downstream steps (flow / log / metric) are presented. TODO(source:
  KG/docs) — confirm this mapping.

## 10. Known Bugs
None recorded for this screen. (No `customer-issue-kb.md` entry references the first-run setup wizard.)

## 11. Edge Cases
- **Skip setup**, then verify the wizard does not reappear on next login.
- **Let's start** with zero checkboxes selected — is it allowed / what is skipped?
- Selecting both checkboxes vs one — confirm the correct downstream steps appear.
- Re-visiting `/setup/` directly after setup is already complete (should redirect / short-circuit?).
- Interrupting mid-wizard (close browser) and returning — resume vs restart.
- Non-admin navigating to `/setup/` directly.
