---
screen: Flow · as-mapping
module: Settings
category: flow-settings
route: "/settings/flow-settings/as-mapping"
build: 8.2.6
status: draft
sources: [catalog]            # catalog/settings_flow_settings_as_mapping.json. No screenshot depicts this screen — Flow.png is the analytics dashboard, not a settings screen.
verified: 2026-07-09
---

# Flow · AS Mapping

## 1. Purpose
Maps **Autonomous System (AS)** identity onto flow traffic — associating an **AS Number** with an
**AS Name / Organization** and a set of **IP details** — so external/internet traffic in flow analytics can
be attributed to the owning network (ISP / cloud / enterprise AS) rather than shown as raw IPs.

- **Business objective:** identify *who* the far end of a flow belongs to (which AS/organization),
  supporting peering, upstream-provider and internet-egress analysis.
- **Screen description:** a searchable grid of AS Name / AS Number / Organization / IP Details rows with a
  **Create AS Mapping** action and per-row Actions.
- **Primary use cases:** register a custom AS ↔ organization ↔ IP-range mapping; correct or delete one.
- **Who uses it:** network / NOC admins doing flow / traffic-origin analysis. TODO(source: KG/docs) — role.
- **Dependencies:** the Flow module; flow data carrying source/destination IPs (and AS info where the
  exporter provides it). TODO(source: docs) — whether AS is exporter-supplied or resolved from IP ranges.

## 2. Navigation
```
Settings → Flow (Flow Settings) → AS Mapping
```
- **Breadcrumb:** Settings › Flow › AS Mapping
- **Sibling screens (Flow Settings):** Flow Settings · Sampling Rate · Application Mapping ·
  Protocol Mapping · AS Mapping · Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/as-mapping`

## 3. Actions
- **Create AS Mapping** — opens the create form/drawer (`#create-protocol-btn` — shared id, see caveat).
- **Search** the grid — `input[name="search-protocol-list"]` (placeholder _Search_).
- **Per-row Actions** — edit / delete a mapping.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[name="search-protocol-list"]` (text, placeholder _Search_) |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |
| Grid | columns: **AS Name**, **AS Number**, **Organization**, **IP Details**, **Actions** |
| Create AS Mapping (primary) | `#create-protocol-btn` |

> The create form's own fields (expected: AS Name, AS Number, Organization, IP range/details) were **not
> captured** in the list-state sweep — confirm live. TODO(source: catalog live-form sweep).

> **Automation caveat:** the button id `#create-protocol-btn` and search input name `search-protocol-list`
> are shared across AS / Domain / Geolocation / IP / Protocol Mapping. Scope every locator to this route.

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings_as_mapping.json`; promote
verified ones into the cookbook (Settings > Flow > AS Mapping)._

## 5. Permissions
- Settings configuration screen → expected **Admin**-level write. Generic RBAC reasoning only.
  TODO(source: KG/docs). Requires the **Flow** module/license. TODO(source: docs).

## 6. Entry Conditions
- Logged in; Settings reachable; **Flow module enabled**.
- TODO(source: docs) — whether a base AS database ships or the table starts empty.

## 7. Exit Conditions
- **On Create (success):** toast; new AS row in grid; matching flow traffic attributed to that AS /
  organization in analytics.
- **On Delete:** row removed; traffic reverts to unlabelled AS.
- Good assertions: row present after create; AS/Organization visible in flow analytics for matching IPs.

## 8. Validations
- **AS Number** — expected numeric (public AS range up to 32-bit). TODO(source: docs) — exact rule.
- **AS Name / Organization** — expected required. TODO(source: docs).
- **IP Details** — expected valid IP/CIDR list. TODO(source: docs).
- Inline errors / required markers not captured. TODO(source: catalog live-form sweep).

## 9. Business Rules
- A mapping ties **AS Number ↔ AS Name/Organization ↔ IP range(s)** (reasoned from grid columns).
- TODO(source: KG) — uniqueness (per AS number? per IP range?), precedence when an IP matches multiple
  rows, and interaction with Geolocation / IP Mapping for the same address.

## 10. Known Bugs
None recorded for this screen.

## 11. Edge Cases
- Duplicate AS number; overlapping IP ranges across AS rows.
- Invalid AS number (0, negative, non-numeric, >4294967295); malformed IP/CIDR in IP Details.
- Very long / Unicode organization name.
- Delete an AS mapping in active use — does live traffic re-attribute?
- Search: no match, partial (name vs number), case sensitivity.
- Cross-screen locator collision (shared `#create-protocol-btn`).
- Empty grid (Flow enabled, no matching flow yet).
