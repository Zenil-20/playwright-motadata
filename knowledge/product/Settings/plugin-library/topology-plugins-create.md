---
screen: Plugin Library · Create Topology Plugin
module: Settings
category: plugin-library
route: "/settings/plugin-library/topology-plugins/create"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library_topology_plugins_create.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library · Create Topology Plugin

## 1. Purpose
The authoring form for a **topology plugin** — a vendor/model-scoped plugin that walks SNMP OIDs (and/or
runs a parser script) to build device link/neighbour topology. It is the concrete fix for the KB's
topology-parsing hotspot (Section 8), where LLDP/SNMP name/OID quirks break the default map.

- **Business objective:** produce correct topology for a specific vendor/make/model by choosing the right
  layer protocol, OIDs, and a parser script that normalizes names/values.
- **Screen description:** a form scoping the plugin to **Vendor / Make & Model / Monitor**, selecting a
  **Layer Protocol** and **Protocol Type**, then defining OID group(s) (counter name + OID, via **Choose
  OID** / **Add OID Group**) and a **Parser Script**, with **Timeout**, **Add Variable**, **Test**, and
  **Reset**.
- **Primary use cases:** author a topology plugin for a device family and **Test** it before creating.
- **Who uses it:** network engineers / admins. TODO(source: KG/docs) — exact RBAC gate.
- **Dependencies:** SNMP access to the target monitor, the topology scanner, and the plugin execution engine.

## 2. Navigation
```
Settings → Plugin Library → Topology Plugins → Create Topology Plugin
```
- **Breadcrumb:** Settings › Plugin Library › Topology Plugins › Create
- **URL:** `/settings/plugin-library/topology-plugins/create`
- **Back:** the Topology Plugins list.

## 3. Actions
- Enter **Name** (`input#topology-name`, "Enter Name").
- Choose **Vendor** ("Select Vendor"), **Make & Model** ("Select Make & Model"), **Monitor** (Select),
  **Layer Protocol**, **Protocol Type**, **Script Language** — via radio groups and
  `[data-cy='dropdown-trigger-input']` dropdowns.
- Define an OID row: **counter name** (`input[name="counter-name"]`, "e.g. CPU (%)") + **OID**
  (`input[name="oid"]`, "e.g. 1.3.6.1.4.1.9.2.1.58.0").
- **Choose OID** — pick an OID from a browser/MIB.
- **Add OID Group** — `#add-new-metric-group`; **remove** a group — `#remove-metric-group`.
- Set **Timeout** (`input[name="timeout"]`).
- Author the **Parser Script** (CodeMirror).
- **Add Variable**.
- **Test** — `#test-btn-id`; **Reset** — `#reset-btn-id`.
- **Create Topology Plugin** (save) — `#submit-btn-id`.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Name * | `input#topology-name` — placeholder _"Enter Name"_ |
| Vendor | Select — placeholder _"Select Vendor"_ (`[data-cy='dropdown-trigger-input']`) |
| Make & Model | Select — placeholder _"Select Make & Model"_ |
| Monitor | Select |
| Layer Protocol | radio group |
| Protocol Type | radio group |
| Script Language | radio group (radio groups total **12** across Layer Protocol / Protocol Type / Script Language) |
| Counter name | `input[name="counter-name"]` — _"e.g. CPU (%)"_ |
| OID | `input[name="oid"]` — _"e.g. 1.3.6.1.4.1.9.2.1.58.0"_ |
| Choose OID | button (MIB/OID picker) |
| Add OID Group | `#add-new-metric-group` |
| Remove OID Group | `#remove-metric-group` |
| Timeout | `input[name="timeout"]` |
| Parser Script | CodeMirror editor |
| Add Variable | button |
| Test | `#test-btn-id` |
| Reset | `#reset-btn-id` |
| Create Topology Plugin (primary) | `#submit-btn-id` |

