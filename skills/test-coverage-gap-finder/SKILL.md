---
name: test-coverage-gap-finder
description: Find ObserveOps test-coverage gaps the way our /coverage-audit command does — diff canonical TFS/regression cases against the data-driven CSV matrices and propose the MINIMUM new rows to close them, per docs/COVERAGE.md. Use before a release cycle or after importing new TFS cases.
---

# Test Coverage Gap Finder (ObserveOps)

Find what our suite does **not** cover — but "coverage" here does not mean code line/branch coverage. ObserveOps runs on the **"max coverage, min automation"** contract in `docs/COVERAGE.md`: one data-driven script iterates many CSV rows, so coverage scales with **data rows and canonical test cases**, not with lines of spec. A gap is a canonical TFS/regression case with no matching scenario or matrix row — and it is closed by **adding a CSV row, not a new spec**.

This skill is the reasoning behind the `/coverage-audit` command (`.claude/commands/coverage-audit.md`).

## When to use / When NOT
- **Use when:** preparing a release readiness sign-off, after importing new TFS/Jira cases into the test-case store, or when asked "are we covering module X?".
- **Do NOT use for:** code coverage (Istanbul/V8 line-branch) — that is not our model here. Do not propose one-spec-per-case; that violates the contract.

## Procedure (mirrors /coverage-audit)
1. **Load canonical cases.** `framework/core/testcase-store/store.js` → `loadRegression()` reads every suite in `tests/regression/**` (normalized to the 13 canonical fields). Include TFS import CSVs and `tests/generated/**` awaiting promotion.
2. **Load the coverage matrices.** `tests/data/discovery-devices.csv`, `tests/data/discovery-form-structure.csv`, and any other `tests/data/*.csv`.
3. **Match each canonical case:**
   - device / provision case → covered if a `discovery-devices.csv` row matches (subtype/category keyword in `title`/`tags`).
   - form-field / UI-structure case → covered if a `discovery-form-structure.csv` row asserts that control.
   - anything else → **uncovered** (candidate for a new CSV row, or a new scenario only if the whole area has none).
4. **Report the table:** `module | total | covered | uncovered | coverage %`, then list uncovered case ids/titles grouped by module.
5. **Recommend the minimum** new **rows** (not specs) that close the biggest gaps. Cross-check the TFS traceability table in `docs/COVERAGE.md`.

## Risk-weight the gaps (don't treat all equal)
Prioritize uncovered cases that land on `knowledge/known_issues/customer-issue-kb.md` hotspots — those are where defects actually cluster:
- **Critical:** Discovery credential/OID gaps (§1), HA bring-up & upgrade regressions (§2), platform OOM/store corruption (§3).
- **High:** poller-vs-policy alert math (§5), raw-vs-aggregated report divergence (§4).
- **Medium:** widget/dashboard ordering & clone-state (§10).
A KB §QA-implications idea with no covering case (e.g. ifSpeed=0, topology 16-char parser, re-notification permutations) is a **high-priority gap** even if the case count looks small.

## Report shape
```markdown
## ObserveOps Coverage Gap Report — build 8.2.6
| Module | Total | Covered | Uncovered | Coverage % |
|---|---|---|---|---|
| Discovery (Linux) | 123 | 118 | 5 | 96% |
| ...

### Uncovered (grouped by module, with risk)
- [CRITICAL] MOTADATA-####  "Discovery with read-only Cisco WLC creds" — KB §1 credential pattern
  → close by: ADD row to discovery-devices.csv (cred_type=readonly), NOT a new spec.

### Minimum change to close top gaps
- +3 rows in discovery-devices.csv, +1 row in discovery-form-structure.csv.
- 1 whole-new area (NetPath) has no scenario → propose ONE new data-driven scenario + matrix CSV.
```

## Rules & anti-patterns
- **Never propose one-spec-per-case.** Propose CSV rows for existing data-driven scenarios; only a whole uncovered area justifies ONE new scenario + its matrix CSV.
- **Cite file paths and case ids.** Do not claim coverage that isn't backed by a real matrix row (`coverage.js` gate enforces this at promotion).
- **A green run ≠ full coverage** — a passing scenario over 3 rows does not cover the 20 device classes the TFS plan lists. Count rows against cases.
- **Distinguish gap from retired-by-design** — the 30 legacy per-device specs are being replaced by CSV rows (`docs/COVERAGE.md` migration note); a case covered by a row is covered even if its old spec is gone.

Adapted from qaskills/seed-skills/test-coverage-gap-finder
