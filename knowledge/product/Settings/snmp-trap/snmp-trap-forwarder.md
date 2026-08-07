---
screen: Snmp Trap · snmp-trap-forwarder
module: Settings
category: snmp-trap
route: "/settings/snmp-trap/snmp-trap-forwarder"
build: 8.2.6
status: draft                        # create-form FIELDS now documented (§4); their LOCATORS still unharvested
sources: [catalog, kb, docs]         # locators/catalog/settings_snmp_trap_snmp_trap_forwarder.json · known_issues/customer-issue-kb.md §7,§5 · docs.motadata.com SNMP-Trap-Forwarder
verified: 2026-07-09                 # 8.2.6 baseline; docs additions merged 2026-08-07
---

> Module context — architecture, processing pipeline, prerequisite chain and test coverage:
> [`../../TrapExplorer/README.md`](../../TrapExplorer/README.md).

# SNMP Trap · Trap Forwarder

## 1. Purpose
The configuration of **SNMP Trap Forwarders** — rules that relay traps AIOps receives on to another
destination host:port (e.g. an upstream NMS, a manager-of-managers, or a SIEM). A forwarder ties
selected **SNMP Trap Profiles** to a **Destination IP/Host** and **Port**, so specific classified traps
are re-emitted downstream.

- **Business objective:** integrate AIOps into a larger monitoring hierarchy by passing traps upward or
  sideways, so a single receiver doesn't become a dead end for trap data.
- **Screen description:** a searchable grid with **Create SNMP Trap Forwarder**, showing Forwarder Name,
  the SNMP Trap Profiles it forwards, Destination IP/Host, and Port.
- **Primary use cases:** create a forwarder selecting which trap profiles to relay and to which
  destination; review/edit/delete forwarders.
- **Who uses it:** network/monitoring administrators integrating with upstream systems.
- **Dependencies:** existing **SNMP Trap Profiles** to select · a reachable destination host:port · a
  Trap Listener actually receiving the traps to be forwarded.

## 2. Navigation
```
Settings → SNMP Trap → SNMP Trap Forwarder
```
- **Breadcrumb:** Settings › SNMP Trap › SNMP Trap Forwarder
- **Sibling screens:** SNMP Trap Profiles · SNMP Trap Listener
- **URL:** `/settings/snmp-trap/snmp-trap-forwarder`

## 3. Actions
- **Create SNMP Trap Forwarder** — `#btn-create-trap-forwarding`
- **Search** — `input[placeholder="Search"]` / `input[name="search-trap-forwarding"]`
- **Row actions** — edit / delete (per-row **Actions** column; no `data-cy` grid-action hook was
  captured on this route — harvest the row controls live. TODO(source: KG))

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Create SNMP Trap Forwarder | `#btn-create-trap-forwarding` |
| Search | `input[placeholder="Search"]` · `input[name="search-trap-forwarding"]` |
| Grid columns | SNMP Trap Forwarder Name · SNMP Trap Profiles · Destination IP/Host · Port · Actions |

> The **create-forwarder form fields were not captured** in this catalog sweep (grid + create button
> only). The product docs give the field set below; **the locators still must be harvested live**.

**Create-form fields (source: docs):** Forwarder Name · **SNMP Trap Profiles (multi-select)** ·
Destination IP · Port · Type · SNMP Version · Community.

This confirms the outbound relay carries **its own SNMP version and community** — it is re-encoded for
the destination, not passed through verbatim, so inbound and outbound SNMP settings are independent
and must be tested as such.

_Locators: see `knowledge/locators/catalog/settings_snmp_trap_snmp_trap_forwarder.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Monitoring-admin scoped** — configuring outbound relay is administrative. TODO(source: KG/docs).
- License gating: TODO(source: docs).

## 6. Entry Conditions
- Logged in; SNMP Trap area reachable.
- At least one **SNMP Trap Profile** exists to select for forwarding.
- The destination host:port is reachable from the forwarding component.

## 7. Exit Conditions
- **Create (success):** forwarder appears in the grid with its profiles/destination/port; matching
  received traps are relayed. TODO(source: KG) confirm toast and how to verify delivery downstream.
- **Delete:** relay stops.

## 8. Validations
- **Destination IP/Host** — required; valid IP or resolvable host. TODO(source: docs).
- **Port** — required; valid port. TODO(source: docs).
- **SNMP Trap Profiles** — at least one selected (a forwarder with no profiles forwards nothing).
  TODO(source: docs) confirm.
- **Forwarder Name** — required, likely unique. TODO(source: docs).

## 9. Business Rules
- A forwarder relays only the **selected Trap Profiles** to the destination — profiles are the filter.
  **Multiple profiles per forwarder** are supported (source: docs).
- Forwarding depends on traps first being **received** (a working Listener) and **classified** to a
  selected profile.
- **Forwarding is non-blocking — local ingestion ALWAYS occurs** (source: docs). An unreachable
  destination, a wrong port, or a failed relay must never remove the trap from Trap Explorer. Any test
  asserting forwarding failure must also assert the trap is still present locally.
- The relay carries its **own SNMP Version and Community** (§4), independent of the inbound listener.
- Each referenced profile's **Used Count** reflects forwarder references (see
  `snmp-trap-profiles.md` §9).
- TODO(source: Motadata KG) — the `Type` field's enumeration, and name/destination uniqueness rules.

## 10. Known Bugs
- **None recorded for this exact screen.** The closest cited items are trap-adjacent, not forwarder
  defects: (KB §7, PQD-33528) traps not visible when Listener community/v3 credentials mismatch — a
  forwarder can only relay what the Listener receives; and (KB §5, PQD-39582 [MOTADATA-8359]) a **trap
  *policy* could not add a source**, which concerns alert policies rather than this Settings forwarder.
  Do not treat either as a confirmed forwarder bug.

## 11. Edge Cases
- Create a forwarder with no profiles selected (forwards nothing).
- Unreachable destination IP/host or blocked port — traps never delivered, but **must still appear in
  Trap Explorer** (non-blocking, §9). This is the key assertion for the whole screen.
- Delete a forwarder while it is actively forwarding.
- Outbound SNMP Version / Community mismatched to what the destination expects.
- One forwarder with many profiles vs. many forwarders sharing one profile (Used Count accuracy).
- Destination = the AIOps host itself (loop).
- High trap volume causing forwarding backlog.
- Forward a profile that is later deleted (dangling reference).
- Invalid IP / unresolvable hostname; port out of range.
