---
screen: Users Settings · roles
module: Settings
category: users-settings
route: "/settings/users-settings/roles"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # catalog/settings_users_settings_roles.json · screenshots/Settings1.png (left-nav) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Users Settings · Role

## 1. Purpose
The **Role** screen defines the *permission sets* (RBAC roles) that govern what an operator may see and
do across ObserveOps. A role bundles module/action grants (e.g. view monitors, run queries, edit
policies) into a named unit that is then attached to users via **User Profiles**.

- **Business objective:** enforce least-privilege access — separate who can administer the platform
  from who can only view dashboards or run reports, so audits and change-control are satisfiable.
- **Screen description:** a searchable grid of roles under `Settings → User Settings → Role`, with a
  **Create Role** entry point and per-row Actions (edit/clone/delete). Columns: **Role Name**,
  **Description**, **Used Count**, **Actions**.
- **Primary use cases:** create a role, edit its permission grants, clone a role as a template for a
  new one, delete an unused role, see how many users/profiles consume a role (**Used Count**).
- **Who uses it:** administrators with user-management rights. Non-admin operators typically cannot
  reach this screen — TODO(source: KG/docs) confirm the exact permission that gates it.
- **Dependencies:** the user/RBAC store; **User Profiles** (which reference roles); the permission
  catalog that enumerates grantable actions. TODO(source: KG/docs) — the full permission taxonomy.

## 2. Navigation
```
Settings → User Settings → Role
```
- **Breadcrumb:** Settings › User Settings › Role
- **Left-nav group:** *User Settings* (siblings: User · User Profile · Personal Access Token · Role ·
  Group · Password Settings · LDAP Server Settings · Single Sign-On · Radius Server Settings) — order
  confirmed from `screenshots/Settings1.png`.
- **URL:** `/settings/users-settings/roles`
- Settings shell provides the top search box and the left-nav search filter.

## 3. Actions
- **Create Role** — opens the role editor (`#create-role-btn`, `[data-testid='roles-create-btn']`).
- **Search** roles by name/description (`role-search`, `[data-testid='roles-search-input']`).
- **Export** the grid — **PDF** (`[data-testid='roles-export-pdf-btn']`) / **CSV**
  (`[data-testid='roles-export-csv-btn']`).
- **Row Actions** (per the *Actions* column) — edit / clone / delete a role. Exact action set
  TODO(source: KG/docs); the create/edit form fields (name, description, permission grants) were **not
  captured** in the grid-state sweep — confirm live or via the KG.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name='role-search']` (placeholder *Search*) · `[data-testid='roles-search-input']` |
| Create Role (primary) | `#create-role-btn` · `[data-testid='roles-create-btn']` |
| Export PDF | `[data-testid='roles-export-pdf-btn']` |
| Export CSV | `[data-testid='roles-export-csv-btn']` |
| Grid | columns: **Role Name**, **Description**, **Used Count**, **Actions** |
| Row Actions | edit / clone / delete (in the *Actions* column) |

> The **Create/Edit Role** dialog (name, description, and the permission-grant matrix) is not in the
> catalog because the sweep only captured the grid state. Author the dialog fields from a live harvest
> or the KG before writing tests against it. _Promote verified locators into `selector-cookbook.md`._

## 5. Permissions
- **Admin-gated:** managing roles is itself a privileged action — only users whose role grants
  user/RBAC administration should see **Create Role** and the row Actions. TODO(source: KG/docs) —
  the exact grant name (e.g. "User Management" / "Administration").
- **Roles are the unit of permission** for the whole product: a role's grants determine module
  visibility and allowed actions everywhere else. A missing grant silently removes capability rather
  than erroring — see Known Bugs (the "Query" permission case).
- TODO(source: KG/docs): whether built-in/system roles (e.g. a default Administrator) are
  non-deletable and non-editable.

## 6. Entry Conditions
- User is logged in with a role that permits user/RBAC administration.
- Settings is reachable (`/settings/`) and the roles grid loads its rows.

## 7. Exit Conditions
- **On Create/Edit (success):** success toast; the new/updated role appears in the grid; an audit
  entry is written (Audit Trail). Good assertions: row present with expected **Role Name** and
  **Description**.
- **On Delete:** row removed; blocked (or warned) when **Used Count** > 0 — see Business Rules.
- **On Export:** a PDF/CSV file downloads reflecting the current (filtered) grid.

## 8. Validations
- **Role Name** — required and expected **unique**; duplicate → inline error. TODO(source: KG/docs)
  confirm uniqueness + max length.
- **Description** — optional. TODO(source: docs) max length.
- **Permission grants** — TODO(source: KG/docs): whether at least one grant is required to save.

## 9. Business Rules
- **Used Count** reflects how many users/profiles reference the role; a role in use is expected to be
  **protected from deletion** (delete blocked or a reassign prompt). TODO(source: KG/docs) confirm.
  See [[RBAC-03]] for the cross-cutting version of this rule (also applies to Profile/Group/Policy).
- A role with a **missing permission** removes the corresponding capability for every user who has it —
  e.g. without the **Query** grant a user cannot download reports (Known Bugs). This makes role
  editing high-blast-radius; changes should be audited. See [[RBAC-01]] (least-privilege cascade).
- **User Profiles reference roles** — deleting/altering a role cascades to every profile (and thus
  user) that consumes it. TODO(source: KG/docs) confirm cascade semantics. Note that Group scope does
  **not** cascade parent→child the same way — see [[RBAC-02]], don't assume this rule generalizes.
- Managing roles is itself gated by RBAC and should never rely on a hidden control alone —
  see [[RBAC-04]] (no self-elevation / hidden-control is not enforcement).
- TODO(source: KG/docs): built-in system roles, and whether roles are scoped to groups here or only in
  User Profiles (**Scope By** lives on the User Profile screen).

## 10. Known Bugs
- **version: 8.x** · **issue:** a **read-only user could not download reports** because their role was
  missing the **"Query"** permission — capability silently absent rather than an explicit error
  (`customer-issue-kb.md` §4 "Report content/permission gotchas", PQD-38798). · **workaround:** grant
  the **Query** permission to the role.
- **version: 8.1.3** · **issue (auth-wide, related):** concurrent admin sessions flagged by VAPT
  (`customer-issue-kb.md` §9, PQD-41192 / MOTADATA-8587). · **workaround:** set
  `"allow.concurrent.sessions": "no"` in `motadata.json`. (Config-level, not set on this screen — cited
  for RBAC test context.)
- No role-editor CRUD defects recorded beyond the above for build 8.2.6. Do not invent bugs.

## 11. Edge Cases
- Duplicate **Role Name**; empty name → save blocked.
- **Delete a role with Used Count > 0** — expect block / reassign prompt, not an orphaned user.
- Create a role with **no permissions** granted (can it save? can a user with it do anything?).
- Edit a role that a **currently logged-in user** holds — does the change take effect mid-session or
  on next login? (ties to the concurrent-session issue).
- Grant/revoke the **Query** permission and assert report download toggles accordingly (regression for
  PQD-38798).
- Very long name/description; Unicode in name; search with no matches (empty grid).
- Export an empty or filtered grid (PDF/CSV fidelity).
