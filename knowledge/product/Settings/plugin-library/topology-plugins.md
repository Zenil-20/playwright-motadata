---
screen: Plugin Library · Topology Plugins
module: Settings
category: plugin-library
route: "/settings/plugin-library/topology-plugins"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library_topology_plugins.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library · Topology Plugins

## 1. Purpose
The **Topology Plugins** list — reusable plugins that build network topology (neighbour/link maps) for
vendor devices whose LLDP/SNMP data the default topology walk doesn't handle. Topology is a KB hotspot
(Section 8): LLDP/SNMP string parsing and vendor OID gaps repeatedly break the map, and custom
topology plugins are the fix.

- **Business objective:** correctly discover device-to-device links for vendors/models the stock walk
  misses, so the topology map and dependency mapper are complete.
- **Screen description:** a searchable grid of topology plugins with **Create Topology Plugin**.
- **Primary use cases:** review plugins, see Used Count, search by name, open to edit, create a new one.
- **Who uses it:** network/monitoring engineers / admins. TODO(source: KG/docs) — exact RBAC gate.
- **Dependencies:** SNMP/LLDP data from monitors, the topology scanner, and the plugin execution engine.

## 2. Navigation
```
Settings → Plugin Library → Topology Plugins
```
- **Breadcrumb:** Settings › Plugin Library › Topology Plugins
- **URL:** `/settings/plugin-library/topology-plugins`
- **Create:** `/settings/plugin-library/topology-plugins/create` (see `topology-plugins-create.md`).

## 3. Actions
- **Search** plugins — `input[placeholder="Search"]` / `input[name="search"]`.
- **Create Topology Plugin** — `#create-topology-plugin-btn`.
- **Row actions** (edit / delete / clone) — `[data-cy='grid-action']`.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]`, `input[name="search"]` |
| Create Topology Plugin (primary) | `#create-topology-plugin-btn` |
| Grid | columns: Name · Protocol Type · Used Count · Actions |
| Per-row actions | `[data-cy='grid-action']` |

_Locators: see `knowledge/locators/catalog/settings_plugin_library_topology_plugins.json`; promote
verified ones into the selector-cookbook._

## 5. Permissions
- Expected **admin/operator** (topology plugins run SNMP/scripts against devices). TODO(source: KG/docs) — confirm.

## 6. Entry Conditions
- Logged in; Settings reachable; Topology Plugins family selected.
- The topology-plugin store loads; **Used Count** populates from bindings.

## 7. Exit Conditions
- **Create** navigates to the create form.
- Deleting a plugin removes it (subject to Used Count). TODO(source: docs) — audit entry.

## 8. Validations
- Search filters by **Name**. TODO(source: docs) — match semantics.
- Field validations live on the create screen.

## 9. Business Rules
- **Protocol Type** classifies each plugin (the plugin's link-discovery protocol). TODO(source: KG) — enumeration.
- **Used Count > 0** means devices/monitors reference the plugin; deleting likely affects topology.
  TODO(source: KG) — confirm delete guard.
- TODO(source: KG): name uniqueness; how a topology plugin is selected during a scan.

## 10. Known Bugs
- **Name/IP parsing misclassification breaks topology** (Section 8, PQD-29906, PQD-36424 / MOTADATA-7745):
  16-character device names parsed as IPv6; a later fix regressed ASCII `A.B.C.D` octet parsing (worked
  8.0.15, broke 8.1.0) — combined parser fix in **8.1.2** (the canonical "fix-introduced-regression" case).
- **Interface-name mismatches prevent neighbour mapping** (Section 8, PQD-33405 / MOTADATA-6884, PQD-37125):
  LLDP returns full names vs discovered short names, garbage/control chars in names, or wrong LLDP OID data.
  Workaround: custom topology plugin normalizing names and falling back to the interface-description OID
  `.1.0.8802.1.1.2.1.4.1.1.8`.
- **Monitor name must equal hostname** for topology to map (Section 8, PQD-36818, PQD-36965) — renamed
  monitors drop out of topology.

None recorded for the Topology Plugins list UI itself beyond the above topology-engine issues. Do not invent bugs.

## 11. Edge Cases
- Empty list (no custom topology plugins).
- Device names of exactly 16 chars, or IPs with alpha-looking octets (KB parser regression class).
- LLDP full-vs-short interface names; control chars in names.
- Renamed monitor (name ≠ hostname) → topology gap.
- Delete a plugin with Used Count > 0; search with no matches.
