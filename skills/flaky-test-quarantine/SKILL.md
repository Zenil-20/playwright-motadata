---
name: flaky-test-quarantine
description: Quarantine (never mask) a flaky ObserveOps spec once the failure-triager classifies it flaky-timing — skip-and-flag it out of the green path, register it with cited evidence + owner, and keep re-running it out-of-band until the smart-wait fix verifies. Use when a tests/regression spec fails intermittently and reports/failures.json shows no hard product-bug signal.
---

# Flaky-test quarantine (ObserveOps)

Quarantine is the last resort our `agents/debugger/prompt.md` (mt-failure-triager) reaches only
**after** it classifies a failure as `flaky-timing` and the orchestrator's **3-iteration heal
ceiling** is exhausted. It is a holding pattern, not a delete key — the spec stays in
`tests/regression/**`, keeps running, and blocks nothing on the green path until its smart-wait fix
is verified.

The one hard rule from our conventions: **quarantine-not-mask**. You never weaken an assertion,
loosen an `expect`, or delete a check to force green. That is a firing offense in the triager
prompt. You isolate the flaky spec, cite why, and fix the timing.

## When to use / When NOT

- **Use when:** a spec under `tests/regression/**` (44 specs) or `tests/scenarios/**` fails, the
  triager returns `class: flaky-timing` (element appears in a later trace snapshot than the action,
  transient network, or a navigation race), and 3 heal iterations did not stick.
- **Do NOT use for:** `product-bug` (has a hard signal — error toast / non-2xx / wrong state in the
  a11y tree → gated Jira sub-task, never quarantine); `locator-drift` (route to `mt-locator-resolver`
  + `resolver.js` fallback, not quarantine); `wrong-assertion` (the manual case's `expected` is wrong
  — fix the case, don't quarantine). Never quarantine a Discovery/NCCM async job under its real
  budget — provisioning waits legitimately run 8 min (`flow.js` uses `timeout: 480000`), so a <8-min
  "hang" is not flaky.

## Procedure (ObserveOps-specific)

1. Confirm the verdict is `flaky-timing` in the triager's output block and in the matching entry of
   `reports/failures.json` (failing spec, step, locator/assertion, `confidence`, `fallback`).
2. Register the quarantine next to the failure record — spec path, failing step, cited trace
   evidence (the literal snapshot/log string the triager pulled), root cause = `flaky-timing`,
   owner (module owner of the screen under test), and the `knowledge/product/<Module>/<Screen>.md`
   the spec targets. No entry without a cited string — same provenance rule as the triager.
3. Skip-and-flag, don't ignore: mark the spec with a `test.skip`/annotation carrying the quarantine
   reason + ticket so anyone reading the file sees why. Keep it in the suite so a future run can
   detect it recovered.
4. Apply the real fix = the smart-wait policy (see `retry-resilience-testing`): replace the brittle
   assumption with `expect(locator).toBeVisible({ timeout })` / `expect.poll` / `waitForURL` as in
   `framework/playwright/flow.js` (avatar-visible login check at line 22, `getByText(ip).first()` at
   line 109). Never a bare `waitForTimeout` and never `networkidle`.
5. Verify before release: re-run the previously flaky spec many times (isolated **and** in the full
   `tests/regression` suite — AntDesign state leakage between drawer/popover flows only shows under
   ordering). Only when it is stable across repeated runs do you remove the quarantine flag.
6. Hand a persistable note to `mt-knowledge-updater` (a verified wait pattern for that screen); if
   the same screen quarantines 3+ times across runs, recommend re-harvesting that whole screen in
   `knowledge/locators/selector-cookbook.md`.

## Rules & anti-patterns (tie to our conventions)

- **Quarantine-not-mask.** Isolating a spec is allowed; weakening its assertion to pass is forbidden.
- **Evidence or it didn't happen.** Every quarantine carries a cited literal string from the trace
  (`source: trace`), mirroring the triager's no-guess rule.
- **No permanent retries on the green path.** Retries live only in the out-of-band quarantine run
  while the fix is in progress — never baked into the main regression config to hide flakiness.
- **No global timeout inflation.** Bumping every timeout slows all 44 specs and hides the real race.
  Fix the one wait, using a smart-wait tied to the actual UI condition.
- **Every quarantine has an owner and a bound.** An unowned, unbounded quarantine is a silent
  deletion of coverage. Escalate a spec quarantined too long without a fix.
- **Never quarantine a product-bug to get green.** If a hard signal exists, it's a bug report, not a
  quarantine — cross-check `knowledge/known_issues/customer-issue-kb.md` first.

Adapted from qaskills/seed-skills/flaky-test-quarantine
