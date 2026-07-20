---
name: web-vitals-testing
description: Measure and guard Core Web Vitals (LCP, CLS, INP, TTFB) for Motadata ObserveOps's heaviest screens — Dashboards and the Metric/Log/APM/RUM/Flow/Trap Explorers — where large widget grids and big result sets stress load performance. Use to catch render/interaction regressions in the Vue 3 / Ant Design SPA under realistic data.
---
# Core Web Vitals Testing (ObserveOps Dashboards & Explorers)

ObserveOps is a Vue 3 + Ant Design SPA (build 8.2.6). Its performance-critical surfaces are the data-dense ones:
**Dashboards** (`knowledge/product/Dashboards/Dashboard.md` — many widgets rendering concurrently) and the
**Explorers** — Metric (`MetricExplorer/metric-explorer.md`), Log, APM (`APM/explorer.md`), RUM, Flow
(`Flow/explorer.md`), Trap, NCCM — which run queries returning large result sets into grids/charts. A widget grid
that reflows as tiles load, or an Explorer that janks when you apply a filter, is exactly what Core Web Vitals
catches. This skill measures LCP / CLS / INP / TTFB on those screens under realistic data and guards against
regressions.

## When to use / When NOT
- **Use** to baseline and regression-guard load/interaction performance on Dashboards and the Explorers,
  especially after a widget/chart change, a grid refactor, or a Vue/Ant Design upgrade.
- **Use** with **realistic data volume** — an empty tenant showing "No data found" everywhere gives a meaningless
  green; seed monitors/metrics/logs first (via `seed-data` / `mt-sandbox-state`) so widgets and grids actually
  render.
- **Do NOT** treat this as a lab microbenchmark — it complements the functional E2E, it doesn't replace it.
- **Do NOT** flake on cold caches or a busy shared lab; pin the env and warm the route, and run enough samples to
  compare medians, not a single noisy number.

## Procedure (ObserveOps-specific)
1. **Pick the screen + a realistic state.** e.g. a Dashboard with N widgets, or the Metric Explorer after
   applying a filter that returns a large series set. Log in via the framework's avatar-visible login and navigate
   with `framework/playwright/flow.js` (cookbook locators, no positional XPath).
2. **Capture the vitals in-page.** Collect the metrics from the real render:
   - **LCP** — when the largest widget/chart/grid paints (the dashboard's hero tile or the Explorer's result
     grid). This is the headline number for "did the screen load".
   - **CLS** — layout shift as widget tiles / grid rows stream in. Ant Design grids reflowing as data arrives is
     the prime CLS offender here.
   - **INP** — responsiveness to the first real interaction: apply an Explorer filter, change a time range,
     expand a widget. AIOps users live in these controls, so interaction latency matters more than initial load.
   - **TTFB** — the backend query time behind the Explorer (ties to `skills/api-contract-validator`: a slow
     Explorer is often a slow API, not a slow render).
   Read them from `PerformanceObserver` / the browser performance entries after the screen settles — using
   **smart waits** (await the LCP element / grid rows visible), never `networkidle` or a blind `waitForTimeout`.
3. **Assert against budgets, per screen.** Set a budget per screen (Dashboards and Explorers get looser budgets
   than a light Settings form) and fail when a metric regresses beyond it. Compare against a stored baseline so a
   gradual slowdown across builds is visible, not just a single threshold.
4. **Test both themes and the empty state.** ObserveOps has Light/Dark/Auto (Settings → My Account → UI
   Preference) — dark-mode chart re-theming can shift LCP/CLS. Also measure a "No data found" empty state so an
   empty-screen fast path isn't mistaken for good loaded-state performance.
5. **Record the numbers with provenance.** Store results with the build (8.2.6), screen, data volume, and theme so
   comparisons are apples-to-apples; a metric without its data-state context is meaningless.

## Rules & anti-patterns (tie to our conventions)
- **Realistic data or it's noise.** Vitals on an empty tenant are a false pass — seed state first (max coverage,
  min automation still applies: one data-driven perf scenario × several screens/volumes).
- **Smart waits only.** Await the LCP element or grid rows; never `networkidle`/blind sleeps — they corrupt the
  timing you're trying to measure.
- **Medians over single runs.** Sample enough to beat lab jitter; report a distribution, don't chase one number.
- **Budget per screen, baseline over time.** A dashboard is not a login form — give each screen its own budget and
  diff against the stored baseline to catch drift.
- **Separate render from backend.** A bad TTFB is a backend/API problem (hand to api-contract-validator), not a
  frontend fix — don't mis-file the regression.
- **No fabricated numbers.** Every metric carries its build/screen/volume/theme context; provenance always.

Adapted from qaskills/seed-skills/web-vitals-testing
