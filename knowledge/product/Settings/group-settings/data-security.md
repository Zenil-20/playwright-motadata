---
screen: Group · data-security
module: Settings
category: group-settings
route: "/settings/group-settings/data-security"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # catalog/settings_group_settings_data_security.json · screenshots/Settings1.png (left-nav "Group") · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Group · Data Security

## 1. Purpose
The **Data Security** screen controls, **per monitor**, which **groups** may see that monitor's data
across the **Monitoring**, **Log**, and **Flow** data planes. It is the data-scoping half of RBAC: a
user's **User Profile** scope decides which groups they belong to, and this screen decides which groups
each monitor's data is exposed to.

- **Business objective:** enforce data-level segregation (multi-tenant / need-to-know) — ensure a group
  only sees the monitors/logs/flows it is entitled to, independent of module permissions.
- **Screen description:** a grid of monitors under `Settings → Group → Data Security` with per-monitor
  **Assigned Groups** and per-data-plane checkboxes (**Monitoring**, **Log**, **Flow**). Columns:
  **Monitor**, **Monitor Type**, **Assigned Groups**, **Monitoring**, **Log**, **Flow**, **Actions**.
- **Primary use cases:** assign a monitor to one or more groups; enable/disable the Monitoring/Log/Flow
  data planes for that assignment; search monitors; adjust via the row Actions.
- **Who uses it:** administrators with group/data-security management rights.
- **Dependencies:** the group hierarchy; discovered monitors; **User Profiles** (whose **Scope By**
  consumes these group assignments); the Log and Flow modules (for those columns to be meaningful).

## 2. Navigation
```
Settings → Group → Data Security
```
- **Breadcrumb:** Settings › Group › Data Security
- **Left-nav group:** *User Settings → Group* (the **Group** item in the User Settings nav; confirmed
  present in `screenshots/Settings1.png`). Route category is `group-settings`.
- **URL:** `/settings/group-settings/data-security`

## 3. Actions
- **Search** monitors — two search inputs captured (placeholder *Search*): expected a monitor search and
  a group/assignment filter. TODO(source: KG/docs) confirm which is which.
- **Assign / unassign groups** per monitor (the **Assigned Groups** column).
- **Toggle data planes** per monitor via the **Monitoring / Log / Flow** checkboxes (catalog reports
  **102 checkboxes** — i.e. the three-plane checkboxes across many monitor rows).
- **Row Actions** — edit assignment (via `[data-cy='grid-action']`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search (x2) | two `input` (placeholder *Search*) — monitor filter + group/assignment filter (roles TBD) |
| Monitoring / Log / Flow checkboxes | ~**102 checkboxes** total (3 data-plane toggles × monitor rows) |
| Row action menu | `[data-cy='grid-action']` |
| Grid | columns: **Monitor**, **Monitor Type**, **Assigned Groups**, **Monitoring**, **Log**, **Flow**, **Actions** |

> No **Create/Save** button was captured in the sweep — assignment changes may **auto-save per row** or
> save via the row action menu (`[data-cy='grid-action']`); confirm live/KG. The **Assigned Groups**
> editor (a group multi-select) and any bulk-assign control were **not captured** — harvest live/KG.
> _Promote verified locators into `selector-cookbook.md`._

## 5. Permissions
- **Admin-gated:** editing data-security assignments is a privileged action — it directly changes what
  other users can see. TODO(source: KG/docs) — exact grant.
- **This screen is the enforcement point for data visibility:** even a user whose **Role** grants
  "view monitors" only sees monitors whose **Assigned Groups** intersect their profile scope. A monitor
  with no matching group assignment is invisible to that user regardless of role.
- TODO(source: KG/docs): precedence between a monitor's group assignment here and a User Profile's
  **Scope By** — confirm whether both must agree (intersection) or either suffices.

## 6. Entry Conditions
- Logged in with group/data-security management rights.
- Monitors are discovered (rows exist) and groups are defined (assignable targets).
- Log/Flow columns are meaningful only where the Log/Flow modules are licensed/enabled.

## 7. Exit Conditions
- **On assign/toggle (success):** success toast / row reflects the new **Assigned Groups** and
  Monitoring/Log/Flow state; an audit entry is written. Assertion: a user in an assigned group can now
  see that monitor's data for the enabled planes, and cannot for disabled ones.
- **On unassign:** the monitor's data disappears for users of the removed group.

## 8. Validations
- **Assigned Groups** — TODO(source: KG/docs): whether a monitor may have zero groups (fully hidden) or
  must have at least one.
- **Monitoring/Log/Flow** — independent per-plane booleans; TODO(source: KG/docs) whether a plane can be
  enabled without at least one assigned group.

## 9. Business Rules
- **Visibility = group assignment ∩ user profile scope**, evaluated **per data plane** (Monitoring / Log
  / Flow). Disabling **Log** for a monitor hides its logs even from users who can see its metrics.
  TODO(source: KG/docs) confirm the exact intersection semantics.
- **Group scoping is not automatically hierarchical here** — parent/child group selection has been an
  explicit-selection design elsewhere in the product (see Known Bugs); confirm whether assigning a
  parent group cascades to children on this screen. TODO(source: KG/docs).
- TODO(source: KG/docs): default assignment for a newly discovered monitor (all groups? none? a default
  group?).

## 10. Known Bugs
None recorded **specifically** for the Data Security screen in `customer-issue-kb.md` for build 8.2.6.
Adjacent group-scoping behaviour worth testing here:
- **issue (design, related):** a **parent group does not automatically include its child groups** —
  nested groups must be selected **explicitly** (`customer-issue-kb.md` §4 "Report content/permission
  gotchas", PQD-38219). Intentional design elsewhere; verify how it behaves for **Assigned Groups** on
  this screen before assuming cascade.
- **issue (related):** a read-only user could not download reports due to a missing **Query** role
  permission (PQD-38798) — a *role*-level gap, not a data-security assignment, but both shape what a user
  ultimately sees; combine both when testing end-to-end visibility.
Do not invent bugs.

## 11. Edge Cases
- Assign a **parent group** — assert whether child-group users gain access (cascade vs explicit, cf.
  PQD-38219).
- Monitor with **no assigned groups** — confirm it is hidden from all non-admins.
- Enable **Log**/**Flow** for a monitor whose Log/Flow module is disabled/unlicensed — expected no-op or
  guard.
- Toggle **Monitoring** off but **Log** on (and vice versa) — assert per-plane isolation.
- Newly discovered monitor — verify its default visibility matches policy (no accidental exposure).
- Large inventory (many rows × 3 checkboxes = the ~102 captured) — bulk-assign performance and
  per-row save integrity.
- User whose profile scope no longer intersects a monitor mid-session — visibility updates on refresh vs
  next login.
