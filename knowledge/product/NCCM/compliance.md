---
screen: NCCM · Compliance
module: NCCM
route: "/nccm/compliance"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/nccm_compliance.json · screenshots/NCCM.png (tab strip) · known_issues §13
verified: 2026-07-09
---

# NCCM · Compliance

## 1. Purpose
The **config-compliance** tab of NCCM — lists the compliance **policies** that managed device configs
are evaluated against and their resulting **scores/severity**, so admins can prove and improve the
security/standardization posture of the network config estate.

- **Business objective:** measure how well device running-configs conform to defined **benchmarks**
  (e.g. hardening standards), surface the worst offenders by severity, and track scores over time —
  the audit/compliance half of NCCM (the "CC" in NCCM).
- **Screen description:** a grid of compliance policies with columns **Compliance Policy ·
  Compliance Score · Device Severity · Used Count · Benchmark · Last Scan At**, above the shared NCCM
  tab strip (Overview · Compliance · Explorer) and a **Search** box.
- **Primary use cases:** review each policy's score and severity; see how many devices a policy is
  used on; check the benchmark it maps to and when it was last scanned; search for a specific policy.
- **Who uses it:** compliance/security admins and network engineers. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM module licensed; compliance policies/benchmarks defined; at least one
  compliance **scan** has run against managed devices.

## 2. Navigation
```
NCCM → Compliance tab   →  /nccm/compliance
```
- **Tabs:** Overview · Compliance · Explorer
- **URL:** `/nccm/compliance`

## 3. Actions
- **Search** policies (`input[name="search"]`, placeholder "Search").
- Read policy rows: Compliance Policy, Compliance Score, Device Severity, Used Count, Benchmark,
  Last Scan At.
- Drill into a policy for its per-device results. TODO(source: docs) — confirm drill-through / whether
  a row opens rule/device detail.
- Create / edit / run a compliance policy or trigger a scan. TODO(source: KG/docs) — the sweep
  captured **no buttons** on this tab; confirm whether policy CRUD/scan actions live here, on a
  row-action menu, or under Settings.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Tabs | Overview · Compliance · Explorer |
| Search | `input[name="search"]` (placeholder "Search") |
| Compliance grid | Compliance Policy · Compliance Score · Device Severity · Used Count · Benchmark · Last Scan At |

_`buttonIds:[]`, `buttons:[]`, `selects:0, switches:0, radios:0, checkboxes:0` — no toolbar controls
captured in this state; row-level or hidden actions not captured by the sweep._

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (NCCM > Compliance)._

## 5. Permissions
- Requires NCM module licensed and a compliance/config role. Viewing scores is a read action;
  creating/editing policies or running scans is more privileged. TODO(source: KG/docs) — exact RBAC
  and whether policy authoring is here or in Settings.

## 6. Entry Conditions
- Logged in; NCM module enabled/licensed.
- Compliance policies/benchmarks exist and at least one scan has run (else empty grid / no scores).

## 7. Exit Conditions
- Grid renders policies with current Compliance Score, Device Severity, Used Count, Benchmark, and
  Last Scan At.
- **Search** filters the policy rows.
- Empty state (no policies/scans) → empty grid, not an error.

## 8. Validations
- **Search** — free-text substring; no format rule. TODO(source: docs).
- Policy authoring validations (name uniqueness, benchmark selection, rule definition) —
  TODO(source: KG/docs), since the authoring surface was not captured here.

## 9. Business Rules
- **Compliance Score** is derived from evaluating a device config against the policy's **benchmark**;
  **Device Severity** rolls up the worst rule outcome per device. TODO(source: KG) — exact scoring
  formula and severity thresholds.
- **Used Count** = number of devices/configs the policy is applied to.
- **Last Scan At** reflects the most recent compliance scan; scores are only as fresh as the last
  scan. TODO(source: KG) — scan schedule/trigger.
- A policy with Used Count 0 has no effective score. TODO(source: docs) — confirm display.

## 10. Known Bugs
None recorded **specifically for the NCCM Compliance tab** in `customer-issue-kb.md`. The nearest NCM
defect class (§13) concerns **config backup/firmware on specific vendors** (Cisco/FortiGate/ISE/
TP-Link CLI dialect issues) — a device whose config never backs up cannot be meaningfully scored, so
those backup failures indirectly starve compliance results. No compliance-scoring-specific customer
bug is recorded. **None recorded for this screen** beyond that indirect dependency.

## 11. Edge Cases
- No policies / no scans yet → empty grid.
- Policy applied to devices whose backup failed (unscannable configs — KB §13 dependency).
- Policy with Used Count 0; policy never scanned (blank Last Scan At).
- Search with no matches; special characters in a policy/benchmark name.
- Very large policy set (grid performance / pagination).
- Stale scores after devices were removed/re-provisioned (Used Count drift).
- Score boundary values (0% / 100%) and severity thresholds rendering correctly.
