---
screen: NCCM Settings · device-inventory
module: Settings
category: nccm-settings
route: "/settings/nccm-settings/device-inventory"
build: 8.2.6
status: draft                        # authored from catalog + NCCM.png + customer-issue-kb; some rules TODO
sources: [catalog, screenshot, kb]   # locators/catalog/settings_nccm_settings_device_inventory.json · screenshots/NCCM.png · known_issues/customer-issue-kb.md §13
verified: 2026-07-09
---

# NCCM Settings · Device Inventory

## 1. Purpose
The per-device control grid for NCCM. Every discovered network device appears here with its
configuration-management state, and this is where an admin **enables or disables NCCM management**,
sees which **Template** and **credentials** a device is using, and spots devices whose config backup
is **Failed**. This is the same grid the NCCM Settings root (`/settings/nccm-settings/`) resolves to.

- **Business objective:** turn a raw monitored inventory into a managed config-backup fleet — decide
  which devices are under NCCM, confirm they can authenticate, and triage the ones that fail. The NCCM
  module dashboard's **Backup Summary** (Failed 4 / Successful 4 in NCCM.png) and **Baseline-Running
  Conflict** widgets are downstream of the state set here.
- **Screen description:** searchable/filterable device table with a per-row **Manage NCCM Status**
  ON/OFF switch and a per-row action menu.
- **Primary use cases:** enable NCCM on a device, assign/verify Template, check Credential Status,
  filter to Failed devices, bulk-tag the inventory, review Scheduler and device Type.
- **Who uses it:** network/config administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** discovered devices · a compatible Device Template · valid credentials · NCCM
  license/module enabled.

## 2. Navigation
```
Settings → NCCM Settings → Device Inventory
```
- **Breadcrumb:** Settings › NCCM Settings › Device Inventory
- **Sibling screens:** Device Template · Firmware Update Profile
- **URL:** `/settings/nccm-settings/device-inventory` (also the target of `/settings/nccm-settings/`)

## 3. Actions
- **Search** devices — `input[placeholder="Search"]` / `input[name="search"]`
- **Filter** — `#filter-btn` (button "Filter")
- **Show / Hide Columns** — `#btn-show-hide-columns`
- **Tag Inventory** (bulk tag over selected rows) — `#btn-tag-inventory`
- **Toggle Manage NCCM Status** per device — row **ON/OFF** switch (`#true` observed on the toggle);
  ~50 switches = one per device row
- **Filter/mark Failed** — the **Failed** control (credential/backup failure)
- **Row action menu** — `[data-cy='grid-action']` (exact items TODO(source: KG))
- **Row selection** — checkboxes (~102 = select-all + rows) feed the bulk Tag Inventory action

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` · `input[name="search"]` |
| Filter | **Filter** / `#filter-btn` |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Tag Inventory (bulk) | `#btn-tag-inventory` |
| Manage NCCM Status toggle | ant-switch per row **ON/OFF** (`#true` observed) — 50 switches |
| Failed filter | button **Failed** |
| Row action menu | `[data-cy='grid-action']` |
| Row select | ~102 checkboxes |
| Grid columns | Device · IP/Host · System OID · Vendor · Template · Manage NCCM Status · Credential Status · Scheduler · Type · Actions |

> **Column meaning (grounded in the header set):** *System OID* identifies the device model (used to
> auto-match a template); *Template* is the assigned Device Template; *Manage NCCM Status* is the
> ON/OFF toggle; *Credential Status* shows whether stored credentials authenticate; *Scheduler* shows
> the backup schedule; *Type* is Switch/Router/etc. *Actions* is the per-row menu.

_Locators: see `knowledge/locators/catalog/settings_nccm_settings_device_inventory.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Config-admin scoped** for enabling NCCM / running config actions. TODO(source: KG/docs) — whether
  non-admins get a read-only grid.
- **License/module gated** — NCM/config-management entitlement required.

## 6. Entry Conditions
- Logged in; Settings reachable; NCCM module licensed/enabled.
- Inventory has at least one discovered device.

## 7. Exit Conditions
- **Enable NCCM (toggle ON):** Manage NCCM Status shows ON, a Scheduler binds, backups begin;
  Credential Status resolves if credentials are valid. TODO(source: KG) confirm toast.
- **Disable (toggle OFF):** device drops out of backup scheduling.
- **Search/Filter:** grid narrows; no persistence.

## 8. Validations
- TODO(source: docs) — grid is search/filter only; the meaningful "validation" is runtime: enabling
  NCCM without a matching template or with bad credentials surfaces a **Failed** / Credential Status
  error rather than an inline form error.

## 9. Business Rules
- A device needs a **template matched by Vendor / OS Type (via System OID)** for backup to succeed.
- **Credential Status = failed** blocks config backup regardless of the toggle.
- TODO(source: Motadata KG) — whether toggling ON auto-provisions a default scheduler and its cadence;
  whether disabling NCCM deletes stored config history.

## 10. Known Bugs
From `customer-issue-kb.md` §13 (NCM / Configuration Management):
- **Vendor CLI-dialect backup/firmware failures** — Cisco/FortiGate/Cisco-ISE/TP-Link config fetch or
  firmware upgrade fails; `diagnosis:` wrong template command sequence, **TFTP unreachable (FTP/SCP
  works)**, FortiGate `a` confirmation after enable, ISE ignores `terminal length 0`, TP-Link needs
  `\r\n`; `workaround:` fix template commands / switch transport TFTP→FTP-SCP / vendor-specific
  handling (TP-Link **8.0.25**). Refs: PQD-31539, PQD-33382 [MOTADATA-6866], PQD-38572, PQD-39653,
  PQD-33405. → This is what a **Failed** row here most often means.
- Also relevant (KB §1): **stale/duplicate monitor records** after re-provisioning can leave a device
  with wrong NCCM state (PQD-40358 class) — fix by delete + re-provision.

## 11. Edge Cases
- Device with no matching template → Failed on enable.
- Read-only / wrong-privilege credentials → Credential Status failure (KB §1 credential class).
- TFTP-only transport where TFTP is blocked → backup fails though the device is reachable (KB §13).
- Bulk Tag Inventory across a huge selection; select-all then filter interaction.
- Filter to **Failed** with none failed → empty state.
- Re-provisioned duplicate device showing stale toggle/scheduler.
- Toggle ON→OFF before first scheduled backup; concurrent edits from two admin sessions.
