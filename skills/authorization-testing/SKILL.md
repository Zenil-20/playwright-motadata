---
name: authorization-testing
description: Generate role×action RBAC matrix tests against Motadata ObserveOps's real access-control screens — Roles, User Profiles, Group → Data Security — proving least-privilege, scope-by-group data isolation, and privilege-escalation prevention at both the UI and the backend. Use when a change touches permissions, scope, or who-can-see-what.
---
# Authorization Testing (ObserveOps RBAC)

ObserveOps enforces access control across three real screens, and a correct test must exercise all three because
they answer different questions:
- **Role** (`knowledge/product/Settings/users-settings/roles.md`) — *what a user may do* (module/action grants,
  e.g. view monitors, run **Query**, edit policies). Route `/settings/users-settings/roles`.
- **User Profile** (`users-settings/user-profiles.md`) — *what a user may do it to*: it binds a Role to a
  **Scope By** (which groups/monitors are visible). Route `/settings/users-settings/user-profiles`.
- **Group → Data Security** (`group-settings/data-security.md`) — the per-monitor enforcement point:
  *visibility = group assignment ∩ user-profile scope*, evaluated per data plane (**Monitoring / Log / Flow**).
  Route `/settings/group-settings/data-security`.

The whole point of RBAC here is least-privilege and multi-tenant data isolation, so authorization tests must be a
**matrix**, not a happy path: many roles × many actions × the scope dimension.

## When to use / When NOT
- **Use** when a change touches Roles/User-Profiles/Data-Security, when adding a new module action that needs a
  grant, or to build the standing regression that proves an operator cannot see another group's monitors.
- **Use** to regress the two cited RBAC defects (below) on every build.
- **Do NOT** assert only the negative-at-the-UI (button hidden). A hidden button is not enforcement — always pair
  with the API check (see `skills/api-security-testing`), because the backend is the real gate.
- **Do NOT** invent permission grant names or scope semantics. Many exact grant names are `TODO(source: KG/docs)`
  in the screen docs — harvest live via `motadata-explorer` before asserting them; don't guess.

## Procedure (build the role×action matrix)
1. **Enumerate the axes from the real screens.**
   - *Roles* = a least-privileged operator role, a scoped operator, an admin, plus a role deliberately **missing
     the Query grant** (to regress PQD-38798).
   - *Actions* = the operations the target module exposes (view / create / edit / delete / export / run-query /
     download-report).
   - *Scope* = at least two groups (**Group A**, **Group B**) so data isolation is testable.
   Represent the matrix as a CSV under `tests/data/*.csv` (max coverage, min automation: one data-driven scenario
   × many rows) — each row = `role, scope, action, expected(allow|deny)`.
2. **Seed the identities through the real screens.** Create the Roles, then the User Profiles (Role + `Scope By`
   group), then set **Data Security** assignments so a monitor belongs to Group A only. Use the `seed-data` skill
   / `mt-sandbox-state` so the precondition is guaranteed, not assumed.
3. **Drive each matrix row with one data-driven spec.** For each row, log in as that identity (avatar-visible
   login), navigate to the module, attempt the action via `framework/playwright/flow.js`, and assert:
   - **allow** → action succeeds and the row/toast appears;
   - **deny (action)** → the control is absent/disabled **and** the backend returns `403` (never a silent empty
     result — that is the PQD-38798 failure mode);
   - **deny (scope)** → a Group-B operator does **not** see the Group-A monitor's data on the Monitoring/Log/Flow
     planes, and cannot reach it by id.
4. **Privilege-escalation checks.** Attempt to edit one's own User Profile to widen **Scope By** or swap in a
   higher **Role**; attempt mass-assignment on the profile/role update. Expect denial. Assert that editing a Role
   held by a **currently logged-in user** takes effect on next login vs mid-session per the screen's edge cases.
5. **Delete-protection.** A Role/User-Profile with **Used Count > 0** must be delete-blocked or force a reassign —
   assert no orphaned users.
6. **Cite results.** Verified grants/scope semantics flip a screen doc's `TODO` to verified (via
   `mt-knowledge-updater`); confirmed defects land in `knowledge/known_issues/customer-issue-kb.md`.

Cited RBAC defects to regress every build:
- **PQD-38798** — a read-only user could not download reports because their **Role** lacked the **Query** grant;
  capability was silently absent, not an explicit error. Assert: revoke Query → report/download denied with a
  clear signal; grant Query → it works.
- **PQD-38219** — a **parent group does not auto-include child groups**; nested groups must be selected
  **explicitly** in scope/assignment. Assert cascade does *not* silently happen for **Assigned Groups** /
  **Scope By**.
- **PQD-41192 / MOTADATA-8587** — concurrent admin sessions VAPT finding; with
  `"allow.concurrent.sessions":"no"` a second/old session must be rejected.

## Rules & anti-patterns (tie to our conventions)
- **Matrix, not happy path.** Test every role against every action; the *deny* cells are the whole value.
- **Enforcement is backend.** UI-hidden control + backend `403` together; neither alone is a pass.
- **Scope is a first-class dimension.** Every data-visibility assertion carries a group scope; a test without two
  groups cannot prove isolation.
- **No invented grants/semantics; provenance always.** Where the screen docs say `TODO(source: KG/docs)`, harvest
  and cite before asserting — don't fabricate the permission taxonomy.
- **Delete-protection and cascade are part of authz**, not just CRUD — assert Used-Count blocks and explicit
  (non-cascading) group selection.

Adapted from qaskills/seed-skills/authorization-testing
