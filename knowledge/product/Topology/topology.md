---
screen: Topology · topology
module: Topology
route: "/topology"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/topology.json · screenshots/topology.png · known_issues/customer-issue-kb.md §8
verified: 2026-07-09
---

# Topology

## 1. Purpose
The **network topology map** — an interactive graph of discovered devices and the links between them,
built from LLDP/CDP/SNMP neighbour data, so operators can see how the network is wired and where failures
propagate.

- **Business objective:** visualize physical/logical connectivity and device health in one map to speed
  up root-cause and impact analysis (a red core router with children explains a cluster of alerts).
- **Screen description:** domain tabs (**Network, SDN, Cloud, Virtualization, HCI**); a left **tree panel**
  with a Search box and expandable groups (South Region, Network, Router, Switch, test, North Region,
  SUPPORT-LOGIX, Location → Ahmedabad …) each with a status dot; a central **canvas** rendering device
  nodes (color-coded by status: green Up, red Down, blue selected) connected by links, with node labels
  (e.g. DC-CoreRouter-R1-6131, g4.g4.com, g3.g3.com, router-221); a **canvas toolbar** — a **Layer 3
  ON/OFF** toggle, an info toggle, layout/style toggles, zoom (+ / −), fullscreen, refresh, a legend, and a
  **Create Topology View** button; directional pan arrows (↑ ← ↓ →); and a **Minimap** bottom-right.
- **Primary use cases:** browse connectivity, find a device via search/tree, toggle Layer-3 view, zoom/pan,
  read node health, save a custom topology view.
- **Who uses it:** network operators and administrators.
- **Dependencies:** discovery with neighbour data (LLDP/CDP) · SNMP interface data · the topology scanner
  (Settings → Monitoring → Topology Scanner) · monitor status from the poller.

## 2. Navigation
```
Left icon rail → Topology (node-graph icon)
```
- **Domain tabs:** Network · SDN · Cloud · Virtualization · HCI
- **URL:** `/topology` — open the full URL; SPA routing must load the page.
- Back-chevron (top-left) returns to the previous screen.

## 3. Actions
- **Search** — locate a node/group (`input` _Search_; canvas hint "Ctrl + F | Esc to clear").
- **Expand / collapse tree** — drill groups → devices in the left panel; selecting a node focuses it on canvas.
- **Toggle Layer 3** — the `Layer 3` **ON/OFF** switch (catalog `switches: 1`; button text `OFF`) switches
  between L2 and L3 topology.
- **Toggle radios** — 2 radios in the toolbar (catalog `radios: 2`), a view/layout style pair.
  TODO(source: KG) exact labels (e.g. hierarchical vs radial layout).
- **Zoom in / out** — `+` / `−` canvas controls; **fullscreen**, **refresh**, **legend/info** toggles.
- **Pan** — directional arrow pad (↑ ← ↓ →) and the minimap.
- **Create Topology View** — `Create Topology View` button saves a custom, filtered view.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Domain tabs | Network · SDN · Cloud · Virtualization · HCI |
| Search | `input` _Search_ ("Ctrl + F | Esc to clear") |
| Tree panel | expandable groups with status dots (South Region, Router, Switch, Location → Ahmedabad …) |
| Canvas | device nodes (status-colored) + links; labels under nodes |
| Layer 3 toggle | `switch` **ON/OFF** (button text `OFF`) |
| Layout radios | 2 radios (view/layout style) |
| Zoom / pan | `+` `−`, arrow pad, fullscreen, refresh |
| Info / legend | info + legend toggles (top-right `?`) |
| Minimap | bottom-right overview |
| Create Topology View | `Create Topology View` button |

_Locators: see `knowledge/locators/catalog/topology.json`; promote verified ones into the cookbook
(Topology). Zoom/layout/refresh icons were not id-captured — resolve live._

