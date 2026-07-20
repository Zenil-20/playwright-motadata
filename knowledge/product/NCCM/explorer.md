---
screen: NCCM · Explorer
module: NCCM
route: "/nccm/explorer"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/nccm_explorer.json · screenshots/NCCM.png (tab strip) · known_issues §13
verified: 2026-07-09
---

# NCCM · Explorer

## 1. Purpose
The **per-device configuration workbench** of NCCM — a device-level grid where admins inspect each
managed device's current config version, backup status, baseline conflict, and firmware, and run
config operations (compare versions, backup, tag) across selected devices.

- **Business objective:** operate on individual network-device configurations at scale — verify
  backups succeeded, detect **config conflicts** (running ≠ baseline), track **current vs latest
  firmware**, compare config **versions**, and act via the row **Actions** menu — the hands-on half
  of NCCM.
- **Screen description:** a wide device grid with per-device config/backup/firmware columns, a row
  **checkbox** per device (40 captured → multi-select for bulk actions), status **filter chips**
  (Backup Successful · Conflict Detected · Backup Failed), a **Compare** action for config-version
  diff, a **tag inventory** action, a show/hide-columns control, a **Search** box, and a row-level
  **grid-action** menu (`[data-cy='grid-action']`).
- **Primary use cases:** filter devices by backup/conflict status; select devices and **Compare**
  config versions; run/trigger a backup or firmware action per row; tag devices; check firmware
  currency (Current vs Latest).
- **Who uses it:** network/config-management admins performing config operations. TODO(source:
  KG/docs) — role gating.
- **Dependencies:** NCM-managed devices with fetched configs; config-fetch/upgrade credentials;
  a defined baseline for conflict detection; a firmware catalog for Latest-firmware comparison.

## 2. Navigation
```
NCCM → Explorer tab   →  /nccm/explorer
```
- **Tabs:** Overview · Compliance · Explorer
- **URL:** `/nccm/explorer`

## 3. Actions
- **Search** devices (`input[placeholder="Search"]`).
- Filter by status chip: **Backup Successful** · **Conflict Detected** · **Backup Failed**.
- **Select** device rows (checkboxes) for bulk operations.
- **Compare** (`#compare-btn`) — diff two config versions / baseline vs running for selected device(s).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Tag inventory** (`#btn-tag-inventory`) — tag selected devices.
- **Row Actions** (`[data-cy='grid-action']`) — per-device menu (e.g. backup now, view config,
  firmware upgrade, set baseline). TODO(source: docs) — enumerate the exact row actions.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Tabs | Overview · Compliance · Explorer |
| Search | `input[placeholder="Search"]` (2 captured — grid + a scoped one) |
| Status filter chips | **Backup Successful** · **Conflict Detected** · **Backup Failed** |
| Compare | `#compare-btn` |
| Show/hide columns | `#btn-show-hide-columns` |
| Tag inventory | `#btn-tag-inventory` |
| Row selection | per-row checkbox (`checkboxes: 40`) |
| Row action menu | `[data-cy='grid-action']` |
| Device grid | Device · IP · Current Version · Config Conflict · Last Performed Action · Last Backup Status · Last Firmware Upgrade Stat · Last Backup Time · Last Action Time · Current Firmware · Latest Firmware · Baseline Version · Actions |

_`buttonIds: [btn-show-hide-columns, btn-tag-inventory, compare-btn]`. Buttons **Backup Successful /
Conflict Detected / Backup Failed** are status **filter chips**, not commands. `selects:0,
switches:0, radios:0, checkboxes:40`._

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (NCCM > Explorer)._

## 5. Permissions
- Requires NCM licensed and an elevated config-management role — Explorer performs **write** actions
  (backup, firmware upgrade, tag, baseline). Config changes are gated by the **Approval** workflow
  (`/ncm-approval`). TODO(source: KG/docs) — exact RBAC; which actions require approval vs. execute
  immediately.

## 6. Entry Conditions
- Logged in; NCM module enabled/licensed.
- NCM-managed devices exist with at least one fetched config (else empty grid / blank version cells).
- Credentials valid for config fetch/push; firmware catalog present for firmware columns.

## 7. Exit Conditions
- Grid renders devices with Current Version, Config Conflict, backup/firmware status, and timestamps.
- Status chip / Search filters the rows.
- **Compare** opens a config diff view for the selection. TODO(source: docs) — confirm diff UI.
- A row action (backup/firmware/tag) results in a success toast and, where applicable, an **Approval**
  request (see `ncm-approval.md`). TODO(source: docs).
- **Config Conflict** flips to in-sync after a successful baseline update. TODO(source: KG).

## 8. Validations
- **Search** — free text; substring filter. TODO(source: docs).
- **Compare** — requires a valid selection (≥1 device / 2 versions). TODO(source: docs) — exact
  min/max selection rule.
- **Tag inventory** — tag-format rules; note KB §1 tag defects (uppercase CSV tags, blank tags,
  auto-lowercasing). TODO(source: docs).
- Firmware upgrade / backup actions carry their own confirmations + credential checks. TODO(source: docs).

## 9. Business Rules
- **Config Conflict** = running config differs from the approved **baseline**; **Baseline Version**
  names the approved config the running is compared against.
- **Current Firmware vs Latest Firmware** flags upgrade availability; **Last Firmware Upgrade Stat**
  records the outcome of the last upgrade attempt.
- **Last Backup Status / Time** and **Last Performed Action / Time** track the most recent backup and
  operation per device.
- Config-change operations route through the **NCM Approval** queue before applying. TODO(source:
  KG/docs) — confirm which operations require approval.
- Backup/firmware success is vendor-CLI-dependent (see Known Bugs).

## 10. Known Bugs
From `customer-issue-kb.md` §13 (NCM / Configuration Management) — these directly drive the
**Last Backup Status**, **Config Conflict**, and firmware columns here:
- **Firmware upgrade / config backup fails on specific vendors** (PQD-31539, PQD-33382
  [MOTADATA-6866], PQD-38572, PQD-39653): Cisco firmware upgrade fails; FortiGate NCM dead; Cisco ISE
  config fetch shows **"More"** (ISE ignores `terminal length 0`); NTPC firmware fail. Causes:
  template commands not per user-guide; **TFTP unreachable while FTP works**; FortiGate needs an
  **"a"** confirmation after `enable`; TP-Link needs `\r\n` line endings + prompt changes after
  enable (PQD-33405). Fixes/workarounds: correct template command sequences; **switch TFTP → FTP**;
  vendor-specific command handling (TP-Link productized **8.0.25**); use published KB templates.

These are the concrete reasons a row shows **Backup Failed** or a stuck firmware upgrade despite the
device being reachable. No Explorer-grid UI-rendering bug otherwise recorded.

## 11. Edge Cases
- Device reachable but backup fails due to vendor CLI dialect (FortiGate "a", ISE "More", TP-Link
  `\r\n`) — KB §13.
- TFTP blocked but FTP open (backup should succeed via FTP fallback).
- Select-all across a huge fleet then **Compare** (selection/perf limits).
- Compare with 0 or 1 selected (must block or prompt).
- Conflict Detected on a device with **no baseline set** (Baseline Version blank).
- Firmware Current == Latest (no upgrade offered) vs. Latest older than Current.
- Tag inventory with uppercase / blank tags (KB §1 tag defects).
- Row action that requires approval — verify it creates an Approval request, not an immediate change.
- Device re-provisioned on same IP → stale version/backup rows (KB §1 stale-record class).
- Show/hide-column selection persistence across filters.
