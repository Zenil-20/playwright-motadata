---
screen: Telnet · telnet
module: Settings
category: utility
route: "/settings/utility/telnet"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_telnet.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — Telnet

## 1. Purpose
An **ad-hoc TCP port-reachability test**. The admin enters an IP/hostname and a **TCP Port**; **Test**
attempts a TCP connection to that host:port **from the collector** and reports whether the port is open.

- **Business objective:** verify a required service port is reachable (e.g. SSH 22, WinRM 5985/5986,
  SNMP-over-TCP, a database port) before/while troubleshooting monitoring — a targeted follow-up to Ping.
- **Screen description:** a form with **IP Address/Host Name** and **TCP Port** (`id=port`), plus
  **Test** and **Reset**; the result renders below.
- **Primary use cases:** confirm a firewall permits the monitoring/agent port; distinguish "host up
  but port closed" from "host down"; validate a port after a firewall change.
- **Who uses it:** administrators / network & support engineers.
- **Dependencies:** authenticated Settings session · a collector able to reach the target · the target
  port permitted end-to-end.

## 2. Navigation
```
Settings → Utility → Telnet
```
- **Breadcrumb:** Settings › Utility › Telnet
- **URL:** `/settings/utility/telnet`

## 3. Actions
- Enter **IP Address/Host Name**.
- Enter **TCP Port**.
- **Test** — attempt the TCP connection (`#utility-telnet-test-btn`).
- **Reset** — clear the form (`#utility-telnet-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address/Host Name * | text input · placeholder `172.31.11.52` |
| TCP Port * | `input#port` (empty type in sweep — treat as numeric) |
| **Reset** | `#utility-telnet-reset-btn` |
| **Test** | `#utility-telnet-test-btn` |

_Locators: `knowledge/locators/catalog/settings_utility_telnet.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented. Expect **Admin** (possibly privileged Operator); **Viewer**
  likely cannot. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller reachable and able to reach the target network.

## 7. Exit Conditions
- **On Test (port open):** success message (connection established).
- **On Test (port closed/filtered):** failure/timeout message.
- **On Reset:** form clears; no server call. Stateless — nothing persisted.
- TODO(source: KG/docs) — exact success/failure copy.

## 8. Validations
- **IP Address/Host Name** — required before Test.
- **TCP Port** — required, numeric, valid port range **1–65535**. TODO(source: docs) confirm exact bounds.

## 9. Business Rules
- **Connects from the collector**, so an "open"/"closed" verdict reflects the collector→target path
  and any firewall between them — not the browser's.
- **Stateless & ad-hoc** — nothing is saved; despite the "Telnet" name this is a **port-open probe**,
  not an interactive Telnet session. TODO(source: KG) confirm no shell interaction.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): "agent installed but not reporting — required ports closed" (PQD-29673,
> customer-issue-kb §6) and blocked WS/WSS/agent-port cases (§3) are exactly what this port probe
> diagnoses. Do not invent bugs.

## 11. Edge Cases
- Host up but port closed vs. host down (different messages expected).
- Port = 0, 65535, 65536 (out of range), non-numeric port.
- Filtered/dropped port (silent firewall) → timeout, not immediate refusal.
- Hostname that fails DNS resolution; IPv6 target.
- Empty required field; rapid re-run.
