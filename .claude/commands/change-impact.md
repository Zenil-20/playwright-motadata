---
description: Run the change-impact VCS merge-check on the current branch diff and emit the minimal regression re-run set
---

# Change impact

Compute the smallest set of tests to re-run for the current branch's changes, instead of the whole
regression suite. Runs the `change-impact` skill (`skills/change-impact/SKILL.md`).

## Steps

1. **Detect the diff.** Call `detectChanges('origin/main')` from
   `framework/integrations/vcs.js` to get `[{ ref, title, paths[] }]` for `origin/main...HEAD`
   (default `HEAD~1...HEAD` if no arg). If it returns `[]` (off-git or no diff), report
   "no changes — no re-run" and stop.

2. **Map changed paths → impacted artifacts** per the `change-impact` skill:
   - engine files (`framework/playwright/selectors.js|resolver.js|flow.js`) → all `tests/scenarios/**`,
   - `tests/regression/**` spec/CSV → that suite only,
   - `tests/data/*.csv` → `tests/scenarios/Discovery_DataDriven.spec.js`,
   - `knowledge/product/<Module>/*` → regression cases in that module (resolve via the store),
   - device-family paths → affected `discovery-devices.csv` rows via `impactedDevices(paths, keys)`.

3. **Resolve module → specs** with `loadRegression()` + `query(cases, { module })` from
   `framework/core/testcase-store/store.js`.

4. **Report** the change `ref`/`title`, the impacted specs, CSV rows, and `knowledge/product` screens,
   and print the exact `npx playwright test <paths>` command for the minimal re-run. Do **not** run it.

## Rules
- Minimal re-run set; only widen to the whole suite when a shared engine file changed.
- Every impacted item must trace to a real changed path — flag unmapped paths, never guess a spec.
- Cite file paths for every spec/CSV/screen named.
