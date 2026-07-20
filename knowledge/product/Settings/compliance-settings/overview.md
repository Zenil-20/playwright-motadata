---
screen: Compliance Settings
module: Settings
category: compliance-settings
route: "/settings/compliance-settings/"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_compliance_settings.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Compliance Settings

## 1. Purpose
The landing screen of **Compliance Settings** — Motadata's network-configuration compliance area
(part of the NCM/Network-Config capability). The captured controls are identical to **Audit Policy**
(the sweep of `/settings/compliance-settings/` mirrors `.../audit-policy`), so the default tab **is**
the compliance-policy list: policies that schedule a **Benchmark** of **Rules** to run against
device configurations and report pass/fail compliance.

- **Business objective:** let admins govern configuration compliance — define what "compliant"
  means (Rules → Benchmarks) and schedule audits (Policies) so drift from a standard (e.g. a CIS-style
  hardening baseline) is detected on network devices.
- **Screen description:** a searchable/filterable grid (**Policy Name · Description · Created Time ·
  Used Count · Tag · Schedule · Benchmark · Actions**) with **Create Compliance Policy**, **Filter**
  and column show/hide, alongside sibling screens Audit Policy, Benchmark, Rules and Weighted
  Calculation.
- **Primary use cases:** review compliance policies, create one, jump to Benchmarks/Rules.
- **Who uses it:** network/compliance administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM / Network Config module licensed/enabled · devices with fetched
  running-config (config backup via NCM) · Benchmarks and Rules defined.

## 2. Navigation
```
Settings → Compliance Settings   (left-nav)
```
- **Breadcrumb:** Settings › Compliance Settings
- **Sibling screens:** Audit Policy · Benchmark · Rules · Weighted Calculation. TODO(source:
  KG/docs) — confirm exact sub-nav labels/order.
- **URL:** `/settings/compliance-settings/` (SPA route; open the full URL).

## 3. Actions
- **Create Compliance Policy** — add a new audit policy (`#create-audit-policy-btn-id`).
- **Filter** — open the filter panel (`#filter-btn`).
- **Show/Hide Columns** — column chooser (`#btn-show-hide-columns`).
- **Search** — free-text filter (`input[name="search-audit-policy"]`, placeholder _Search_).
- **Per-row Actions** — `[data-cy='grid-action']` (edit / delete / run). TODO(source: KG/docs).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-audit-policy"]` (text) + a second unnamed _Search_ input |
| Grid | columns **Policy Name · Description · Created Time · Used Count · Tag · Schedule · Benchmark · Actions** |
| Create Compliance Policy | button `#create-audit-policy-btn-id` |
| Filter | button `#filter-btn` |
| Show/Hide Columns | button `#btn-show-hide-columns` |
| Row actions | `[data-cy='grid-action']` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_compliance_settings.json`; promote
verified ones into the cookbook (Settings > Compliance Settings)._

> **Note:** this landing route and Audit Policy share the same grid/ids — scope tests by route.

## 5. Permissions
- Configuration screen — expected **Admin / network-config-admin** to create/edit; others read-only.
  TODO(source: KG/docs) — exact RBAC + NCM/compliance license gate.

## 6. Entry Conditions
- Logged in; Settings reachable; NCM/Network-Config compliance licensed/enabled.
- Meaningful audits require devices whose config has been fetched (NCM config backup). TODO(source:
  docs) — confirm the license/feature name.

## 7. Exit Conditions
- Grid renders existing policies; **Create Compliance Policy** transitions to the policy form.
  TODO(source: docs) — success toasts, run/schedule signals.

## 8. Validations
- Grid/search are read paths — no field validation here; create/edit validations live on the policy
  form. TODO(source: docs).

## 9. Business Rules
- A **Policy** references a **Benchmark**; a Benchmark is built from **Rule Groups** of **Rules**;
  results can be scored via **Weighted Calculation**. Compliance is evaluated against device
  **running-config** fetched by NCM. TODO(source: KG) — confirm the exact chain and scheduling model.

## 10. Known Bugs
None recorded for the Compliance Settings screen in `customer-issue-kb.md`.
> KB §13 (NCM/Configuration Management) records per-vendor **config-fetch/backup** failures (Cisco,
> FortiGate, ISE, TP-Link) — a *dependency* risk, since a compliance audit has nothing to evaluate if
> the device config wasn't fetched — but these are NCM defects, not compliance-settings defects. Do
> not invent bugs.

## 11. Edge Cases
- No benchmarks/rules defined yet (policy has nothing to run).
- Policy referencing a benchmark whose rules were later deleted.
- Device with no fetched config (audit has no input — KB §13 dependency).
- Large policy list — search/filter/column-chooser/pagination.
- Scheduled audit overlapping a config backup window.
