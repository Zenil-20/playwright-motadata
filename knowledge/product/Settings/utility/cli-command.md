---
screen: CLI Command · cli-command
module: Settings
category: utility
route: "/settings/utility/cli-command"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_utility_cli_command.json (live Vue-router sweep 2026-07-02) · customer-issue-kb
verified: 2026-07-09
---

# Utility — CLI Command

## 1. Purpose
An **ad-hoc CLI runner**: execute an arbitrary command against a device over its CLI transport
(SSH/Telnet) using a **Credential Profile**, **from the collector**, and see the raw output.

- **Business objective:** reproduce and debug the exact command/parsing behaviour behind
  Linux/network-device monitoring — the KB's #1 hotspot is *per-OS command-output parsing quirks* and
  *credential/permission drift* (customer-issue-kb §1), both of which this tool exposes directly.
- **Screen description:** a form with **IP Address/Host Name**, **Credential Profile** (dropdown with
  inline **Create Credential Profile**) and a **CLI Command** field, plus **Reset** and **Test**;
  the command output renders below.
- **Primary use cases:** confirm an SSH credential works; run the exact command a plugin uses and
  inspect output (e.g. `top`, `entstat`, vendor CLI); validate command support on a specific
  OS/hardware revision before filing/fixing a plugin.
- **Who uses it:** administrators / support & plugin engineers.
- **Dependencies:** authenticated Settings session · a collector able to reach the target · a valid
  **SSH/Telnet Credential Profile** with rights to run the command.

## 2. Navigation
```
Settings → Utility → CLI Command
```
- **Breadcrumb:** Settings › Utility › CLI Command
- **URL:** `/settings/utility/cli-command`

## 3. Actions
- Enter **IP Address/Host Name**.
- Choose a **Credential Profile** (or **Create Credential Profile** inline — `#create-credential-btn-id`).
- Enter the **CLI Command**.
- **Test** — run it (`#utility-cli-command-test-btn`).
- **Reset** — clear the form (`#utility-cli-command-reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| IP Address/Host Name * | text input · placeholder `172.31.11.52` |
| Credential Profile * | searchable dropdown · `[data-cy='dropdown-trigger-input']` (placeholder `Select`) |
| **Create Credential Profile** | `#create-credential-btn-id` |
| CLI Command * | command input (id not captured in sweep) |
| **Reset** | `#utility-cli-command-reset-btn` |
| **Test** | `#utility-cli-command-test-btn` |

> The sweep captured two labelled text inputs (IP, Credential Profile trigger) but three labels — the
> **CLI Command** field's id wasn't captured. TODO(source: KG/docs) — capture it and the output block.

_Locators: `knowledge/locators/catalog/settings_utility_cli_command.json` — promote verified ones to the cookbook._

## 5. Permissions
- Settings-level, administrator-oriented, and **runs arbitrary commands on devices** — expect the most
  restrictive gating (Admin). TODO(source: KG/docs) — exact RBAC; whether output is redacted/limited.

## 6. Entry Conditions
- Logged in with access to Settings → Utility.
- A collector/poller reachable and able to reach the target device's CLI port (SSH 22 / Telnet 23).
- A valid **SSH/Telnet Credential Profile** exists (or is created inline).

## 7. Exit Conditions
- **On Test (success):** the device's command output renders.
- **On Test (failure):** connect/auth error (invalid credential, unreachable, KEX/cipher mismatch) or
  a command error from the device.
- **On Reset:** form clears; no server call. Stateless — nothing persisted.

## 8. Validations
- **IP Address/Host Name** — required before Test.
- **Credential Profile** — required (must be an SSH/Telnet-type credential).
- **CLI Command** — required. TODO(source: docs) — any command allow/deny-listing or length limit.

## 9. Business Rules
- **Runs from the collector** over the credential's CLI transport; result reflects reachability **and**
  authentication **and** the device's own command support — a wrong credential type/scope or an
  unsupported command fails distinctly.
- **Stateless & ad-hoc** — nothing is saved; this is a diagnostic, not a config-change (NCM) action.
- SSH negotiation depends on mutually-supported KEX/ciphers — a mismatch fails at connect
  (customer-issue-kb §1, PQD-29912). TODO(source: KG) confirm Telnet is also supported here.

## 10. Known Bugs
**None recorded for this screen** in `customer-issue-kb.md` for build 8.2.6.
> Context (not a defect here): this tool is the front line for the KB's biggest cluster —
> credential/permission drift (§1, PQD-30159, PQD-32697), SSH KEX/cipher mismatch (§1, PQD-29912),
> per-OS command-output parsing (§1, PQD-31143/PQD-33218), and vendor CLI dialects (§13, FortiGate "a",
> ISE "More"). Reproduce those here; they are not defects in this screen. Do not invent bugs.

## 11. Edge Cases
- Wrong-type credential (e.g. an SNMP profile) or read-only credential lacking the command's rights.
- SSH KEX/cipher/algorithm mismatch; device only offering legacy ciphers.
- Command that produces paged output (`--More--`) or a huge/long-running output.
- Command that errors on the device; interactive command needing input.
- Unreachable host / closed SSH port; IPv6 target.
- Empty required field / no credential; rapid re-run.
