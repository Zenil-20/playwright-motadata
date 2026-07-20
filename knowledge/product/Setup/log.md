---
screen: Setup · log
module: Setup
route: "/setup/log"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/setup_log.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Setup · log

## 1. Purpose
The **Log ingestion** step of the first-run onboarding wizard — where the admin configures (or skips)
syslog/log ingestion during initial setup.

- **Business objective:** get log data flowing into ObserveOps as part of guided setup rather than
  requiring the admin to locate log-ingestion settings afterwards.
- **Screen description:** a wizard step (catalog title _"Motadata ObserveOps | Setup"_) with two
  buttons: **Skip Log Ingestion** and **Next**. No input fields were captured in the sweep — the
  configuration controls likely render conditionally. TODO(source: KG/docs) — confirm the exact fields
  (e.g. syslog port, source/parser selection).
- **Primary use cases:** configure log ingestion and continue, or skip logs and move on.
- **Who uses it:** the administrator running first-run setup.
- **Dependencies:** an authenticated session; an in-progress setup wizard (reached via `/setup/`).

## 2. Navigation
```
/setup/flow  →  Next  →  /setup/log  →  Next  →  /setup/metric
```
- **URL:** `/setup/log` (open the full URL; SPA routing must load the page).
- **Wizard siblings:** `/setup/` (start) · `/setup/flow` · `/setup/metric`
- **Position:** one step in the multi-step setup wizard. TODO(source: KG/docs) — confirm exact step
  order and where **Next** leads.

## 3. Actions
- **Skip Log Ingestion** — skip this step without configuring logs.
- **Next** — save/continue to the next wizard step.
- Configure log ingestion settings — TODO(source: KG/docs): no input controls were captured in the
  sweep; confirm the actual fields live.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Skip Log Ingestion | `button` labeled _Skip Log Ingestion_ |
| Next (primary) | `button` labeled _Next_ |

> No inputs/selects were captured — the log-config fields (if any) render conditionally and were not
> in the OFF-state sweep. Confirm live before automating data entry.

_Locators: see `knowledge/locators/catalog/setup_log.json` (raw sweep). No stable ids captured — scope
by accessible name (_Next_, _Skip Log Ingestion_) or harvest via the explorer skill._

## 5. Permissions
- Part of the **admin** first-run setup flow.
- TODO(source: KG/docs) — confirm role gating.

## 6. Entry Conditions
- User is logged in and inside the setup wizard (arrived from `/setup/flow`).
- TODO(source: docs) — whether reaching `/setup/log` directly (outside the wizard) is supported.

## 7. Exit Conditions
- **Next:** advances to the next step (`/setup/metric`); any entered log config is saved.
- **Skip Log Ingestion:** advances without configuring logs.
- TODO(source: docs) — confirm the exact next step and persistence of the choice.

## 8. Validations
- TODO(source: docs) — if log-config fields exist, their validations (port range, required source/
  parser) are unconfirmed; **Skip** should bypass any such validation.

## 9. Business Rules
- Log ingestion is **optional** at setup time (an explicit Skip is offered) — it can presumably be
  configured later from log-ingestion settings. TODO(source: KG/docs) — confirm.
- TODO(source: KG/docs) — default event-source / parser behavior (KB notes only certain Windows event
  sources are enabled by default at runtime — relevant context but not this setup step).

## 10. Known Bugs
None recorded for this screen. (`customer-issue-kb.md` §7 covers Log *Explorer* / parsing runtime
defects — logs landing in "Others", parser-by-IP issues — not the first-run setup step, so they are
not attributed here.)

## 11. Edge Cases
- **Skip Log Ingestion**, then confirm logs can still be configured later.
- **Next** with no logs configured (empty step) — allowed?
- Direct navigation to `/setup/log` outside the wizard.
- Back/refresh mid-step — is entered config preserved?
- Invalid log-config values (if fields exist) then Next vs Skip.
