---
screen: Snmp Trap · snmp-trap-listener
module: Settings
category: snmp-trap
route: "/settings/snmp-trap/snmp-trap-listener"
build: 8.2.6
status: draft                        # create-form FIELDS now documented (§4); their LOCATORS still unharvested
sources: [catalog, kb, docs, live]   # locators/catalog/settings_snmp_trap_snmp_trap_listener.json · known_issues/customer-issue-kb.md §7 · docs.motadata.com SNMP-Trap-Listener · live app 8.2.3 (2026-04-05)
verified: 2026-07-09                 # 8.2.6 baseline; docs/live additions merged 2026-08-07
---

> Module context — architecture, processing pipeline, prerequisite chain and test coverage:
> [`../../TrapExplorer/README.md`](../../TrapExplorer/README.md).

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

> The **create-listener form fields were not captured in the catalog sweep**. The product docs give the
> field set below; **the locators still must be harvested live** before writing tests against the create
> flow. The v3 credential sub-fields are the exact ones the KB trap-invisibility bug turns on.

**Create-form fields (source: docs):**

| SNMP version | Fields |
|---|---|
| v1 / v2c | Profile Name · Description · **Community String** · Port (UDP) |
| v3 | Profile Name · Description · **Security Username** · **Security Level** · Port (UDP) |

**SNMPv3 security levels** — each reveals a different conditional field set, so all three are distinct
test paths:

| Level | Auth | Privacy | Extra fields |
|---|---|---|---|
| `noAuthNoPriv` | ✗ | ✗ | none |
| `authNoPriv` | ✓ | ✗ | Auth Protocol · Auth Password |
| `authPriv` | ✓ | ✓ | Auth Protocol · Auth Password · Privacy Protocol · Privacy Password |

**Default listener (observed 8.2.3):** one listener named `Default`, no description, SNMP version
`V1/V2c, V3`, ports `1620, 1630`. Grid paginates at 50/page and sorts by NAME ascending.

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
- **Port** — required; valid UDP port. **Ports are exclusive: the same port cannot be reused across
  listeners** (source: docs), so a duplicate-port create must be rejected.
  - ⚠️ **Unresolved default.** This doc previously assumed the SNMP standard **162** — that was never
    verified. The live app ships the `Default` listener on **1620 (v1/v2c)** and **1630 (v3)**
    (observed 8.2.3), matching the product docs. Treat **1620/1630** as the observed default and `162`
    as an unconfirmed assumption; **re-verify on 8.2.6 before writing port-binding tests.**
- **SNMP Version** — required (v1 / v2c / v3).
- **Community (v1/v2c)** / **Security Username + Security Level (v3)** — required per version; the v3
  auth/privacy sub-fields appear conditionally on Security Level (§4).
- **Name** — required, likely unique. TODO(source: docs).

## 9. Business Rules
- The listener's **SNMP version + credentials must match what the device sends**, or traps are dropped
  (this is the crux of the KB trap-invisibility bug).
- **Port exclusivity** — one listener per port; ports cannot be shared (source: docs).
- **The v3 listener must be explicitly toggled ON** — it does not start accepting v3 traps merely
  because v3 fields are filled in (source: docs). A likely silent-failure path worth its own test.
- A **`Default` listener ships pre-configured** covering both v1/v2c and v3 (observed 8.2.3).
- TODO(source: Motadata KG) — whether the shipped Default listener is enabled out of the box.

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
- Two listeners on the same port — must be **rejected** (port exclusivity, §9).
- Non-standard port; privileged-port permission on the host.
- Delete the only listener while devices are actively sending traps.
- v3 fields fully configured but the **v3 toggle left OFF** — traps silently not received.
- Each SNMPv3 security level in turn (`noAuthNoPriv` / `authNoPriv` / `authPriv`), asserting the
  conditional fields appear and disappear correctly.
- SNMPv3 with a wrong username, wrong auth password, or mismatched privacy protocol.
- Edit the shipped `Default` listener's ports (1620/1630) — does anything depend on them?
