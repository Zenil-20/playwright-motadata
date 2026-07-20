---
screen: Compliance Settings · rules
module: Settings
category: compliance-settings
route: "/settings/compliance-settings/rules"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_compliance_settings_rules.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Compliance Settings · Rules

## 1. Purpose
Lists and manages individual **compliance rules** — the atomic checks that test a device
configuration against an expected condition/pattern. Rules are the building blocks assembled into
**Rule Groups** inside **Benchmarks**, which **Audit Policies** then run. The grid shows each rule's
description, tag and **Rule Type**.

- **Business objective:** maintain the library of reusable compliance checks so benchmarks can be
  composed from consistent, tested rules.
- **Screen description:** a searchable grid (**Rule · Description · Tag · Rule Type · Actions**) with
  a **Create Rule** action.
- **Primary use cases:** review rules, create a rule, edit/delete, filter/search by tag/type.
- **Who uses it:** network/compliance administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM/compliance licensed. Rules operate on device **running-config** at audit
  time.

## 2. Navigation
```
Settings → Compliance Settings → Rules
```
- **Breadcrumb:** Settings › Compliance Settings › Rules
- **URL:** `/settings/compliance-settings/rules` (SPA route; open the full URL).
- **Create sub-route:** `/settings/compliance-settings/rules/create` (see rules-create.md).

## 3. Actions
- **Create Rule** — open the create form (`#btn-create-rule`, route `.../rules/create`).
- **Search** — free-text filter (`input[name="rule-search"]`, placeholder _Search_).
- **Per-row Actions** — `[data-cy='grid-action']` (edit / delete / view usage). TODO(source:
  KG/docs) — exact menu; a rule used by a benchmark is likely delete-guarded.
- **Note:** unlike the other compliance list screens, the sweep captured **no Filter button** here
  (`buttonIds: ["btn-create-rule"]` only). TODO(source: docs) — confirm whether a filter exists.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="rule-search"]` (text) + a second unnamed _Search_ input |
| Grid | columns **Rule · Description · Tag · Rule Type · Actions** |
| Create Rule | button `#btn-create-rule` |
| Row actions | `[data-cy='grid-action']` |

_Locators: raw sweep in `knowledge/locators/catalog/settings_compliance_settings_rules.json`;
promote verified ones into the cookbook (Settings > Compliance Rules)._

## 5. Permissions
- Expected **Admin / network-config-admin** to create/edit/delete; others read-only. TODO(source:
  KG/docs) — exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Compliance Settings reachable; NCM/compliance licensed/enabled.
- TODO(source: docs) — whether built-in rules ship by default.

## 7. Exit Conditions
- **On create (success):** new rule row with its Rule Type; expected success toast. TODO(source:
  docs).
- **On delete:** row removed (only if not used by a benchmark — see Business Rules).

## 8. Validations
- **Rule Name** — required, likely unique (see create form). TODO(source: docs).
- Condition/pattern validation lives on the create form. TODO(source: docs).

## 9. Business Rules
- A rule is referenced by **rule groups** inside **benchmarks**; a rule in use is expected to be
  undeletable until removed from all groups. TODO(source: KG) — confirm the guard.
- **Rule Type** categorizes the check. TODO(source: KG/docs) — enumerate the rule types and how each
  evaluates config text.
- TODO(source: KG) — rule weighting for scoring (Weighted Calculation).

## 10. Known Bugs
None recorded for the Compliance Rules screen in `customer-issue-kb.md`. Do not invent bugs.

## 11. Edge Cases
- Delete a rule referenced by a benchmark (Used elsewhere).
- Rule whose pattern matches nothing / everything.
- Duplicate rule name.
- Large rule library — search/pagination (no Filter captured — confirm).
- Tag/type filtering interplay.
