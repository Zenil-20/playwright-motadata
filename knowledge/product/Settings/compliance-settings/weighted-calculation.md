---
screen: Compliance Settings · weighted-calculation
module: Settings
category: compliance-settings
route: "/settings/compliance-settings/weighted-calculation"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_compliance_settings_weighted_calculation.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Compliance Settings · Weighted Calculation

## 1. Purpose
Configures the **weighted scoring model** for compliance — how the pass/fail results of individual
rules (and rule groups within a benchmark) roll up into an overall **compliance score**. Weights let
critical checks count for more than minor ones, so a device's compliance percentage reflects risk
rather than a flat rule count.

> **Grounding caveat:** the live sweep captured **only a single _Search_ input** on this screen —
> no grid, form fields, weights table, or buttons (`buttons: []`, `gridHeaders: []`,
> `selects/switches/radios/checkboxes: 0`). The Purpose above is inferred from the screen
> name/route and the compliance model; the actual controls (where weights are entered, per rule vs
> per group vs per severity, and how they're saved) are **TODO(source: KG/docs)** and must be
> harvested live before any test. Do not assume a grid or save button until confirmed.

- **Business objective (inferred):** make compliance scores meaningful by weighting checks.
- **Screen description:** at minimum a searchable list (only a _Search_ input was captured).
  TODO(source: KG/docs) — confirm the real layout.
- **Who uses it:** network/compliance administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM/compliance licensed · rules/benchmarks whose results are being scored.

## 2. Navigation
```
Settings → Compliance Settings → Weighted Calculation
```
- **Breadcrumb:** Settings › Compliance Settings › Weighted Calculation
- **URL:** `/settings/compliance-settings/weighted-calculation` (SPA route; open the full URL).

## 3. Actions
- **Search** — free-text filter (placeholder _Search_) — the only control captured.
- TODO(source: KG/docs) — set/edit weights, save. Not captured in the sweep; harvest live.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | one unnamed _Search_ text input (no id/name) |

_Locators: raw sweep in
`knowledge/locators/catalog/settings_compliance_settings_weighted_calculation.json`. The sweep is
sparse — the full control set (weight fields, categories, save) must be harvested live before
automation._

## 5. Permissions
- Expected **Admin / network-config-admin** to edit weights; others read-only. TODO(source: KG/docs)
  — exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Compliance Settings reachable; NCM/compliance licensed/enabled. TODO(source: docs).

## 7. Exit Conditions
TODO(source: docs) — depends on the (uncaptured) edit/save flow; expected success toast on save and a
recomputed score on subsequent audits.

## 8. Validations
TODO(source: docs) — no fields captured; expected numeric weights (range, must sum to 100%?, no
negatives). Confirm live.

## 9. Business Rules
- Inferred: weights govern how rule/group results combine into a compliance percentage. TODO(source:
  KG) — confirm the weighting granularity (per rule / per group / per severity), the aggregation
  formula, defaults, and whether a change re-scores past audits or only future ones.

## 10. Known Bugs
None recorded for this screen in `customer-issue-kb.md`.
> KB §4 records a customer needing a **custom script for penalty/weighted calculations** in reports
> (PQD-35662 [MOTADATA-7509], §4 "Custom report scripts") — a feature-gap signal, not a defect on
> this settings screen. Do not invent bugs.

## 11. Edge Cases
- Weights that don't sum to the expected total (if enforced).
- Zero or negative weight; extreme weight skew.
- Changing weights after audits already ran (re-score vs not).
- No weights configured (default behavior).
> Most edge cases depend on controls not yet captured — revisit after a live harvest.
