---
screen: Compliance Settings · benchmark-create
module: Settings
category: compliance-settings
route: "/settings/compliance-settings/benchmark/create"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_compliance_settings_benchmark_create.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Compliance Settings · Benchmark — Create

## 1. Purpose
The form for creating a **benchmark**. The admin names it, adds a description and tags, and assembles
it from one or more **Rule Groups** (**Add Rule Group**) — each group holding compliance rules. The
saved benchmark becomes selectable by an Audit Policy.

- **Business objective:** build a reusable compliance standard by grouping rules, so audits evaluate
  a device against a structured baseline.
- **Screen description:** a form with **Benchmark Name · Description · Tags** plus an **Add Rule
  Group** builder, and actions **Reset** / **Create Benchmark**.
- **Primary use cases:** create a benchmark, add rule groups (and rules within them), tag it, save.
- **Who uses it:** network/compliance administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM/compliance licensed · **Rules** defined to add into groups.

## 2. Navigation
```
Settings → Compliance Settings → Benchmark → Create Benchmark
```
- **Breadcrumb:** Settings › Compliance Settings › Benchmark › Create
- **URL:** `/settings/compliance-settings/benchmark/create` (reached via **Create Benchmark**).

## 3. Actions
- **Add Rule Group** — add a rule-group section to the benchmark (`#add-rule-group`).
- **Create Benchmark** — save the benchmark.
- **Reset** — clear the form (`#reset-btn`).
- **Tags** — enter/select tags (input placeholder _Enter Name_).

## 4. Components
| Field / control | Detail (from catalog) |
|---|---|
| Benchmark Name * | `input[name="bencmark-name"]` (text, placeholder _Benchmark Name_) — **note the misspelled `name` attribute `bencmark-name`** (sic, in product) |
| Description | text input (placeholder _Description_) |
| Tags | text input (placeholder _Enter Name_) — tag entry |
| (dropdown) | 1 select on the screen — TODO(source: docs) identify (likely rule-group / rule picker) |
| Add Rule Group | button `#add-rule-group` |
| Reset | button `#reset-btn` |
| Create Benchmark | button `#create-snmp-device-catalog-btn` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_compliance_settings_benchmark_create.json`;
promote verified ones into the cookbook._

> **Automation caveats:**
> - The Benchmark Name input's name attribute is the **misspelled** `bencmark-name` — use it verbatim.
> - The primary save button id is `#create-snmp-device-catalog-btn` — an id **reused from the SNMP
>   Device Catalog create screen** (shared component). Scope by route so a test doesn't cross screens.
> - The single `select` and the rule-group builder rows were not fully captured — harvest live before
>   automating the "add rule group / add rules" flow.

## 5. Permissions
- Expected **Admin / network-config-admin** to create; others no access. TODO(source: KG/docs) —
  exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Compliance Settings reachable; NCM/compliance licensed/enabled.
- Rules should exist to add into rule groups. TODO(source: docs).

## 7. Exit Conditions
- **On Create Benchmark (success):** benchmark saved, returns to the Benchmark list with the new row
  (Used Count = 0); expected success toast. TODO(source: docs) — confirm toast + redirect.
- **On Reset:** form cleared; no server call.

## 8. Validations
- **Benchmark Name** — required (placeholder-labeled field). TODO(source: docs) — uniqueness/length.
- **Description / Tags** — TODO(source: docs) — required?
- **Rule Group(s)** — at least one group (and rules) likely required to save a meaningful benchmark.
  TODO(source: docs) — whether an empty benchmark can be saved.

## 9. Business Rules
- A benchmark is **composed of rule groups**; **Add Rule Group** builds that structure. TODO(source:
  KG) — max groups/rules, rule ordering, and how group/rule weights feed **Weighted Calculation**.
- TODO(source: KG) — whether the same rule can appear in multiple groups/benchmarks.

## 10. Known Bugs
None recorded for this create screen in `customer-issue-kb.md`. Do not invent bugs.

## 11. Edge Cases
- Save with no rule groups (empty benchmark).
- Add a rule group but leave it empty.
- Duplicate benchmark name.
- Reset after adding several rule groups (discards all).
- Very long name/description; Unicode; many tags.
- Save button id collides with SNMP Device Catalog create — verify correct screen in a spec.
