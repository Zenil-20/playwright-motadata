---
screen: SNMP Ping · snmp-ping
module: Settings
category: utility
route: "/settings/utility/snmp-ping"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_snmp_ping.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — SNMP Ping

## 1. Purpose
An **ad-hoc SNMP-level reachability test for an existing Monitor**: pick a **Monitor** and a
**Credential Profile** and confirm the device answers SNMP **from the collector**. Unlike SNMP
Community Check (which takes a raw IP), this tool targets a device already provisioned as a Monitor.

- **Business objective:** verify that a monitored device is still answering SNMP with its configured
  credential — the fast "is this monitor's SNMP alive?" check when a device shows no/stale data.
- **Screen description:** a form with **Monitor** (a "Select Monitor" dropdown), **Credential Profile**
  (dropdown with inline **Create Credential Profile**), and **2 radio buttons** (a mode/version
  selector — see note), plus **Reset** and **Test**; the pass/fail result renders below.
- **Primary use cases:** confirm SNMP reachability for a specific monitor; re-test after a credential
  or network change; isolate "monitor down" from "SNMP credential/transport problem".
- **Who uses it:** administrators / SNMP & support engineers.
- **Dependencies:** authenticated Settings session · at least one existing **Monitor** to select · a
  collector able to reach the device's SNMP port · a **SNMP Credential Profile**.

## 2. Navigation
```
Settings → Utility → SNMP Ping
```
- **Breadcrumb:** Settings › Utility › SNMP Ping
- **URL:** `/settings/utility/snmp-ping`

## 3. Actions
- Select a **Monitor** (placeholder _Select Monitor_).
- Choose a **Credential Profile** (or **Create Credential Profile** inline — `#create-credential-btn-id`).
- Pick the mode via the **2 radios**.
- **Test** — run the check (`#utility-snmp-ping-test-btn`).
- **Reset** — clear the form (`#utility-snmp-ping-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Monitor * | dropdown · placeholder `Select Monitor` |
| Credential Profile * | searchable dropdown · `[data-cy='dropdown-trigger-input']` (placeholder `Select`) |
| **Create Credential Profile** | `#create-credential-btn-id` |
| Mode / version selector | **2 radio buttons** (catalog `radios: 2`) |
| **Reset** | `#utility-snmp-ping-reset-btn` |
| **Test** | `#utility-snmp-ping-test-btn` |

> This is the **only** utility tool keyed to a **Monitor** rather than a raw IP/host. The **2 radios**
> are a two-way selector (likely SNMP version/mode). TODO(source: KG/docs) — confirm what the radios
> select and the result block structure.

_Locators: `knowledge/locators/catalog/settings_utility_snmp_ping.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented. Expect **Admin** (possibly privileged Operator); **Viewer**
  likely cannot. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- **At least one Monitor already exists** to select (this tool cannot target an un-provisioned IP).
- A collector/poller reachable and able to reach the device's SNMP port.
- A **SNMP Credential Profile** exists (or is created inline).

## 7. Exit Conditions
- **On Test (pass):** "SNMP responding for this monitor"-style success.
- **On Test (fail):** timeout / no-response / invalid-credential message.
- **On Reset:** form clears; no server call. Stateless — nothing persisted.

## 8. Validations
- **Monitor** — required before Test.
- **Credential Profile** — required (SNMP-type).
- TODO(source: docs) — what the 2 radios enforce/default; whether the monitor's own credential
  pre-fills the profile.

## 9. Business Rules
- **Targets a Monitor**, so the device IP comes from the selected monitor's record — the tool tests
  the collector→monitor SNMP path with the chosen credential.
- **Runs from the collector**; a "fail" distinguishes SNMP-credential/transport problems from the
  monitor merely being marked down.
- **Stateless & ad-hoc** — nothing is saved; it does not change the monitor.
- TODO(source: KG) — whether the selected Credential Profile overrides the monitor's stored credential
  or must match it.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): SNMP-transport failures and credential drift on monitored devices
> (customer-issue-kb §1, PQD-34689/PQD-32697) are what this per-monitor SNMP check helps confirm. Do
> not invent bugs.

## 11. Edge Cases
- No monitors exist yet → the Monitor dropdown is empty (tool unusable).
- Monitor selected but its device is down / SNMP disabled → fail.
- Credential Profile that doesn't match the device's actual community/v3 user.
- Mode radio toggled to the wrong SNMP version for the device.
- Empty required field / no credential; rapid re-run.
