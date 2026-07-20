---
screen: Log Settings · log-forwarder
module: Settings
category: log-settings
route: "/settings/log-settings/log-forwarder"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_log_settings_log_forwarder.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Log Settings · Log Forwarder

## 1. Purpose
Configures **log forwarders** — rules that relay logs received by Motadata on to external
destinations (e.g. a SIEM, a syslog/collector server, or another Motadata node). Each forwarder has
a **type** and a **"Forward As"** format, and can be enabled/disabled (**Forwarder Status**).

- **Business objective:** integrate Motadata into a customer's wider logging estate — forward
  ingested logs downstream without re-collecting them, in the required transport/format.
- **Screen description:** a searchable grid (**Forwarder Name · Description · Forwarder Type ·
  Forward As · Forwarder Status · Actions**) with a **Create Log Forwarder** action.
- **Primary use cases:** create a forwarder to a syslog/SIEM target, edit its type/format, enable or
  disable it, review status.
- **Who uses it:** log/platform administrators / SOC integrators. TODO(source: KG/docs) — role gate.
- **Dependencies:** logs being ingested · a reachable external destination · network path/firewall
  open to the target (KB shows firewall/port issues are a recurring integration blocker).

## 2. Navigation
```
Settings → Log Settings → Log Forwarder
```
- **Breadcrumb:** Settings › Log Settings › Log Forwarder
- **URL:** `/settings/log-settings/log-forwarder` (SPA route; open the full URL).

## 3. Actions
- **Create Log Forwarder** — open the create form (`#btn-create-trap-forwarding`).
- **Search** — free-text filter (`input[name="search-trap-forwarding"]`, placeholder _Search_).
- **Per-row Actions** — edit / delete / enable-disable a forwarder (Actions column). TODO(source:
  KG/docs) — exact menu items.

> **Automation caveat:** the create button id is `#btn-create-trap-forwarding` and the search input
> name is `search-trap-forwarding` — **trap-forwarding ids reused on the log-forwarder screen**
> (shared component with SNMP Trap Forwarder). Scope by route so a test doesn't cross log-forwarder
> and trap-forwarder screens.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-trap-forwarding"]` (text, placeholder _Search_) + a second unnamed _Search_ input |
| Grid | columns **Forwarder Name · Description · Forwarder Type · Forward As · Forwarder Status · Actions** |
| Create Log Forwarder | button `#btn-create-trap-forwarding` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_log_settings_log_forwarder.json`;
promote verified ones into the cookbook (Settings > Log Forwarder). The create-form fields (name,
description, type, forward-as, destination host/port) were **not** captured — harvest live._

## 5. Permissions
- Expected **Admin / log-admin** to create/edit/enable; others read-only. TODO(source: KG/docs) —
  exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Log Settings reachable; log ingestion licensed/enabled.
- A reachable external destination for the forwarder to be functional. TODO(source: docs).

## 7. Exit Conditions
- **On create (success):** a new forwarder row appears with the chosen type/format and a
  **Forwarder Status**; expected success toast. TODO(source: docs) — confirm toast + whether
  forwarding starts immediately.
- **On enable/disable:** Forwarder Status flips; forwarding starts/stops accordingly.

## 8. Validations
- **Forwarder Name** — required (and likely unique). TODO(source: docs).
- **Forwarder Type / Forward As** — required selections. TODO(source: docs) — enumerate types
  (syslog/TCP/UDP/…) and formats.
- **Destination host/port** — required, valid host + numeric port. TODO(source: docs).

## 9. Business Rules
- A forwarder relays **already-ingested** logs downstream; disabling it stops forwarding without
  affecting ingestion. TODO(source: KG) — confirm filtering (which logs are forwarded), format
  transforms, and retry/back-off behavior on an unreachable target.

## 10. Known Bugs
None recorded specifically for the Log Forwarder screen in `customer-issue-kb.md`.
> KB §5/§7 note that firewall/port blocking and WS/WSS restrictions break outbound integrations
> generally — a plausible failure mode for a forwarder to an unreachable target, but not a recorded
> forwarder defect. Do not invent bugs.

## 11. Edge Cases
- Unreachable / wrong destination host or port (does forwarding retry or silently drop?).
- Forwarder disabled vs deleted.
- Duplicate forwarder name.
- Very high log volume (throughput/back-pressure).
- Format mismatch between "Forward As" and what the downstream SIEM expects.
- Firewall blocks the transport (recurring KB theme) — expect an actionable status, not silent loss.
- Editing type/format while the forwarder is active.
