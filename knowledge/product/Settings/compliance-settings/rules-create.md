---
screen: Compliance Settings · rules-create
module: Settings
category: compliance-settings
route: "/settings/compliance-settings/rules/create"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_compliance_settings_rules_create.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Compliance Settings · Rules — Create

## 1. Purpose
The form for authoring a **compliance rule** — the atomic check that tests a device configuration
against an expected **Condition**, matches a **Result Pattern**, and requires a given **Occurrence**.
It appears to be a **multi-step** form (a **Next** button advances it), where the captured step
defines the match logic (four **radio** options plus Condition / Result Pattern / Occurrence).

- **Business objective:** let admins define precise, reusable config checks (e.g. "the running-config
  must/most-not contain pattern X, N times") that benchmarks then aggregate.
- **Screen description:** a step form with labels **Condition · Result Pattern · Occurrence**, a set
  of **4 radio** options (match mode), several **Select** dropdowns, and actions **Reset** / **Next**.
- **Primary use cases:** create a rule by choosing a match mode, entering the pattern/condition and
  occurrence, then advancing through the wizard to save.
- **Who uses it:** network/compliance administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** NCM/compliance licensed.

> **Grounding caveat:** the sweep captured a **`Create Runbook`** button and button id
> **`runook-credential-btn-id`** on this route — these are **reused/mislabeled from the Runbook
> plugin screen** (a shared component), *not* a genuine "create runbook" action here. Treat the real
> primary action as **Next** (wizard) and do **not** rely on the `Create Runbook` label/id for this
> screen until verified live. The four inputs and four radios were captured only generically
> (placeholders _Select_ / blank) — harvest scoped locators before automating.

## 2. Navigation
```
Settings → Compliance Settings → Rules → Create Rule
```
- **Breadcrumb:** Settings › Compliance Settings › Rules › Create
- **URL:** `/settings/compliance-settings/rules/create` (reached via **Create Rule**).

## 3. Actions
- **Next** — advance to the next step of the rule wizard.
- **Reset** — clear the current step.
- **Radio selection** — choose one of **4** match modes (Condition type). TODO(source: docs) —
  enumerate the four options.
- **Select** dropdowns — `[data-cy='dropdown-trigger-input']` (Condition / pattern operator / etc.).
- **Create Runbook (`#runook-credential-btn-id`)** — **captured but suspect** (see caveat); do not
  use as the rule-save action without live verification.

## 4. Components
| Field / control | Detail (from catalog) |
|---|---|
| Condition | label + input (placeholder blank _" "_) — TODO(source: docs) text vs dropdown |
| Result Pattern | label + `Select` dropdown — TODO(source: docs) confirm it's the pattern field |
| Occurrence | label + `Select` dropdown — how many matches required |
| (match mode) | **4 radio** options (e.g. contains / not-contains / equals …) — TODO(source: docs) enumerate |
| Dropdowns | `[data-cy='dropdown-trigger-input']` (shared across the Selects) |
| Reset | button |
| Next | button (wizard advance) |
| Create Runbook | button `#runook-credential-btn-id` — **reused/mislabeled; verify live** |

_Locators: raw sweep in `knowledge/locators/catalog/settings_compliance_settings_rules_create.json`;
promote verified ones into the cookbook. Per-field ids were not captured — the four inputs share the
generic dropdown-trigger hook and distinguish only by label/placeholder._

## 5. Permissions
- Expected **Admin / network-config-admin** to create; others no access. TODO(source: KG/docs) —
  exact RBAC + license gate.

## 6. Entry Conditions
- Logged in; Compliance Settings reachable; NCM/compliance licensed/enabled.
- Arrived from Rules → Create.

## 7. Exit Conditions
- **On Next → final save (success):** rule saved, returns to the Rules list with the new row and its
  Rule Type; expected success toast. TODO(source: docs) — confirm the wizard's final save action
  (the true label/id, given the suspect `Create Runbook` capture) and the toast/redirect.
- **On Reset:** current step cleared; no server call.

## 8. Validations
- **Condition / Result Pattern** — required; a valid pattern/regex expected. TODO(source: docs) —
  pattern syntax + validation.
- **Occurrence** — required; numeric/threshold. TODO(source: docs) — allowed range.
- **Match mode radio** — exactly one required. TODO(source: docs).

## 9. Business Rules
- A rule combines a **match mode** (one of four radios) with a **Result Pattern** and an
  **Occurrence** threshold to decide pass/fail against config text. TODO(source: KG) — exact
  semantics of each match mode and how occurrence interacts with pass/fail (at-least-N vs exactly-N).
- Multi-step wizard: later steps (after **Next**) were not captured. TODO(source: KG/docs) — what the
  subsequent step(s) collect (e.g. remediation, weight, scope).

## 10. Known Bugs
None recorded for this create screen in `customer-issue-kb.md`. Do not invent bugs.

## 11. Edge Cases
- Advance (**Next**) with required fields empty (Condition/Pattern/Occurrence/radio).
- Invalid regex/pattern in Result Pattern.
- Occurrence of 0 or a very large value.
- Two match modes conflicting (radio should enforce single select).
- Reset mid-wizard (does it clear all steps or just the current?).
- Save via the correct final action — **not** the mislabeled `Create Runbook` id.
