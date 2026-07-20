---
screen: NCCM · Overview
module: NCCM
route: "/nccm/overview"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/nccm_overview.json · screenshots/NCCM.png · known_issues §13
verified: 2026-07-09
---

# NCCM · Overview

## 1. Purpose
The dashboard/landing tab of **Network Configuration and Compliance Management (NCCM/NCM)** — a
roll-up of the network devices under configuration management, their backup health, and their
baseline-vs-running config drift.

- **Business objective:** give network/config admins a single health read of managed devices — how
  many devices, of what type/vendor, whether their config backups are succeeding, and whether their
  running config has drifted from the approved **baseline** — so backup failures and config conflicts
  are caught proactively.
- **Screen description (from `NCCM.png`):** header "Network Configuration and Compliance Management"
  with tabs **Overview · Compliance · Explorer**. Overview shows three donut + table pairs:
  **Device Overview** (donut by device kind — Switch/Router — + **Device Summary** table by
  Type/Vendor/OS Type/Number of Devices), **Backup Summary** (donut Failed/Successful + **Failed
  Backup Summary** table Host Name/IP/Type/Vendor/Last Backup Time), and **Baseline-Running Conflict
  Overview** (donut In-sync/Not applicable + **Baseline-Running Conflict Summary** table
  Device/Type/Vendor/Last Backup At). A **filter by name…** input scopes the view.
- **Primary use cases:** see total managed devices and their mix; spot failed backups and drill in;
  see which devices have baseline/running config conflicts.
- **Who uses it:** network engineers / config-management admins. TODO(source: KG/docs) — role gating.
- **Dependencies:** devices discovered **with NCM enabled**; credentials that permit config fetch;
  at least one backup run; a defined baseline for conflict detection.

## 2. Navigation
```
Left icon rail → NCCM  →  Overview (default tab)
```
- **Tabs:** Overview · Compliance · Explorer
- **URL:** `/nccm/overview` (the module root `/nccm/` resolves here — see `nccm.md`).

## 3. Actions
- Switch tab **Overview ↔ Compliance ↔ Explorer**.
- **Filter by name** (`input[placeholder="filter by name…"]`) to scope the summaries.
- Drill from a **Failed Backup Summary** / **Baseline-Running Conflict Summary** row into the device
  (Explorer). TODO(source: docs) — confirm the drill-through target.
- Read the donut legends (Switch/Router counts; Failed/Successful; In-sync/Not applicable).

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Tabs | Overview · Compliance · Explorer |
| Name filter | `input[placeholder="filter by name…"]` |
| Device Overview | donut by device kind (Switch / Router) + counts |
| Device Summary table | Type · Vendor · Os Type · Number of Devices |
| Backup Summary | donut Failed / Successful |
| Failed Backup Summary table | Host Name · IP · Type · Vendor · Last Backup Time |
| Baseline-Running Conflict Overview | donut In-sync / Not applicable |
| Baseline-Running Conflict Summary table | Device · Type · Vendor · Last Backup Time (screenshot header "Last Backup At") |

_Catalog `gridHeaders` concatenate the three tables' columns (Type/Vendor/Os Type/Number of Devices ·
Host Name/IP/Type/Vendor/Last Backup Time · Device/Type/Vendor/Last Backup Time). `buttonIds:[]`,
`selects:0, switches:0, radios:0, checkboxes:0`._

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (NCCM > Overview)._

## 5. Permissions
- Requires the **NCM/NCCM module** licensed and a config-management role. Read of the Overview is a
  view action; the device-level operations (backup/upgrade/approve) live on Explorer / Approval and
  are more privileged. TODO(source: KG/docs) — exact RBAC (Admin/Operator/Viewer) and NCM licensing.

## 6. Entry Conditions
- Logged in; NCM module enabled/licensed.
- One or more devices are **NCM-managed** (discovered with NCM enabled). See the Network Discovery
  "with NCM" vs "without NCM" flows.
- At least one backup attempt exists for meaningful Backup/Conflict summaries (else empty donuts).

## 7. Exit Conditions
- Donuts + summary tables render with counts reflecting current device/backup/conflict state.
- **Filter by name** narrows the rows/summary to matching devices.
- Empty state (no NCM devices) → zero-count donuts / empty tables, not an error.

## 8. Validations
- **Filter by name** — free-text substring filter; no format rule. TODO(source: docs).
- No editable form here (dashboard). No input-format validations. TODO(source: docs).

## 9. Business Rules
- Only **NCM-enabled** devices appear — a discovered device without NCM is out of scope here.
- **Backup Summary** = success/failure of the most recent config backup per device; a device with no
  backup is not "Successful".
- **Baseline-Running Conflict** compares the device's **running** config against its approved
  **baseline**; "Not applicable" = no baseline set / not comparable; "In-sync" = matches.
- Backup schedule/last-backup-time is driven by the NCM backup job. TODO(source: KG) — schedule model
  and how a baseline is designated.

## 10. Known Bugs
From `customer-issue-kb.md` §13 (NCM / Configuration Management) — these are the failure modes behind
"Failed Backup Summary" and firmware fields:
- **Config backup / firmware upgrade fails on specific vendors** (PQD-31539, PQD-33382
  [MOTADATA-6866], PQD-38572, PQD-39653): Cisco firmware upgrade fails; FortiGate NCM dead; Cisco ISE
  config fetch shows "More"; NTPC firmware fail. Root causes: template commands not per the
  user-guide; **TFTP unreachable while FTP works**; FortiGate needs an **"a"** confirmation after
  `enable`; ISE ignores `terminal length 0` (hence "More"); TP-Link needs `\r\n` line endings +
  prompt changes after enable (PQD-33405). Solutions: fix template command sequences; switch
  **TFTP → FTP**; vendor-specific command handling (TP-Link fixed **8.0.25**); published KB templates.

These explain devices landing in **Failed Backup Summary** even when reachable. No Overview-screen
UI-rendering bug otherwise recorded.

## 11. Edge Cases
- Zero NCM-managed devices → empty donuts/tables (must not error).
- All backups failed (vendor CLI dialect issue — Known Bugs) → 100% Failed donut.
- Device with no baseline → "Not applicable" in the conflict donut.
- Name filter with no matches; special characters in a device/host name.
- Very large managed fleet (donut/table performance and pagination).
- Backup succeeded via FTP after TFTP failed (state should flip to Successful next run).
- Device deleted/re-provisioned on the same IP (stale summary rows — cf. KB §1 stale-record class).
