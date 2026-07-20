---
screen: Plugin Library · Create Metric Plugin
module: Settings
category: plugin-library
route: "/settings/plugin-library/metrics/create"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library_metrics_create.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library · Create Metric Plugin

## 1. Purpose
The authoring form for a **custom metric (KPI) plugin** — a script that collects one or more metrics
from a target monitor and parses the output into KPI values. This is the concrete tool the KB repeatedly
points to for "default OIDs not implemented → ship a custom plugin" (Section 1).

- **Business objective:** collect metrics the stock templates miss (vendor-specific OIDs, per-OS command
  output) and normalize them (e.g. computed memory %, uptime/100 conversions as in the D-Link fix).
- **Screen description:** a single form — plugin identity (name/description/type), execution target
  (monitors, port, timeout, credential profile), the **SSH/collection Script**, the **Script Language**,
  and a **Parsing Script**, plus **Add Variable**, **Test**, and **Reset**.
- **Primary use cases:** create a new metric plugin, test it against a live monitor before saving.
- **Who uses it:** monitoring engineers / admins. TODO(source: KG/docs) — exact RBAC gate.
- **Dependencies:** a target monitor, a credential profile (or create one inline), and the plugin
  execution engine (Go/Python) for Test and runtime.

## 2. Navigation
```
Settings → Plugin Library → Metrics → Create Metric Plugin
```
- **Breadcrumb:** Settings › Plugin Library › Metrics › Create
- **URL:** `/settings/plugin-library/metrics/create`
- **Back:** the Metrics list (`/settings/plugin-library/metrics`).

## 3. Actions
- Enter **Metric Plugin Name** (`input[name="metric-name"]`, "Must be unique"), **Description**.
- Choose **Type** (Select), **Monitors** (Select), **Credential Profile** (Select) — dropdowns use
  `[data-cy='dropdown-trigger-input']`.
- **Create Credential Profile** inline — `#create-credential-btn-id`.
- Set **Port** (`input[name="port"]`) and **Timeout** (`input[name="timeout"]`).
- Pick **Script Language** (radio group, 5 options).
- Author the **SSH Script** and **Parsing Script** in the two CodeMirror editors.
- **Add Variable** — insert a variable/macro into the script.
- **Test** the plugin — `#test-btn-id`.
- **Reset** the form — `#reset-btn-id`.
- **Save** (Create Metric Plugin) — the submit control was **not captured** in the sweep;
  TODO(source: KG) — confirm its id (peers use `#submit-btn-id`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Metric Plugin Name * | `input[name="metric-name"]` — hint _"Must be unique"_ |
| Description | text input |
| Type | Select (`[data-cy='dropdown-trigger-input']`) |
| Monitors | Select (`[data-cy='dropdown-trigger-input']`) |
| Port | `input[name="port"]` |
| Timeout | `input[name="timeout"]` |
| Credential Profile | Select + **Create Credential Profile** `#create-credential-btn-id` |
| Script Language | radio group (5 options) |
| SSH Script | CodeMirror editor |
| Parsing Script | CodeMirror editor |
| Add Variable | button (inserts variable/macro) |
| Test | `#test-btn-id` |
| Reset | `#reset-btn-id` |
| Save / Create | **not captured** — TODO(source: KG) confirm id |

> **Automation caveat:** the two script bodies are **CodeMirror** editors, not plain `<textarea>` — set
> their content via the CodeMirror API/`.cm-content`, not `fill()` on a hidden input. The three Selects
> share `[data-cy='dropdown-trigger-input']`; scope by field order/label to disambiguate.

_Locators: see `knowledge/locators/catalog/settings_plugin_library_metrics_create.json`; promote verified
ones into the selector-cookbook._

## 5. Permissions
- Authoring a script that runs on monitored devices is a privileged operation — expected **admin/operator**.
  TODO(source: KG/docs) — confirm role and whether inline **Create Credential Profile** needs a separate
  credential-management permission.

## 6. Entry Conditions
- Logged in; reached from the Metrics list **Create Metric Plugin**.
- At least one monitor and a usable credential profile exist (or one is created inline) for **Test** to run.
- TODO(source: docs) — whether Test requires the target monitor's collector to be up.

## 7. Exit Conditions
- **On Save (success):** plugin appears in the Metrics list; a success toast; TODO(source: docs) — audit entry.
- **On Test:** returns collected/parsed sample output (success) or an error (auth/timeout/parse failure).
- **On Reset:** form clears to defaults; no server write.

## 8. Validations
- **Metric Plugin Name** — required and **unique** ("Must be unique"); duplicate → inline error.
- **Port / Timeout** — numeric. TODO(source: docs) — allowed ranges/defaults.
- **Credential Profile** — required for script auth (unless the Type is credential-less). TODO(source: KG).
- **SSH Script / Parsing Script** — required for a script-type plugin. TODO(source: docs) — non-empty rule.
- **Script Language** — one radio must be selected. TODO(source: docs) — full option set (e.g. Shell /
  Python / PowerShell / Perl).

## 9. Business Rules
- **Name is unique** across metric plugins.
- The **Type** governs which fields apply (e.g. SSH/script vs SNMP) — port/credential/script fields are
  relevant to script types. TODO(source: KG) — exact Type enumeration and conditional fields.
- **Add Variable** injects reusable variables/macros consumed by the script. TODO(source: KG) — variable syntax.
- A metric plugin binds to **Monitors**; its Used Count on the list reflects those bindings.
- TODO(source: KG/docs): whether **Test** must pass before Save is allowed.

## 10. Known Bugs
- **Custom Go plugin scripts spawning processes/cron → OOM** (Section 3, PQD-38278 / MOTADATA-8024).
  Fix/workaround: **write the plugin in Python, not Go** (hotfixes 8.1.3–8.2.0). Directly relevant to the
  **Script Language** choice on this form.
- **Secure WinRM (HTTPS/5986) collection** needed `"plugin.engine": "python"` because the Go PluginEngine
  lacked WinRM-HTTPS — productized 8.1.3 (Section 1, PQD-36217 / MOTADATA-7707).
- **Slow targets vs internal timeout:** devices answering in 30–40 min were force-terminated at ~7 min
  (Section 1, PQD-29383/PQD-37125). Set **Timeout** deliberately for slow devices.

Do not invent bugs beyond the above cited patterns.

## 11. Edge Cases
- Duplicate **Metric Plugin Name**.
- Empty required script; script that errors or returns no output on **Test**.
- Wrong/expired **Credential Profile** → Test auth failure (KB Section 1 credential class).
- **Port** or **Timeout** non-numeric, zero, or extreme; very short timeout on a slow device.
- Go vs Python script language — process-spawning script (OOM risk, prefer Python).
- Parsing script that produces negative/NaN metric values (KB: negative disk/memory class, re-poll).
- Very large CodeMirror script body; unicode/control chars in output.
- Save without running Test; Reset after typing a long script.
- Inline **Create Credential Profile** cancelled mid-flow.
