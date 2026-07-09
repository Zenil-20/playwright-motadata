---
description: Audit TFS/regression test-case coverage against the data-driven scenarios and flag gaps
---

# Coverage audit

Report which canonical test cases are covered by an automated scenario and which are gaps.
Enforces the "max coverage, min automation" contract in `docs/COVERAGE.md`.

## Steps

1. **Load canonical cases.** Use `framework/core/testcase-store/store.js` → `loadRegression()` to read every
   suite in `tests/regression/` (already normalized to the 13 canonical fields). Also read the
   TFS import CSVs if present.

2. **Load the coverage matrices.** Read `tests/data/discovery-devices.csv` and
   `tests/data/discovery-form-structure.csv`, plus any other `tests/data/*.csv`.

3. **Match.** For each canonical case, decide if it is covered:
   - device/provision cases → covered if a matching `discovery-devices.csv` row exists
     (match on subtype/category keywords in the case `title`/`tags`)
   - form-field/UI-structure cases → covered if a `discovery-form-structure.csv` row asserts
     that control
   - Everything else → uncovered (candidate for a new CSV row, not a new spec).

4. **Report a table**: `module | total cases | covered | uncovered | coverage %`, then list the
   uncovered case ids/titles grouped by module.

5. **Recommend** the *minimum* new rows (not new specs) that would close the biggest gaps.

## Rules
- Never propose one-spec-per-case. Propose CSV rows for existing data-driven scenarios.
- If a whole area has no scenario yet, propose ONE new data-driven scenario + its matrix CSV.
- Cite file paths and case ids. Do not invent coverage that isn't backed by a matrix row.
