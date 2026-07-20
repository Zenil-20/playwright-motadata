---
name: retry-resilience-testing
description: Make ObserveOps specs resilient the ObserveOps way — smart waits (no networkidle, no blind waitForTimeout) plus the resolver.js primary→fallback self-heal, so a spec survives slow AIOps async jobs and one AntDesign locator drifting without a full-suite retry crutch. Use when a spec is timing-fragile or you're adding a wait/heal to a flaky-timing fix.
---

# Retry & resilience testing (ObserveOps)

Resilience in this repo is **not** blanket test-runner retries. It is two specific mechanisms:

1. **Smart waits** — react to the actual UI condition, never to the clock. Policy lives in
   `framework/playwright/flow.js`: the login check waits on the avatar becoming visible
   (`expect(page.locator(S.login.avatar)).toBeVisible({ timeout: 120000 })`, line 22); a provisioned
   device is confirmed with `expect(page.getByText(ip).first()).toBeVisible({ timeout: 480000 })`
   (line 109). **No `networkidle`. No bare `waitForTimeout`.** A budgeted `toBeVisible` / `expect.poll`
   / `waitForURL` tied to a real condition is the only allowed wait.
2. **Locator self-heal** — `framework/playwright/resolver.js` tries the `primary` selector, and if it
   doesn't match exactly one element, heals to the `fallback`, enforcing the cookbook's mandatory
   `count()===1` (`resolve()` and `unique()`). This is our per-step resilience: one AntDesign control
   drifting doesn't fail the run if a verified fallback exists.

Together these replace the seed skill's circuit-breaker/bulkhead framing: our "circuit" is
resolver's primary→fallback; our "timeout pattern" is the smart-wait budget; our "retry" is the
triager's **single** targeted re-run, never a suite-wide retry loop.

## When to use / When NOT

- **Use when:** authoring/patching a wait on an AIOps flow that legitimately takes time (Discovery
  SNMP/SSH/WMI provisioning, NCCM backup, policy apply); giving a step a verified `fallback`; or
  turning a `flaky-timing` verdict into a durable fix.
- **Do NOT use for:** masking `locator-drift` with retries (re-resolve via `mt-locator-resolver`),
  masking a `product-bug` (that's a gated bug report), or adding runner-level retries to the green
  regression path to paper over flakiness.

## Procedure (ObserveOps-specific)

1. **Right budget, right condition.** Size the smart wait to the real operation: login/UI ~120s;
   discovery provisioning up to ~480s (match `flow.js`). Wait on the *outcome* the user would see
   (the gridcell/IP text, the success toast `S.profile.success_toast`), not on network idle.
2. **Give the step a fallback.** In `framework/playwright/selectors.js`, provide `primary` +
   `fallback` so `resolver.js` can heal. Scope AntDesign duplicates to `.ant-drawer-open`,
   `.ant-popover:visible`, or `tr.k-master-row` so both candidates still satisfy `count()===1`.
3. **Assert uniqueness.** Use `unique(scope, spec, expect)` from `resolver.js` for controls that must
   match exactly one element in the required screen state (prevents strict-mode flakiness).
4. **Retry is targeted, not global.** When the triager returns `flaky-timing`, its action is "patch
   the wait, retry once" — honor that and the 3-iteration heal ceiling. Do not add `retries` to the
   whole `tests/regression` config.
5. **Verify the resilience holds.** Re-run the patched spec repeatedly (isolated + in-suite) before
   declaring it fixed; a wait that passes once under a warm cache is not proven.

## Rules & anti-patterns (tie to our conventions)

- **No `networkidle`, no blind `waitForTimeout`.** These are banned by our smart-wait policy; they
  pass on a fast machine and flake on a slow AIOps run.
- **Heal, don't retry-spam.** Per-step resilience is `resolver.js` primary→fallback; suite-wide
  retries only hide drift and race conditions.
- **A fallback must be verified, not invented.** Both `primary` and `fallback` must satisfy
  `count()===1` in the required state — a fabricated fallback is worse than none. Harvest via
  `motadata-explorer` / the cookbook if unknown.
- **Budget generously but bound it.** An 8-minute discovery wait is correct; an unbounded wait hides
  a genuine hang. Every wait has an explicit `timeout`.
- **Don't resilience-wrap a real bug.** If the failure is a non-2xx or an error toast, no wait or
  fallback fixes it — route to a bug report.

Adapted from qaskills/seed-skills/retry-resilience-testing
