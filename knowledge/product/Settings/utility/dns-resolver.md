---
screen: DNS Resolver · dns-resolver
module: Settings
category: utility
route: "/settings/utility/dns-resolver"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_dns_resolver.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — DNS Resolver

## 1. Purpose
An **ad-hoc DNS lookup tool**. The admin enters a hostname or IP and **Test** resolves it **from the
collector**, returning the resolved IP (forward) or name (reverse).

- **Business objective:** confirm the collector resolves a device's name correctly — stale or wrong
  DNS is a documented cause of "UI never loads / wrong IP / data missing" (customer-issue-kb §3).
- **Screen description:** a single field (**IP Address/Host Name**) with **Test** and **Reset**;
  the resolved value renders below.
- **Primary use cases:** verify a hostname resolves before adding a monitor by name; detect stale DNS
  after an IP change; confirm reverse-DNS (PTR) for a device IP.
- **Who uses it:** administrators / support engineers.
- **Dependencies:** authenticated Settings session · a collector with working DNS configuration.

## 2. Navigation
```
Settings → Utility → DNS Resolver
```
- **Breadcrumb:** Settings › Utility › DNS Resolver
- **URL:** `/settings/utility/dns-resolver`

## 3. Actions
- Enter **IP Address/Host Name**.
- **Test** — resolve (`#utility-dns-resolver-test-btn`).
- **Reset** — clear the field (`#utility-dns-resolver-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address/Host Name * | text input · placeholder `172.31.11.52` |
| **Reset** | `#utility-dns-resolver-reset-btn` |
| **Test** | `#utility-dns-resolver-test-btn` |

> No selects/switches/radios/grid (catalog: all zero). The result block wasn't captured — TODO(source:
> KG/docs) confirm whether it shows a single resolved value or a record list, and forward vs reverse.

_Locators: `knowledge/locators/catalog/settings_utility_dns_resolver.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented. Expect **Admin** (possibly privileged Operator); **Viewer**
  likely cannot. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller with DNS reachable.

## 7. Exit Conditions
- **On Test (resolves):** the resolved IP (or name) renders.
- **On Test (no record):** "not resolved / NXDOMAIN"-style message.
- **On Reset:** field clears; no server call. Stateless — nothing persisted.

## 8. Validations
- **IP Address/Host Name** — required before Test; accepts a hostname (forward) or an IP (reverse).
- TODO(source: docs) — exact input format handling and error copy.

## 9. Business Rules
- **Resolution uses the collector's DNS configuration**, so results reflect the collector's resolver,
  not the browser's — the whole point when diagnosing stale/split DNS.
- **Stateless & ad-hoc** — nothing is saved.
- TODO(source: KG) — whether both forward (name→IP) and reverse (IP→name) are supported, and which
  resolver/servers are used.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): "stale DNS / browser cache after public-IP change → UI never loads"
> (PQD-30253, customer-issue-kb §3) and hostname/IP-resolution confusion (§3, PQD-27130) are what this
> tool helps confirm from the collector side. Do not invent bugs.

## 11. Edge Cases
- Name with no A record (NXDOMAIN); IP with no PTR record.
- Multiple A records (round-robin) — which/how many returned?
- Split-horizon / stale DNS (collector resolves differently than expected).
- Trailing dot / FQDN vs short name; IPv6 (AAAA) lookup.
- Empty required field; rapid re-run.
