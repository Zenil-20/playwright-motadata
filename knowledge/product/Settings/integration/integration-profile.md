---
screen: Integration · integration-profile
module: Settings
category: integration
route: "/settings/integration/integration-profile"
build: 8.2.6
status: draft
sources: [catalog, kb]           # locators/catalog/settings_integration_integration_profile.json (live Vue-router sweep 2026-07-02); known_issues/customer-issue-kb.md §2
verified: 2026-07-09
---

# Integration · Integration Profile

## 1. Purpose
The list/manager for **Integration Profiles** — the objects that decide **which alerts get forwarded to
which connector** (ServiceNow, Motadata ServiceOps, Jira, Teams, Slack…). Where the per-connector screens
define *how to reach* an external system, an Integration Profile defines *what to send there*.

- **Business objective:** map monitoring alerts (by severity/scope/rules) onto an external integration
  so the right problems reach the right ticketing/notification system.
- **Screen description:** a grid under `Settings → Integration → Integration Profile` listing existing
  profiles with **Profile Name, Description, Integration Type, Used Count, Actions**, plus **Create
  Integration Profile**, a **Filter**, and a show/hide-columns control. Row checkboxes (12 captured)
  suggest per-row selection for bulk operations.
- **Primary use cases:** create/edit/delete an integration profile, see how many places a profile is
  used (Used Count), filter the list, bulk-select profiles.
- **Who uses it:** administrators wiring alerts to integrations (see Permissions).
- **Dependencies:** at least one configured **connector** (ServiceNow/ServiceOps/Jira/Teams/Slack) to
  bind to · the alert engine that produces the alerts a profile routes.

## 2. Navigation
```
Settings → Integration → Integration Profile
```
- **Breadcrumb:** Settings › Integration › Integration Profile
- **Sibling connectors:** Motadata ServiceOps · Service Now · Atlassian Jira · Microsoft Teams · Slack · LAMA
- **URL:** `/settings/integration/integration-profile` (open the full URL; SPA routing must load the page)

## 3. Actions
Derived from the catalog buttons/controls:
- **Create Integration Profile** (`#create-user-btn`) — open the create form/drawer for a new profile.
  (Note the id is the generic `#create-user-btn` — a shared create-button id, not profile-specific.)
- **Filter** (`#filter-btn`) — filter the profile list.
- **Show/Hide Columns** (`#btn-show-hide-columns`) — toggle grid columns.
- **Row actions** (`[data-cy='grid-action']`) — per-row edit/delete/etc. TODO(source: KG/docs) exact set.
- **Select rows** — 12 checkboxes captured (row + possibly header select-all) for bulk actions.
- **Search** the grid (placeholder _Search_).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Grid | columns: **Profile Name · Description · Integration Type · Used Count · Actions** |
| Row select | checkboxes (12 captured — row-level + select-all) |
| Row actions | `[data-cy='grid-action']` |
| Create Integration Profile | `#create-user-btn` (shared create-button id) |
| Filter | `#filter-btn` |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Search | text input, placeholder _Search_ |
| Settings left-nav + Search | shared Settings shell |

> This is a **grid/list** screen (unlike the connector forms). The create/edit form fields were **not
> captured** by the OFF-state sweep — they render in a drawer/dialog after Create. TODO(source: KG/docs)
> capture the profile form (which connector, severities, alert filters, mapping). Promote verified
> locators into the selector-cookbook.

## 5. Permissions
- **Admin-only (expected):** integration profiles route alerts system-wide, so create/edit/delete is
  gated to administrators; Operators/Viewers at most read. TODO(source: KG/docs) confirm exact permission.
- License/module gating: TODO(source: KG/docs).

## 6. Entry Conditions
- Logged in with access to `/settings/integration/`.
- To create a working profile, at least one **connector** must already be configured to bind to.
- TODO(source: docs) — any module/feature flag.

## 7. Exit Conditions
- **On Create (success):** success toast; new row appears in the grid with its Integration Type;
  **Used Count** starts at 0 (or reflects bindings). Audit entry written. TODO(source: KG) confirm.
- **On Delete:** row removed; blocked if **Used Count > 0** (in-use)? TODO(source: KG/docs) confirm.
- **On Filter:** grid narrows to matching profiles.

## 8. Validations
- **Profile Name** — required and likely **unique**; duplicate → error. TODO(source: KG/docs) confirm.
- **Integration Type / connector** — required (a profile must target a connector). TODO(source: KG/docs).
- At least one severity/alert-scope must be selected — see Known Bugs (single-severity NPE). TODO(source: KG/docs).
- Field-level validations of the create form: TODO(source: KG/docs) — form not captured in the sweep.

## 9. Business Rules
- **A profile binds alerts to a connector** — it is the routing layer between the alert engine and the
  external integration; connectors do nothing until a profile routes alerts to them.
- **Used Count** reflects how many places/policies reference the profile; a profile in use likely cannot
  be deleted without detaching first. TODO(source: KG/docs) confirm.
- TODO(source: KG/docs): whether one profile can target multiple connectors; severity→field mapping;
  whether Profile Name is immutable after creation.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` §2 (Upgrade / patch bugs):
- **NullPointerException when only one severity is configured in an integration profile.**
  `PQD-35982 / PQD-35984 [MOTADATA-7641]` · Symptom: after upgrade (8.0.26→8.1.0 era), tickets/alerts
  stop and services fail because the integration profile has a single severity configured. Diagnosis: NPE
  when only one severity is present in the profile. Solution: re-released bundle patch (fixed in 8.2.x).
  → **Regression coverage:** create a profile with exactly one severity, exercise it across an upgrade,
  assert no NPE and that tickets/alerts still generate.
> No other Integration-Profile-specific issues recorded for this screen.

## 11. Edge Cases
- Create a profile with **exactly one severity** (the `MOTADATA-7641` NPE class).
- Duplicate **Profile Name**.
- Delete a profile with **Used Count > 0** (in use) — expect a block or cascade warning.
- Create a profile whose target connector is not yet configured/reachable.
- Bulk-select all rows via the header checkbox and delete.
- Filter with no matches (empty grid state).
- Very long Profile Name/Description; special characters.
- Profile targeting a connector that is later deleted (dangling binding).
