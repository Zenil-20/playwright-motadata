---
screen: Snmp Trap
module: Settings
category: snmp-trap
route: "/settings/snmp-trap/"
build: 8.2.6
status: draft                        # authored from catalog + TRAP.png + customer-issue-kb; some rules TODO
sources: [catalog, screenshot, kb]   # locators/catalog/settings_snmp_trap.json · screenshots/TRAP.png · known_issues/customer-issue-kb.md §7
verified: 2026-07-09
---

> Module context — architecture, processing pipeline, prerequisite chain and test coverage:
> [`../../TrapExplorer/README.md`](../../TrapExplorer/README.md).

# SNMP Trap Settings

## 1. Purpose
The landing screen for **SNMP Trap** configuration under Settings. It is the entry point to the three
building blocks that make trap monitoring work: **Trap Profiles** (recognise a Trap OID and turn it
into a meaningful event), **Trap Listener** (the receiver socket/port + SNMP version/credentials), and
**Trap Forwarder** (relay received traps to another destination). On this route the catalog is the
**Trap Profiles** grid — the SNMP Trap root defaults to the profiles list.

- **Business objective:** let network teams ingest asynchronous SNMP traps from devices, classify them
  by Trap OID into named, actionable events, and optionally forward them onward. The **Trap Explorer**
  (TRAP.png) is the downstream viewer — it shows received traps (Trap Name, Trap OID, Source, Vendor,
  Count, Message, Timestamp, Acknowledged) and a per-row **Create Trap** action, which is where a raw
  received trap becomes a Trap Profile defined here.
- **Screen description:** a searchable grid of SNMP Trap Profiles with **Create SNMP Trap Profile**.
- **Primary use cases:** define a trap profile for a device's Trap OID, review which profiles exist and
  how many places use each (Used Count), branch to Listener/Forwarder config.
- **Who uses it:** network/monitoring administrators.
- **Dependencies:** an active **Trap Listener** receiving on the configured port/version · devices
  configured to send traps to AIOps with correct community/SNMPv3 credentials.

## 2. Navigation
```
Settings → SNMP Trap
```
- **Breadcrumb:** Settings › SNMP Trap
- **Sibling screens:** SNMP Trap Profiles · SNMP Trap Listener · SNMP Trap Forwarder
- **URL:** `/settings/snmp-trap/` (SPA — resolves to the Trap Profiles grid)
- **Related (not this screen):** the **Trap Explorer** viewer (TRAP.png), reached from the monitoring
  navigation, shows live/received traps and offers **Create Trap** to seed a profile.

## 3. Actions
- **Create SNMP Trap Profile** — `#btn-create-trap-profile` (button "Create SNMP Trap Profile")
- **Search** profiles — `input[placeholder="Search"]` / `input[name="search-trap-profile"]`
- **Row actions** — `[data-cy='grid-action']` (edit / delete — exact items TODO(source: KG))

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Create SNMP Trap Profile | `#btn-create-trap-profile` |
| Search | `input[placeholder="Search"]` · `input[name="search-trap-profile"]` |
| Row action menu | `[data-cy='grid-action']` |
| Grid columns | SNMP Trap Profile Name · Trap OID · Used Count · Actions |

> This root route's catalog is identical to `snmp-trap/snmp-trap-profiles` — the two docs describe the
> same Trap Profiles grid.

_Locators: see `knowledge/locators/catalog/settings_snmp_trap.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Monitoring-admin scoped** — creating trap profiles/listeners is administrative.
  TODO(source: KG/docs) — exact role; whether Viewer sees the grid read-only.
- **License/module gating:** TODO(source: docs) — whether trap monitoring is separately licensed.

## 6. Entry Conditions
- Logged in; Settings reachable.
- For traps to actually arrive, a **Trap Listener** must be up on the expected port and SNMP version.

## 7. Exit Conditions
- **Create profile (success):** new profile appears with its Trap OID and a Used Count; received traps
  matching that OID are classified under it in Trap Explorer. TODO(source: KG) confirm toast.
- **Search:** grid narrows; no persistence.

## 8. Validations
- TODO(source: docs) — grid is search only; field validations live on the create-profile form
  (Trap OID format, unique name). See `snmp-trap-profiles.md`.

## 9. Business Rules
- A profile maps a **Trap OID** to a named, human-readable trap; **Used Count** shows dependency usage.
- Trap classification depends on the device sending the **correct community string / SNMPv3 username**
  to a listening port (see Known Bugs).
- TODO(source: Motadata KG) — profile name/OID uniqueness; default profiles shipped.

## 10. Known Bugs
From `customer-issue-kb.md` §7 (Log / Flow / Trap Explorers):
- **Traps visible in tcpdump but not in Trap Explorer.** `issue:` device is sending traps but they
  never appear (PQD-33528). `diagnosis:` **wrong SNMPv2c community string**, or **SNMPv3 traps sent
  with a blank username**. `workaround:` correct the community/v3 credentials on both the device and
  the receiver (Trap Listener), and validate in the **Live Trap** screen. → A profile can be perfect
  yet show nothing if the Listener credentials/version don't match the sender.
- Related (KB §5, policy side): a **trap policy could not add a source** (PQD-39582 [MOTADATA-8359]) —
  noted for trap-driven alert policies, not this Settings grid itself.

## 11. Edge Cases
- Profile defined but Listener down / wrong port → no traps classified.
- SNMPv2c community mismatch or blank SNMPv3 username → traps silently dropped (KB §7).
- Duplicate Trap OID across two profiles (ambiguous classification).
- Very high trap volume (TRAP.png shows counts in the thousands, e.g. 1468) — grid/search performance.
- Delete a profile with Used Count > 0.
