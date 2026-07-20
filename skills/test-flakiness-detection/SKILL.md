---
name: test-flakiness-detection
description: Decide whether an ObserveOps spec is genuinely flaky before quarantining it — separate flaky-timing from locator-drift, wrong-assertion, and product-bug using the failure-triager's trace-evidence rules, not a screenshot glance. Use when a tests/regression spec fails intermittently and you must classify the cause with a cited literal from the trace.
---

# Test-flakiness detection (ObserveOps)

Detection is classification, and in this repo classification is owned by
`agents/debugger/prompt.md` (mt-failure-triager). A single red run is **not** proof of flakiness — it
may be a real regression. Flakiness is one of four verdicts, and the triager may only reach it with
**cited evidence** pulled from the trace's `error-context.md` (the a11y tree with `ref=` ids), the
action log, and captured network — never from a screenshot or video.

The whole point: don't call a real bug "flaky" (that hides a regression) and don't call drift
"flaky" (that quarantines a spec a one-line locator fix would save). Both are firing offenses in the
triager prompt.

## When to use / When NOT

- **Use when:** a spec under `tests/regression/**` or `tests/scenarios/**` fails and you need to
  decide *which* of the four classes it is before acting; or when auditing repeat entries in
  `reports/failures.json` to spot a chronically flaky screen.
- **Do NOT use for:** re-resolving locators (`mt-locator-resolver`), writing wait patches
  (that's the fix, see `retry-resilience-testing`), or opening bug reports. This skill decides the
  class; other skills act on it.

## The 4-way classification (each REQUIRES a cited trace literal)

| Class | Hard evidence to cite | Route |
|---|---|---|
| **flaky-timing** | element present in a *later* trace snapshot than the failing action; transient network; navigation race | smart-wait fix → if 3 heal iterations fail, `flaky-test-quarantine` |
| **locator-drift** | strict-mode message showing >1 match, OR not-found while the a11y tree shows the control under a different role/name | `resolver.js` fallback, then re-resolve that step only (`mt-locator-resolver`) |
| **wrong-assertion** | target element is correct but the spec's `expected` ≠ the live value (cite BOTH) | fix the manual case's `expected`; re-harvest the real string |
| **product-bug** | a HARD signal: error-toast text, non-2xx network response, or wrong app state visible in the tree | STOP → gated bug report + Jira sub-task; cross-check `customer-issue-kb.md` |

**No-guess rule (inherited from the triager):** you may NOT classify `product-bug` without a hard
signal. Absent one, pick the likeliest test-side cause or escalate. Do NOT classify `flaky-timing`
just because a run went red — flaky requires the "appears in a later snapshot" evidence.

## Procedure (ObserveOps-specific)

1. Read the failing entry in `reports/failures.json`: spec path, failing step, locator/assertion,
   `confidence`, `fallback`.
2. Extract `error-context.md` from the run's trace under `workspace/<TICKET>/<run-id>/`. Read the
   a11y tree + action log + network. This is sufficient — do NOT load screenshots/video.
3. Locate the failing action; identify exactly what it targeted (role / name / scope). AntDesign
   dups (a `.ant-drawer-open` control also present in a `.ant-popover:visible`, or a `tr.k-master-row`
   checkbox vs. the thead select-all) usually read as **drift**, not flaky — check the strict-mode
   count before blaming timing.
4. Match the state against *Known Bugs* + *Validations* in `knowledge/product/<Module>/<Screen>.md`
   for the screen under test to tell documented behavior from regression.
5. Emit exactly one class with its cited literal. For a chronically flaky screen (same screen flaky
   3+ runs), recommend re-harvesting it in `knowledge/locators/selector-cookbook.md`.

## Rules & anti-patterns (tie to our conventions)

- **Provenance required.** Every verdict carries a literal string from the trace (`source: trace`).
- **Evidence before verdict; escalate when unsure.** Ambiguous between two classes with no deciding
  evidence → STOP and escalate with both candidates.
- **Discovery/NCCM async jobs are not flaky under budget.** `flow.js` waits up to 8 min
  (`timeout: 480000`) for provisioning; a slow-but-eventual job is expected behavior, not flakiness.
- **Detect from the trace, not the video.** Screenshots cost tokens and add nothing the a11y tree
  doesn't; the triager forbids them.
- **One class per failure; never reclassify the same failure twice** — if the first read was wrong,
  escalate rather than churn.

Adapted from qaskills/seed-skills/test-flakiness-detection
