---
screen: Users Settings · user-profiles
module: Settings
category: users-settings
route: "/settings/users-settings/user-profiles"
build: 8.2.6
status: draft
sources: [catalog, screenshot]   # catalog/settings_users_settings_user_profiles.json · screenshots/Settings1.png (left-nav)
verified: 2026-07-09
---

# Users Settings · User Profile

## 1. Purpose
The **User Profile** screen binds a **Role** (permission set) to a **Scope** (which groups/monitors the
holder may see) into a reusable profile that is then assigned to users. It is the join between *what a
user can do* (Role) and *what a user can do it to* (Scope).

- **Business objective:** grant the same role to different populations with different data visibility —
  e.g. "Operator over the DC group" vs "Operator over the Branch group" — without cloning permissions.
- **Screen description:** a searchable grid under `Settings → User Settings → User Profile` with a
  **Create User Profile** entry point. Columns: **User Profile**, **Description**, **Scope By**,
  **Role**, **Used Count**, **Actions**.
- **Primary use cases:** create a profile (pick a role + a scope), edit scope/role, clone a profile,
  delete an unused profile, see consumer count (**Used Count**).
- **Who uses it:** administrators with user-management rights.
- **Dependencies:** the **Role** screen (roles referenced here) and the group/monitor hierarchy (the
  scope target). Data-level scoping interacts with **Group → Data Security**.

## 2. Navigation
```
Settings → User Settings → User Profile
```
- **Breadcrumb:** Settings › User Settings › User Profile
- **Left-nav group:** *User Settings* (siblings incl. User · Role · Group · Password Settings …) —
  order confirmed from `screenshots/Settings1.png`.
- **URL:** `/settings/users-settings/user-profiles`

## 3. Actions
- **Create User Profile** — opens the profile editor (`#create-user-profile-btn`,
  `[data-testid='user-profiles-create-btn']`).
- **Search** profiles (`user-profile-search`, `[data-testid='user-profiles-search-input']`).
- **Export** — **PDF** (`[data-testid='user-profiles-export-pdf-btn']`) / **CSV**
  (`[data-testid='user-profiles-export-csv-btn']`).
- **Row Actions** — edit / clone / delete a profile (exact set TODO(source: KG/docs)).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name='user-profile-search']` · `[data-testid='user-profiles-search-input']` |
| Create User Profile (primary) | `#create-user-profile-btn` · `[data-testid='user-profiles-create-btn']` |
| Export PDF / CSV | `[data-testid='user-profiles-export-pdf-btn']` / `[data-testid='user-profiles-export-csv-btn']` |
| Grid | columns: **User Profile**, **Description**, **Scope By**, **Role**, **Used Count**, **Actions** |
| Row Actions | edit / clone / delete |

> The **Create/Edit User Profile** dialog — name, description, **Role** picker, and **Scope By**
> selector (group/monitor scope) — was **not captured** by the grid-state sweep. Harvest it live or
> from the KG before authoring tests. _Promote verified locators into `selector-cookbook.md`._

## 5. Permissions
- **Admin-gated:** creating/editing profiles is a privileged user-management action.
  TODO(source: KG/docs) — exact grant.
- **Scope is enforced through this profile:** the **Scope By** value limits which groups/monitors the
  assigned users can see — the data-visibility half of RBAC (the action half is the **Role**).
- TODO(source: KG/docs): whether a default/all-scope profile exists and is protected.

## 6. Entry Conditions
- Logged in with user-management rights.
- At least one **Role** exists (a profile must reference a role) and the group hierarchy is populated
  (for a meaningful scope).

## 7. Exit Conditions
- **On Create/Edit (success):** success toast; row appears/updates with the chosen **Role** and
  **Scope By**; audit entry written. Assertions: row present with expected Role + Scope.
- **On Delete:** row removed; expected to be blocked when **Used Count** > 0.
- **On Export:** PDF/CSV of the current grid downloads.

## 8. Validations
- **User Profile (name)** — required, expected **unique**; duplicate → inline error.
  TODO(source: KG/docs) confirm.
- **Role** — required (a profile must map to exactly one role). TODO(source: KG/docs) confirm cardinality.
- **Scope By** — TODO(source: KG/docs): required vs optional, and allowed scope types (group / tag /
  all).
- **Description** — optional; max length TODO(source: docs).

## 9. Business Rules
- A profile is **Role + Scope**: the same role can appear in many profiles with different scopes.
- **Used Count** reflects assigned users; a profile in use is expected to be **protected from
  deletion**. TODO(source: KG/docs) confirm.
- **Scope By** here governs data visibility, complementary to **Group → Data Security** (which scopes
  monitor data to groups). TODO(source: KG/docs) confirm precedence when both apply.
- TODO(source: KG/docs): can a user hold multiple profiles, or exactly one?

## 10. Known Bugs
None recorded for this screen in `customer-issue-kb.md` for build 8.2.6. (Adjacent, not this screen:
LDAP group→profile mapping issues are catalogued under §11 LDAP/AD — see `ldap-server-settings.md`;
role/permission gaps under §4 — see `roles.md`.) Do not invent bugs.

## 11. Edge Cases
- Duplicate profile name; empty name/role → save blocked.
- **Delete a profile with Used Count > 0** — expect block/reassign, no orphaned users.
- Change the **Role** of a profile held by active users — capability change mid-session vs next login.
- Change **Scope By** and assert the assigned user's visible groups/monitors update accordingly.
- Very narrow scope (single monitor) vs all-scope; empty scope (can it save?).
- Clone a profile and edit the clone — assert the original is untouched (clone-independence, cf.
  `customer-issue-kb.md` clone-state defects in other modules).
- Search with no matches; export filtered grid.
