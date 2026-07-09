---
name: failure-reporter-service
type: service
description: Custom Playwright reporter that writes a triage-ready JSON summary of failed tests for the failure-triager agent to consume.
tools: ["Playwright Reporter API", "Node fs"]
source: bridges observeops-qa "evidence on failure" with the failure-triager agent; doc format per rohitg00/awesome-claude-code-toolkit
---

# Failure Reporter Service

Turns Playwright results into `reports/failures.json` so the `failure-triager` agent (and the
`/analyze-failures` command) get structured input instead of a hand-fed trace path.

## Output (`reports/failures.json`)

Per failure: `spec`, `title`, `status`, `retry`, `failing_step`, `error` (truncated),
`trace`, `error_context`, `duration_ms`.

## Wiring

Registered in `playwright.config.js`:
`reporter: [['list'], ['html', {open:'never'}], ['./framework/core/reporters/failure-reporter.js']]`.
Keep `use.trace: 'on'` so every failure carries a trace the triager can read.

## Rules & Regulations

1. **Record, don't judge.** The reporter only captures evidence. Classification
   (locator-drift / flaky / wrong-assertion / product-bug) is the triager's job.
2. **Never swallow a failure.** It observes; it must not change test status or retries.
3. **Stable schema.** Downstream tooling depends on the field names above — extend, don't rename.
4. **Skips aren't failures.** `passed`/`skipped` are ignored on purpose.

## Before Completing a Task

- [ ] A forced failure produces a well-formed `reports/failures.json`.
- [ ] `reports/` stays gitignored (runtime artifact).
- [ ] Field names unchanged unless the triager contract is updated too.