> **Automation caveat:** the **Parser Script** is a **CodeMirror** editor (use the CodeMirror API, not
> `fill()`). OID groups are **repeatable** — `#add-new-metric-group` clones the counter-name/OID row, so
> after adding groups the `counter-name`/`oid` inputs are **no longer unique**; scope each to its group
> container. The three dropdowns share `[data-cy='dropdown-trigger-input']`; scope by label/placeholder.

_Locators: see `knowledge/locators/catalog/settings_plugin_library_topology_plugins_create.json`; promote
verified ones into the selector-cookbook._

## 5. Permissions
- Authoring an SNMP/script plugin that runs against devices is privileged — expected **admin/operator**.
  TODO(source: KG/docs) — confirm role.

## 6. Entry Conditions
- Logged in; reached from the Topology Plugins list **Create**.
- A reachable SNMP monitor of the chosen Vendor/Make & Model exists for **Test**.
- TODO(source: docs) — whether Choose OID requires MIBs loaded.

## 7. Exit Conditions
- **On Create (success):** plugin appears in the Topology Plugins list; success toast; TODO(source: docs) — audit entry.
- **On Test:** returns walked/parsed topology data (success) or an error (SNMP/timeout/parse failure).
- **On Reset:** form clears; no server write.

## 8. Validations
- **Name** — required (likely unique). TODO(source: docs) — uniqueness/format.
- **Vendor / Make & Model / Monitor** — required to scope the plugin. TODO(source: KG) — which are mandatory.
- **OID** — must be a valid dotted OID (placeholder shows the format); at least one OID group required.
  TODO(source: docs) — OID syntax validation.
- **Counter name** — required per OID row. TODO(source: docs).
- **Timeout** — numeric. TODO(source: docs) — range/default.
- **Layer Protocol / Protocol Type / Script Language** — one radio each. TODO(source: docs) — option sets.

## 9. Business Rules
- The plugin is **scoped to Vendor / Make & Model** — it applies only to matching devices (this is why the
  KB's per-vendor topology gaps are fixed with a targeted plugin).
- **OID groups are repeatable** (`Add OID Group`) — a plugin can walk multiple counters/OIDs.
- The **Parser Script** normalizes raw SNMP/LLDP strings (names, interface names) into topology links —
  exactly the normalization the KB's Section 8 defects require.
- TODO(source: KG): name uniqueness scope; how Layer Protocol vs Protocol Type interact; how the plugin is
  selected during a topology scan.

## 10. Known Bugs
- **Name/IP parsing misclassification** (Section 8, PQD-29906, PQD-36424 / MOTADATA-7745): 16-char names
  read as IPv6; the fix regressed ASCII octet parsing (8.0.15 → 8.1.0) — combined fix **8.1.2**. A parser
  script authored here must handle both correctly.
- **Interface-name mismatch** (Section 8, PQD-33405 / MOTADATA-6884, PQD-37125): LLDP full vs short names,
  garbage/control chars — normalize and fall back to interface-description OID
  `.1.0.8802.1.1.2.1.4.1.1.8` (the parser script's job).
- **Duplicate-connection error on legitimate same-index interfaces** (Section 8, PQD-38710 / MOTADATA-8179):
  uniqueness validated on interface index only, not device+interface — fixes 8.2.0–8.2.2.

Do not invent bugs beyond the above cited patterns.

## 11. Edge Cases
- Invalid/malformed OID; empty OID group; multiple OID groups then remove one.
- Device name of exactly 16 chars or IP with alpha-looking octets (KB parser regression class) — verify
  the parser handles both.
- LLDP full-vs-short interface names; control chars in names.
- Same interface index on two different devices (duplicate-connection class).
- Wrong Vendor/Make & Model scope vs the Test monitor → no data.
- **Timeout** too short for a large SNMP walk (KB: 4000-interface / 24-min walk class).
- Duplicate plugin **Name**; very large parser script; Reset after adding several OID groups.
