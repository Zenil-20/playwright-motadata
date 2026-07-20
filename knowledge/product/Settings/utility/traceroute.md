---
screen: TraceRoute · traceroute
module: Settings
category: utility
route: "/settings/utility/traceroute"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_utility_traceroute.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Utility — TraceRoute

## 1. Purpose
An **ad-hoc path-trace tool** that reports the sequence of network hops between the collector and a
target IP/hostname, hop by hop, up to a maximum hop count.

- **Business objective:** localise *where* connectivity breaks (which hop drops or times out) when a
  device is unreachable — a step deeper than Ping.
- **Screen description:** a form with **IP Address/Host Name**, **Maximum Hops** and **Timeout**, plus
  **Test** and **Reset**; the hop list renders below.
- **Primary use cases:** diagnose routing/firewall problems on the path to a device; confirm traffic
  egresses the expected gateway; compare paths after a network change.
- **Who uses it:** administrators / network & support engineers.
- **Dependencies:** authenticated Settings session · a collector able to reach (or attempt to reach)
  the target · ICMP/UDP traceroute probes allowed along the path.

## 2. Navigation
```
Settings → Utility → TraceRoute
```
- **Breadcrumb:** Settings › Utility › TraceRoute
- **URL:** `/settings/utility/traceroute`

## 3. Actions
- Enter **IP Address/Host Name**.
- Set **Maximum Hops** and **Timeout** (parameters).
- **Test** — run the trace (`#utility-traceroute-test-btn`).
- **Reset** — clear the form (`#utility-traceroute-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address/Host Name * | text input · placeholder `172.31.11.52` |
| Maximum Hops | labelled field (input id not captured in sweep) |
| Timeout | labelled field (input id not captured in sweep) |
| **Reset** | `#utility-traceroute-reset-btn` |
| **Test** | `#utility-traceroute-test-btn` |

> The catalog captured only one non-search text input (the IP field) but **three labels** (IP,
> Maximum Hops, Timeout) — the Hops/Timeout inputs exist but their ids weren't captured. TODO(source:
> KG/docs) — capture their ids/defaults and the hop-result table structure.

_Locators: `knowledge/locators/catalog/settings_utility_traceroute.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented. Expect **Admin** (possibly privileged Operator); **Viewer**
  likely cannot. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller reachable and able to attempt the path to the target.

## 7. Exit Conditions
- **On Test:** a hop-by-hop list renders (each hop's address/latency, or `*` for a timed-out hop) up
  to **Maximum Hops**. TODO(source: KG/docs) — exact rendering.
- **On Reset:** form clears; no server call. Stateless — nothing persisted.

## 8. Validations
- **IP Address/Host Name** — required before Test.
- **Maximum Hops** — numeric, positive; TODO(source: docs) exact min/max & default.
- **Timeout** — numeric (seconds); TODO(source: docs) exact unit/range/default.

## 9. Business Rules
- **Runs from the collector**, so the traced path is the collector's path, not the browser's.
- Trace stops at the target or at **Maximum Hops**, whichever comes first; intermediate hops that
  don't reply show as timeouts rather than aborting the trace.
- **Stateless & ad-hoc** — nothing is saved.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6. Do not invent bugs.

## 11. Edge Cases
- Target unreachable — trace should terminate at Maximum Hops with trailing timeouts, not hang.
- Maximum Hops = 1, or a very large value; Timeout at min/max.
- Hostname that fails DNS resolution; IPv6 target.
- Path with hops that block traceroute probes (all-`*` middle hops).
- Empty required field; rapid re-run.
