---
screen: SNMP Community Check · snmp-community-check
module: Settings
category: utility
route: "/settings/utility/snmp-community-check"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_snmp_community_check.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — SNMP Community Check

## 1. Purpose
An **ad-hoc SNMP credential validator**: confirm that a device responds to a given **Credential
Profile** (SNMP community for v1/v2c, or v3 user), **from the collector**, with configurable
**Timeout** and **SNMP Retries**.

- **Business objective:** prove the SNMP credential is correct *before* provisioning a monitor — wrong
  community strings and blank SNMPv3 usernames are documented causes of "no data / traps not visible"
  (customer-issue-kb §1, §7).
- **Screen description:** a form with **IP Address/Host Name**, **Credential Profile** (dropdown with
  inline **Create Credential Profile**), **Timeout**, **SNMP Retries**, and **2 radio buttons** (a
  mode/version selector — see note), plus **Reset** and **Test**; the pass/fail result renders below.
- **Primary use cases:** validate a community/v3 credential; tune Timeout/Retries for a slow device;
  isolate "credential wrong" from "device unreachable".
- **Who uses it:** administrators / SNMP & support engineers.
- **Dependencies:** authenticated Settings session · a collector able to reach the target's SNMP port ·
  a **SNMP Credential Profile** to test.

## 2. Navigation
```
Settings → Utility → SNMP Community Check
```
- **Breadcrumb:** Settings › Utility › SNMP Community Check
- **URL:** `/settings/utility/snmp-community-check`

## 3. Actions
- Enter **IP Address/Host Name**.
- Choose a **Credential Profile** (or **Create Credential Profile** inline — `#create-credential-btn-id`).
- Set **Timeout** and **SNMP Retries**; pick the mode via the **2 radios**.
- **Test** — run the check (`#utility-snmp-community-check-test-btn`).
- **Reset** — clear the form (`#utility-snmp-community-check-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address/Host Name * | text input · placeholder `192.16.14.10` |
| Credential Profile * | searchable dropdown · `[data-cy='dropdown-trigger-input']` (placeholder `Select`) |
| **Create Credential Profile** | `#create-credential-btn-id` |
| Timeout | labelled field (id not captured in sweep) |
| SNMP Retries | labelled field (id not captured in sweep) |
| Mode / version selector | **2 radio buttons** (catalog `radios: 2`) |
| **Reset** | `#utility-snmp-community-check-reset-btn` |
| **Test** | `#utility-snmp-community-check-test-btn` |

> The **2 radios** are a two-way selector — most likely an SNMP version/mode choice (e.g. v1/v2c vs
> v3, or a single-IP vs range mode). TODO(source: KG/docs) — confirm what the radios select. The
> Timeout/SNMP-Retries input ids and the result block weren't captured.

_Locators: `knowledge/locators/catalog/settings_utility_snmp_community_check.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented. Expect **Admin** (possibly privileged Operator); **Viewer**
  likely cannot. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller reachable and able to reach the target's SNMP port.
- A **SNMP Credential Profile** exists (or is created inline).

## 7. Exit Conditions
- **On Test (pass):** "SNMP responding / credential valid"-style success.
- **On Test (fail):** timeout / no-response / invalid-community message after exhausting **SNMP Retries**.
- **On Reset:** form clears; no server call. Stateless — nothing persisted.

## 8. Validations
- **IP Address/Host Name** — required before Test.
- **Credential Profile** — required (SNMP-type).
- **Timeout** — numeric (seconds); **SNMP Retries** — numeric count. TODO(source: docs) — ranges/defaults.
- TODO(source: docs) — what the 2 radios enforce and their default.

## 9. Business Rules
- **Runs from the collector** with the SNMP credential; a "fail" verdict distinguishes wrong
  community/v3 user from an unreachable/latent device — the whole point of the tool.
- **Retries × Timeout** bounds how long the check waits; slow devices need higher values (mirrors the
  monitor-side SNMP timeout tuning in customer-issue-kb §1).
- **Stateless & ad-hoc** — nothing is saved.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): wrong SNMPv2c community / blank SNMPv3 username causing "traps not
> visible / no data" (customer-issue-kb §7, PQD-33528) and SNMP-transport failures (§1, PQD-34689) are
> exactly what this check catches. Do not invent bugs.

## 11. Edge Cases
- Correct IP but wrong community / wrong v3 user → fail after retries.
- Blank SNMPv3 username; v2c community tested against a v3-only device (and vice-versa).
- Very slow device: Retries=0 vs high; Timeout at min/max.
- Response from a different IP (NAT) → apparent fail (§1, PQD-34689).
- Empty required field / no credential; IPv6 target; rapid re-run.
