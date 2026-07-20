---
screen: Compliance Settings · benchmark
module: Settings
category: compliance-settings
route: "/settings/compliance-settings/benchmark"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_compliance_settings_benchmark.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Compliance Settings · Benchmark

## 1. Purpose
Lists and manages **benchmarks** — named collections of compliance **Rule Groups / Rules** that
together define a compliance standard (e.g. a hardening baseline) to evaluate device configurations
against. A benchmark is what an **Audit Policy** schedules and runs; the grid shows each benchmark's
description, **Used Count** (how many policies use it) and tag.

- **Business objective:** package individual rules into a reusable standard so audits test a device
  against a coherent baseline rather than ad-hoc single rules.
- **Screen description:** a searchable/filterable grid (**Benchmark · Description · Used Count · Tag ·
  Actions**) with a **Create Benchmark** action.
- **Primary use cases:** review benchmarks and their usage, create one, edit its rule groups,
  delete, filter by tag.
- **Who uses it:** network/compliance administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM/compliance licensed · **Rules** defined (to add to rule groups).

## 2. Navigation
```
Settings → Compliance Settings → Benchmark
```
- **Breadcrumb:** Settings › Compliance Settings › Benchmark
- **URL:** `/settings/compliance-settings/benchmark` (SPA route; open the full URL).
- **Create sub-route:** `/settings/compliance-settings/benchmark/create` (see benchmark-create.md).

## 3. Actions
- **Create Benchmark** — open the create form (`#btn-create-benchmark`, route `.../benchmark/create`).
- **Filter** — open the filter panel (`#filter-btn`).
- **Search** — free-text filter (`input[name="benchmark-search"]`, placeholder _Search_).
- **Per-row Actions** — `[data-cy='grid-action']` (edit / delete / view usage). TODO(source:
  KG/docs) — exact menu; deleting a benchmark with **Used Count > 0** likely blocked.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="benchmark-search"]` (text) + a second unnamed _Search_ input |
| Grid | columns **Benchmark · Description · Used Count · Tag · Actions** |
| Create Benchmark | button `#btn-create-benchmark` |
| Filter | button `#filter-btn` |
| Row actions | `[data-cy='grid-action']` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_compliance_settings_benchmark.json`;
promote verified ones into the cookbook (Settings > Benchmark)._

## 5. Permissions
- Expected **Admin / network-config-admin** to create/edit/delete; others read-only. TODO(source:
  KG/docs) — exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Compliance Settings reachable; NCM/compliance licensed/enabled.
- **Rules** should exist to populate a benchmark's rule groups. TODO(source: docs) — whether
  built-in benchmarks ship by default.

## 7. Exit Conditions
- **On create (success):** new benchmark row (Used Count = 0); expected success toast. TODO(source:
  docs).
- **On delete:** row removed (only if unused — see Business Rules).

## 8. Validations
- **Benchmark Name** — required, likely unique (see create form). TODO(source: docs).
- Type-specific validation lives on the create form. TODO(source: docs).

## 9. Business Rules
- A benchmark **contains rule groups** (each group a set of rules) and is **referenced by audit
  policies** — **Used Count** reflects that reference count; a benchmark in use is expected to be
  undeletable until unreferenced. TODO(source: KG) — confirm the guard and exactly what Used Count
  counts.
- TODO(source: KG) — weighting of rules/groups within a benchmark (see Weighted Calculation),
  built-in vs custom editability.

## 10. Known Bugs
None recorded for the Benchmark screen in `customer-issue-kb.md`.
> No compliance-benchmark defects appear in the KB. (NCM config-fetch failures in KB §13 are a
> separate dependency.) Do not invent bugs.

## 11. Edge Cases
- Delete a benchmark with **Used Count > 0** (referenced by a policy).
- Benchmark with zero rule groups (empty standard).
- Benchmark whose rules were later deleted.
- Duplicate benchmark name.
- Large benchmark (many rule groups/rules) — audit run time.
- Tag filtering + search interplay; large list pagination.
