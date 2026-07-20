---
name: change-impact
description: VCS merge-check for Motadata ObserveOps — run framework/integrations/vcs.js detectChanges() on a PR/branch diff, map changed paths to the impacted tests/regression specs, tests/data CSV rows, and knowledge/product screens, and emit the minimal re-run set. Use before merging or before a regression run to avoid running all 44 specs when only one module changed.
---

# Change Impact (VCS merge-check)

Given a merged PR or a branch diff, decide the **smallest set of tests to re-run** instead of the
whole suite. This is the change-driven half of the daily workflow: a diff → impacted ObserveOps
screens → targeted re-run scope.

## When to use
- A PR is up (or a branch is ahead of `origin/main`) and you need the regression scope for it.
- Invoked by `/change-impact` (`.claude/commands/change-impact.md`) on the current branch.
- Before a full `tests/regression/**` run, to prune it to the changed area.

## When NOT
- No git repo / no diff → `detectChanges()` returns `[]`; report "no changes, no re-run" and stop.
  Never fabricate an impact set to look busy.
- Green-field authoring of a brand-new feature — use `prd-gate` then the authoring path instead.

## Procedure

1. **Detect the diff.** Call `detectChanges(since)` from
   `framework/integrations/vcs.js`. Default range is `HEAD~1...HEAD`; pass `origin/main` for a full
   branch diff (`origin/main...HEAD`). It returns `[{ ref, title, paths[] }]` (safe `[]` off-git).

   ```js
   import { detectChanges, impactedDevices } from '../../framework/integrations/vcs.js';
   const changes = detectChanges('origin/main');
   const paths = changes.flatMap(c => c.paths);
   ```

2. **Classify each changed path** and map it to test artifacts:

   | Changed path | Impacted artifact to re-run |
   |---|---|
   | `framework/playwright/selectors.js` / `resolver.js` / `flow.js` | **all** data-driven specs in `tests/scenarios/**` (shared engine — highest blast radius) |
   | `tests/regression/<Module>/*.spec` or `*.csv` | that exact spec/suite only |
   | `tests/data/discovery-devices.csv` / `discovery-form-structure.csv` | `tests/scenarios/Discovery_DataDriven.spec.js` (it iterates those rows) |
   | `knowledge/product/<Module>/<Screen>.md` | regression specs whose `module` matches `<Module>` (via the store, step 3) |
   | `knowledge/locators/selector-cookbook.md` | any spec touching the changed screen's locators |
   | product-side path mentioning a device family (`snmp`, `wmi`, `ssh`, `k8s`, `linux`…) | use `impactedDevices(paths, deviceKeys)` to pick the affected `discovery-devices.csv` rows |

3. **Resolve module → specs via the store.** Load canonical cases with
   `loadRegression()` from `framework/core/testcase-store/store.js`, then
   `query(cases, { module })` to list the regression cases in the impacted module. Their `source`
   / titles point at the specs to re-run.

4. **Map to product screens.** For each impacted module, name the `knowledge/product/<Module>/<Screen>.md`
   screens in scope (Discovery, Policies, Alerts, Dashboards, NCCM…) so the reviewer knows which
   ObserveOps flows the re-run actually exercises.

5. **Emit the minimal re-run set** — a short report:
   - `ref` + `title` of the change,
   - impacted specs (paths under `tests/regression/**` + `tests/scenarios/**`),
   - impacted CSV rows (`tests/data/*.csv`),
   - impacted screens (`knowledge/product/**`),
   - one line: the exact `npx playwright test <paths>` re-run command (do **not** run it).

## Rules & anti-patterns
- **Minimal, not maximal.** Only widen to the whole suite when a shared engine file
  (`selectors/resolver/flow`) changed — that is the one true "run everything" trigger.
- **No fabricated impact.** Every impacted item must trace to a real changed path; if a path maps to
  nothing known, flag it as "unmapped — needs a human", don't guess a spec.
- **Cite paths.** Report absolute or repo-relative paths for every spec/CSV/screen named.
- Off-git or empty diff is a valid "no re-run" answer, mirroring the observeops `vcs_service` no-op stub.

---
Ports the observeops-qa `change_impact_analysis` skill + `vcs_service` concept to our JS platform.
