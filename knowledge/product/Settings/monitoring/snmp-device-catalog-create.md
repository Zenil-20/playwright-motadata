---
screen: Monitoring · snmp-device-catalog-create
module: Settings
category: monitoring
route: "/settings/monitoring/snmp-device-catalog/create"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_monitoring_snmp_device_catalog_create.json · screenshots/"snmp device catalog - create catalog.png" · known_issues/customer-issue-kb.md §1
verified: 2026-07-09
---

# Monitoring — Create SNMP Device Catalog

## 1. Purpose
The **Create SNMP Device Catalog** form defines a new catalog: a **System OID → (Vendor, Type, metric
groups)** map that teaches ObserveOps exactly which OIDs to poll — and under which KPI/counter names — for
a device family. It is the create/edit surface behind the catalog list (`snmp-device-catalog.md`).

- **Business objective:** onboard **non-standard / proprietary devices** so they report correct KPIs by
  supplying the device's actual OIDs, instead of relying on generic template OIDs the device may not answer.
- **Screen description:** a full-page form (`Create SNMP Device Catalog`) with a top identity row —
  **System OID · Name · Vendor · Type** (all marked `*` required in the screenshot) — followed by one or
  more **Metric Group** cards. Each card has a **Metric Group Name**, a **Scalar / Tabular** toggle
  (the 2 radios), a **Test OID Group** button, and an **OID Listing** sub-table of **OID Name → OID** rows
  with **Choose OID**, **Assign Key-Value**, and a `+` to add OID rows. A **Type** dropdown defaults to
  **SNMP Device**. A doc link "Creating a Custom SNMP Device Catalog" sits at the top.
- **Primary use cases:** create a custom catalog for a device with wrong/missing CPU/memory/HW-sensor/VLAN
  KPIs; add computed/converted counters (e.g. memory %, uptime/100); define multiple metric groups per
  catalog (scalar single-value groups and tabular multi-row groups).
- **Who uses it:** monitoring administrators / Motadata support engineers. TODO(source: KG/docs) — exact role.
- **Dependencies:** the SNMP poller (Test OID Group performs a live SNMP query against a device) · a
  reachable target device with valid SNMP credentials for testing · the Vendor list · the catalog store.

## 2. Navigation
```
Settings → Monitor Settings → SNMP Device Catalog → Create SNMP Device Catalog
```
- **Breadcrumb / back:** back-chevron returns to the SNMP Device Catalog list.
- **URL:** `/settings/monitoring/snmp-device-catalog/create`
- **Entry:** `#btn-create-snmp-device-catalog` on the list screen. (Edit likely reuses this form
  pre-filled — TODO(source: KG/docs) confirm edit route.)

## 3. Actions
- Enter **System OID** (`system-oid`, placeholder `.1.3.6.1.4.1.47387`), **Name** (`catalog-name`),
  select **Vendor** and **Type** (dropdowns, `[data-cy='dropdown-trigger-input']`; Type defaults to
  **SNMP Device**).
- **Metric Group** card:
  - **Metric Group Name** (`metric-group-name`, hint _"Must be unique within the catalog"_).
  - Toggle **Scalar / Tabular** (the 2 radios) — scalar = single-value OIDs, tabular = table/indexed OIDs.
  - **Test OID Group** — `#btn-test-oid` — live-query the OIDs in this group to verify they return.
  - **OID Listing** rows: **OID Name** (`counter-name`, e.g. `system.cpu.percent`) and **OID**
    (`oid`, e.g. `1.3.6.1.4.1.116.5.11.4.1.1.5`), with **Choose OID**, **Assign Key-Value**, and `+`
    to add another OID row.
