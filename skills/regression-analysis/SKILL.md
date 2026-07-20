---
name: regression-analysis
description: Dedup / coverage-gap / promotion-candidate analysis over the Motadata regression suite. Loads canonical cases via framework/core/testcase-store/store.js, runs the dedup + coverage validators, and reports duplicates to prune, gaps to fill (as CSV rows, not new specs), and validated generated suites to promote. Use to audit tests/regression health, aligned with /coverage-audit.
---

# Regression Analysis

Health check over the ObserveOps regression suite. Answers three questions: what is **duplicated**
(prune it), what is **not covered** (fill it — with a CSV row, not a new spec), and which
`tests/generated/` suites are **ready to promote** into `tests/regression/`. Honors the "max
coverage, min automation" contract in `docs/COVERAGE.md`.

## When to use
- Auditing suite health or after a batch of AI-authored cases lands in `tests/generated/`.
- Deciding what to promote as the pipeline's final stage.
- Complements `/coverage-audit` (that command diffs cases vs. data-driven scenarios; this skill adds
  dedup + promotion judgement).

## When NOT
- Judging a single new requirement's coverage — that is the `05_testcases` gate on that ticket.
- Locator/spec quality — that is `07_automation`.

## Procedure

1. **Load canonical cases.** Use `framework/core/testcase-store/store.js`:

   ```js
   import { loadRegression, loadCases, query, validate } from '../../framework/core/testcase-store/store.js';
   import { validateDedup } from '../../governance/validation/dedup.js';
   import { validateCoverage } from '../../governance/validation/coverage.js';

   const cases = loadRegression();               // every *.csv in tests/regression/, canonical 13 fields
   ```

2. **Dedup.** Run `validateDedup(cases)` (`governance/validation/dedup.js`). It flags cases whose
   normalized step-signature (`action:target` chain) matches — the classic AI failure of the same
   test under two titles. Report each duplicate pair; recommend keeping the one with better provenance
   (`source`) and pruning the other.

3. **Coverage gaps.** Two complementary passes:
   - **AC tracing** — `validateCoverage(cases, acIds)` checks every acceptance criterion is traced by
     ≥1 case, flags orphan cases, and requires **negative + boundary** scenarios in the suite.
   - **Data-driven coverage** — mirror `/coverage-audit`: for each canonical case decide if a
     `tests/data/discovery-devices.csv` row (device/provision cases) or
     `tests/data/discovery-form-structure.csv` row (form/UI-structure cases) already covers it.
     Uncovered ⇒ candidate for a **new CSV row**, not a new spec.

4. **Weight gaps by field risk.** Prioritize gaps in ObserveOps hotspot areas — Discovery, HA/Upgrade,
   Policies/Alerts — using `knowledge/known_issues/customer-issue-kb.md` so real customer-pain areas
   rank above cosmetic ones.

5. **Promotion candidates.** For suites in `tests/generated/`, load with `loadCases`, run `validate`
   (schema) + `validateDedup` + `validateCoverage`. A suite is promotable only when all pass and it
   adds coverage the regression suite lacks. Recommend `promote(slug)` for those; quarantine the rest.

6. **Report**: a table `module | total | duplicates | uncovered | coverage %`, then the duplicate pairs
   to prune, the minimum new CSV rows to close the biggest gaps, and the generated slugs to promote —
   every item citing case ids and file paths.

## Rules & anti-patterns
- **Never propose one-spec-per-case.** Gaps close with CSV rows on existing data-driven scenarios; a
  whole uncovered area gets ONE new scenario + its matrix CSV.
- **Don't mask** — quarantine failing/duplicate cases, never silently delete.
- **Cite** case ids and file paths for every duplicate, gap, and promotion; invent no coverage a
  matrix row doesn't back.
- Promote only suites that pass schema + dedup + coverage validators.

---
Ports the observeops-qa `regression_analysis` skill to our store + dedup/coverage validators.
