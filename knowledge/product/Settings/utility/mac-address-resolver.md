---
screen: MAC Address Resolver · mac-address-resolver
module: Settings
category: utility
route: "/settings/utility/mac-address-resolver"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_mac_address_resolver.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — MAC Address Resolver

## 1. Purpose
An **ad-hoc tool that resolves the MAC (hardware) address** for a given IP, using a **Credential
Profile** to query the device/gateway (typically via SNMP/ARP) **from the collector**.

- **Business objective:** obtain the Layer-2 identity of an IP for topology/inventory troubleshooting
  and to confirm the collector can reach and authenticate to the device.
- **Screen description:** a form with **IP Address** and **Credential Profile** (a searchable dropdown
  with an inline **Create Credential Profile**), plus **Reset** and a resolve action (the primary
  button, labelled **Test** in the catalog, has id `#utility-mac-address-resolver-resolve-btn`).
- **Primary use cases:** find the MAC behind an IP; verify a credential profile authenticates before
  provisioning; support topology/dependency-mapping diagnostics (customer-issue-kb §8).
- **Who uses it:** administrators / network & support engineers.
- **Dependencies:** authenticated Settings session · a collector able to reach the target · a valid
  **Credential Profile** with rights to read the ARP/interface tables.

## 2. Navigation
```
Settings → Utility → MAC Address Resolver
```
- **Breadcrumb:** Settings › Utility › MAC Address Resolver
- **URL:** `/settings/utility/mac-address-resolver`

## 3. Actions
- Enter **IP Address**.
- Choose a **Credential Profile** (or **Create Credential Profile** inline — `#create-credential-btn-id`).
- **Test / Resolve** — run (`#utility-mac-address-resolver-resolve-btn`).
- **Reset** — clear the form (`#utility-mac-address-resolver-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address * | text input · placeholder `192.16.18.10` |
| Credential Profile * | searchable dropdown · `[data-cy='dropdown-trigger-input']` (placeholder `Select`) |
| **Create Credential Profile** | `#create-credential-btn-id` |
| **Reset** | `#utility-mac-address-resolver-reset-btn` |
| **Test / Resolve** (primary) | `#utility-mac-address-resolver-resolve-btn` |

> Note the primary button reads **Test** in the label list but its id is the **resolve** verb
> (`…-resolve-btn`) — automation should target the id. The resolved-MAC result block wasn't captured —
> TODO(source: KG/docs) confirm its structure.

_Locators: `knowledge/locators/catalog/settings_utility_mac_address_resolver.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented. Expect **Admin** (possibly privileged Operator); **Viewer**
  likely cannot. TODO(source: KG/docs) — exact RBAC and whether **Create Credential Profile** needs a
  separate credential-management permission.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller reachable and able to reach the target.
- At least one applicable **Credential Profile** exists (or is created inline).

## 7. Exit Conditions
- **On Resolve (success):** the MAC address for the IP renders.
- **On Resolve (failure):** unreachable / invalid-credential / not-found message.
- **On Reset:** form clears; no server call. Stateless — nothing persisted.

## 8. Validations
- **IP Address** — required before Resolve.
- **Credential Profile** — required.
- TODO(source: docs) — IP format enforcement and exact error copy.

## 9. Business Rules
- **Runs from the collector** and **requires a credential** — the result reflects both reachability
  and successful authentication; a wrong-scope/read-only credential can fail even when the host is up
  (the top KB "data missing for one device" cause, §1).
- Resolution is via the device/gateway's ARP/interface tables over the credential's protocol
  (SNMP expected). TODO(source: KG) confirm protocol and whether reverse (MAC→IP) is possible.
- **Stateless & ad-hoc** — nothing is saved.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): credential/permission problems blocking discovery/KPIs (customer-issue-kb
> §1, e.g. PQD-32697, PQD-38137) and topology name/IP parsing issues (§8) are what a MAC lookup helps
> triage. Do not invent bugs.

## 11. Edge Cases
- IP not in any ARP table (host offline / different segment) → not-found.
- Credential of wrong type/scope or drifted (invalid credential path).
- IP outside the collector's reachable subnets; IPv6 target.
- Empty required field or no credential selected; rapid re-run.
- Multiple MACs behind one IP (proxy-ARP / HSRP) — which is returned?