- **Add Metric Group** — `#add-new-metric-group` — append another metric-group card.
- **Remove** metric group — `#remove-metric-group` (the `×` on the card).
- **Reset** — `#reset-btn` — clear the form.
- **Create SNMP Device Catalog** — `#create-snmp-device-catalog-btn` (primary submit).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| System OID * | `input[name='system-oid']` (placeholder _`.1.3.6.1.4.1.47387`_) |
| Name * | `input[name='catalog-name']` (placeholder _"Name"_) |
| Vendor * | dropdown (placeholder _"Select"_, `[data-cy='dropdown-trigger-input']`) |
| Type * | dropdown (placeholder _"Select"_; defaults to **SNMP Device** in screenshot) |
| Metric Group Name * | `input[name='metric-group-name']` (hint _"Must be unique within the catalog"_) |
| Scalar / Tabular toggle | 2 radios (screenshot shows **Scalar** selected) |
| Test OID Group | `#btn-test-oid` |
| OID Name | `input[name='counter-name']` (placeholder _"e.g. system.cpu.percent"_) |
| OID | `input[name='oid']` (placeholder _"e.g. 1.3.6.1.4.1.116.5.11.4.1.1.5"_) |
| Choose OID | button (opens an OID picker) — TODO(source: KG) id |
| Assign Key-Value | button (map OID index → key/value, for tabular) — TODO(source: KG) id |
| Add OID row | `+` icon in OID Listing — TODO(source: KG) id |
| Add Metric Group | `#add-new-metric-group` |
| Remove Metric Group | `#remove-metric-group` (`×` on card) |
| Reset | `#reset-btn` |
| Create SNMP Device Catalog (primary) | `#create-snmp-device-catalog-btn` |
| Help link | "Creating a Custom SNMP Device Catalog" (external doc) |

> **Note on ids:** the catalog JSON records the `name` attributes (`system-oid`, `catalog-name`,
> `metric-group-name`, `counter-name`, `oid`) with **empty `id`** — target by `name` (or `#`-ids where
> listed for the buttons). Vendor/Type are custom dropdowns, not native `<select>` (`selects: 0`), reached
> via `[data-cy='dropdown-trigger-input']`.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > SNMP Device Catalog > Create)._

## 5. Permissions
- **Write:** monitoring-admin-level role (same as create on the list). TODO(source: KG/docs) — exact role.
- **Test OID Group** performs a live SNMP query — requires a reachable target with SNMP credentials; a
  failed test does not necessarily block Create. TODO(source: KG/docs) — confirm whether a successful test
  is mandatory before Create.
- **License/module gating:** core monitoring; no separate license observed. TODO(source: docs).

## 6. Entry Conditions
- Logged in with write access to Monitor Settings.
- Reached from the SNMP Device Catalog list via `#btn-create-snmp-device-catalog`.
- For **Test OID Group**: a target device reachable over SNMP with valid credentials.
- You know the device's **System OID** (`sysObjectID`) and the vendor OIDs for the KPIs you want.

## 7. Exit Conditions
- **Create (success):** form submits; navigation returns to the catalog list; the new catalog appears with
  **Created By = <user>**, **Used Count = 0**. (Assert by searching the new name on the list.)
- **Validation failure:** submit blocked with inline errors (missing System OID/Name/Vendor/Type, duplicate
  metric-group name, malformed OID). TODO(source: KG/docs) — exact messages.
- **Reset:** all fields clear to empty (`#reset-btn`); no server call.
- **Test OID Group:** shows returned values / an error inline; does not persist the catalog by itself.

## 8. Validations
- **System OID** — required (`*`); must be a valid dotted OID (`sysObjectID` form, e.g.
  `.1.3.6.1.4.1.47387`; note the enterprise arc `.1.3.6.1.4.1.<vendor>`). TODO(source: KG/docs) — whether a
  leading dot is required and whether uniqueness across catalogs is enforced (duplicate OIDs have caused
  stale/duplicate records — see §10).
- **Name** (`catalog-name`) — required (`*`). TODO(source: KG/docs) — uniqueness/length.
- **Vendor** — required (`*`); chosen from the dropdown.
- **Type** — required (`*`); defaults to **SNMP Device**.
- **Metric Group Name** (`metric-group-name`) — required (`*`) and **"Must be unique within the catalog"**
  (explicit placeholder/hint) — duplicate group names within the same catalog are rejected.
- **OID Name** (`counter-name`) — the KPI/counter identifier (e.g. `system.cpu.percent`); pattern
  TODO(source: KG/docs).
