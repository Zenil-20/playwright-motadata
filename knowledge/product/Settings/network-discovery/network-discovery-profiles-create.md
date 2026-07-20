---
screen: Discovery · network-discovery-profiles-create
module: Settings
category: network-discovery
route: "/settings/network-discovery/network-discovery-profiles/create"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_network_discovery_network_discovery_profiles_create.json · "network discovery with ncm.png"/"without ncm.png","linux discovery.png","aws discovery.png","database.png" · customer-issue-kb §1
verified: 2026-07-10
---

# Discovery · Create Discovery Profile

## 1. Purpose
The **wizard that defines and launches a discovery scan**. You pick a device type from a left-nav
catalog (Server, Cloud, Network, SDN, Virtualization, HCI, Storage, Database, Service Check, Wireless,
Container Orchestration, Other), enter the target(s), choose a collector and credentials, tune the
protocol parameters, then save/schedule/run. Running provisions discovered devices as monitors.

- **Business objective:** onboard a device or a range of devices into monitoring in one guided form,
  with type-specific parameters so each technology is polled correctly.
- **Screen description (from `network discovery with/without ncm.png`, `linux discovery.png`,
  `aws discovery.png`, `database.png`):** a header **Create Discovery Profile** with a left-nav device
  catalog and a form that **changes its parameter section by device type** (e.g. "Discovery Parameters
  of Linux", "…Of AWS Cloud", "…of Database"). A right-hand **Discovery Help Card** (Supported
  Platforms, Network & Connectivity Requirements, Credential Requirements and Permissions, Discovery
  Mechanisms) appears for some types.
- **Primary use cases:** discover a single host, an IP range, a CIDR block, or a CSV of targets;
  register cloud accounts (AWS/Azure/O365/Oracle/Google); onboard databases, VMware/Hyper-V, etc.
- **Who uses it:** monitoring admins/operators. TODO(source: KG/docs) — exact create permission.
- **Dependencies:** a reachable **Collector**, a **Credential Profile** (can be created inline via
  **Create Credential Profile**), network reachability + correct ports, and the Discovery module.

## 2. Navigation
```
Settings → Discovery → Network Discovery Profiles → Create Discovery Profile
```
- **Breadcrumb / header:** ‹ Create Discovery Profile (back arrow returns to the profiles grid)
- **URL:** `/settings/network-discovery/network-discovery-profiles/create`
- **Device type** is chosen from the left catalog nav (Server ▸ Linux/Unix, Windows; Cloud ▸ AWS/
  Azure/Office 365/Oracle/Google; Network; SDN ▸ Cisco Catalyst SD-WAN/Meraki/ACI/VMware NSX-T;
  Virtualization ▸ VMware/Hyper-V/Citrix Xen/Proxmox VE/KVM; HCI; Storage; Database; Service Check;
  Wireless; Container Orchestration; Other).

## 3. Actions
- **Select device type** (left-nav catalog) — swaps the parameter section.
- **Choose addressing mode** — tabs **IP/Host · IP Range · CSV · CIDR** (the 4 radios in the catalog).
- **Create Credential Profile** — inline create without leaving the wizard (`#create-credential-btn-id`).
- **Toggle** Network Config Management (NCM), Ping Check, Interface Discovery, Run Topology, and
  (cloud) Discover Down instances — as offered per type.
- **Save and Exit** (`#save-exit-btn-id`) · **Save and Schedule** (`#save-schedule-btn-id`) ·
  **Save and Run** (`#save-run-btn-id`) · **Reset** (`#reset-btn-id`).

## 4. Components
Fields shown depend on the selected device type. Observed layouts:

**Common (network/host types — `network discovery with ncm.png`):**
| Component | Control |
|---|---|
| Discovery Profile Name * | `input[name='profile-name']` `#profile-id` — hint _"Must be unique"_ |
| Addressing mode | Tabs **IP/Host · IP Range · CSV · CIDR** (4 radios) |
| IP/Host * | `input[name='ip-address']` `#ip-address-id` — placeholder _"e.g. 192.168.1.1 or fd00::1"_ |
| Collector Type * | dropdown (default **Collector**) |
| Collectors | dropdown (_Select_) — ⓘ hint |
| Groups * | dropdown (default **Network** for network type) |
| Credential Profiles * | dropdown (_Select_) — ⓘ hint |
| Create Credential Profile | `#create-credential-btn-id` |
| Network Config Management (NCM) | toggle (`#ping-check-btn` id is reused for a toggle in catalog — verify) |
| Tags | `Add Tags` multi-select |
| SNMP Port * | text (default **161**) |
| Retry Count * | text (default **2**) |
| SSH Port * | text (default **22**) — *shown when NCM is ON* |
| Telnet Port | text (default **23**) — *shown when NCM is ON* |
| Ping Check | toggle (default **ON**) |
| Interface Discovery | toggle (default **ON**) |
| Run Topology | toggle (default **OFF**) |
| Notify | text — placeholder _"@User or Email or /Handle or #User Profile or Mobile Number"_ |
| Save and Exit / Save and Schedule / Save and Run / Reset | see §3 for ids |

**Server ▸ Linux/Unix (`linux discovery.png`):** "Discovery Parameters of Linux" — **Port \*** (default
**22**) and **Ping Check** (ON). No SNMP/SSH/Telnet split; simpler than the network type.

