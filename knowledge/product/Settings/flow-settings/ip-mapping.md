---
screen: Flow · ip-mapping
module: Settings
category: flow-settings
route: "/settings/flow-settings/ip-mapping"
build: 8.2.6
status: draft
sources: [catalog]            # catalog/settings_flow_settings_ip_mapping.json. No screenshot depicts this screen — Flow.png is the analytics dashboard, not a settings screen.
verified: 2026-07-09
---

# Flow · IP Mapping

## 1. Purpose
Defines named **IP profiles** — a friendly **Profile Name** (+ Description) bound to a **Source** (an IP /
range / set) — so groups of IP addresses in flow analytics can be shown by a meaningful name (e.g. a site,
subnet or business unit) instead of raw addresses.

- **Business objective:** label internal/known IP ranges so flow analytics is readable per site/segment
  rather than per raw IP.
- **Screen description:** a searchable grid of Profile Name / Description / Source rows with a
  **Create IP Mapping** action and per-row Actions.
- **Primary use cases:** create an IP profile for a subnet/site; correct or delete one.
- **Who uses it:** network / NOC admins. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Flow module; flow data carrying source/destination IPs. TODO(source: docs) — what
  the **Source** column represents exactly (an IP/CIDR list vs. an exporter source).

## 2. Navigation
```
Settings → Flow (Flow Settings) → IP Mapping
```
- **Breadcrumb:** Settings › Flow › IP Mapping
- **Sibling screens (Flow Settings):** Flow Settings · Sampling Rate · Application Mapping ·
  Protocol Mapping · AS Mapping · Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/ip-mapping`

## 3. Actions
- **Create IP Mapping** — opens the create form/drawer (`#create-protocol-btn` — shared id, see caveat).
- **Search** the grid — `input[name="search-protocol-list"]` (placeholder _Search_).
- **Per-row Actions** — edit / delete a profile.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[name="search-protocol-list"]` (text, placeholder _Search_) |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |
| Grid | columns: **Profile Name**, **Description**, **Source**, **Actions** |
| Create IP Mapping (primary) | `#create-protocol-btn` |

> The create form's own fields (expected: Profile Name, Description, Source IP/range) were **not captured**
> in the list-state sweep — confirm live, and confirm what **Source** accepts. TODO(source: catalog live-form sweep).

> **Automation caveat:** `#create-protocol-btn` / `search-protocol-list` are shared across the AS / Domain /
> Geolocation / IP / Protocol Mapping screens. Scope every locator to this route.

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings_ip_mapping.json`; promote
verified ones into the cookbook (Settings > Flow > IP Mapping)._

## 5. Permissions
- Settings configuration screen → expected **Admin**-level write. Generic RBAC reasoning only.
  TODO(source: KG/docs). Requires the **Flow** module/license. TODO(source: docs).

## 6. Entry Conditions
- Logged in; Settings reachable; **Flow module enabled**.
- TODO(source: docs) — whether default IP mappings ship.

## 7. Exit Conditions
- **On Create (success):** toast; new profile row in grid; matching flow traffic shown under the profile
  name in analytics.
- **On Delete:** row removed; those IPs revert to raw display.
- Good assertions: row present after create; profile name visible in flow analytics for matching IPs.

## 8. Validations
- **Profile Name** — expected required; likely unique. TODO(source: docs).
- **Source** — expected valid IP/CIDR/range. TODO(source: docs) — exact accepted format.
- **Description** — optional free-text (expected). TODO(source: docs).
- Inline errors / required markers not captured. TODO(source: catalog live-form sweep).

## 9. Business Rules
- A profile ties a named label to a **Source** IP set (reasoned from grid columns).
- TODO(source: KG) — uniqueness, precedence on overlapping sources, and interaction with AS / Domain /
  Geolocation Mapping for the same address.

## 10. Known Bugs
None recorded for this screen.

## 11. Edge Cases
- Duplicate profile name; overlapping sources across profiles.
- Malformed IP/CIDR; single IP vs range vs list; IPv6.
- Empty / very long / Unicode profile name or description.
- Delete a profile in active use — does live traffic revert immediately?
- Search: no match, partial, case sensitivity.
- Cross-screen locator collision (shared `#create-protocol-btn`).
- Empty grid (Flow enabled, no matching flow yet).
