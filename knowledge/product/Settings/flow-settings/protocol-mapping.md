---
screen: Flow · protocol-mapping
module: Settings
category: flow-settings
route: "/settings/flow-settings/protocol-mapping"
build: 8.2.6
status: draft
sources: [catalog]            # catalog/settings_flow_settings_protocol_mapping.json. No screenshot depicts this screen — Flow.png is the analytics dashboard, not a settings screen.
verified: 2026-07-09
---

# Flow · Protocol Mapping

## 1. Purpose
Holds the lookup that labels a flow's transport **Port** with a **Protocol** name, so flow analytics can
group and display traffic by protocol instead of by bare numbers.

- **Business objective:** make protocol-level flow analysis readable — the Flow dashboard's *Top Protocols
  by Traffic* widget shows named/numbered protocols (e.g. `6 (TCP)`, `17 (UDP)`, `1 (ICMP)`, `2 (IGMP)`),
  which this mapping table underpins.
- **Screen description:** a searchable grid of Port → Protocol rows with a **Create Protocol Mapping**
  action and per-row Actions (edit/delete).
- **Primary use cases:** add/adjust the protocol label for a port; correct or delete a wrong mapping.
- **Who uses it:** network / NOC admins configuring flow visibility. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Flow module (NetFlow/sFlow collection enabled); flow data from exporters; the Flow
  analytics that consumes the labels.

## 2. Navigation
```
Settings → Flow (Flow Settings) → Protocol Mapping
```
- **Breadcrumb:** Settings › Flow › Protocol Mapping
- **Sibling screens (Flow Settings):** Flow Settings · Sampling Rate · Application Mapping ·
  Protocol Mapping · AS Mapping · Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/protocol-mapping`

## 3. Actions
- **Create Protocol Mapping** — opens the create form/drawer (`#create-protocol-btn`).
- **Search** the grid — `input[name="search-protocol-list"]` (placeholder _Search_).
- **Per-row Actions** — edit / delete an existing mapping.
- TODO(source: KG/docs) — bulk import/export (not evident in catalog).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[name="search-protocol-list"]` (text, placeholder _Search_) |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |
| Grid | columns: **Port**, **Protocol**, **Actions** |
| Create Protocol Mapping (primary) | `#create-protocol-btn` |

> The create form's own fields (expected: Port, Protocol) were **not captured** in the list-state sweep —
> confirm exact fields + ids live. TODO(source: catalog live-form sweep).

> **Automation caveat:** the button id `#create-protocol-btn` and the search input name
> `search-protocol-list` are **reused verbatim** on AS / Domain / Geolocation / IP Mapping (catalog copy-paste
> ids). Scope any locator to this route (`/settings/flow-settings/protocol-mapping`) so a test cannot cross
> screens.

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings_protocol_mapping.json`;
promote verified ones into the cookbook (Settings > Flow > Protocol Mapping)._

## 5. Permissions
- Settings configuration screen → expected **Admin**-level write. Generic RBAC reasoning only.
  TODO(source: KG/docs) — exact view vs. edit roles.
- Requires the **Flow** module/license enabled. TODO(source: docs).

## 6. Entry Conditions
- Logged in; Settings reachable; **Flow module enabled**.
- TODO(source: docs) — whether default protocol mappings ship (IANA protocol numbers) or start empty.

## 7. Exit Conditions
- **On Create (success):** toast; new row in grid; flow records on that Port take the Protocol label in
  analytics.
- **On Delete:** row removed; port reverts to unlabelled.
- Good assertions: row present after create; label visible in *Top Protocols by Traffic*.

## 8. Validations
- **Port** — expected numeric 0–65535. TODO(source: docs).
- **Protocol** — expected non-empty; likely unique per Port. TODO(source: docs).
- Inline errors / required markers not captured. TODO(source: catalog live-form sweep).

## 9. Business Rules
- A mapping is keyed by **Port → Protocol** (reasoned from grid columns + the Flow *Top Protocols* widget).
- TODO(source: KG) — relationship to IP-protocol numbers vs. transport ports; uniqueness; precedence;
  whether system/built-in rows are editable.

## 10. Known Bugs
None recorded for this screen.
> (KB flow entries — e.g. `PQD-30304 [MOTADATA-6334]` bi-directional NetFlow parsing, flow-version
> mismatches — concern flow ingestion/parsing and the collector, not this mapping table. Do not attribute
> them here.)

## 11. Edge Cases
- Duplicate mapping (same Port twice) — expect block or overwrite.
- Port out of range / non-numeric.
- Empty / very long / Unicode Protocol name.
- Delete a mapping in active use — does live traffic re-label?
- Search: no matches, partial match, case sensitivity.
- Cross-screen locator collision (shared `#create-protocol-btn`) — the automation caveat above.
- Empty grid (Flow enabled, no flow yet).
