---
screen: Snmp Trap · snmp-trap-profiles
module: Settings
category: snmp-trap
route: "/settings/snmp-trap/snmp-trap-profiles"
build: 8.2.6
status: draft                        # authored from catalog + TRAP.png + customer-issue-kb §7; create-form fields TODO
sources: [catalog, screenshot, kb]   # locators/catalog/settings_snmp_trap_snmp_trap_profiles.json · screenshots/TRAP.png · known_issues/customer-issue-kb.md §7
verified: 2026-07-09
---

# SNMP Trap · Trap Profiles

## 1. Purpose
The catalog of **SNMP Trap Profiles** — each maps a device's **Trap OID** to a named, meaningful trap
so that raw incoming SNMP traps become classified, searchable, and alert-able events instead of opaque
OIDs. This is the same grid the SNMP Trap root resolves to.

- **Business objective:** translate vendor Trap OIDs (e.g. Cisco `clogMessageGenerated`,
  `ciscoConfigManEvent`, `.1.3.6.1.4.1.9.0.1` as seen in TRAP.png) into human-readable trap definitions
  that downstream alerting and the Trap Explorer can use.
- **Screen description:** a searchable grid with **Create SNMP Trap Profile**, showing Profile Name,
  Trap OID, and Used Count.
- **Primary use cases:** create a profile for a new Trap OID (often via **Create Trap** from a received
  trap in Trap Explorer), review/edit existing profiles, see Used Count before editing/deleting.
- **Who uses it:** network/monitoring administrators.
- **Dependencies:** a running Trap Listener (to receive the trap) · devices sending traps with correct
  credentials.

## 2. Navigation
```
Settings → SNMP Trap → SNMP Trap Profiles
```
- **Breadcrumb:** Settings › SNMP Trap › SNMP Trap Profiles
- **Sibling screens:** SNMP Trap Listener · SNMP Trap Forwarder
- **URL:** `/settings/snmp-trap/snmp-trap-profiles` (also the target of `/settings/snmp-trap/`)
- **Alternate create path:** Trap Explorer → per-row **Create Trap** (TRAP.png) pre-fills a profile
  from a received trap. TODO(source: KG) confirm pre-fill behavior.

## 3. Actions
- **Create SNMP Trap Profile** — `#btn-create-trap-profile`
- **Search** — `input[placeholder="Search"]` / `input[name="search-trap-profile"]`
- **Row actions** — `[data-cy='grid-action']` (edit / delete; exact items TODO(source: KG))

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Create SNMP Trap Profile | `#btn-create-trap-profile` |
| Search | `input[placeholder="Search"]` · `input[name="search-trap-profile"]` |
| Row action menu | `[data-cy='grid-action']` |
| Grid columns | SNMP Trap Profile Name · Trap OID · Used Count · Actions |

> The **create-profile form fields were not captured** in this sweep (only the grid + create button).
> Expected fields — Profile Name, Trap OID, varbind/message mapping, severity — must be harvested live
> before writing tests against the create flow. TODO(source: KG).

_Locators: see `knowledge/locators/catalog/settings_snmp_trap_snmp_trap_profiles.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Monitoring-admin scoped** for create/edit/delete. TODO(source: KG/docs) — read-only for other roles.
- License gating: TODO(source: docs).

## 6. Entry Conditions
- Logged in; SNMP Trap area reachable.
- For end-to-end verification, a Trap Listener must be receiving matching traps.

## 7. Exit Conditions
- **Create (success):** profile appears with Trap OID + Used Count 0; subsequent matching traps are
  classified under it in Trap Explorer. TODO(source: KG) confirm toast/redirect.
- **Delete:** removed; TODO(source: KG/docs) — behavior when Used Count > 0 (blocked/warned).

## 8. Validations
- **Profile Name** — required; likely unique. TODO(source: docs).
- **Trap OID** — required; must be a valid dotted OID (e.g. `.1.3.6.1.4.1.9.9.41.2.0.1`).
  TODO(source: docs) confirm format enforcement + uniqueness.
- TODO(source: docs) — remaining create-form field rules (not captured).

## 9. Business Rules
- One profile ↔ one **Trap OID** classification; **Used Count** tracks how many consumers reference it.
- A trap only classifies if the sending device's credentials/version match the **Listener** — the
  profile alone does not make traps appear (see Known Bugs).
- TODO(source: Motadata KG) — Trap OID uniqueness across profiles; shipped default profiles; varbind
  mapping to message.

## 10. Known Bugs
From `customer-issue-kb.md` §7 (Log / Flow / Trap Explorers):
- **Traps in tcpdump but not in Trap Explorer** (PQD-33528). `diagnosis:` wrong SNMPv2c community
  string, or SNMPv3 traps sent with a blank username. `workaround:` fix community/v3 credentials on
  device + Trap Listener and validate in the **Live Trap** screen. → A correct profile still shows no
  data if Listener credentials/version mismatch the sender.

## 11. Edge Cases
- Create a profile whose Trap OID no device ever sends (Used Count stays 0, never fires).
- Duplicate / overlapping Trap OID across profiles.
- Malformed OID string; extremely long OID.
- Enterprise-specific vs standard OID (`.1.3.6.1.4.1.<enterprise>...`).
- High-volume trap OID (thousands/hour per TRAP.png) — classification/search performance.
- Delete a profile currently referenced by an alert policy or forwarder.
