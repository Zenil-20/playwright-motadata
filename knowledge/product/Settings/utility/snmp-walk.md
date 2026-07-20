---
screen: SNMP Walk · snmp-walk
module: Settings
category: utility
route: "/settings/utility/snmp-walk"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_snmp_walk.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — SNMP Walk

## 1. Purpose
An **ad-hoc SNMP walk**: query an OID subtree on a target device using a **Credential Profile**,
**from the collector**, and see the returned OID/value rows.

- **Business objective:** confirm which OIDs a device actually implements — the KB's single biggest
  data-quality cluster is "vendor device doesn't respond to default OIDs → missing/false KPIs"
  (customer-issue-kb §1). An SNMP walk is the definitive way to prove what an OID returns.
- **Screen description:** a form with **IP Address/Host Name**, **Credential Profile** (dropdown with
  inline **Create Credential Profile**), **OID** (default seed `1.3.6.1.2.1`) and **Timeout**, plus
  **Reset** and a run action (`#utility-snmp-walk-run-btn`); the walk output renders below.
- **Primary use cases:** verify SNMP responds and returns the expected metric OIDs before adding a
  monitor; capture actual OID values to fix a template/SNMP Device Catalogue entry; diagnose a device
  that returns only a handful of lines.
- **Who uses it:** administrators / SNMP & plugin engineers.
- **Dependencies:** authenticated Settings session · a collector able to reach the target's SNMP port
  (161/udp) · a valid **SNMP Credential Profile** (v1/v2c community or v3 user).

## 2. Navigation
```
Settings → Utility → SNMP Walk
```
- **Breadcrumb:** Settings › Utility › SNMP Walk
- **URL:** `/settings/utility/snmp-walk`

## 3. Actions
- Enter **IP Address/Host Name**.
- Choose a **Credential Profile** (or **Create Credential Profile** inline — `#create-credential-btn-id`).
- Enter/confirm the **OID** (defaults to `1.3.6.1.2.1`) and **Timeout**.
- **Test / Run** — walk the subtree (`#utility-snmp-walk-run-btn`).
- **Reset** — clear the form (`#utility-snmp-walk-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address/Host Name * | text input · placeholder `172.31.11.52` |
| Credential Profile * | searchable dropdown · `[data-cy='dropdown-trigger-input']` (placeholder `Select`) |
| **Create Credential Profile** | `#create-credential-btn-id` |
| OID | text input · placeholder/seed `1.3.6.1.2.1` |
| Timeout | labelled field (id not captured in sweep) |
| **Reset** | `#utility-snmp-walk-reset-btn` |
| **Test / Run** (primary) | `#utility-snmp-walk-run-btn` |

> Primary button reads **Test** in the label list but its id is the **run** verb (`…-run-btn`) —
> target the id in automation. The output grid wasn't captured — TODO(source: KG/docs) confirm it
> renders OID→value rows.

_Locators: `knowledge/locators/catalog/settings_utility_snmp_walk.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented. Expect **Admin** (possibly privileged Operator); **Viewer**
  likely cannot. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller reachable and able to reach the target's SNMP port.
- A valid **SNMP Credential Profile** exists (or is created inline).

## 7. Exit Conditions
- **On Run (success):** the walked OID→value rows render (possibly just a few if the device implements
  little of the subtree).
- **On Run (failure):** timeout / no-response / invalid-community message.
- **On Reset:** form clears; no server call. Stateless — nothing persisted.

## 8. Validations
- **IP Address/Host Name** — required before Run.
- **Credential Profile** — required (SNMP-type).
- **OID** — dotted-numeric OID; defaults to `1.3.6.1.2.1`. TODO(source: docs) — format enforcement.
- **Timeout** — numeric (seconds). TODO(source: docs) — unit/range/default; whether it guards very
  slow/large devices.

## 9. Business Rules
- **Runs from the collector** using the SNMP credential; result reflects reachability, correct
  community/v3 user, and what the device actually implements — a device may respond yet return only a
  few OIDs (customer-issue-kb §1).
- **Timeout matters on large devices** — SNMP walks on huge (e.g. 4000-interface) or latent devices
  can take many minutes (§1, PQD-33921: 24+ min). Set Timeout accordingly.
- **Stateless & ad-hoc** — nothing is saved.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): default-OID gaps → missing/false KPIs (§1, PQD-27244/PQD-31043),
> SNMP-transport failures incl. response-IP ≠ request-IP and 24-min walks (§1, PQD-33921/PQD-34689),
> and a missing mandatory Interface-Alias OID (§1) are precisely what an SNMP walk exposes. Do not invent bugs.

## 11. Edge Cases
- OID that returns nothing (unimplemented subtree) vs a huge subtree (walk from the root `1`).
- Very slow/large device exceeding the Timeout; latency-induced partial results.
- Wrong community / blank SNMPv3 username → no response (§7, PQD-33528 pattern).
- Response returned from a different IP (NAT) → apparent no-response (§1, PQD-34689).
- Malformed OID; empty required field / no credential; IPv6 target; rapid re-run.
