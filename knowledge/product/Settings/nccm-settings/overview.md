---
screen: NCCM Settings
module: Settings
category: nccm-settings
route: "/settings/nccm-settings/"
build: 8.2.6
status: draft                        # authored from catalog + NCCM.png + customer-issue-kb; several rules TODO
sources: [catalog, screenshot, kb]   # locators/catalog/settings_nccm_settings.json · screenshots/NCCM.png · known_issues/customer-issue-kb.md §13
verified: 2026-07-09
---

# NCCM Settings

## 1. Purpose
The landing screen for **NCCM — Network Configuration and Compliance Management** under Settings. It
lists every network device that AIOps can back up / manage configuration for, and is the control panel
from which config-management is turned **on/off** per device, templates are assigned, and credential
readiness is checked. On this route the catalog is identical to the **device-inventory** grid — the
NCCM Settings root defaults to the device inventory.

- **Business objective:** give network teams one place to enable configuration backup, baseline/running
  conflict detection, and firmware management across their device fleet, so config drift and failed
  backups are caught centrally. The NCCM module dashboard (see screenshot) summarises **Device Overview**,
  **Backup Summary** (Failed / Successful), and **Baseline-Running Conflict** — this Settings inventory is
  where the underlying per-device management state is configured.
- **Screen description:** a searchable, filterable device grid with a per-row **Manage NCCM Status**
  toggle, plus toolbar actions for column visibility and tag-based bulk inventory operations.
- **Primary use cases:** enable/disable NCCM for a device, assign a device **Template**, verify
  **Credential Status**, filter to **Failed** devices, review scheduler state.
- **Who uses it:** network/config administrators. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** discovered devices in the inventory · a matching **Device Template**
  (`/settings/nccm-settings/device-template`) · valid device credentials · the NCCM/NCM license or
  module flag. TODO(source: docs) confirm license name.

## 2. Navigation
```
Settings → NCCM Settings
```
- **Breadcrumb:** Settings › NCCM Settings
- **Sibling screens:** Device Inventory · Device Template · Firmware Update Profile
- **URL:** `/settings/nccm-settings/` (SPA — open the full URL; it resolves to the device-inventory grid)
- **Related (not this screen):** the NCCM **module dashboard** — *Network Configuration and Compliance
  Management* with **Overview / Compliance / Explorer** tabs (NCCM.png) — is a separate analytics view,
  not part of Settings.

## 3. Actions
- **Search** devices — `input[placeholder="Search"]` (a second `input[name="search"]` also present)
- **Filter** — open the filter panel (`#filter-btn`, button "Filter")
- **Show / Hide Columns** — `#btn-show-hide-columns`
- **Tag Inventory** (bulk tag operation over selected rows) — `#btn-tag-inventory`
- **Toggle Manage NCCM Status** per row — the row **ON / OFF** switch (`#true` id observed on the
  toggle control; buttons "ON"/"OFF"); ~50 switches captured = one per listed device
- **Filter to Failed** — the **Failed** control (credential/backup failure filter or badge)
- **Row actions** — `[data-cy='grid-action']` (per-row action menu; exact items TODO(source: KG))
- **Bulk select** — row checkboxes (~102 captured = select-all + per-row)

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` and `input[name="search"]` |
| Filter | button **Filter** / `#filter-btn` |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Tag Inventory (bulk) | `#btn-tag-inventory` |
| Manage NCCM Status toggle | ant-switch per row, **ON/OFF** (`#true` observed) — 50 switches |
| Failed filter | button **Failed** |
| Row action menu | `[data-cy='grid-action']` |
| Row select checkboxes | ~102 checkboxes (select-all + rows) |
| Grid columns | Device · IP/Host · System OID · Vendor · Template · Manage NCCM Status · Credential Status · Scheduler · Type · Actions |

> This route's catalog is byte-for-byte the **device-inventory** catalog — treat the two docs as the
> same grid in two navigation entries. Keep the real ids (`#btn-tag-inventory`, `#filter-btn`,
> `#btn-show-hide-columns`) for automation.

_Locators: see `knowledge/locators/catalog/settings_nccm_settings.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Config-admin scoped:** enabling/disabling NCCM and running config operations is an administrative
  action. TODO(source: KG/docs) — whether Operator/Viewer see the grid read-only.
- **License/module gated:** the whole NCCM area requires the NCM/config-management module to be
  licensed/enabled. TODO(source: docs) — exact license entitlement name.

## 6. Entry Conditions
- User is logged in and Settings is reachable.
- NCCM module is licensed/enabled.
- At least one device has been discovered (grid populates from the monitored inventory).

## 7. Exit Conditions
- **Enable NCCM on a device:** the row **Manage NCCM Status** flips ON; a scheduler is associated;
  subsequent backups begin populating the module's Backup Summary. TODO(source: KG) confirm toast text.
- **Assign template / credentials resolve:** **Credential Status** column moves off the failed state.
- **Filter/Search:** grid narrows to matching rows; no server write.

## 8. Validations
- TODO(source: docs) — inline validations on this grid are minimal (search/filter only). Enabling NCCM
  on a device with no matching template or bad credentials is expected to surface a **Failed** /
  Credential Status error rather than a form validation.

## 9. Business Rules
- A device must have a compatible **Device Template** (matched by Vendor / OS Type) before config
  backup can succeed — see the KB firmware/backup failures below.
- **Credential Status** reflects whether the stored device credentials authenticate for config
  operations; a failed status blocks backup.
- TODO(source: Motadata KG) — whether toggling **Manage NCCM Status** ON auto-creates a default
  scheduler, and default backup cadence.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` §13 (NCM / Configuration Management — ~7 issues):
- **Config backup / firmware fails on specific vendors due to CLI-dialect quirks.**
  `issue:` Cisco firmware upgrade fails; FortiGate NCM "dead"; Cisco ISE config fetch shows `More`;
  TP-Link backup needs `\r\n` line endings + prompt change after `enable` (PQD-31539, PQD-33382
  [MOTADATA-6866], PQD-38572, PQD-39653, PQD-33405).
  `diagnosis:` template command sequences not per user-guide; **TFTP unreachable while FTP worked**;
  FortiGate needs an `a` confirmation after enable; ISE ignores `terminal length 0`.
  `workaround:` correct the template command sequence; switch **TFTP → FTP/SCP**; vendor-specific
  command handling (TP-Link fix in **8.0.25**). → Directly relevant when a device shows **Failed**
  backup / Credential Status here.

## 11. Edge Cases
- Enable NCCM on a device whose vendor has **no matching template** → expect Failed, not a silent no-op.
- Device reachable but credentials read-only / wrong privilege level → Credential Status failure.
- Bulk **Tag Inventory** over a mixed selection (some NCCM-on, some off).
- Filter to **Failed** with zero failed devices (empty grid state).
- Very large inventory (thousands of devices) — grid paging/search performance.
- Toggle a row ON then immediately OFF before the first scheduled backup runs.
- Duplicate device (same IP re-provisioned) showing stale NCCM state (KB §1 stale-record class).
