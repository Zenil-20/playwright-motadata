---
screen: Snmp Trap · snmp-trap-profiles
module: Settings
category: snmp-trap
route: "/settings/snmp-trap/snmp-trap-profiles"
build: 8.2.6
status: draft                        # create-form FIELDS now documented (§4); their LOCATORS still unharvested
sources: [catalog, screenshot, kb, docs]   # locators/catalog/settings_snmp_trap_snmp_trap_profiles.json · screenshots/TRAP.png · known_issues/customer-issue-kb.md §7 · docs.motadata.com SNMP-Trap-Profile
verified: 2026-07-09                 # 8.2.6 baseline; docs additions merged 2026-08-07
---

> Module context — architecture, processing pipeline, prerequisite chain and test coverage:
> [`../../TrapExplorer/README.md`](../../TrapExplorer/README.md).

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

> The **create-profile form fields were not captured** in this catalog sweep (grid + create button
> only). The product docs give the field set below; **the locators still must be harvested live**
> before writing tests against the create flow.

**Create-form fields (source: docs):**

| Field | Type | Logic |
|---|---|---|
| Profile Name | text, **required** | Unique identifier |
| Trap OID | OID, **required** | Unique per profile |
| **Filter** | Yes/No, **required** | **Yes = the trap is DROPPED silently. No = ingested normally.** |
| Translator | text | The message displayed in Trap Explorer |
| Severity | selection | Assigned to every trap matching this OID |

⚠️ **`Filter` is the most destructive control on this screen** — see §9.

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
- **Profile Name** — required; unique identifier (source: docs).
- **Trap OID** — required; **unique per profile**; must be a valid dotted OID
  (e.g. `.1.3.6.1.4.1.9.9.41.2.0.1`). TODO(source: docs) confirm format enforcement.
- **Filter** — required (Yes/No). TODO(source: docs) confirm the default; given the drop semantics, a
  default of `Yes` would be a serious footgun and is worth explicitly asserting.
- **Translator** / **Severity** — optional; no constraints documented.

## 9. Business Rules
- One profile ↔ one **Trap OID** classification; **Used Count** tracks how many consumers reference it
  — specifically **forwarder references** (source: docs).
- A trap only classifies if the sending device's credentials/version match the **Listener** — the
  profile alone does not make traps appear (see Known Bugs).
- **`Filter = Yes` silently DROPS every matching trap** (source: docs). The trap is discarded at
  processing step 3 — it never reaches Trap Explorer, never forwards, and never triggers an alert, with
  **no error and no audit surface**. This is the only true data-loss path in trap processing, and it is
  a single Yes/No away from normal operation.
  - Contrast with an **unmatched** OID, which is *not* a drop: it still ingests and appears in Explorer
    with blank name/severity/message. "No profile" and "profile with Filter=Yes" produce opposite
    outcomes and must be tested as separate cases.
- **Inbuilt profiles cannot be deleted** — they may only be **cloned or viewed** (source: docs). A
  delete attempt must fail.
- TODO(source: Motadata KG) — Trap OID uniqueness enforcement across profiles; the shipped inbuilt
  profile list; varbind mapping to message.

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
- Delete a profile currently referenced by an alert policy or forwarder (Used Count > 0).
- **Delete an inbuilt profile — must fail** (§9); confirm Clone and View remain available.
- **`Filter = Yes` end-to-end:** send a matching trap and assert it is absent from Trap Explorer, not
  forwarded, and raises no alert — then flip to `No` and assert it appears.
- Flip `Filter` Yes→No→Yes while traps are arriving (does the change apply to in-flight traps?).
- Used Count after a forwarder that references the profile is edited or deleted.
- Edit a profile's Severity/Translator while matching traps are arriving — do existing rows re-label?