**Cloud ▸ AWS (`aws discovery.png`):** no IP/Host. Adds **Discover Down instances** (toggle OFF),
**Regions \*** (dropdown, e.g. _North America > us-east-1 (+28)_) and **Resources to be Monitored**
(dropdown, default _Monitor All Resources_). Groups default **Cloud**.

**Database (`database.png`):** **Database Type \*** (e.g. _Oracle RAC Cluster_), **Scan IP/Host \***,
**Database Service Name \***, Groups default _Database > <type>_, **Port \*** (e.g. **1521** for Oracle).

> **NCM ON vs OFF** — the two `network discovery with/without ncm.png` captures differ only by the
> **Network Config Management** toggle: ON reveals **SSH Port** and **Telnet Port**; OFF hides them.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Create Discovery Profile). Many dropdowns use `[data-cy='dropdown-trigger-input']` — scope by label._

## 5. Permissions
- Create/run discovery — admin/operator capability. TODO(source: KG/docs) — exact role.
- Credential Profiles the user can select may be scoped by role/group. TODO(source: KG).

## 6. Entry Conditions
- Logged in; Discovery module enabled.
- A **Collector** is registered and up.
- A **Credential Profile** exists (or is created inline) matching the target's protocol.
- Target reachable from the collector on the relevant port(s).

## 7. Exit Conditions
- **Save and Exit:** profile saved; returns to the profiles grid with the new row.
- **Save and Schedule:** profile saved with a schedule; scheduler column reflects it.
- **Save and Run:** profile saved and a discovery run starts immediately; discovered devices become
  monitors; the grid's **Status/Discovered Objects** update. TODO(source: KG) confirm success toast.
- **Reset:** form clears back to defaults; no server call.

## 8. Validations
- **Discovery Profile Name** — required, **must be unique** (placeholder _"Must be unique"_).
- **IP/Host** — required for host/network types; format hint _"e.g. 192.168.1.1 or fd00::1"_ (accepts
  IPv4 and IPv6). IP Range / CIDR / CSV modes impose their own format. TODO(source: docs) exact rules.
- **Collector Type / Groups / Credential Profiles** — required (`*`).
- **SNMP Port / Retry Count / SSH Port** — required (`*`) on the network type; numeric ports.
- **Database:** Database Type, Scan IP/Host, Database Service Name, Port required.
- **Cloud:** Regions required (`*`).
- TODO(source: docs): port numeric ranges (1–65535), CSV schema, max targets per profile.

## 9. Business Rules
- The **parameter section is device-type-specific** — selecting a type in the left nav changes which
  fields/toggles render (Linux → Port only; AWS → Regions + Resources; Database → Type/Service/Port).
- **NCM ON adds SSH + Telnet ports** to Discovery Parameters (config backup needs CLI access).
- **Ping Check** and **Interface Discovery** default **ON**; **Run Topology** defaults **OFF**.
- Default ports are protocol-standard: SNMP **161**, SSH **22**, Telnet **23**, Oracle DB **1521**.
- Profile **name must be unique** (see §8).
- TODO(source: KG/docs): whether a Credential Profile must match the selected protocol before save;
  whether Save and Run is blocked when no collector is reachable.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` §1 (Discovery — the single biggest ticket source):
- **Credential / permission problems block discovery** (13x; PQD-30159, PQD-32697, PQD-38137,
  PQD-39521): read-only vs admin creds (Cisco WLC), changed profiles (ESXi timeout), WinRM/AD
  username format, PAM `pam_faillock` lockouts. **Fix/workaround:** correct credential scope, WinRM/
  non-admin SOPs, SSH key auth, whitelist the poller.
- **SSH/TLS algorithm & auth mismatches** (5x; PQD-29912, PQD-31138, PQD-33284, PQD-36217): missing
  KEX (`diffie-hellman-group-exchange-sha256`), ACI TLS_RSA drop, WinRM-HTTPS gap. **Fix:** add KEX;
  `"plugin.engine": "python"` for HTTPS WinRM (8.1.3).
- **SNMP transport failures** (6x; PQD-34689, PQD-33921, PQD-37852): response from a different IP than
  queried (NAT), 24-min SNMP walks, missing Interface-Alias OID. **Fix:** device NAT/binding, higher
  backend timeout, custom exe.
- **Slow targets killed by internal timeout** (PQD-29383, PQD-37125): device answers in 30–40 min but
  the process force-terminates at ~7 min. **Fix:** raise per-monitor timeout, stretch poller interval.
- **Scheduler overload / stuck "Running"** (PQD-34444 [MOTADATA-7320]): consolidate via group-name-in-
  CSV (512/CSV, 8.1.0); disable completed profiles.
- **Antivirus/EDR/firewall blocks discovery** (PQD-35176, PQD-36964): whitelist `/motadata` path + exe.

## 11. Edge Cases
- Duplicate profile name; blank required field (name/IP/collector/credentials) → save blocked.
- Invalid IP, malformed IP Range/CIDR, malformed CSV, IPv6 targets.
- Ports out of range or non-numeric; SNMP/SSH/Telnet swapped.
- NCM toggled ON then OFF before save (SSH/Telnet should not be required when OFF).
- No collector reachable at Save and Run; credential profile of the wrong protocol.
- Cloud: no region selected; "Monitor All Resources" vs a scoped resource set on a huge account.
- Database: wrong Database Type vs. actual engine; non-default service name/port.
- Switching device type mid-edit (do entered values persist or reset?).
- Very large CSV (approach 512-devices/CSV consolidation limit — see Known Bugs).
- Slow/large device (4000-interface switch) — long walk vs. timeout.
