---
screen: Utility (overview)
module: Settings
category: utility
route: "/settings/utility/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Settings — Utility (overview)

## 1. Purpose
The **Utility** section of Settings is a suite of **ad-hoc network & credential diagnostic tools** an
administrator runs on demand to test connectivity, name resolution, and credential validity against a
target device — *before, during, or after* discovery/monitoring, when data is missing or a device
won't provision.

- **Business objective:** give operators a first-line troubleshooting toolbox inside the product (no
  shelling into the collector) so "device down / no data / invalid credential" tickets can be
  reproduced and root-caused from the UI. This directly targets the top KB hotspot — credential /
  permission and SNMP-transport failures (customer-issue-kb §1).
- **Screen description:** the landing route `/settings/utility/` opens the **Ping** tool by default;
  a left-nav lists the sibling tools. Each tool is a small stateless form with a **Test** and a
  **Reset** button; results render below the form. Nothing is persisted.
- **The tool suite (each is its own screen, documented separately):**
  - **Ping** — ICMP reachability (`/settings/utility/ping`)
  - **TraceRoute** — hop-by-hop path trace (`/settings/utility/traceroute`)
  - **Telnet** — TCP port reachability (`/settings/utility/telnet`)
  - **DNS Resolver** — hostname ⇄ IP resolution (`/settings/utility/dns-resolver`)
  - **MAC Address Resolver** — resolve MAC for an IP (`/settings/utility/mac-address-resolver`)
  - **SNMP Ping** — SNMP-level reachability for an existing Monitor (`/settings/utility/snmp-ping`)
  - **SNMP Community Check** — validate SNMP credential/community (`/settings/utility/snmp-community-check`)
  - **SNMP Walk** — walk an OID subtree (`/settings/utility/snmp-walk`)
  - **CLI Command** — run a CLI command over SSH/Telnet (`/settings/utility/cli-command`)
  - **Power Shell Command** — run a PowerShell command via WinRM (`/settings/utility/power-shell-command`)
- **Primary use cases:** confirm a device is reachable; verify a credential profile works; check a
  DNS entry; test whether SNMP responds and returns data before adding a monitor.
- **Who uses it:** administrators / support engineers troubleshooting discovery & monitoring.
- **Dependencies:** an authenticated session with Settings access · a **collector/poller** able to
  reach the target (the test runs *from* the collector, not the browser) · for credential-based tools
  a valid **Credential Profile** (SNMP / SSH / WinRM); for SNMP Ping an existing **Monitor**.

## 2. Navigation
```
Settings (gear, bottom-left) → Utility → (Ping | TraceRoute | Telnet | DNS Resolver |
   MAC Address Resolver | SNMP Ping | SNMP Community Check | SNMP Walk | CLI Command |
   Power Shell Command)
```
- **Breadcrumb:** Settings › Utility › <tool>
- **URL:** `/settings/utility/` (default landing renders the **Ping** tool; catalog `title` = "Ping").
- **Left-nav search:** the shared Settings shell exposes a **Search** box (placeholder _Search_) to
  filter the settings menu.

## 3. Actions
- **Select a tool** from the Utility left-nav.
- **Enter a target** (IP / hostname / monitor) and any tool-specific parameters.
- **Test** — run the diagnostic and read the result panel.
- **Reset** — clear the form back to defaults.
- **Create Credential Profile** (on credential-based tools) — inline-create a credential without
  leaving the screen (`#create-credential-btn-id`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Settings left-nav + **Search** | shared Settings shell · `input[placeholder="Search"]` |
| Tool form (per screen) | target input + tool-specific fields (see each tool's doc) |
| **Reset** | `#utility-<tool>-reset-btn` |
| **Test** | `#utility-<tool>-test-btn` (SNMP Walk = `…-run-btn`, MAC Resolver = `…-resolve-btn`) |
| **Create Credential Profile** (credential tools) | `#create-credential-btn-id` |
| Credential Profile dropdown (credential tools) | `[data-cy='dropdown-trigger-input']` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_utility*.json` — promote verified ones to the cookbook._

## 5. Permissions
- Utility lives under **Settings**, which is administrator-oriented. Expect **Admin** (and possibly a
  privileged Operator) to view/run these tools; **Viewer** likely cannot.
- TODO(source: KG/docs): exact RBAC — which roles can open Utility and run **Test**; whether the
  **Create Credential Profile** action needs a separate credential-management permission.

## 6. Entry Conditions
- Logged in with access to **Settings → Utility**.
- A **collector/poller** reachable from the app and able to reach the target network.
- Credential-based tools: at least one applicable **Credential Profile** exists (or is created inline).
- SNMP Ping: at least one **Monitor** already exists to select.

## 7. Exit Conditions
- **On Test (success):** a result/output panel renders (reachable, resolved value, command output,
  OID rows…). TODO(source: KG/docs) — confirm exact success rendering per tool.
- **On Test (failure):** an error/timeout message renders (unreachable, invalid credential, no SNMP
  response…). These are the informative negatives worth asserting.
- **On Reset:** form returns to defaults; no server call.
- **Stateless:** the tools do **not** persist input or results and do not create monitors/alerts.

## 8. Validations
- **Target (IP / Host / Monitor):** required before **Test**.
- **Credential Profile:** required on credential-based tools.
- Numeric parameters (TCP Port, Maximum Hops, Timeout, SNMP Retries) must be numeric / in range.
- TODO(source: docs) — exact per-field formats and inline error copy (documented per tool).

## 9. Business Rules
- **Runs from the collector**, so a result reflects **collector→target** reachability & firewall
  posture, not the browser's — a common source of "works on my laptop, fails in product" confusion.
- **Credential-based tools require a matching credential type** (SNMP for SNMP tools, SSH for CLI,
  WinRM for PowerShell); a wrong-type profile fails.
- **Ad-hoc & stateless** — no persistence, no audit-worthy state change (TODO(source: KG) confirm
  whether an audit entry is written for a run).
- TODO(source: KG/docs): whether a collector can be chosen, or the tool always uses the default/first.

## 10. Known Bugs
**None recorded for this screen** (the Utility diagnostic tools) in `customer-issue-kb.md` for build 8.2.6.
> Context (not defects in this screen) — the conditions these tools exist to diagnose are heavy KB
> hotspots: credential/permission failures blocking discovery (customer-issue-kb §1, e.g. PQD-32697,
> PQD-38137), SNMP response-IP ≠ request-IP and multi-minute SNMP walks (PQD-33921), and wrong SNMP
> community strings (§7, PQD-33528). Use the matching Utility tool to reproduce these. Do not invent bugs.

## 11. Edge Cases
- Target unreachable / firewalled at the collector; DNS name that doesn't resolve.
- Credential profile of the wrong type or with drifted credentials.
- Very slow SNMP target (walk > several minutes) hitting the tool timeout.
- Switching tools mid-run; running **Test** twice quickly; empty required field.
- IPv6 targets; hostname vs. raw IP; leading/trailing spaces in the target.