- **OID** (`oid`) — a valid dotted OID for the metric; validated live by **Test OID Group**.
- **Scalar vs Tabular** — Scalar for single-value OIDs; Tabular for indexed tables (then **Assign Key-Value**
  maps index → key). TODO(source: KG/docs) — required-field differences between the two modes.

## 9. Business Rules
- A catalog groups **metric groups**, each holding one or more **OID Name → OID** rows; scalar groups
  yield single values, tabular groups yield per-index rows. (Grounded: Scalar/Tabular toggle + OID Listing.)
- **Metric Group Name must be unique within the catalog** (explicit UI rule).
- **Test OID Group** validates OIDs against a live device before you commit — the intended workflow is
  enter OIDs → Test → confirm values → Create.
- Catalog is matched to monitors by **System OID** at discovery time (see `snmp-device-catalog.md` §9).
- Custom catalogs exist to **override/extend** default template OIDs for devices that answer non-standard
  OIDs — including **computed/derived counters** (the D-Link fix defined memory % and uptime/100). This form
  is where such computed counters are declared. TODO(source: KG/docs) — how a computed expression (÷100, %)
  is entered vs. a plain OID (likely via Assign Key-Value / a transform).
- TODO(source: KG/docs) — precedence when a device matches both a System and a custom catalog.

## 10. Known Bugs
Grounded in `knowledge/known_issues/customer-issue-kb.md` §1. This form is the **fix surface** for the
"default OIDs don't work" class; the entries below are remediations enacted *here*.

- **Vendor device doesn't respond to default OIDs → missing/false CPU, memory, HW-sensor, VLAN KPIs**
  (~8x; **PQD-27244, PQD-31043, PQD-35401, PQD-41015**).
  - Remediation: create/update this catalog — **update the OID per metric group** or add the catalog entry.
    The **D-Link** fix mapped vendor OIDs including a **computed memory %** and an **uptime/100** conversion
    (both expressed as metric-group counters here).
- **Mandatory Interface-Alias OID `.1.3.6.1.2.1.31.1.1.1.18` not implemented on some devices → interfaces
  missing** (SNMP transport failures; **PQD-31208**).
  - Remediation: a **custom exe removing the alias-OID prerequisite** — the per-device OID map is adjusted so
    the missing mandatory OID no longer blocks collection; the metric-group OIDs defined here are that map.
- **Stale/duplicate monitor records from duplicate Object ID (CSV-import mishap)** (~6x; **PQD-40358** et al.).
  - Relevance: a **duplicate System OID** entered here can create the duplicate-Object-ID stale-record class;
    remediation elsewhere is "clean the SNMP Device Catalogue". Validate System OID uniqueness on create.

> Do not invent additional bugs; the above are the cited, form-relevant issues.

## 11. Edge Cases
- **Malformed / non-OID System OID** (letters, missing dots, trailing dot) → assert inline validation.
- **System OID with vs. without a leading dot** (`1.3.6…` vs `.1.3.6…`) → assert accepted/normalized.
- **Duplicate metric-group name** within one catalog → must be rejected ("Must be unique within the catalog").
- **Duplicate System OID** vs. an existing catalog → assert behavior (block vs. duplicate-record risk, §10).
- **Test OID Group** against an unreachable device / wrong SNMP credentials → assert a clear error, no crash.
- **Scalar vs Tabular** mismatch (tabular OID in a scalar group or vice-versa) → assert Test flags it.
- **Assign Key-Value** on a tabular group with an index the device doesn't return → assert graceful handling.
- **Computed counter** (memory %, uptime/100) — enter and Test; assert the transform yields correct values.
- **Add many metric groups / many OID rows** then Reset (`#reset-btn`) — assert full clear.
- **Remove** the only metric group (`#remove-metric-group`) — assert the form requires ≥1 group before Create.
- Submit with a required identity field (System OID / Name / Vendor / Type) empty → assert blocked.
- Very long Name / counter-name; Unicode in Name; whitespace-only Metric Group Name.
