---
screen: Users Settings (User list)
module: Settings
category: users-settings
route: "/settings/users-settings/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # catalog/settings_users_settings.json; customer-issue-kb.md
verified: 2026-07-09
---

# Users Settings — User list

## 1. Purpose
The admin directory of all user accounts. Landing screen of the **User Settings** category; it lists
every user and is where accounts are created, edited, disabled and deleted.

- **Business objective:** centrally manage who can log in and what they can do (via role + user profile).
- **Screen description:** a user grid with search + column controls + Create User; sibling tabs cover
  User Profiles, Roles, Password Settings, LDAP/SSO/RADIUS, Personal Access Token, Group.
- **Primary use cases:** onboard/offboard a user, reset/change access, audit the user list.
- **Who uses it:** administrators (user management is an admin function).
- **Dependencies:** the user store · Roles (for assignment) · optional LDAP/SSO/RADIUS for federated users.

## 2. Navigation
```
Settings → User Settings → User (default landing)
```
- **Breadcrumb:** Settings › User Settings › User
- **Sibling tabs** (from the left nav): User · User Profile · Personal Access Token · Role · Group ·
  Password Settings · LDAP Server Settings · Single Sign-On · Radius Server Settings
- **URL:** `/settings/users-settings/`

## 3. Actions
- **Create User** (`#create-user-btn`)
- **Search** users
- **Show / Hide Columns** (`#btn-show-hide-columns`)
- Per-row edit / delete / enable-disable (`[data-cy='grid-action']`) — TODO(source: KG/docs) confirm the row menu
- Export list — TODO(source: KG/docs)

## 4. Components
| Component | Control |
|---|---|
| User grid | rows per user (the sweep captured many user names as row ids) |
| Search | `input[placeholder='Search']` (sidebar) + grid `name='search'` |
| Create User | `#create-user-btn` |
| Column chooser | `#btn-show-hide-columns` |

_Create/edit dialog fields were not captured by the list sweep — harvest live. Locators → `knowledge/locators/catalog/settings_users_settings.json`._

## 5. Permissions
- **Admin-only.** Creating/editing/deleting users and assigning roles is a privileged operation.
- TODO(source: KG/docs) — exact role grant that unlocks user management; whether Operators get read-only.

## 6. Entry Conditions
- Logged in as an admin with a valid session; User Settings reachable.

## 7. Exit Conditions
- **Create/edit success:** success toast; the new/updated user appears in the grid; audit entry written.
- **Delete:** user removed from the grid (and can no longer log in).

## 8. Validations
- User Name likely unique + required; Email valid format; password vs the system password policy.
- Exact field rules/limits: TODO(source: KG/docs) — create dialog not captured.

## 9. Business Rules
- A user must be assigned a **Role** (and typically a **User Profile** scope) to be effective.
- Federated (LDAP/SSO/RADIUS) users are provisioned/synced from those providers.
- TODO(source: KG/docs) — can the last admin be deleted/disabled? self-delete rules? seat/license limits?

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md`:
- **Concurrent-session / auth** — `PQD-41192` (concurrent session handling) cited as auth-wide context.
- **Role/permission gap** — `PQD-38798`: a missing "Query" permission on a role blocks report download
  for users on that role. Relevant when validating role assignment from this screen.

## 11. Edge Cases
- Duplicate user name / email already in use.
- Delete or disable **your own** account; delete the **last** admin.
- Create user with no role / no scope.
- Federated user collision with a local user of the same name (see LDAP duplicate-user KB).
- Very long name; Unicode in name; disabled user attempting login.
- Search with no results; large user list pagination.
