---
name: test-impact-analysis
description: Map a git diff to the ObserveOps specs and product screens it touches — our "VCS merge check" — using framework/integrations/vcs.js (detectChanges → impactedDevices) so a branch re-runs only the impacted tests/regression/** specs and knowledge/product screens instead of all 44. Use before merge to scope the regression set to what actually changed.
---

# Test-impact analysis (ObserveOps)

Impact analysis here is the **VCS merge check**: given a branch diff, work out which of our 44
`tests/regression/**` specs and which `knowledge/product/<Module>/<Screen>.md` screens the change can
affect, so CI (and the reviewer) re-run only those. The mechanism is
`framework/integrations/vcs.js`:

- `detectChanges(since)` → `[{ ref, title, paths[] }]` — changed files vs a ref (default
  `HEAD~1...HEAD`, e.g. `detectChanges('origin/main')`). Safe no-op `[]` outside a git repo.
- `impactedDevices(paths, deviceKeys)` → keyword-matches changed paths to the affected discovery
  device rows, so a change to a device area targets the matrix rows in `tests/data/*.csv` it touches.

This skill maps *changed paths → impacted specs + screens*. The companion
`regression-test-selection` skill turns that impact set into the actual minimal run list.

## When to use / When NOT

- **Use when:** a branch is up for merge and you want the impacted-only regression set; auditing
  which screens/specs a refactor could break; or feeding the reviewer a scoped re-run list. The
  repo's `change-impact` skill runs this end-to-end on the current branch.
- **Do NOT use for:** a full release regression (run everything), a first-time run with no baseline
  ref, or work outside a git repo (`detectChanges` returns `[]` — fall back to running all 44).

## Procedure (ObserveOps-specific)

1. **Get the diff.** `detectChanges('origin/main')` (or the target branch) → the changed `paths[]`.
   Empty result ⇒ can't scope ⇒ run the full suite (fail safe, never fail silent).
2. **Classify each changed path:**
   - `framework/playwright/selectors.js` or `resolver.js`/`flow.js` → **broad** impact: any spec
     using the touched control/flow. Widen the set.
   - `tests/data/*.csv` (a matrix row) → the data-driven `tests/scenarios/**` reading that CSV.
   - a spec under `tests/regression/**` → itself, directly.
   - `knowledge/product/<Module>/<Screen>.md` or `knowledge/locators/selector-cookbook.md` → specs
     asserting on that module/screen.
3. **Map to devices/rows.** Run `impactedDevices(paths, deviceKeys)` to pull the affected discovery
   device rows from `tests/data/*.csv`, so a change scoped to (say) SNMP devices only pulls those
   matrix rows, not every row.
4. **Map to screens.** For each impacted module, list the `knowledge/product/<Module>/<Screen>.md`
   screens to re-verify (e.g. a Discovery change → Settings/02-Discovery screens; an NCCM backup
   change → NCCM screens + `tests/regression/nccm`).
5. **Emit the impact set:** `{ specs[], screens[], deviceRows[], ref, title }` — the input the
   `regression-test-selection` skill (and the reviewer gate) consume.

## Rules & anti-patterns (tie to our conventions)

- **Fail safe, not silent.** No baseline / not a git repo / ambiguous mapping ⇒ run all 44, don't
  quietly skip. Under-selecting hides regressions — the opposite of our goal.
- **Framework changes fan out.** A `selectors.js`/`resolver.js`/`flow.js` edit is never "one spec";
  it can break every spec that resolves through it. Treat as broad impact.
- **Cite the mapping.** Each impacted spec/screen must trace back to a changed path — same provenance
  discipline as the rest of the pipeline; no "probably related" guesses.
- **Data-driven means row-level.** Prefer selecting affected CSV rows over the whole scenario —
  "max coverage, min automation" applies to re-runs too.
- **This scopes; it does not decide green.** Selection/priority is `regression-test-selection`;
  pass/fail verdicts stay with the reviewer and triager.

Adapted from qaskills/seed-skills/test-impact-analysis
