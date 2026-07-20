---
screen: Ping · ping
module: Settings
category: utility
route: "/settings/utility/ping"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_ping.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — Ping

## 1. Purpose
An **ad-hoc ICMP reachability test**. The admin enters an IP address or hostname and clicks **Test**;
the product pings the target **from the collector/poller** and reports whether it is reachable.

- **Business objective:** answer "is this device reachable from Motadata?" in one click, without
  shelling into the collector — the first triage step for "device down / no data" tickets.
- **Screen description:** a single field (**IP Address/Host Name**) with **Test** and **Reset**
  buttons; the result renders below. It is the **default landing tool** of Settings → Utility.
- **Primary use cases:** confirm a target is up before adding a monitor; sanity-check a firewall/route
  change; distinguish "device down" from "credential/SNMP problem" (Ping OK but SNMP fails ⇒ not ICMP).
- **Who uses it:** administrators / support engineers.
- **Dependencies:** authenticated Settings session · a collector able to reach the target's network ·
  ICMP allowed along the path.

## 2. Navigation
```
Settings → Utility → Ping
```
- **Breadcrumb:** Settings › Utility › Ping
- **URL:** `/settings/utility/ping` (also the default at `/settings/utility/`)

## 3. Actions
- Enter **IP Address/Host Name**.
- **Test** — run the ping (`#utility-ping-test-btn`).
- **Reset** — clear the field (`#utility-ping-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address/Host Name * | text input · placeholder `172.31.11.52` |
| Settings left-nav **Search** | shared shell · `input[placeholder="Search"]` |
| **Reset** | `#utility-ping-reset-btn` |
| **Test** | `#utility-ping-test-btn` |

> No selects/switches/radios/grid on this screen (catalog: all zero). The result output block was not
> captured in the sweep — TODO(source: KG/docs) confirm its structure (latency / packet-loss / raw lines).

_Locators: `knowledge/locators/catalog/settings_utility_ping.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented. Expect **Admin** (and possibly privileged Operator) to run;
  **Viewer** likely cannot. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller reachable and able to reach the target network.

## 7. Exit Conditions
- **On Test (reachable):** success result renders (reachable / latency). TODO(source: KG/docs) — exact fields.
- **On Test (unreachable):** timeout / "not reachable" message renders.
- **On Reset:** field clears; no server call. Stateless — nothing is persisted.

## 8. Validations
- **IP Address/Host Name** — required before Test; accepts an IP or a resolvable hostname.
- TODO(source: docs) — IPv4/IPv6/hostname format enforcement and inline error copy.

## 9. Business Rules
- **Ping runs from the collector**, so the result reflects collector→target reachability, not the
  browser's — a firewalled ICMP path fails even when the device is up.
- **Stateless & ad-hoc** — no monitor is created, nothing is saved.
- A hostname is resolved via DNS first; a resolution failure surfaces before the ICMP attempt
  (see the DNS Resolver tool). TODO(source: KG) confirm.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): Ping is the tool used to triage the "device unreachable / data missing"
> class in customer-issue-kb §1. Note availability method Heartbeat→Ping is a documented remedy for an
> agent-down case (PQD-41189) — relevant background, not a bug in this screen. Do not invent bugs.

## 11. Edge Cases
- Unreachable / firewalled (ICMP blocked) target — expect a clean timeout message, not a hang.
- Hostname that fails DNS resolution.
- IPv6 target; hostname vs raw IP; leading/trailing spaces.
- Rapid double-**Test**; **Test** with an empty field; very long hostname.
