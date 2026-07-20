---
name: empty-state-reviewer
description: Audit ObserveOps "No data found" empty states — APM/RUM explorers, data grids, dashboards, filtered-to-empty, permission-restricted, and error-vs-empty — against the screen docs. Use to verify a screen degrades gracefully when data is absent.
---

# Empty-state review for ObserveOps

ObserveOps is data-driven: nearly every explorer, grid, and dashboard renders a **"No data found"**
empty state when the selected range/filter/license yields nothing. Example, cited from
`knowledge/product/APM/explorer.md` §6: _"APM licensed; trace data exists in the selected range (else
empty grid / 'No data found')."_ The job is to confirm each data-dependent view shows an **intentional**
empty state — distinct from an error, a permission block, or an infinite spinner.

## When to use
- Auditing an explorer/grid/dashboard screen doc for its empty behavior (APM, RUM, Metric/Log Explorers,
  Alerts, Monitors, Reports).
- After a filter/time-range change that legitimately yields zero rows.
- When a fresh/unlicensed tenant shows blank screens during onboarding.

## When NOT
- Not for error states caused by a backend failure — those must read as errors (retry), not "No data found".
- Don't audit a screen still loading; wait on our smart-wait (target `count()===1`), never `networkidle`.

## The five empty triggers (test each per data-dependent screen)
1. **No data yet** — fresh tenant / never-collected metric. Expect "No data found", not a broken grid.
2. **Filtered to empty** — a time range or filter with no matches. Expect the same or a filter-aware
   message plus a way to widen the range/clear the filter; results return when cleared.
3. **License/feature gated** — e.g. APM not licensed (explorer §6). Expect a gating message, not silent blank.
4. **Permission-restricted** — RBAC-limited user. Expect a permission message, not the generic empty state,
   and it must not leak hidden object names/counts.
5. **Error-caused** — API abort/500/timeout. Must render an **error** state (retry), clearly not "No data found".

## Procedure (ObserveOps-specific)
1. **Navigate** with `framework/playwright/flow.js` (avatar-visible login, smart wait) to the screen's `route:`.
2. **Force each trigger** — for filtered-empty, set a time range far in the past/future or an impossible
   filter; for license/permission, run as the appropriate tenant/role (coordinate with the `seed-data` skill).
3. **Assert the empty surface, not a blank.** The grid should keep its **column headers** and show a
   centered **"No data found"** message/illustration inside the grid body (AntDesign/Kendo empty overlay),
   not an empty white box or a stuck `.ant-spin` spinner.
   ```js
   await expect(page.getByText(/no data found/i)).toBeVisible();
   await expect(page.locator('.ant-spin-spinning')).toHaveCount(0); // not stuck loading
   ```
4. **Differentiate error from empty.** Block the screen's API (`page.route(... route.abort())`) and assert
   the result reads as an error with a retry affordance — NOT "No data found".
5. **Contrast in both themes.** Empty-state illustrations must render in Light and Dark (see `dark-mode-testing`).
6. **Reverse transition.** After data appears (seed a monitor/trace), revisit and confirm the empty state
   is replaced by content — not a cached "No data found".
7. **Record** any wrong/missing empty state in the screen doc §10/§11 (Known Bugs / Edge Cases).

## Screens to prioritize (cite the docs)
- `knowledge/product/APM/explorer.md`, `APM/services.md`, `APM/error-tracker.md` — trace/service grids.
- `knowledge/product/RUM/rum.md` — RUM sessions/pages.
- Metric/Log Explorers, Alerts grid, Monitors inventory, Reports — all "No data found" surfaces.

## Rules & anti-patterns
- "Empty is not broken" — a stuck spinner or a raw blank is a bug, not an empty state.
- Never conflate the five triggers into one generic message; license/permission/error each need distinct copy.
- Don't fabricate empty-state copy in a screen doc — record only what the live app / screenshot shows; cite it.

Adapted from qaskills/seed-skills/empty-state-reviewer.
