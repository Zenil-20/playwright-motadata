---
screen: Flow · domain-mapping
module: Settings
category: flow-settings
route: "/settings/flow-settings/domain-mapping"
build: 8.2.6
status: draft
sources: [catalog]            # catalog/settings_flow_settings_domain_mapping.json. No screenshot depicts this screen — Flow.png is the analytics dashboard, not a settings screen.
verified: 2026-07-09
---

# Flow · Domain Mapping

## 1. Purpose
Associates a **Domain Name** and a **Category** with a set of **IP details**, so flow traffic to/from those
IPs can be labelled by domain and grouped into a category (e.g. social, streaming, business) in flow
analytics.

- **Business objective:** turn IP-level flow endpoints into recognisable domains/categories for
  application-of-interest and acceptable-use style traffic analysis.
- **Screen description:** a searchable grid of Domain Name / Category / IP Details rows with a
  **Create Domain Mapping** action and per-row Actions.
- **Primary use cases:** register a domain ↔ category ↔ IP-range mapping; correct or delete one.
- **Who uses it:** network / NOC admins. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Flow module; flow data carrying source/destination IPs. TODO(source: docs) —
  whether the category list is fixed/predefined or free-text.

## 2. Navigation
```
Settings → Flow (Flow Settings) → Domain Mapping
```
- **Breadcrumb:** Settings › Flow › Domain Mapping
- **Sibling screens (Flow Settings):** Flow Settings · Sampling Rate · Application Mapping ·
  Protocol Mapping · AS Mapping · Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/domain-mapping`

## 3. Actions
- **Create Domain Mapping** — opens the create form/drawer (`#create-protocol-btn` — shared id, see caveat).
- **Search** the grid — `input[name="search-protocol-list"]` (placeholder _Search_).
- **Per-row Actions** — edit / delete a mapping.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[name="search-protocol-list"]` (text, placeholder _Search_) |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |
| Grid | columns: **Domain Name**, **Category**, **IP Details**, **Actions** |
| Create Domain Mapping (primary) | `#create-protocol-btn` |

> The create form's own fields (expected: Domain Name, Category, IP range/details) were **not captured** in
> the list-state sweep — confirm live. TODO(source: catalog live-form sweep).

> **Automation caveat:** `#create-protocol-btn` / `search-protocol-list` are shared across the AS / Domain /
> Geolocation / IP / Protocol Mapping screens. Scope every locator to this route.

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings_domain_mapping.json`; promote
verified ones into the cookbook (Settings > Flow > Domain Mapping)._

## 5. Permissions
- Settings configuration screen → expected **Admin**-level write. Generic RBAC reasoning only.
  TODO(source: KG/docs). Requires the **Flow** module/license. TODO(source: docs).

## 6. Entry Conditions
- Logged in; Settings reachable; **Flow module enabled**.
- TODO(source: docs) — whether default domain/category mappings ship.

## 7. Exit Conditions
- **On Create (success):** toast; new domain row in grid; matching flow traffic labelled by that
  domain/category in analytics.
- **On Delete:** row removed; traffic reverts to unlabelled domain.
- Good assertions: row present after create; domain/category visible in analytics for matching IPs.

## 8. Validations
- **Domain Name** — expected valid domain string; likely required. TODO(source: docs).
- **Category** — expected from a fixed set or free-text; likely required. TODO(source: docs).
- **IP Details** — expected valid IP/CIDR list. TODO(source: docs).
- Inline errors / required markers not captured. TODO(source: catalog live-form sweep).

## 9. Business Rules
- A mapping ties **Domain Name ↔ Category ↔ IP range(s)** (reasoned from grid columns).
- TODO(source: KG) — uniqueness, precedence when an IP matches multiple rows, and interaction with
  AS / Geolocation / IP Mapping for the same address.

## 10. Known Bugs
None recorded for this screen.

## 11. Edge Cases
- Duplicate domain; overlapping IP ranges across domain rows.
- Invalid domain (spaces, missing TLD, wildcard); malformed IP/CIDR.
- Empty / very long / Unicode (IDN) domain names.
- Delete a domain mapping in active use — does live traffic re-label?
- Search: no match, partial, case sensitivity.
- Cross-screen locator collision (shared `#create-protocol-btn`).
- Empty grid (Flow enabled, no matching flow yet).
