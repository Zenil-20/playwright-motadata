---
screen: Compliance Settings · audit-policy
module: Settings
category: compliance-settings
route: "/settings/compliance-settings/audit-policy"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_compliance_settings_audit_policy.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Compliance Settings · Audit Policy

## 1. Purpose
Lists and manages **compliance/audit policies** — each policy binds a **Benchmark** to a set of
target devices and a **Schedule**, so the benchmark's rules are evaluated against those devices'
configurations on a cadence and produce compliance results. The grid surfaces each policy's
description, created time, **Used Count**, tag, schedule and the benchmark it runs.

- **Business objective:** operationalize compliance — turn a static benchmark into a recurring audit
  that flags configuration drift on network devices.
- **Screen description:** a searchable/filterable grid (**Policy Name · Description · Created Time ·
  Used Count · Tag · Schedule · Benchmark · Actions**) with **Create Compliance Policy**, **Filter**
  and a **Show/Hide Columns** chooser.
- **Primary use cases:** create a compliance policy, edit its benchmark/schedule/targets, run/review,
  filter by tag/schedule/benchmark, delete.
- **Who uses it:** network/compliance administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM/compliance licensed · a defined **Benchmark** · devices with fetched
  running-config (NCM backup).

## 2. Navigation
```
Settings → Compliance Settings → Audit Policy
```
- **Breadcrumb:** Settings › Compliance Settings › Audit Policy
- **URL:** `/settings/compliance-settings/audit-policy` (SPA route; also the module landing grid).

## 3. Actions
- **Create Compliance Policy** — open the policy form (`#create-audit-policy-btn-id`).
- **Filter** — open the filter panel (`#filter-btn`).
- **Show/Hide Columns** — column chooser (`#btn-show-hide-columns`).
- **Search** — free-text filter (`input[name="search-audit-policy"]`, placeholder _Search_).
- **Per-row Actions** — `[data-cy='grid-action']` (edit / delete / run policy). TODO(source:
  KG/docs) — confirm a "run now" action + where results are viewed.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-audit-policy"]` (text) + a second unnamed _Search_ input |
| Grid | columns **Policy Name · Description · Created Time · Used Count · Tag · Schedule · Benchmark · Actions** |
| Create Compliance Policy | button `#create-audit-policy-btn-id` |
| Filter | button `#filter-btn` |
| Show/Hide Columns | button `#btn-show-hide-columns` |
| Row actions | `[data-cy='grid-action']` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_compliance_settings_audit_policy.json`;
promote verified ones into the cookbook. The Create-policy form fields (name, benchmark picker,
targets, schedule) were not captured — harvest live._

## 5. Permissions
- Expected **Admin / network-config-admin** to create/edit/run; others read-only. TODO(source:
  KG/docs) — exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Compliance Settings reachable; NCM/compliance licensed/enabled.
- At least one **Benchmark** defined and target devices with fetched config, for a policy to do
  anything. TODO(source: docs).

## 7. Exit Conditions
- **On create (success):** new policy row with its benchmark/schedule; expected success toast.
  TODO(source: docs) — confirm toast + whether the first audit runs immediately or on schedule.
- **On run:** compliance results generated (pass/fail per rule, score). TODO(source: KG/docs) —
  where results surface (report/dashboard).

## 8. Validations
- **Policy Name** — required, likely unique. TODO(source: docs).
- **Benchmark** — required selection. TODO(source: docs).
- **Targets** (devices/groups/tags) — at least one required. TODO(source: docs).
- **Schedule** — required cadence. TODO(source: docs) — schedule model/limits.

## 9. Business Rules
- A policy **references a Benchmark**; deleting/altering that benchmark affects the policy.
  **Used Count** likely reflects how many times/where the policy is referenced. TODO(source: KG) —
  confirm what Used Count counts.
- Compliance is evaluated against **NCM-fetched running-config** — if a device's config wasn't
  fetched, that device has no input to audit (KB §13 dependency). TODO(source: KG).
- TODO(source: KG) — scoring via Weighted Calculation, re-audit-on-change vs schedule-only.

## 10. Known Bugs
None recorded for the Audit Policy screen in `customer-issue-kb.md`.
> Dependency risk only: KB §13 records per-vendor NCM **config-fetch/backup** failures (e.g. Cisco
> ISE "More" pagination, FortiGate confirmation prompt, TP-Link line endings) that would leave an
> audit with no config to evaluate. That is an NCM defect class, not an audit-policy defect. Do not
> invent bugs.

## 11. Edge Cases
- Policy with a benchmark that has no rules.
- Target device with no fetched config (audit no-op / error).
- Schedule overlapping the device's config-backup window.
- Deleting a benchmark still referenced by a policy (Used Count > 0).
- Very large target set (many devices × many rules) — run duration/timeout.
- Duplicate policy name; tag filtering interplay.
