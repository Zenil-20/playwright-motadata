---
screen: Setup · flow
module: Setup
route: "/setup/flow"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/setup_flow.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Setup · flow

## 1. Purpose
The **Flow ingestion** step of the first-run onboarding wizard — where the admin configures (or skips)
NetFlow/sFlow/IPFIX ingestion during initial setup.

- **Business objective:** get network-flow data flowing into ObserveOps early, as part of guided setup,
  rather than requiring the admin to find flow settings later.
- **Screen description:** a wizard step (catalog title _"Motadata ObserveOps | Setup"_) with two
  buttons: **Skip Flow Ingestion** and **Next**. No input fields were captured in the sweep — the
  configuration controls likely render conditionally. TODO(source: KG/docs) — confirm the exact fields
  (e.g. exporter/collector port, flow version).
- **Primary use cases:** configure flow ingestion and continue, or skip flow and move on.
- **Who uses it:** the administrator running first-run setup.
- **Dependencies:** an authenticated session; an in-progress setup wizard (reached via `/setup/`).

## 2. Navigation
```
/setup/  →  (Let's start)  →  /setup/flow  →  Next  →  /setup/log
```
- **URL:** `/setup/flow` (open the full URL; SPA routing must load the page).
- **Wizard siblings:** `/setup/` (start) · `/setup/log` · `/setup/metric`
- **Position:** one step in the multi-step setup wizard. TODO(source: KG/docs) — confirm exact step
  order and where **Next** leads.

## 3. Actions
- **Skip Flow Ingestion** — skip this step without configuring flow.
- **Next** — save/continue to the next wizard step.
- Configure flow ingestion settings — TODO(source: KG/docs): no input controls were captured in the
  sweep; confirm the actual fields live.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Skip Flow Ingestion | `button` labeled _Skip Flow Ingestion_ |
| Next (primary) | `button` labeled _Next_ |

> No inputs/selects were captured — the flow-config fields (if any) render conditionally and were not
> in the OFF-state sweep. Confirm live before automating data entry.

_Locators: see `knowledge/locators/catalog/setup_flow.json` (raw sweep). No stable ids captured —
scope by accessible name (_Next_, _Skip Flow Ingestion_) or harvest via the explorer skill._

## 5. Permissions
- Part of the **admin** first-run setup flow.
- TODO(source: KG/docs) — confirm role gating.

## 6. Entry Conditions
- User is logged in and inside the setup wizard (arrived from `/setup/`).
- TODO(source: docs) — whether reaching `/setup/flow` directly (outside the wizard) is supported.

## 7. Exit Conditions
- **Next:** advances to the next step (`/setup/log`); any entered flow config is saved.
- **Skip Flow Ingestion:** advances without configuring flow.
- TODO(source: docs) — confirm the exact next step and persistence of the choice.

## 8. Validations
- TODO(source: docs) — if flow-config fields exist, their validations (port range, required values)
  are unconfirmed; **Skip** should bypass any such validation.

## 9. Business Rules
- Flow ingestion is **optional** at setup time (an explicit Skip is offered) — it can presumably be
  configured later from the Flow/ingestion settings. TODO(source: KG/docs) — confirm.
- TODO(source: KG/docs) — flow version / exporter requirements (KB notes flow-version mismatches, e.g.
  NetFlow v5 vs v9, as a common field issue — but that concerns runtime data, not this setup step).

## 10. Known Bugs
None recorded for this screen. (`customer-issue-kb.md` §7 covers Flow *Explorer* / ingestion runtime
defects — flow-version mismatch, exporter config — not the first-run setup step, so they are not
attributed here.)

## 11. Edge Cases
- **Skip Flow Ingestion**, then confirm flow can still be configured later.
- **Next** with no flow configured (empty step) — allowed?
- Direct navigation to `/setup/flow` outside the wizard.
- Back/refresh mid-step — is entered config preserved?
- Invalid flow-config values (if fields exist) then Next vs Skip.
