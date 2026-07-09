---
name: testcase-store-service
type: service
description: Normalizes any TFS/Jira/Excel test-case CSV to 13 canonical fields; validates, saves, promotes, and queries suites.
tools: ["Node fs", "csv.js", "mapping.js"]
source: JS port of observeops-qa framework/services/testcase_repository.py; doc format per rohitg00/awesome-claude-code-toolkit
---

# Test-Case Store Service

One API for the test-case lifecycle. Any CSV (Jira export, TFS/ADO, manual Excel) is
mapped to the canonical schema by matching headers against alias lists — no per-file code.

## Files

| File | Role |
|---|---|
| `mapping.js` | 13 canonical fields + header alias map + `canonicalOf(header)`. |
| `csv.js` | Dependency-free CSV parse/serialize (quoted fields, BOM). |
| `store.js` | `loadCases`, `loadRegression`, `validate`, `saveGenerated`, `promote`, `query`. |

## Canonical schema (13 fields)

`id, title, module, type, priority, preconditions, steps, test_data, expected_result,
automated, tags, source, node` — `title` is the only required field.

## Layout

- `tests/regression/` — source of truth (only place a suite is "real").
- `tests/generated/` — tool/agent-authored, awaiting promotion.

## Rules & Regulations

1. **Canonical only downstream.** Consumers read the 13 canonical fields; they never parse
   raw vendor CSVs directly. Add a header alias in `mapping.js` instead of a special case.
2. **Validate before save.** `saveGenerated()` rejects rows missing `title`. Never write an
   unvalidated suite.
3. **Promotion is the only path into regression.** Don't hand-drop files into
   `tests/regression/`; run `promote(slug)` so the generated→regression gate is honored.
4. **Unknown columns are dropped, not guessed.** If data is being lost, add the alias — do not
   infer meaning from column position.

## Before Completing a Task

- [ ] New CSV sources load via an alias in `mapping.js`, not bespoke parsing.
- [ ] `validate()` passes on any suite you write.
- [ ] `node -e "import('./framework/core/testcase-store/store.js')"` imports cleanly.