## 5. Permissions
- **View:** Admin / Operator / Viewer (scoped to permitted groups).
- **Create Topology View:** likely Admin/Operator (it persists a saved view). TODO(source: KG/docs)
  confirm role gate and whether saved views are shared or per-user.

## 6. Entry Conditions
- User is logged in.
- **Topology has been built** — discovery ran with neighbour data and the topology scanner processed it;
  otherwise the canvas is empty or shows isolated nodes.
- Monitor names equal hostnames (see §10) for correct mapping.

## 7. Exit Conditions
- **Canvas renders** the graph for the active tab; nodes reflect live status color.
- **On Layer-3 toggle:** the graph re-renders at the chosen layer.
- **On Create Topology View (success):** the custom view is saved and selectable later; TODO(source: KG)
  confirm success toast + where saved views appear.
- Viewing does not modify data (no audit entry).

## 8. Validations
- **Search** is free-text; Esc clears. No strict field validation on this screen.
- **Create Topology View** — name/selection required. TODO(source: KG) the exact required fields and any
  uniqueness on the view name.

## 9. Business Rules
- **Topology maps by monitor name = hostname** — renaming a monitor removes it from topology (KB §8).
- **Node color encodes status** (green Up, red Down, hollow/other Unreachable); links represent discovered
  neighbour adjacencies.
- **Layer-3 view** derives from routing/IP data; Layer-2 from switch/LLDP data.
- A **new scan can replace the existing topology** (KB §8) — layout is regenerated unless a static/custom
  view is used.
- TODO(source: KG): how Include/Exclude filters and saved views interact with the auto-generated map.

## 10. Known Bugs
From `customer-issue-kb.md` §8 (Topology & Dependency Mapper) — a hotspot; cite for regression:
- **Name/IP parsing misclassification breaks topology** (PQD-29906, PQD-36424 / MOTADATA-7745, PQD-41316):
  **16-character device names parsed as IPv6**; the later fix regressed ASCII `A.B.C.D` octet parsing
  (worked 8.0.15, broke 8.1.0). *Combined parser fix in 8.1.2* — treat as the canonical
  "fix-introduced-regression." → Regression pack: names of exactly 16 chars, IPs with alpha-looking octets.
- **Interface-name mismatches prevent neighbour mapping** (PQD-33405 / MOTADATA-6884, PQD-37125): TP-Link/HFCL
  topology empty; "interface not provisioned"; LLDP full names vs short discovered names; garbage/control
  chars in names. *Workaround:* normalize names, fall back to interface-description OID, trim control chars.
- **Monitor name must equal hostname** (PQD-36818, PQD-36965): renamed monitors dropped from topology.
- **Topology maintenance behaviors** (PQD-30386, PQD-36665, PQD-31827, PQD-38710 / MOTADATA-8179,
  PQD-40859 / MOTADATA-8544, PQD-33789 / MOTADATA-7130): new scan overwrites existing topology; layout
  scrambles on device add; **stale vMotion links** linger; wrong port connectivity vs dependency mapper;
  duplicate-connection error on legitimate same-index interfaces; wrong status color in manual view.
  *Fixes:* static-layout improvement 8.2.1; 8.2.0–8.2.2 (+8.2.1 hotfix exe).

## 11. Edge Cases
- **Empty topology** (no neighbour data) — empty canvas / isolated nodes, not an error.
- Device name exactly **16 characters** or **IP-looking name** (KB parser regression).
- **Large graph** (hundreds of nodes) — render/zoom performance, label overlap, minimap usability.
- Re-run discovery after a device add — does the saved/static view survive, or does auto-relayout scramble it?
- **vMotion / VM moved** — stale link cleanup (KB PQD-31827).
- Duplicate interface index across two devices — should not raise a false duplicate-connection error.
- Toggle Layer 3 on a topology with no L3 data — graceful empty vs error.
- Node in **Unreachable** vs **Down** — color/legend distinction.
- Create Topology View with no selection / duplicate name.
- Search for a device that exists as a monitor but isn't in topology (name ≠ hostname).
