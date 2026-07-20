---
screen: Plugin Library · Runbooks
module: Settings
category: plugin-library
route: "/settings/plugin-library/runbooks"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library_runbooks.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library · Runbooks

## 1. Purpose
The **Runbook Plugins** list — reusable automation scripts (diagnostic or remediation) that run against
monitors, on demand or on a schedule. This is also the **default landing** of the Plugin Library
(`/settings/plugin-library/` resolves here).

- **Business objective:** capture repeatable operational actions (collect diagnostics, remediate a
  condition) as scripts that can be run/scheduled against devices, and track their last result.
- **Screen description:** a searchable, filterable grid of runbooks, each showing type, category,
  schedule, and last-run result, with a **Run** action per row and **Create Runbook Plugin**.
- **Primary use cases:** browse runbooks, run one on demand, review Last Run Result, create/edit a runbook,
  see how many monitors use it (Used Count).
- **Who uses it:** operations engineers / admins. TODO(source: KG/docs) — exact RBAC gate (running scripts
  on devices is privileged).
- **Dependencies:** the monitor store, credential profiles (script auth), the scheduler, and the plugin
  execution engine (Go/Python).

## 2. Navigation
```
Settings → Plugin Library → Runbooks     (also the Plugin Library landing)
```
- **Breadcrumb:** Settings › Plugin Library › Runbooks
- **URL:** `/settings/plugin-library/runbooks` (and `/settings/plugin-library/`).
- **Create:** `/settings/plugin-library/runbooks/create` (see `runbooks-create.md`).

## 3. Actions
- **Search** runbooks — `input[placeholder="Search"]` / `input[name="search"]`.
- **Filter** — `#filter-btn`.
- **Create Runbook Plugin** — `#create-runbook-btn`.
- **Run** a runbook row — `[data-cy='run']` (updates Last Run Result).
- **Row actions** (edit / delete / clone / schedule) — `[data-cy='grid-action']`.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]`, `input[name="search"]` |
| Filter | `#filter-btn` |
| Create Runbook Plugin (primary) | `#create-runbook-btn` |
| Grid | columns: Runbook Name · Description · Used Count · Runbook Type · Runbook Category · Scheduler · Last Run Result · Actions |
| Run | `[data-cy='run']` |
| Per-row actions | `[data-cy='grid-action']` |

_Locators: see `knowledge/locators/catalog/settings_plugin_library_runbooks.json`; promote verified ones
into the selector-cookbook._

## 5. Permissions
- Running/authoring scripts on monitored devices is privileged — expected **admin/operator**.
  TODO(source: KG/docs) — confirm the role and whether **Run** vs edit are separately gated.

## 6. Entry Conditions
- Logged in; Settings reachable; Runbooks family (or the Plugin Library landing) loaded.
- The runbook store loads; **Used Count**, **Scheduler**, and **Last Run Result** populate.

## 7. Exit Conditions
- **Run** executes the runbook against its target(s); the row's **Last Run Result** updates
  (success/failure).
- **Create** navigates to the create form.
- Deleting a runbook removes it (subject to Used Count). TODO(source: docs) — audit entry.

## 8. Validations
- Search filters by name; Filter narrows by column facets. TODO(source: docs) — exact facets.
- Field validations live on the create screen.

## 9. Business Rules
- **Runbook Type** and **Runbook Category** classify each runbook. TODO(source: KG) — enumerations.
- **Scheduler** column indicates whether a runbook is scheduled; **Last Run Result** records the outcome of
  the most recent execution.
- **Used Count > 0** means monitors reference the runbook; deleting likely affects them. TODO(source: KG) —
  confirm delete guard.
- TODO(source: KG): runbook name uniqueness scope.

## 10. Known Bugs
- **Custom Go runbook/plugin scripts spawning processes / cron jobs → OOM kills** of app/datastore
  (Section 3, PQD-38278 / MOTADATA-8024). Fix/workaround: **write runbook scripts in Python, not Go**;
  hotfixes 8.1.3–8.2.0. Directly relevant because runbooks execute scripts on devices.

None recorded for the Runbooks list UI itself beyond the above plugin-execution issue. Do not invent bugs.

## 11. Edge Cases
- Empty list (no runbooks).
- **Run** a runbook whose target monitor/collector is down → Last Run Result = failure.
- Delete a scheduled runbook or one with Used Count > 0.
- Runbook that spawns processes (Go OOM class) — prefer Python.
- Search/filter with no matches; special characters.
- Concurrent Run of the same runbook from two sessions.
