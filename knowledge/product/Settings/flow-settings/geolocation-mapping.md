---
screen: Flow · geolocation-mapping
module: Settings
category: flow-settings
route: "/settings/flow-settings/geolocation-mapping"
build: 8.2.6
status: draft
sources: [catalog]            # catalog/settings_flow_settings_geolocation_mapping.json. No screenshot depicts this screen — Flow.png is the analytics dashboard, not a settings screen.
verified: 2026-07-09
---

# Flow · Geolocation Mapping

## 1. Purpose
Defines named **geolocation profiles** that tie a set of **IP details** to a **Country** and **City**, so
flow traffic to/from those IPs can be placed geographically in flow analytics (source/destination country
and city).

- **Business objective:** add geographic context to flow — see which countries/cities traffic goes to,
  and override or supply geolocation for private/unknown ranges the built-in geo database can't resolve.
- **Screen description:** a searchable grid of Profile Name / Description / Country / City / IP Details rows
  with a **Create Geolocation Mapping** action and per-row Actions.
- **Primary use cases:** create a profile mapping an IP range to a country/city; correct or delete one.
- **Who uses it:** network / NOC admins. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Flow module; flow data carrying IPs. TODO(source: docs) — relationship to any
  built-in geo-IP database and whether these profiles override it.

## 2. Navigation
```
Settings → Flow (Flow Settings) → Geolocation Mapping
```
- **Breadcrumb:** Settings › Flow › Geolocation Mapping
- **Sibling screens (Flow Settings):** Flow Settings · Sampling Rate · Application Mapping ·
  Protocol Mapping · AS Mapping · Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/geolocation-mapping`

## 3. Actions
- **Create Geolocation Mapping** — opens the create form/drawer (`#create-protocol-btn` — shared id, see caveat).
- **Search** the grid — `input[name="search-protocol-list"]` (placeholder _Search_).
- **Per-row Actions** — edit / delete a profile (`[data-cy='grid-action']`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[name="search-protocol-list"]` (text, placeholder _Search_) |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |
| Grid | columns: **Profile Name**, **Description**, **Country**, **City**, **IP Details**, **Actions** |
| Row actions | `[data-cy='grid-action']` (edit / delete) |
| Create Geolocation Mapping (primary) | `#create-protocol-btn` |

> The create form's own fields (expected: Profile Name, Description, Country, City, IP range/details) were
> **not captured** in the list-state sweep — confirm live. TODO(source: catalog live-form sweep).

> **Automation caveat:** `#create-protocol-btn` / `search-protocol-list` are shared across the AS / Domain /
> Geolocation / IP / Protocol Mapping screens. Scope every locator to this route.

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings_geolocation_mapping.json`;
promote verified ones into the cookbook (Settings > Flow > Geolocation Mapping)._

## 5. Permissions
- Settings configuration screen → expected **Admin**-level write. Generic RBAC reasoning only.
  TODO(source: KG/docs). Requires the **Flow** module/license. TODO(source: docs).

## 6. Entry Conditions
- Logged in; Settings reachable; **Flow module enabled**.
- TODO(source: docs) — whether a built-in geo database backs the Country/City fields (dropdown vs free-text).

## 7. Exit Conditions
- **On Create (success):** toast; new profile row in grid; matching flow traffic located to that
  country/city in analytics.
- **On Delete:** row removed; those IPs fall back to the default geo resolution (or unknown).
- Good assertions: row present after create; geo label visible in flow analytics for matching IPs.

## 8. Validations
- **Profile Name** — expected required; likely unique. TODO(source: docs).
- **Country / City** — expected required; likely selected from a list. TODO(source: docs).
- **IP Details** — expected valid IP/CIDR list. TODO(source: docs).
- **Description** — optional free-text (expected). TODO(source: docs).
- Inline errors / required markers not captured. TODO(source: catalog live-form sweep).

## 9. Business Rules
- A profile ties **IP range(s) ↔ Country + City** under a named Profile (reasoned from grid columns).
- TODO(source: KG) — whether these profiles override the built-in geo-IP lookup, precedence on overlapping
  ranges, and interaction with AS / IP Mapping for the same address.

## 10. Known Bugs
None recorded for this screen.

## 11. Edge Cases
- Duplicate profile name; overlapping IP ranges across profiles.
- Country/City mismatch (city not in the chosen country); private IPs with no real geo.
- Malformed IP/CIDR; IPv6 ranges.
- Very long / Unicode profile name or description.
- Delete a profile in active use — does live traffic re-locate?
- Search: no match, partial, case sensitivity.
- Cross-screen locator collision (shared `#create-protocol-btn`).
- Empty grid (Flow enabled, no matching flow yet).
