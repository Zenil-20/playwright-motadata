---
screen: Plugin Library · Create Runbook Plugin
module: Settings
category: plugin-library
route: "/settings/plugin-library/runbooks/create"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library_runbooks_create.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library · Create Runbook Plugin

## 1. Purpose
The authoring form for a **runbook plugin** — a script (diagnostic or remediation) that runs against a
monitor, either on demand or scheduled. Structurally it mirrors the metric-plugin form (script + parsing
script + credential/port/timeout) but produces a runnable/schedulable runbook rather than a KPI collector.

- **Business objective:** turn a repeatable operational procedure into a reusable, testable script bound
  to monitors and organized by category.
- **Screen description:** a single form — identity (name/description/category), execution target
  (monitors, credential profile, port, timeout), the **SSH Script**, **Script Language**, and a **Parsing
  Script**, plus **Add Variable**, **Test**, and **Reset**.
- **Primary use cases:** create a runbook and **Test** it against a live monitor before saving.
- **Who uses it:** operations engineers / admins. TODO(source: KG/docs) — exact RBAC gate.
- **Dependencies:** a target monitor, a credential profile (or create one inline), and the plugin
  execution engine (Go/Python).

## 2. Navigation
```
Settings → Plugin Library → Runbooks → Create Runbook Plugin
```
- **Breadcrumb:** Settings › Plugin Library › Runbooks › Create
- **URL:** `/settings/plugin-library/runbooks/create`
- **Back:** the Runbooks list.

## 3. Actions
- Enter **Runbook Name** (`input[name="runbook-name"]`), **Description**
  (`input[name="runbook-description"]`).
- Choose **Runbook Category** (Select), **Monitors** (Select), **Credential Profile** (Select) — dropdowns
  use `[data-cy='dropdown-trigger-input']`.
- **Create Credential Profile** inline — `#create-credential-btn-id`.
- Set **Port** (`input[name="port"]`) and **Timeout** (`input[name="timeout"]`).
- Pick **Script Language** (radio group, 6 options).
- Author the **SSH Script** and **Parsing Script** in the two CodeMirror editors.
- **Add Variable**, **Test**, **Reset**.
- **Save** (Create Runbook Plugin) — submit control **not captured** in the sweep; TODO(source: KG) — confirm id.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Runbook Name * | `input[name="runbook-name"]` |
| Description | `input[name="runbook-description"]` |
| Runbook Category | Select (`[data-cy='dropdown-trigger-input']`) |
| Monitors | Select (`[data-cy='dropdown-trigger-input']`) |
| Credential Profile | Select + **Create Credential Profile** `#create-credential-btn-id` |
| Port | `input[name="port"]` |
| Timeout | `input[name="timeout"]` |
| Script Language | radio group (6 options) |
| SSH Script | CodeMirror editor |
| Parsing Script | CodeMirror editor |
| Add Variable | button |
| Test | button (no id captured — peers use `#test-btn-id`; TODO confirm) |
| Reset | button (no id captured — peers use `#reset-btn-id`; TODO confirm) |
| Save / Create | **not captured** — TODO(source: KG) confirm id |

> **Automation caveat:** both script bodies are **CodeMirror** editors (use the CodeMirror API, not
> `fill()`). The three Selects share `[data-cy='dropdown-trigger-input']`; scope by label/order. Note the
> runbook create form captured **6** Script-Language radios vs the metric form's 5 — TODO(source: KG)
> confirm the extra language option.

_Locators: see `knowledge/locators/catalog/settings_plugin_library_runbooks_create.json`; promote verified
ones into the selector-cookbook._

## 5. Permissions
- Authoring a script that executes on devices is privileged — expected **admin/operator**.
  TODO(source: KG/docs) — confirm role and inline credential-creation permission.

## 6. Entry Conditions
- Logged in; reached from the Runbooks list **Create**.
- A target monitor and usable credential profile exist (or created inline) for **Test**.
- TODO(source: docs) — whether Test requires the target collector up.

## 7. Exit Conditions
- **On Save (success):** runbook appears in the Runbooks list; success toast; TODO(source: docs) — audit entry.
- **On Test:** returns execution/parsed output (success) or an error (auth/timeout/script failure).
- **On Reset:** form clears; no server write.

## 8. Validations
- **Runbook Name** — required (likely unique). TODO(source: docs) — uniqueness/format.
- **Port / Timeout** — numeric; TODO(source: docs) — ranges/defaults.
- **Credential Profile** — required for script auth (unless category is credential-less). TODO(source: KG).
- **SSH Script / Parsing Script** — required for a script runbook. TODO(source: docs).
- **Script Language** — one radio required (6 options). TODO(source: docs) — full option set.

## 9. Business Rules
- The runbook binds to **Monitors** and is organized by **Runbook Category** (shown on the list).
- **Add Variable** injects reusable variables/macros into the script. TODO(source: KG) — syntax.
- Once saved, the runbook can be **run on demand** (`[data-cy='run']`) or **scheduled** (Scheduler column).
  TODO(source: KG) — where the schedule is configured.
- TODO(source: KG/docs): name uniqueness scope; whether Test must pass before Save.

## 10. Known Bugs
- **Custom Go runbook scripts spawning processes/cron → OOM** (Section 3, PQD-38278 / MOTADATA-8024).
  Fix/workaround: **author the runbook in Python, not Go**; hotfixes 8.1.3–8.2.0. Directly relevant to the
  **Script Language** choice here.
- **Slow targets vs internal timeout** (Section 1, PQD-29383/PQD-37125): a device answering in 30–40 min
  was force-terminated at ~7 min — set **Timeout** deliberately for slow targets.

Do not invent bugs beyond the above cited patterns.

## 11. Edge Cases
- Empty required script; script that errors or times out on **Test**.
- Wrong/expired **Credential Profile** → auth failure.
- Go vs Python script (process-spawning → OOM risk; prefer Python).
- **Port / Timeout** non-numeric, zero, or extreme.
- Duplicate **Runbook Name**.
- Very large CodeMirror script; unicode/control chars in output.
- Save without Test; Reset after a long edit; inline Create Credential Profile cancelled.
