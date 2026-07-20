---
name: release-readiness-checklist
description: Build a go/no-go scorecard for an ObserveOps test run, gated on our promotion contract (tests/generated → tests/regression) and the governance/validation runGate gates. Use before promoting a generated suite or signing off a regression cycle.
---

# Release Readiness Checklist (ObserveOps)

Decide **go / no-go** for promoting an ObserveOps suite, using explicit gates rather than vibes. In our pipeline "release readiness" has a concrete meaning: a suite in `tests/generated/` (awaiting promotion) is promoted into `tests/regression/` (source of truth) **only** as the daily pipeline's final stage, and only after the executable governance gates pass. This skill assembles that scorecard.

## When to use / When NOT
- **Use when:** the pipeline is about to promote `tests/generated/**` → `tests/regression/**`, or a QA lead is signing off a regression cycle for a build (e.g. ObserveOps 8.2.6).
- **Do NOT use for:** authoring cases (`mt-testcase-generator`), fixing failures (`mt-debugger`), or per-test locator work. This produces a decision, not code.

## The promotion gate (what "ready" means here)
Promotion is blocked unless **every** applicable `governance/validation` gate returns `pass:true`. Run them the way `mt-reviewer` does — `runGate(stageKey, ctx)` via `governance/validation/cli.mjs`:

| Gate (governance/validation) | Checks | Blocks promotion on |
|---|---|---|
| `requirement.js` | source ticket / AC present & normalized | missing requirement |
| `locators.js` | every step has a verified `count()===1` locator | any invented / ambiguous locator |
| `assertions.js` | assertions non-trivial, expected values harvested not guessed | assertion-free or memory-authored expected |
| `business-rules.js` | steps honor `knowledge/product/<Module>/<Screen>.md` §Business Rules/§Validations | contradicted rule |
| `automation-review.js` | smart-waits only (no `networkidle`/blind `waitForTimeout`), no positional XPath | brittle pattern |
| `dedup.js` | not a duplicate of an existing regression case | duplicate |
| `coverage.js` | scenario maps to a canonical case / CSV matrix row | uncovered claim |

Any `pass:false` → the artifact is **quarantined, not masked**, and promotion is a **no_go**.

## Scorecard template
```markdown
# ObserveOps Release Readiness — <suite / build 8.2.6>
Candidate suite: tests/generated/<...>   → target: tests/regression/<...>
Run: workspace/<TICKET>/<run-id>/   ·   Decision: Pending

| Gate | Status | Threshold | Evidence | Owner |
|---|---|---|---|---|
| runGate 05_testcases | pending | all pass:true | governance/validation cli output | Reviewer |
| runGate 07_automation | pending | all pass:true | governance/validation cli output | Reviewer |
| Executor pass rate | pending | 100% of non-quarantined | reports/failures.json empty | Executor |
| Failure triage clear | pending | 0 open product-bug | debugger verdicts | QA lead |
| Flake / heal ceiling | pending | ≤3 heals/spec, 0 masked | run-manifest | QA lead |
| Coverage vs TFS | pending | no NEW gap | /coverage-audit + docs/COVERAGE.md | QA lead |
| Known-issue regressions | pending | KB regression pack green | customer-issue-kb.md ideas | QA lead |
| Sandbox state clean | pending | seed verified | seed-report.json | Sandbox |

## Sign-off
Reviewer: gates pass:true / QA lead: triage clear / decision owner + time
```

## Go / No-Go criteria (ObserveOps-specific)
1. `runGate('05_testcases')` and `runGate('07_automation')` return all `pass:true`.
2. `reports/failures.json` has **no** `product-bug` verdict left open (from `agents/debugger`).
3. No test was made green by masking — heal ceiling ≤3 iterations honored, quarantined tests flagged not deleted.
4. `/coverage-audit` shows **no new gap** vs the TFS surface tracked in `docs/COVERAGE.md` (a gap is closed by a CSV row, not by dropping a case).
5. The KB regression pack (from `knowledge/known_issues/customer-issue-kb.md` §QA implications — e.g. ifSpeed=0, poller-vs-policy math, topology 16-char parser 8.1.2) is green.
6. Sandbox was in a declared state (`seed-report.json`) so failures are real, not dirty-state noise.

## Rules & anti-patterns
- **A scorecard that can't produce no_go is theater.** Any `pass:false` gate is a hard block.
- **Trend + current, not one green run.** Cite the run-manifest history, not just today's pass.
- **Never lower a gate threshold during sign-off** to force promotion — that is masking.
- **Quarantine-not-mask** applies to the release decision too: ship the promotion minus the quarantined spec; do not weaken the spec to include it.

Adapted from qaskills/seed-skills/release-readiness-checklist
