---
screen: Log Settings · log-inventory
module: Settings
category: log-settings
route: "/settings/log-settings/log-inventory"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_log_settings_log_inventory.json (live Vue-router sweep 2026-07-02); customer-issue-kb.md §7
verified: 2026-07-09
---

# Log Settings · Log Inventory

## 1. Purpose
The inventory of every **log source** feeding Motadata — each device/agent/application that ships
logs, the **parser(s) assigned** to it, and its **category** and **group**. This is where an admin
confirms a source is recognized and correctly parsed; a source with the wrong/no parser sends its
logs to **"Others"** and they become unsearchable (KB §7).

- **Business objective:** ensure every log-emitting source is inventoried and mapped to the right
  parser so log search, dashboards and log-based alerting operate on structured fields.
- **Screen description:** a searchable, filterable grid (**Source · Source Type · Assigned Parsers ·
  Category · Group · Actions**) with **Create Log Inventory** and **Filter** toolbar actions.
- **Primary use cases:** review sources, assign/change a parser, group/categorize sources, add a new
  source, filter by type/category/group.
- **Who uses it:** log/platform administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** log ingestion licensed/enabled · collector/agent forwarding logs · Log Parsers
  (assignable) · groups & tags (System Settings).

## 2. Navigation
```
Settings → Log Settings → Log Inventory
```
- **Breadcrumb:** Settings › Log Settings › Log Inventory
- **URL:** `/settings/log-settings/log-inventory` (SPA route; open the full URL).
- **Note:** the Log Settings landing route (`/settings/log-settings/`) exposes this same grid/ids.

## 3. Actions
- **Create Log Inventory** — add a new log source (`#create-group-btn`).
- **Filter** — open the filter panel (`#filter-btn`).
- **Search** — free-text filter (`input[name="search"]`, placeholder _Search_).
- **Per-row Actions** — `[data-cy='grid-action']` (edit source, assign parser, delete). TODO(source:
  KG/docs) — exact menu items.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search"]` (text) + a second unnamed _Search_ input |
| Grid | columns **Source · Source Type · Assigned Parsers · Category · Group · Actions** |
| Create Log Inventory | button `#create-group-btn` |
| Filter | button `#filter-btn` |
| Row actions | `[data-cy='grid-action']` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_log_settings_log_inventory.json`;
promote verified ones into the cookbook (Settings > Log Inventory). Create/edit form fields were not
captured — harvest live._

> **Automation caveat:** `#create-group-btn` / `#filter-btn` / `[data-cy='grid-action']` are shared
> generic ids reused across Log Settings screens (and the overview route). Scope by route.

## 5. Permissions
- Expected **Admin / log-admin** to create/edit/assign; Operator/Viewer read-only. TODO(source:
  KG/docs) — exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Log Settings reachable; log ingestion licensed/enabled.
- Sources appear only once a collector/agent forwards logs; before that the grid is empty.

## 7. Exit Conditions
- **On create/edit (success):** row added/updated with the chosen parser/category/group; expected
  success toast. TODO(source: docs) — confirm toast.
- **On parser assignment:** subsequent logs from that source parse against the assigned parser
  (previously-"Others" logs are not retro-parsed — TODO(source: KG) confirm).

## 8. Validations
- **Source** — required; identity (name/IP). TODO(source: docs).
- **Assigned Parsers** — one or more valid parsers. TODO(source: docs) — can multiple parsers be
  assigned; ordering/precedence.
- **Category / Group** — TODO(source: docs) — required? free-text vs picker.

## 9. Business Rules
- **Parser assignment is per source** — historically keyed on **source-IP**, so two devices behind a
  dynamic/dual-WAN IP can collide and mis-parse (KB §7). A source with no matching parser → logs go
  to **"Others"**.
- Only **Event / Application / Security** Windows event sources are enabled by default; additional
  event sources need event IDs added in agent settings (KB §7).
- TODO(source: KG) — default parser fallback, group/tag inheritance, source-type detection.

## 10. Known Bugs
From `customer-issue-kb.md` §7 "Logs land in 'Others' / not parsed / not searchable":
- **Parser assignment per source-IP breaks on dynamic dual-WAN IPs** — logs bypass the assigned
  parser (feature request for name-based grouping). (PQD-35659.)
- **`windows.event.provider` non-indexable** → filter/search dead in the Log module until a hotfix +
  config parameter indexed the field (**8.1.3** patch). (PQD-38164 [MOTADATA-8029].)
- **Only Event/Application/Security event sources enabled by default** → AD/Exchange logs missing
  until event sources with event IDs are added in agent settings; **Linux AuditD parser** became a
  default from **8.2.2**. (PQD-36867, PQD-41651.)
> Verify against build 8.2.6 before treating as open. Do not invent bugs.

## 11. Edge Cases
- Source with **no assigned parser** → "Others".
- Two sources sharing one IP (dual-WAN) → parser collision.
- Source sending mixed log formats (needs multiple parsers).
- Windows source with non-default event channels (missing until added).
- Large inventory — search/filter/pagination performance.
- Deleting a source that is actively ingesting.
- Reassigning a parser mid-stream (do in-flight logs re-parse?).
