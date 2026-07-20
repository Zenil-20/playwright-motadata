---
screen: Monitoring · snmp-device-catalog
module: Settings
category: monitoring
route: "/settings/monitoring/snmp-device-catalog"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_monitoring_snmp_device_catalog.json · screenshots/"snmp device catalog.png" · known_issues/customer-issue-kb.md §1
verified: 2026-07-09
---

# Monitoring — SNMP Device Catalog

## 1. Purpose
The **SNMP Device Catalog** is the master list of device "catalogs" — vendor/model-specific maps that
tell ObserveOps **which SNMP OIDs to poll for which KPIs** on a given device family. Each catalog binds
a device's **System OID** (the `sysObjectID`, e.g. `.1.3.6.1.4.1.47387`) to a **Vendor**, a **Type**, and
one or more **metric groups** (OID → counter-name maps). When a monitor is discovered, its reported
System OID is matched against this catalog so the right OIDs are polled and the right KPIs populate.

- **Business objective:** make **non-standard / vendor-proprietary devices** report correct CPU, memory,
  hardware-sensor, interface, VLAN and other KPIs by supplying the exact OIDs the device implements —
  instead of falling back to generic OIDs the device may not answer.
- **Screen description:** a large searchable grid under `Settings → Monitor Settings → SNMP Device Catalog`.
  The screenshot shows **24,432 items** across paged results (50/page) — the vast majority are built-in,
  **Created By = System** (e.g. `0xBEDA, LLC`, `1&1 Internet AG`, Fortinet, and many Huawei `1000E-*` models
  each with a distinct System OID like `.1.3.6.1.4.1.2011.2.321.1.66`). Users add **custom** catalogs on top.
- **Primary use cases:** find whether a device family already has a catalog; add a custom catalog for a
  device that reports wrong/missing KPIs on default OIDs; check the **Used Count** (how many monitors
  reference a catalog) before editing/deleting; clean up stale/duplicate catalogs.
- **Who uses it:** monitoring/NOC administrators and Motadata support engineers doing device onboarding
  and KPI remediation. TODO(source: KG/docs) — exact role name(s) with write access.
- **Dependencies:** the SNMP poller / plugin engine · the monitor & metric-group model · discovery
  (System OID is captured at discovery and used to match a catalog).

## 2. Navigation
```
Settings → Monitor Settings → SNMP Device Catalog
```
- **Breadcrumb:** Settings › Monitor Settings › SNMP Device Catalog
- **Left-nav siblings (Monitor Settings):** Device Monitor Settings · Cloud Monitor Settings · Monitor
  Templates · Agent Monitor Settings · Service Check Monitor Settings · Process Monitor Settings ·
  Service Monitor Settings · File/Directory Settings · **SNMP Device Catalog** · Rediscover Settings ·
  NetRoute Settings · Topology Scanner · Monitoring Hour · Custom Monitoring Field
- **URL:** `/settings/monitoring/snmp-device-catalog`
- **Create form:** `Create SNMP Device Catalog` → `/settings/monitoring/snmp-device-catalog/create`
  (documented in `snmp-device-catalog-create.md`).

## 3. Actions
- **Search** the catalog list — `search-snmp-device-catalog` (placeholder _"Search"_).
- **Filter** — `#show-filter` opens the filter panel; the screenshot shows **Vendors** and **Types**
  quick-filter chips plus a `+ Filter` control.
- **Create SNMP Device Catalog** — `#btn-create-snmp-device-catalog` → navigates to the create form.
- **Row actions** — the per-row kebab (`[data-cy='grid-action']`), typically Edit / Delete / Clone.
  TODO(source: KG/docs) — confirm the exact row-action set and whether **System**-created rows are
  read-only vs. only user-created rows are editable/deletable.
- **Paginate** — pager with 50 items/page (also 1/2/3/4/5… and jump controls).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Global Settings search (left) | `input` (placeholder _"Search"_, no id) — shared Settings shell |
| Catalog search | `input[name='search-snmp-device-catalog']` (placeholder _"Search"_) |
| Vendors filter chip | quick filter (screenshot) — TODO(source: KG) id |
| Types filter chip | quick filter (screenshot) — TODO(source: KG) id |
| Filter | `#show-filter` (`+ Filter`) |
| Create SNMP Device Catalog (primary) | `#btn-create-snmp-device-catalog` |
| Grid | columns: **SNMP Device Catalog Name · Vendor · Type · Used Count · System OID · Created By · Actions** |
| Row action (kebab) | `[data-cy='grid-action']` |
| Pager | 50/page, page numbers + first/prev/next/last |

> **Grid semantics (from screenshot):**
> - **Type** renders as an icon, not text (two distinct glyphs observed) — TODO(source: KG/docs) confirm
>   the Type value set (e.g. "SNMP Device" vs others; the create form defaults Type to **SNMP Device**).
> - **Used Count = 0** on all visible built-in rows — count is how many monitors currently reference the
>   catalog; a non-zero count means the catalog is in active use (relevant before edit/delete).
> - **Created By = System** marks built-in catalogs; user-created catalogs show the author.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > SNMP Device Catalog)._

## 5. Permissions
- **Read:** users who can open Monitor Settings can view the catalog list.
- **Write (create/edit/delete):** a monitoring-admin-level role. TODO(source: KG/docs) — exact role name;
  whether Operator/Viewer are read-only here.
- **Built-in vs custom:** the very large built-in set (Created By = System) is shipped content; editing/
  deleting **System** rows is very likely restricted or discouraged. TODO(source: KG/docs) — confirm.
