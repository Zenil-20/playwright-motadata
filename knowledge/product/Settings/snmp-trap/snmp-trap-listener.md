---
screen: Snmp Trap · snmp-trap-listener
module: Settings
category: snmp-trap
route: "/settings/snmp-trap/snmp-trap-listener"
build: 8.2.6
status: draft                        # authored from catalog + customer-issue-kb §7; create-form fields TODO
sources: [catalog, kb]               # locators/catalog/settings_snmp_trap_snmp_trap_listener.json · known_issues/customer-issue-kb.md §7
verified: 2026-07-09
---

# SNMP Trap · Trap Listener

## 1. Purpose
The configuration of **SNMP Trap Listeners** — the receiver endpoints that AIOps opens to accept
inbound SNMP traps. A listener declares the **port**, the **SNMP version**, and (per version) the
community string or SNMPv3 credentials that inbound traps must match. Without a correctly configured,
running listener, no trap is ever received — regardless of how many Trap Profiles exist.

- **Business objective:** stand up the socket(s) that receive device traps, with the exact SNMP version
  and credentials the devices use, so traps are accepted and passed to classification.
- **Screen description:** a searchable grid with **Create SNMP Trap Listener**, showing Name,
  Description, SNMP Version, and Port.
- **Primary use cases:** create a listener on the standard trap port (162) or a custom port, for a given
  SNMP version; review/edit/delete listeners.
- **Who uses it:** network/monitoring administrators.
- **Dependencies:** OS/firewall must permit the chosen UDP port to the collector/receiver · devices
  configured to send traps to this host:port with matching credentials.

## 2. Navigation
```
Settings → SNMP Trap → SNMP Trap Listener
```
- **Breadcrumb:** Settings › SNMP Trap › SNMP Trap Listener
- **Sibling screens:** SNMP Trap Profiles · SNMP Trap Forwarder
- **URL:** `/settings/snmp-trap/snmp-trap-listener`

## 3. Actions
- **Create SNMP Trap Listener** — `#btn-create-trap-listener`
- **Search** — `input[placeholder="Search"]` / `input[name="search-trap-listener"]`
- **Row actions** — `[data-cy='grid-action']` (edit / delete; exact items TODO(source: KG))

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Create SNMP Trap Listener | `#btn-create-trap-listener` |
| Search | `input[placeholder="Search"]` · `input[name="search-trap-listener"]` |
| Row action menu | `[data-cy='grid-action']` |
| Grid columns | NAME · DESCRIPTION · SNMP VERSION · PORT · ACTIONS |

> The **create-listener form fields were not captured** (grid + create button only). Expected fields —
> Name, Description, SNMP Version (v1/v2c/v3), Port, and version-conditional credentials (community for
> v1/v2c; user/auth/priv for v3) — must be harvested live. The v3 credential sub-fields are the exact
> ones the KB trap-invisibility bug turns on. TODO(source: KG).

_Locators: see `knowledge/locators/catalog/settings_snmp_trap_snmp_trap_listener.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Monitoring-admin scoped** — opening a receiver port is administrative. TODO(source: KG/docs) — role.
- License gating: TODO(source: docs).

## 6. Entry Conditions
- Logged in; SNMP Trap area reachable.
- The chosen port must be free and permitted by the host firewall.

## 7. Exit Conditions
- **Create (success):** listener appears in the grid with its Version + Port and begins accepting
  matching traps; verify arrivals in the Live Trap / Trap Explorer view. TODO(source: KG) confirm toast.
- **Delete:** listener stops receiving on that port.

## 8. Validations
- **Port** — required; valid port number (default trap port 162). TODO(source: docs) — range check and
  duplicate-port prevention across listeners.
- **SNMP Version** — required (v1 / v2c / v3). TODO(source: docs).
- **Community (v1/v2c)** / **User + auth/priv (v3)** — required per version. TODO(source: docs) confirm
  the conditional field set and any auth/priv protocol choices.
- **Name** — required, likely unique. TODO(source: docs).

## 9. Business Rules
- The listener's **SNMP version + credentials must match what the device sends**, or traps are dropped
  (this is the crux of the KB trap-invisibility bug).
- TODO(source: Motadata KG) — whether multiple listeners can share a port, default port, and whether a
  default listener ships enabled.

## 10. Known Bugs
From `customer-issue-kb.md` §7 (Log / Flow / Trap Explorers):
- **Traps received at the OS (tcpdump) but never appear in Trap Explorer** (PQD-33528). `diagnosis:`
  wrong SNMPv2c **community string**, or SNMPv3 traps sent with a **blank username** — i.e. a
  listener-credential/version mismatch. `workaround:` align the community/v3 credentials between the
  sending device and this listener; validate in the **Live Trap** screen. → This screen is the primary
  place that root cause is fixed.

## 11. Edge Cases
- Create a listener on a port already in use / blocked by firewall.
- SNMP version mismatch (device sends v2c, listener configured v3, or vice-versa).
- Blank/incorrect community or v3 username → silent drop (KB §7).
- Two listeners on the same port (conflict).
- Non-standard port (not 162); privileged-port permission on the host.
- Delete the only listener while devices are actively sending traps.
