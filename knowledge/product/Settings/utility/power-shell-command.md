---
screen: Power Shell Command · power-shell-command
module: Settings
category: utility
route: "/settings/utility/power-shell-command"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_power_shell_command.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — Power Shell Command

## 1. Purpose
An **ad-hoc PowerShell runner** for Windows targets: execute a PowerShell command against a Windows
host over **WinRM** using a **Credential Profile**, **from the collector**, and inspect the output.

- **Business objective:** reproduce and debug Windows monitoring — WinRM configuration, AD username
  format, and non-admin permission issues are a recurring "one Windows device won't discover / partial
  data" cause (customer-issue-kb §1).
- **Screen description:** a form with **IP Address/Host Name**, **Credential Profile** (dropdown with
  inline **Create Credential Profile**) and a **PowerShell Command** field, plus **Reset** and **Test**;
  output renders below.
- **Primary use cases:** confirm a WinRM credential authenticates; run the exact PowerShell a plugin
  uses and inspect output; validate WinRM HTTP (5985) vs HTTPS (5986) reachability.
- **Who uses it:** administrators / Windows & support engineers.
- **Dependencies:** authenticated Settings session · a collector able to reach the target's WinRM port ·
  WinRM enabled/configured on the target · a valid **Windows Credential Profile** (with correct AD
  username format).

## 2. Navigation
```
Settings → Utility → Power Shell Command
```
- **Breadcrumb:** Settings › Utility › Power Shell Command
- **URL:** `/settings/utility/power-shell-command`

## 3. Actions
- Enter **IP Address/Host Name**.
- Choose a **Credential Profile** (or **Create Credential Profile** inline — `#create-credential-btn-id`).
- Enter the **PowerShell Command**.
- **Test** — run it (`#utility-power-shell-command-test-btn`).
- **Reset** — clear the form (`#utility-power-shell-command-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address/Host Name * | text input · placeholder `172.31.11.52` |
| Credential Profile * | searchable dropdown · `[data-cy='dropdown-trigger-input']` (placeholder `Select`) |
| **Create Credential Profile** | `#create-credential-btn-id` |
| PowerShell Command * | command input (id not captured in sweep) |
| **Reset** | `#utility-power-shell-command-reset-btn` |
| **Test** | `#utility-power-shell-command-test-btn` |

> Three labels but two text inputs captured — the **PowerShell Command** field's id wasn't captured.
> TODO(source: KG/docs) — capture it and the output block structure.

_Locators: `knowledge/locators/catalog/settings_utility_power_shell_command.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented, and **runs arbitrary commands on Windows hosts** — expect
  Admin-only. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller reachable and able to reach the target's WinRM port (5985/5986).
- WinRM enabled/configured on the target; a valid **Windows Credential Profile** exists (or created inline).

## 7. Exit Conditions
- **On Test (success):** the command's output renders.
- **On Test (failure):** WinRM connect/auth error (unconfigured WinRM, wrong AD username format,
  non-admin rights, HTTPS/5986 unsupported by the engine) or a command error.
- **On Reset:** form clears; no server call. Stateless — nothing persisted.

## 8. Validations
- **IP Address/Host Name** — required before Test.
- **Credential Profile** — required (Windows/WinRM-type credential).
- **PowerShell Command** — required. TODO(source: docs) — any allow/deny-listing or length limit.

## 9. Business Rules
- **Runs from the collector over WinRM**; result reflects reachability **and** WinRM auth **and** the
  command's own success — the exact chain that breaks Windows discovery.
- **Stateless & ad-hoc** — nothing is saved.
- HTTPS WinRM (5986) historically needed `"plugin.engine": "python"` (productized 8.1.3,
  customer-issue-kb §1, PQD-36217) — a wrong engine can fail secure WinRM. TODO(source: KG) confirm the
  engine used by this utility.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): WinRM-unconfigured / wrong AD username format (§1, PQD-32697), Windows
> secure-HTTPS discovery via WinRM (§1, PQD-36217), and PowerShell-dependency/security-team concerns on
> agents (§6, PQD-36066) are what this tool helps reproduce. Do not invent bugs.

## 11. Edge Cases
- WinRM disabled on target; HTTP (5985) works but HTTPS (5986) fails, or vice-versa.
- AD username format wrong (`user` vs `DOMAIN\user` vs `user@domain`); non-admin credential.
- Command with large/multiline output; long-running or interactive command; a command that errors.
- Unreachable host / firewalled WinRM port; IPv6 target.
- Empty required field / no credential; rapid re-run.
