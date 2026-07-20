---
screen: NCCM Settings · device-template-create
module: Settings
category: nccm-settings
route: "/settings/nccm-settings/device-template/create"
build: 8.2.6
status: draft                        # authored from catalog + customer-issue-kb §13; several rules TODO
sources: [catalog, kb]               # locators/catalog/settings_nccm_settings_device_template_create.json · known_issues/customer-issue-kb.md §13
verified: 2026-07-09
---

# NCCM Settings · Create Device Template

## 1. Purpose
The form that defines **how NCCM communicates with a class of device** — its identity (name, vendor,
OS type) and the ordered list of CLI **operations** (command, expected prompt, timing) plus the file
**transfer protocol** used to move configuration off the device. This is where the per-vendor CLI
dialect that the customer KB repeatedly cites as the NCM failure surface is actually encoded.

- **Business objective:** let an admin support a new/edge device by scripting its exact login →
  paging → config-fetch command sequence and transfer method, without a product release.
- **Screen description:** a template form (Name, Description, Vendor, OS Type) plus a repeatable
  **Operation** block (Command, Timeout, Prompt, Prompt Command, Delay Time) and a transfer-protocol
  choice (**SCP/SFTP · TFTP · No protocol**), with **Select From Catalog**, **Reset**, and **Save**.
- **Primary use cases:** create a custom template; seed one from the catalog then adjust commands.
- **Who uses it:** network/config administrators.
- **Dependencies:** the SNMP/CLI device catalog (Select From Catalog) · device credentials (used at
  run time, not entered here).

## 2. Navigation
```
Settings → NCCM Settings → Device Template → Create Template
```
- **Breadcrumb:** Settings › NCCM Settings › Device Template › Create
- **URL:** `/settings/nccm-settings/device-template/create`
- **Back:** returns to the Device Template grid.

## 3. Actions
- Fill **Device Template Name**, **Description**
- Choose **Vendor** (`input[placeholder="Vendor"]`, `[data-cy='dropdown-trigger-input']`)
- Choose **OS Type** (`placeholder="Select"` dropdown)
- **Select From Catalog** — pre-populate operations from a known device catalog entry
- **Add Operation** — append a CLI operation row (Command / Timeout / Prompt / Prompt Command / Delay)
- Set **Delay Time (ms)** and **Timeout (ms)** per operation
- Choose transfer protocol — **SCP/SFTP**, **TFTP**, or **No protocol**
- Toggle the single **switch** (`OFF` observed — purpose TODO(source: KG))
- **Remove** an operation — `#remove-metric-group`
- **Reset** — clear the form · **Save** — persist the template

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Device Template Name | text input (label "Device Template Name") |
| Description | text input `placeholder="Write text here"` |
| Vendor | dropdown `placeholder="Vendor"` · `[data-cy='dropdown-trigger-input']` |
| OS Type | dropdown `placeholder="Select"` |
| Delay Time (ms) | numeric input |
| Command | text input (per operation) |
| Timeout (ms) | numeric input (per operation) |
| Prompt | text input (per operation) |
| Prompt Command | text input (per operation) |
| Add Operation | button **Add Operation** |
| Remove operation | `#remove-metric-group` |
| Transfer protocol | buttons **SCP/SFTP** · **TFTP** · **No protocol** (mutually exclusive) |
| Toggle | 1 ant-switch (**OFF** observed) — purpose TODO(source: KG) |
| Select From Catalog | button **Select From Catalog** |
| Reset / Save | buttons **Reset** · **Save** |

> The operation fields **Command / Prompt / Prompt Command / Timeout / Delay Time** are exactly the
> knobs the customer KB fixes are made of (FortiGate `a` after enable, ISE paging, TP-Link `\r\n`).
> The `#remove-metric-group` id is reused from the metric-group UI — on this screen it removes an
> **operation** row; scope by row so automation doesn't hit the wrong one.

_Locators: see `knowledge/locators/catalog/settings_nccm_settings_device_template_create.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Config-admin scoped** (create/edit templates). TODO(source: KG/docs) — exact role.
- **License/module gated** — NCM module required.

## 6. Entry Conditions
- Logged in; NCCM module enabled; reached via Device Template → Create Template.

## 7. Exit Conditions
- **Save (success):** template persists and appears in the Device Template grid, selectable for
  device assignment. TODO(source: KG) confirm success toast + redirect.
- **Reset:** form clears to empty/defaults; no server call.
- **Save (failure):** validation errors on required fields (see §8).

## 8. Validations
- **Device Template Name** — required; likely unique. TODO(source: docs) confirm uniqueness + max length.
- **Vendor**, **OS Type** — required selections. TODO(source: docs).
- **Delay Time (ms)**, **Timeout (ms)** — numeric, non-negative; TODO(source: docs) min/max and defaults.
- **Command** — required per operation (an empty operation is meaningless). TODO(source: KG) confirm.
- **Prompt / Prompt Command** — expected-prompt matching; format rules TODO(source: docs).
- Transfer protocol — exactly one of SCP/SFTP · TFTP · No protocol. TODO(source: KG) confirm default.

## 9. Business Rules
- Operations run **in the order listed**; Prompt/Prompt Command handle interactive CLI paging and
  confirmations (the vendor-quirk handling from the KB).
- **Transfer protocol** determines how the fetched config leaves the device — TFTP vs SCP/SFTP matters
  operationally (KB §13: TFTP unreachable while FTP/SCP worked). "No protocol" implies inline capture.
- **Select From Catalog** seeds operations from a known device profile — a starting point, not a lock.
- TODO(source: Motadata KG) — whether Vendor+OS Type must be unique across templates; default Timeout/
  Delay values; meaning of the single toggle.

## 10. Known Bugs
From `customer-issue-kb.md` §13 (NCM / Configuration Management):
- **Wrong command/prompt/transport in the template → backup or firmware fails.**
  `issue:` FortiGate NCM dead; Cisco ISE config fetch shows `More`; TP-Link backup fails; Cisco firmware
  upgrade fails. `diagnosis:` FortiGate needs `a` confirmation after `enable`; ISE ignores
  `terminal length 0` (paging breaks capture); TP-Link needs `\r\n` and a changed prompt after `enable`;
  **TFTP unreachable while FTP/SCP worked**. `workaround:` correct the operation Command/Prompt sequence,
  choose a reachable transfer protocol (TFTP→SCP/SFTP), vendor-specific handling shipped **8.0.25**
  (TP-Link). Refs: PQD-31539, PQD-33382 [MOTADATA-6866], PQD-33405, PQD-38572, PQD-39653.

## 11. Edge Cases
- Save with an empty operation list, or an operation with a blank Command.
- Prompt string that never matches the device → Timeout expiry (test small vs large Timeout).
- Zero/negative Delay or Timeout; extreme Timeout values.
- Duplicate template (same Vendor + OS Type as an existing one).
- Select From Catalog then heavily edit — ensure edits persist over the seeded values.
- Choose TFTP where the collector cannot reach the device over TFTP (KB §13).
- Very long name/description; Unicode; special chars in Command (`\r\n`, `|`, `?`).
