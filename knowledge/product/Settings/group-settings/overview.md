---
screen: Group (Group list)
module: Settings
category: group-settings
route: "/settings/group-settings/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # catalog/settings_group_settings.json; customer-issue-kb.md
verified: 2026-07-09
---

# Group Settings — Group list

## 1. Purpose
Manage the **groups** used to organize monitors and to scope dashboards, reports, alerting and
data-security (RBAC). Landing screen of the **Group Settings** category.

- **Business objective:** structure the monitored estate into logical groups so access, dashboards and
  policies can be targeted by group instead of per-device.
- **Screen description:** a group grid with search + filter + Create Group; sibling tab: **Data Security**.
- **Primary use cases:** create/edit/delete a group, organize monitors, drive scope-based RBAC.
- **Who uses it:** administrators.
- **Dependencies:** monitors/inventory (members) · Data Security + User Profiles (which consume groups as scope).

## 2. Navigation
```
Settings → Group Settings → Group (default landing)
```
- **Breadcrumb:** Settings › Group Settings › Group
- **Sibling tab:** Data Security
- **URL:** `/settings/group-settings/`

## 3. Actions
- **Create Group** (`#create-group-btn`)
- **Filter** (`#filter-btn`)
- **Search** groups
- Per-row edit / delete (`[data-cy='grid-action']`) — TODO(source: KG/docs) confirm row menu

## 4. Components
| Component | Control |
|---|---|
| Group grid | group rows (columns not captured in the sweep) |
| Search | `input[placeholder='Search']` + grid `name='search'` |
| Create Group | `#create-group-btn` |
| Filter | `#filter-btn` |

_Create/edit dialog fields not captured by the list sweep — harvest live. Locators → `knowledge/locators/catalog/settings_group_settings.json`._

## 5. Permissions
- **Admin-only** for group management. TODO(source: KG/docs) — exact role grant.

## 6. Entry Conditions
- Logged in as an admin with a valid session; Group Settings reachable.

## 7. Exit Conditions
- **Create/edit success:** success toast; the group appears in the grid; available as a scope elsewhere.
- **Delete:** group removed; TODO(source: KG/docs) — behavior for a group that still has members/children.

## 8. Validations
- Group Name likely unique + required. Exact rules/limits: TODO(source: KG/docs) — create dialog not captured.

## 9. Business Rules
- Groups can be **nested** (parent/child) and are consumed as **scope** by User Profiles and Data Security.
- TODO(source: KG/docs) — whether a monitor may belong to multiple groups; delete cascade to children/members.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md`:
- **Parent-group scope not cascading to child** — `PQD-38219`: assigning access at a parent group did not
  propagate to child groups as expected (scope/RBAC defect). Directly relevant to nested-group + Data
  Security testing from this screen.

## 11. Edge Cases
- Duplicate group name.
- Delete a group that still contains monitors or child groups.
- Deeply nested group hierarchy (scope propagation).
- Group used as a User-Profile/Data-Security scope then deleted (dangling scope).
- Empty group; very large group; Unicode in name.
- Filter/search with no results.
