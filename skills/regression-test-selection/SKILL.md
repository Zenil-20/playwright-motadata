---
name: regression-test-selection
description: Turn the VCS merge-check impact set into the minimal ObserveOps regression run — the ordered list of tests/regression/** specs and tests/data CSV rows to re-run for a branch, risk-ranked, with a safe full-suite fallback. Use before merge to run only what the diff can break instead of all 44 specs, driven by framework/integrations/vcs.js.
---

# Regression test selection (ObserveOps)

Selection consumes the impact set from `test-impact-analysis` (our **VCS merge check**, built on
`framework/integrations/vcs.js` — `detectChanges` + `impactedDevices`) and produces the actual
**minimal, risk-ordered run list**: which of the 44 `tests/regression/**` specs, which
`tests/data/*.csv` matrix rows, and which `knowledge/product/<Module>/<Screen>.md` screens to
re-verify for this branch. The repo's `change-impact` skill runs this pipeline on the current branch.

Goal: fast, honest feedback. Run everything the diff can break — and nothing it can't — while never
under-selecting a regression into hiding.

## When to use / When NOT

- **Use when:** gating a pre-merge branch and you want the smallest safe regression set; ordering a
  re-run so the highest-risk specs report first.
- **Do NOT use for:** release/full regression (run all 44), nightly full runs, or any branch where
  `detectChanges` returns `[]` (no baseline / not a git repo) — those get the full suite.

## Procedure (ObserveOps-specific)

1. **Take the impact set** `{ specs[], screens[], deviceRows[], ref, title }` from
   `test-impact-analysis`. Empty or unavailable ⇒ **select all 44** (safe default).
2. **Union direct + transitive selection:**
   - directly changed specs under `tests/regression/**`;
   - specs whose screen appears in the impacted `knowledge/product/<Module>/<Screen>.md` set;
   - data-driven `tests/scenarios/**` restricted to the `deviceRows[]` from
     `impactedDevices(...)` (row-level, not the whole CSV);
   - if the diff touched `framework/playwright/selectors.js` / `resolver.js` / `flow.js`, widen to
     every spec resolving through the touched control/flow (framework changes fan out).
3. **Risk-rank the selected set** (highest first): core AIOps flows (network discovery, policy
   apply, alerts, dashboards) > RBAC/Users/Integrations > read-only screens and empty-state
   ("No data found") checks. Screens with a matching entry in
   `knowledge/known_issues/customer-issue-kb.md` bump up a level.
4. **Emit the run list** — ordered spec paths + the CSV rows to feed the data-driven scenarios +
   the screens to re-verify. This is what the reviewer gate and executor run.
5. **Record provenance.** Every selected spec traces to a changed path (from `ref`/`title`); note
   what was *excluded* and why, so an under-selection is auditable, not invisible.

## Rules & anti-patterns (tie to our conventions)

- **Fail safe.** No baseline, ambiguous mapping, or a framework-wide change ⇒ widen toward the full
  suite. Never let selection silently drop a spec the diff could break.
- **Row-level, not file-level, for data-driven.** Select the impacted `tests/data/*.csv` rows via
  `impactedDevices`, honoring "max coverage, min automation" on re-runs.
- **Rank by product risk, not by filename order.** A discovery/policy spec outranks an empty-state
  check even if the latter sorts first.
- **Selection ≠ verdict.** This skill decides *what and in what order*; the reviewer gate and the
  failure-triager decide pass/fail and classification. Don't let a selection heuristic weaken an
  assertion.
- **Provenance on every pick and every skip.** Cite the changed path behind each selected spec; an
  unexplained exclusion is a hidden coverage gap.

Adapted from qaskills/seed-skills/regression-test-selection
