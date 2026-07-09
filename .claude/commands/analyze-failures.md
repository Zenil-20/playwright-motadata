---
description: Analyze the last run's failures and route each to a fix via the failure-triager
---

# Analyze failures

Turn the machine-readable failure summary into cited, actionable triage. Inspired by the
toolkit's `test-results-analyzer`; delegates the per-failure verdict to the existing
`failure-triager` agent (`.claude/agents/failure-triager.md`).

## Steps

1. **Read** `reports/failures.json` (written by `framework/core/reporters/failure-reporter.js`). If it is
   missing or `count` is 0, report "no failures" and stop.

2. **For each failure**, dispatch the `failure-triager` agent with: `spec`, `failing_step`,
   `error`, and the `trace` / `error_context` paths. The agent classifies as one of
   `locator-drift` / `flaky-timing` / `wrong-assertion` / `product-bug` **with cited evidence**
   (never product-bug without a hard signal).

3. **Group** verdicts and recommend the fix path per the triager contract:
   - locator-drift → re-resolve THAT step via `locator-resolver` / `motadata-explorer`; prefer the
     stored `fallback` (see `framework/playwright/resolver.js` + `framework/playwright/selectors.js`).
   - flaky-timing → replace the brittle wait with a smart wait (`toBeVisible` / `expect.poll` / `waitForURL`).
   - wrong-assertion → the manual-case `expected` is likely wrong; stop and flag.
   - product-bug → emit a bug report with the trace link; recommend a Jira sub-task.

4. **Summarize**: a table of `spec › test | class | evidence | action`, most-severe first.

## Rules
- One trace = one verdict; no batch guessing.
- Quarantine, never mask. Do not silence a failing test to make the run green.
