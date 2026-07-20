---
screen: Flow · application-mapping
module: Settings
category: flow-settings
route: "/settings/flow-settings/application-mapping"
build: 8.2.6
status: draft
sources: [catalog, kb]        # catalog/settings_flow_settings_application_mapping.json; known_issues/customer-issue-kb.md (MOTADATA-8460). No screenshot depicts this screen — Flow.png is the analytics dashboard, not a settings screen.
verified: 2026-07-09
---

# Flow · Application Mapping

## 1. Purpose
Defines how raw flow records (NetFlow / sFlow) are **labelled with a human-readable application name**.
A flow record carries a destination **Port** and a **Protocol** number, not an application; this screen
holds the lookup table that turns e.g. *443 / TCP* into a named application so the Flow analytics can
group traffic by app.

- **Business objective:** make flow analytics business-readable — the Flow dashboard's *Top Application
  by Traffic* widget (e.g. `google-services`, `ms-office-365`, `ms-teams`, `ssl`, `HTTPS`) is driven by
  these mappings; without them traffic would only be visible as bare port/protocol numbers.
- **Screen description:** a searchable grid of Port → Application Name (+ Protocol) rows with a
  **Create Application Mapping** action and per-row Actions (edit/delete).
- **Primary use cases:** add a custom app mapping for an in-house/uncommon service on a known port;
  correct or delete a wrong mapping; look up which app a port is classified as.
- **Who uses it:** network / NOC admins configuring flow visibility. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Flow module (NetFlow/sFlow collection enabled, see **Flow Settings**); flow data
  arriving from exporters; the Flow analytics/dashboard that consumes the labels.

## 2. Navigation
```
Settings → Flow (Flow Settings) → Application Mapping
```
- **Breadcrumb:** Settings › Flow › Application Mapping
- **Sibling screens (Flow Settings):** Flow Settings · Sampling Rate · Application Mapping ·
  Protocol Mapping · AS Mapping · Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/application-mapping` (open the full URL; SPA routing must load it).

## 3. Actions
- **Create Application Mapping** — opens the create form/drawer (`#create-application-btn`).
- **Search** the grid — `input[name="search-application-list"]` (placeholder _Search_).
- **Per-row Actions** — edit / delete an existing mapping (`[data-cy='grid-action']`).
- TODO(source: KG/docs) — whether bulk import/export of mappings exists (other flow screens suggest not).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[name="search-application-list"]` (text, placeholder _Search_) |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |
| Grid | columns: **Port**, **Application Name**, **Protocol**, **Actions** |
| Row actions | `[data-cy='grid-action']` (edit / delete) |
| Create Application Mapping (primary) | `#create-application-btn` |

> The create form's own fields (expected: Port, Protocol, Application Name) were **not captured** in the
> list-state sweep — confirm the exact field set + ids live or via the KG. TODO(source: catalog live-form sweep).

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings_application_mapping.json`;
promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Flow > Application Mapping)._

## 5. Permissions
- Configuration screen under Settings → expected **Admin**-level write; read possibly wider. Generic RBAC
  reasoning only. TODO(source: KG/docs) — exact roles that can view vs. create/edit/delete.
- License/module gating: requires the **Flow** module/license to be enabled. TODO(source: docs) — confirm.

## 6. Entry Conditions
- Logged in with a valid session; Settings reachable.
- **Flow module enabled** and flow data being collected (otherwise the grid is meaningful but empty of
  auto-learned rows). TODO(source: docs) — whether default/seeded application mappings ship.

## 7. Exit Conditions
- **On Create (success):** success toast; the new row appears in the grid; subsequent flow records on that
  Port/Protocol are labelled with the Application Name in Flow analytics.
- **On Delete:** row removed; that Port/Protocol reverts to unlabelled/other in analytics.
- Good assertions: row present in grid after create; label visible in *Top Application by Traffic*.
  TODO(source: docs) — whether re-classification is retroactive or forward-only.

## 8. Validations
- **Port** — expected numeric, valid range 0–65535. TODO(source: docs) — exact rule.
- **Protocol** — expected from a fixed set (e.g. TCP/UDP). TODO(source: docs).
- **Application Name** — expected required; likely unique per Port+Protocol. TODO(source: docs).
- Inline errors / required markers were not captured in the list-state sweep. TODO(source: catalog live-form sweep).

## 9. Business Rules
- A mapping is keyed by **Port (+ Protocol)** → **Application Name**; this is the lookup the Flow pipeline
  applies to classify traffic (reasoned from grid columns + the Flow dashboard's app grouping).
- TODO(source: KG) — uniqueness (one app per Port+Protocol?), precedence when a port matches multiple
  rules, and whether built-in/system mappings can be edited or only user-added ones.

## 10. Known Bugs
**version: 8.2.1 · issue: a monitored port keeps being re-added to Application Mapping, causing a process
storm / high load** — `PQD-39936 [MOTADATA-8460]`. Removing a port from monitoring was not enough because
the **nightly 2:15 AM rediscovery re-adds it to Application Mapping**; the workaround was to remove the port
from *both* monitoring and Application Mapping. A GUI toggle to disable the auto re-add (default **off**)
was productized in **8.2.1**. (KB §6, Agents.)
> Test implication: after deleting an application mapping, assert it is not silently re-created by the
> 2:15 AM rediscovery when the toggle is off.

## 11. Edge Cases
- Duplicate mapping (same Port+Protocol added twice) — expect block or overwrite.
- Port out of range (negative, 0, >65535); non-numeric port.
- Protocol value not in the allowed set.
- Very long / Unicode / duplicate Application Name.
- Delete a mapping that flow data is actively using (does live traffic re-label immediately?).
- Auto re-add interaction: delete a row, wait past the 2:15 AM rediscovery, confirm behaviour vs. the toggle.
- Search with no matches; search on partial port/name; case sensitivity.
- Empty grid (Flow enabled but no flow received yet).
