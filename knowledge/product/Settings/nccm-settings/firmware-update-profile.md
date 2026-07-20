---
screen: NCCM Settings · firmware-update-profile
module: Settings
category: nccm-settings
route: "/settings/nccm-settings/firmware-update-profile"
build: 8.2.6
status: draft                        # authored from catalog + customer-issue-kb §13; create-form fields TODO
sources: [catalog, kb]               # locators/catalog/settings_nccm_settings_firmware_update_profile.json · known_issues/customer-issue-kb.md §13
verified: 2026-07-09
---

# NCCM Settings · Firmware Update Profile

## 1. Purpose
The library of **firmware update profiles** — reusable definitions of how NCCM pushes a firmware image
to a class of devices (which vendor, which image/command sequence). It lets network teams standardise
and repeat firmware upgrades across the fleet rather than upgrading each device by hand.

- **Business objective:** make firmware upgrades a governed, repeatable NCCM operation. Firmware
  upgrade is one of the two config-management operations the customer KB flags as vendor-fragile
  (alongside config backup), so a profile captures the working recipe per vendor.
- **Screen description:** a grid of profiles with **Create Firmware Profile**, listing Profile Name,
  Vendor, Description, and per-row Actions.
- **Primary use cases:** browse existing firmware profiles, create a new one for a vendor, edit/delete.
- **Who uses it:** network/config administrators.
- **Dependencies:** device credentials (used at run time) · a transfer mechanism to stage the image ·
  the target devices in the NCCM inventory.

## 2. Navigation
```
Settings → NCCM Settings → Firmware Update Profile
```
- **Breadcrumb:** Settings › NCCM Settings › Firmware Update Profile
- **Sibling screens:** Device Inventory · Device Template
- **URL:** `/settings/nccm-settings/firmware-update-profile`

## 3. Actions
- **Create Firmware Profile** — opens the create form (button "Create Firmware Profile")
- **Search** — `input[placeholder="Search"]` / `input[name="search"]`
- **Row actions** — edit / delete (per-row **Actions** column; exact controls TODO(source: KG) — no
  `data-cy` grid-action hook was captured on this route)

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Create Firmware Profile | button **Create Firmware Profile** |
| Search | `input[placeholder="Search"]` · `input[name="search"]` |
| Grid columns | PROFILE NAME · VENDOR · DESCRIPTION · ACTIONS |

> This route's sweep captured **no** button ids and **no** `data-cy` hooks beyond the create button —
> the create form's fields are not in the OFF-state catalog. Harvest them live before writing tests
> against the create flow. TODO(source: KG) — firmware image source (upload vs path), command sequence,
> reboot/verify options.

_Locators: see `knowledge/locators/catalog/settings_nccm_settings_firmware_update_profile.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Config-admin scoped** — firmware upgrade is a high-impact operation; expected admin-only.
  TODO(source: KG/docs) — exact role, and whether a separate approval/permission gates *running* an
  upgrade vs. defining a profile.
- **License/module gated** — NCM module required.

## 6. Entry Conditions
- Logged in; NCCM module enabled.
- Devices under NCCM management exist for the profile to target.

## 7. Exit Conditions
- **Create/Edit:** profile appears in the grid, available to apply to devices. TODO(source: KG) confirm
  toast + where the upgrade is actually launched (inventory row action vs. profile).
- **Delete:** removed from grid; TODO(source: KG/docs) — blocked if referenced/in-flight.

## 8. Validations
- TODO(source: docs) — grid is search only; field validations live on the create form (not captured).
  Expected required fields: Profile Name, Vendor, firmware image/source.

## 9. Business Rules
- A firmware profile is scoped by **Vendor** (grid column) — it applies to matching devices.
- Firmware upgrade depends on the same device credentials/transport as config backup, so a device with
  a **Failed** Credential Status in the inventory will also fail firmware upgrade.
- TODO(source: Motadata KG) — image validation, pre/post-upgrade backup, reboot handling, rollback.

## 10. Known Bugs
From `customer-issue-kb.md` §13 (NCM / Configuration Management):
- **Firmware upgrade fails on specific vendors.** `issue:` Cisco firmware upgrade fails; NTPC firmware
  fail (PQD-31539, PQD-39653). `diagnosis:` template/command sequence not per user-guide; **TFTP
  unreachable while FTP worked** (transport reachability). `workaround:` fix the command sequence and
  use a reachable transfer protocol (TFTP→FTP/SCP). → When a firmware run fails, check transport
  reachability and the command recipe first, mirroring the Device Template backup fixes.

## 11. Edge Cases
- Create a profile for a vendor with no matching devices in inventory.
- Firmware image staged over an unreachable transport (TFTP blocked) — KB §13.
- Target device credentials read-only / wrong privilege → upgrade fails (KB §1 credential class).
- Interrupted upgrade (device reboots / connection drops mid-transfer) — rollback behavior.
- Duplicate profile name; very long name/description; Unicode.
- Applying a firmware profile to a device whose running config has an unsaved baseline conflict.
