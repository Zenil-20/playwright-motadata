---
screen: NCCM (module root → Overview)
module: NCCM
route: "/nccm/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/nccm.json · screenshots/NCCM.png · known_issues §13
verified: 2026-07-09
---

# NCCM (module root)

> **Note:** `/nccm/` is the **module root** and resolves to the **Overview** tab — the catalog for
> this route is identical to `nccm_overview.json`. The full functional write-up lives in
> **`overview.md`** (`/nccm/overview`); this file documents the module entry point and cross-links to
> its three tabs. Avoid duplicating detail — treat `overview.md` as canonical for the Overview tab.

## 1. Purpose
The entry point of **Network Configuration and Compliance Management (NCCM)** — Motadata's
network-device config-backup, config-compliance, and firmware/config-drift management module. Opening
NCCM lands the user on the **Overview** dashboard.

- **Business objective:** manage the lifecycle of network-device configuration — automated **backup**
  of running/startup configs, **compliance** scoring against benchmarks, **baseline-vs-running**
  drift detection, and firmware tracking — from one module.
- **Screen description:** header "Network Configuration and Compliance Management" with tabs
  **Overview · Compliance · Explorer**, plus a **filter by name…** input. (See `NCCM.png`.)
- **Primary use cases:** land in NCCM → review Overview health → move to Compliance (policy scores)
  or Explorer (per-device config/backup/firmware operations).
- **Who uses it:** network / config-management admins. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM module licensed; devices discovered with NCM enabled; config-fetch
  credentials.

## 2. Navigation
```
Left icon rail → NCCM   →  /nccm/  (redirects to /nccm/overview)
```
- **Tabs:** Overview (`/nccm/overview`) · Compliance (`/nccm/compliance`) · Explorer (`/nccm/explorer`)
- **Related:** the config-change **Approval** queue at `/ncm-approval` (see `ncm-approval.md`).
- **URL:** `/nccm/`

## 3. Actions
- Enter NCCM → land on **Overview**.
- Navigate to **Compliance** or **Explorer** via the tab strip.
- **Filter by name** across the landing view (`input[placeholder="filter by name…"]`).
- (All device-level operations — Backup, Compare, firmware, tag — are on **Explorer**; policy scores
  on **Compliance**.)

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Module tabs | Overview · Compliance · Explorer |
| Name filter | `input[placeholder="filter by name…"]` |
| Overview dashboard | Device / Backup / Baseline-Running-Conflict donuts + summary tables (see `overview.md`) |

_Catalog identical to `nccm_overview.json`; `buttonIds:[]`, `selects:0, switches:0, radios:0,
checkboxes:0`._

_Locators: see `overview.md` and promote verified ones into the cookbook (NCCM > Overview)._

## 5. Permissions
- Requires the NCM/NCCM module licensed and a config-management role to enter. Per-tab operations
  carry their own gating (Explorer's backup/compare/tag; Approval's approve/reject). TODO(source:
  KG/docs) — module RBAC and license flag.

## 6. Entry Conditions
- Logged in; NCM module enabled/licensed.
- At least one NCM-managed device for meaningful content (else empty Overview).

## 7. Exit Conditions
- `/nccm/` resolves to the Overview dashboard rendered with current state.
- Tab clicks route to Compliance / Explorer without full reload (SPA).

## 8. Validations
- **Filter by name** — free-text substring; no format rule. TODO(source: docs).
- No editable form at the module root.

## 9. Business Rules
- NCCM operates only on **NCM-enabled** devices; enabling NCM happens at discovery (Network Discovery
  "with NCM"). TODO(source: KG) — confirm enable path.
- The three tabs partition the workflow: **Overview** = health roll-up, **Compliance** = benchmark
  scoring, **Explorer** = per-device config/backup/firmware actions.

## 10. Known Bugs
From `customer-issue-kb.md` §13 (NCM / Configuration Management): per-vendor **config backup /
firmware upgrade** failures — Cisco firmware (PQD-31539), FortiGate NCM dead (PQD-38572), Cisco ISE
"More" prompt (PQD-33382 [MOTADATA-6866]), NTPC firmware (PQD-39653); TFTP-unreachable→use FTP;
FortiGate "a" confirmation; TP-Link `\r\n` handling (fixed **8.0.25**). Full detail in `overview.md`
and `explorer.md`. No module-root-specific bug recorded.

## 11. Edge Cases
- Direct navigation to `/nccm/` must land on Overview (not a blank/404).
- NCM licensed but **zero managed devices** → empty Overview.
- NCM module **not licensed** → module hidden or gated. TODO(source: docs) — confirm behavior.
- Deep-linking straight to `/nccm/explorer` or `/nccm/compliance` (tabs must resolve independently).