- **License/module gating:** part of core monitoring; no separate license observed. TODO(source: docs).

## 6. Entry Conditions
- Logged in with access to Settings → Monitor Settings.
- The catalog store is reachable (grid loads; item count renders, e.g. "1 – 50 of 24432 items").
- To edit/delete meaningfully: at least one **user-created** catalog exists (built-ins may be read-only).

## 7. Exit Conditions
- **Create (success):** navigation returns to this list; the new catalog appears with **Created By = <user>**
  and **Used Count = 0** until a matching monitor is discovered/provisioned. (Assert via a search on the
  new name.)
- **Edit (success):** changed Vendor/Type/OIDs persist; success toast. TODO(source: KG/docs) — confirm
  whether already-provisioned monitors re-poll with the new OIDs immediately or only on next rediscovery.
- **Delete (success):** row removed. TODO(source: KG/docs) — behavior when **Used Count > 0** (blocked vs.
  cascade). See §10 "clean SNMP Device Catalogue" — deleting stale/duplicate catalogs is a documented
  remediation, so delete is permitted at least for user rows.

## 8. Validations
- **Search / Filter:** free text; no persistence guaranteed across navigation. TODO(source: KG/docs).
- Field-level validations live on the **create** form (System OID format, unique metric-group name) —
  see `snmp-device-catalog-create.md` §8.
- TODO(source: KG/docs) — whether the list enforces **unique System OID** across catalogs (duplicate
  Object IDs from CSV import have caused stale/duplicate records — see §10).

## 9. Business Rules
- A catalog is **keyed to a device family by System OID** (`sysObjectID`); at match time a monitor's
  reported System OID selects the catalog whose OIDs get polled. (Grounded: the "System OID" column and
  the create form's System OID field with `sysObjectID`-shaped placeholder.)
- **Used Count** reflects live references — a catalog with Used Count > 0 is actively driving KPIs for that
  many monitors; treat edits as impacting production data.
- Built-in catalogs (Created By = System) cover common vendors/models; **custom catalogs extend or override**
  for devices whose default OIDs are wrong/missing (see §10). TODO(source: KG/docs) — precedence when a
  device matches both a System and a custom catalog.
- TODO(source: KG/docs) — exact match logic (exact System OID vs. longest-prefix), and Vendor/Type roles
  in matching vs. display.

## 10. Known Bugs
Grounded in `knowledge/known_issues/customer-issue-kb.md` (§1 Discovery & Monitoring Data, §1 SNMP transport).
This screen is the **primary fix surface** for the recurring "device doesn't answer default OIDs" class.

- **Vendor device doesn't respond to default OIDs → missing/false CPU, memory, HW-sensor, VLAN KPIs**
  (~8x; **PQD-27244, PQD-31043, PQD-35401, PQD-41015**; vendors incl. Cisco, D-Link, Juniper, Hitachi).
  - Symptom: false CPU utilization; blank HW-sensor/STP/VLAN widgets; no memory data for specific models.
  - Diagnosis: the default template OIDs are not implemented on that model; sometimes an SNMP walk returns
    only a handful of lines.
  - Remediation (**this screen**): **add an SNMP Device Catalogue entry** (or update the OID per metric
    group), or ship a custom plugin. The **D-Link** fix mapped vendor OIDs including a **computed memory %**
    and an **uptime/100** conversion.
- **Stale/duplicate monitor records after re-provisioning or hardware swap** (~6x; **PQD-40358**, PQD-40196,
  PQD-37767, PQD-31977).
  - Symptom: serial numbers/data mapped wrong after a firewall-vendor swap on the same IP; duplicate Object
    ID from a CSV-import mishap; device can't be deleted.
  - Remediation: **clean the SNMP Device Catalogue** (remove stale/duplicate entries) as part of the
    delete-and-re-provision / purge-legacy-rows procedure (improvement in 8.0.26).
- **Mandatory Interface-Alias OID `.1.3.6.1.2.1.31.1.1.1.18` not implemented on some devices → interfaces
  missing** (SNMP transport/network-side failures; **PQD-31208**, cluster incl. PQD-34689, PQD-33921,
  PQD-37852).
  - Symptom: interfaces missing despite the device being up; long SNMP walks.
  - Remediation: a **custom exe removing the alias-OID prerequisite** — i.e. the OID map for the affected
    device family is adjusted so the missing mandatory OID no longer blocks collection. This screen's
    metric-group OIDs are where such per-device OID overrides live.

> Do not invent additional bugs; the above are the cited, catalog-relevant issues.

## 11. Edge Cases
- Very large list (24k+ built-ins) — search/filter must scope before create/edit; test pagination boundaries
  (page 1 vs. last page "…of 24432 items").
- Create a custom catalog whose **System OID duplicates** an existing (System or custom) entry — assert the
  match/precedence behavior and that it doesn't silently create the "duplicate Object ID" stale-record class.
- Edit/delete a catalog with **Used Count > 0** — assert whether it's blocked or warns about impacted monitors.
- Attempt to edit/delete a **System**-created (built-in) catalog — assert read-only handling.
- D-Link-style device: default OIDs return wrong/absent memory — add catalog with computed memory % + uptime/100
  and assert KPIs correct after next poll/rediscovery.
- Device missing the mandatory Interface-Alias OID — assert interfaces populate after the catalog/OID override.
- Search with special characters / OID-shaped strings (dots) in the name field.
- Two devices on the same IP after a vendor swap — confirm the catalog cleanup path resolves stale mapping.
