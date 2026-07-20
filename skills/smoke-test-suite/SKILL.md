---
name: smoke-test-suite
description: Build/maintain the ObserveOps golden-path smoke suite — login → discovery → provision → alert → dashboard — as a fast deploy-verification gate. Use to sanity-check a fresh build (8.2.6) before running the full data-driven regression.
---

# Smoke Test Suite (ObserveOps golden path)

A smoke suite answers one question fast: **is this ObserveOps build alive enough to bother testing further?** It exercises the single most load-bearing end-to-end path and nothing else. For Motadata ObserveOps that golden path is:

**login → network discovery → provision monitor → alert → dashboard**

This is the same spine the full data-driven suite rides on (`tests/scenarios/Discovery_DataDriven.spec.js` iterates the discover→credential→provision→verify flow over `tests/data/discovery-devices.csv`). The smoke suite runs it **once**, for one known-good device, with hard assertions at each hop — so a broken login, dead discovery worker, or empty dashboard is caught in under a couple minutes instead of deep in a 1000-row run.

## When to use / When NOT
- **Use when:** verifying a freshly deployed/upgraded build before the full regression, as a CI post-deploy gate, or as the first gate in the release-readiness scorecard.
- **Do NOT use for:** device-matrix breadth (that is the data-driven scenario over CSV rows — "max coverage, min automation"), per-field form coverage (`discovery-form-structure.csv`), or negative/edge cases. Smoke is depth-1 on the happy path only.

## The golden path (cite our screens + flow)
Reuse the real flow and selectors — **no literal selectors in the spec** (`framework/playwright/flow.js` over `framework/playwright/selectors.js`, resolved `count()===1`):

| Step | Screen doc | Smoke assertion |
|---|---|---|
| 1. Login | `knowledge/product/Global/Login.md` | avatar visible (our login check) — not just URL change |
| 2. Discovery | `knowledge/product/Settings/...Discovery` | discovery job reaches a terminal state (async — allow up to ~30s, don't call it flaky sooner) |
| 3. Provision | discovery → provision flow (`flow.js`) | the device appears as a monitor row (`tr.k-master-row`), no "No data found" |
| 4. Alert | `knowledge/product/Alerts/alerts.md` | a policy raises an alert of the expected severity (Critical/Major/Warning per §Business Rules) |
| 5. Dashboard | `knowledge/product/Dashboards/Dashboard.md` | the widget renders real data, not the empty state |

Drive it against a known-good device seeded by `mt-sandbox-state` (`seed-report.json`) so a smoke failure means the **product** broke, not the fixture.

## Patterns & conventions (must respect)
- **Cookbook-first locators**, role/label/`data-cy`, `count()===1`; scope Ant Design duplicates to `.ant-drawer-open` / `.ant-popover:visible` / `tr.k-master-row`.
- **Smart waits only** — `toBeVisible`, `expect.poll`, `waitForURL`. No `networkidle`, no blind `waitForTimeout`. Discovery is genuinely async; poll a terminal state, don't sleep.
- **Skip-with-reason, never false-fail** — if env vars for the smoke device are missing (see `missingEnv()` in the scenario spec), skip with a reason rather than red.
- **Theme-agnostic** — the path must pass in Light and Dark (Settings → My Account → UI Preference); assert on roles/text, not colors.
- Keep it **tiny and independent** — one file, no shared mutable state, runs in a couple minutes.

## Failure routing
A smoke failure feeds the same triage as any spec: the executor writes `reports/failures.json`, `agents/debugger` classifies (locator-drift / flaky-timing / wrong-assertion / product-bug) from the trace. A smoke `product-bug` is a **release blocker** — do not proceed to full regression until it clears.

## Anti-patterns
- Turning smoke into regression — adding device rows/edge cases here defeats the "fast gate" purpose; those belong in the data-driven scenario.
- `waitForTimeout` to "fix" discovery flake — poll the job state instead.
- Asserting on pixels/colors instead of the "No data found" vs data distinction.
- Masking a smoke failure to keep the pipeline green — quarantine and report.

Adapted from qaskills/seed-skills/smoke-test-suite
