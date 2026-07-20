---
screen: Integration · lama
module: Settings
category: integration
route: "/settings/integration/lama"
build: 8.2.6
status: draft
sources: [catalog, kb]           # locators/catalog/settings_integration_lama.json (live Vue-router sweep 2026-07-02); known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Integration · LAMA

## 1. Purpose
The list/manager for **LAMA Profiles** — a scheduled data-exchange integration in ObserveOps. Each
profile binds a named application to an **Exchange** and pulls/pushes data on a **Data Interval** within
defined **Monitoring Hours**, tracking **Last Sync At** and a **Status**.

- **Business objective:** integrate an external application's data with AIOps on a schedule.
  TODO(source: KG/docs) — the exact meaning of **LAMA** (acronym) and what the "Exchange" endpoint is;
  do not assume. The screen's own grid columns are the only grounded evidence.
- **Screen description:** a grid under `Settings → Integration → LAMA` listing profiles with **NAME,
  DESCRIPTION, EXCHANGE, APPLICATION, DATA INTERVAL, MONITORING HOURS, LAST SYNC AT, STATUS, ACTION**,
  plus **Create LAMA Profile** and a show/hide-columns control.
- **Primary use cases:** create/edit/delete a LAMA profile, monitor last-sync/status, adjust the data
  interval or monitoring hours.
- **Who uses it:** administrators configuring data integrations (see Permissions).
- **Dependencies:** TODO(source: KG/docs) — an Exchange endpoint, an application, and a schedule; exact
  prerequisites unknown from the sweep.

## 2. Navigation
```
Settings → Integration → LAMA
```
- **Breadcrumb:** Settings › Integration › LAMA
- **Sibling connectors:** Motadata ServiceOps · Service Now · Atlassian Jira · Microsoft Teams · Slack · Integration Profile
- **URL:** `/settings/integration/lama` (open the full URL; SPA routing must load the page)

## 3. Actions
Derived from the catalog buttons/controls:
- **Create LAMA Profile** (`#create-lama-profile-btn`) — open the create form/drawer for a new profile.
- **Show/Hide Columns** (`#btn-show-hide-columns`) — toggle grid columns.
- **Row actions** (ACTION column) — per-row edit/delete/etc. TODO(source: KG/docs) exact set.
- **Search** the grid (placeholder _Search_).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Grid | columns: **NAME · DESCRIPTION · EXCHANGE · APPLICATION · DATA INTERVAL · MONITORING HOURS · LAST SYNC AT · STATUS · ACTION** |
| Create LAMA Profile | `#create-lama-profile-btn` |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Search | text input, placeholder _Search_ |
| Settings left-nav + Search | shared Settings shell |

> This is a **grid/list** screen. The create/edit form fields were **not captured** by the OFF-state
> sweep — they render in a drawer/dialog after Create. TODO(source: KG/docs) capture the LAMA profile
> form (Exchange, Application, Data Interval, Monitoring Hours). Promote verified locators into the
> selector-cookbook.

## 5. Permissions
- **Admin-only (expected):** a data-integration profile is a system-level object, so create/edit/delete
  is likely gated to administrators. TODO(source: KG/docs) confirm exact permission.
- License/module gating: TODO(source: KG/docs) — LAMA may be a licensed add-on.

## 6. Entry Conditions
- Logged in with access to `/settings/integration/`.
- TODO(source: docs) — an available Exchange/application to bind to; any module/feature flag or license
  required for LAMA.

## 7. Exit Conditions
- **On Create (success):** success toast; new row appears with **STATUS** and (after first run) a
  **LAST SYNC AT** timestamp. Audit entry written. TODO(source: KG) confirm.
- **On Delete:** row removed. TODO(source: KG/docs) confirm in-use handling.
- **STATUS / LAST SYNC AT** are the health signals to assert against for a working sync.

## 8. Validations
- **NAME** — required and likely **unique**. TODO(source: KG/docs) confirm.
- **DATA INTERVAL** — a valid interval; **MONITORING HOURS** — a valid window. TODO(source: KG/docs) formats/limits.
- Form-level validations: TODO(source: KG/docs) — form not captured in the sweep.

## 9. Business Rules
- **A LAMA profile syncs on its Data Interval, only within its Monitoring Hours** — inferred from the
  grid columns; the profile is inactive outside the configured hours. TODO(source: KG/docs) confirm.
- **LAST SYNC AT / STATUS** reflect the outcome of the most recent scheduled run.
- TODO(source: KG/docs): meaning of **LAMA** and **EXCHANGE**; whether a profile can be paused; retry
  behaviour on a failed sync.

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`. No LAMA-specific issues
appear in the KB (no §-entry references LAMA, Exchange, or this route). Do not attribute unrelated
integration bugs here.

## 11. Edge Cases
- Create a profile with an invalid/empty Data Interval or Monitoring Hours.
- Duplicate **NAME**.
- Exchange/application endpoint unreachable at sync time → STATUS should reflect failure, LAST SYNC AT
  should not falsely advance.
- Sync scheduled outside Monitoring Hours (should not run).
- Very long NAME/DESCRIPTION; special characters.
- Delete a profile mid-sync.
- Overlapping/very short Data Interval causing back-to-back syncs.
