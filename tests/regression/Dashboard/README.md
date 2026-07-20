# Default Dashboard Automation

End-to-end coverage for Motadata's default/system dashboards (Dashboards >
&lt;category&gt; > &lt;dashboard&gt;) — the ones shipped locked with the product,
each with a stable system id, as opposed to per-device/custom dashboards.

## Structure

Folder numbering matches the EXACT sequence of the live dashboard tree (the
Dashboards side panel): Overview → Server → Network → SDN → Cloud →
Virtualization → HCI → Applications → Database → Log → Flow → APM. Dashboards
within each category file are also ordered to match the tree's displayed order.

- `tests/Dashboard/_core/dashboardSuite.constants.js` — shared constants (numeric-value
  pattern, kebab-menu item sets by widget type).
- `tests/Dashboard/_core/dashboard.widgetAssertions.js` — every widget-level
  assertion (tile/chart/grid render-or-empty, action menu, Full Screen, Export
  as CSV, hover tooltip). Dashboard-agnostic; a fix here applies to every
  dashboard suite at once.
- `tests/Dashboard/_core/dashboard.suiteFactory.js` — two entry points:
  - `createDefaultDashboardSuite(config)` — one dashboard, one login. Used for
    single-dashboard categories (e.g. APM).
  - `createDashboardCategorySuite(categoryName, [config, config, ...])` — ONE
    login shared across every dashboard in the category (each still gets its
    own nested describe + Navigate test). Use this whenever a category has
    more than one dashboard — it's the "one login per category" pattern that
    replaced the old "one login per dashboard" default.
- `tests/Dashboard/_core/dashboard.template.js` — blank starting point for a new
  dashboard. Not a runnable spec (no `.spec.js` extension).
- `tests/Dashboard/NN-<Name>/<Name>_Dashboard.spec.js` — one small config object
  per dashboard, passed into `createDashboardCategorySuite`/`createDefaultDashboardSuite`.
  Dashboard-specific tests that don't fit the generic shapes (e.g. APM's
  per-row TYPE-icon check) are added via the config's `extraTests` hook,
  sharing the same login session.

## Design notes

- Every widget title / column name in a config **must be verified live** against
  the actual dashboard before it's committed — see CLAUDE.md's cookbook-first /
  motadata-explorer workflow. The factory only generates test shape; it has no
  way to catch a wrong or fabricated widget title.
- Widgets are looked up by `[title="..."]` scoped to the nearest `.widget-view`
  — required because a floating Vue "DEV" widget-inspector overlay (present on
  some accounts/envs) duplicates every widget's title as plain text elsewhere
  on the page.
- A widget with no data for the selected range is a valid, expected state
  ("No data found") — reported as a named soft-failure per test (listing every
  empty widget by title) rather than a hard failure, so one empty widget
  doesn't hide the rest of the dashboard's results.
- Tests are NOT grouped with `.serial()` — an empty-widget report is expected
  and shouldn't abort the remaining tests in the file.
- A widget title that appears MORE THAN ONCE on the same dashboard (e.g.
  "Metric Analysis", "Flow Volume" on Flow Statistics) is excluded from every
  config on that dashboard — `widgetByTitle`'s `[title="..."]` lookup requires
  `count()===1`, which a duplicate can never satisfy.

## Fixed: multi-minute test hangs from a degrading long-lived page

Every test in a dashboard's suite used to share ONE page across the whole
describe block, navigating to the dashboard ONCE (in the "Navigate" test) and
never again. Reproduced live: after several tests' worth of scrolling/hovering/
kebab-menu interactions on that same page, widgets that were visible moments
earlier became unfindable (0-count) or stuck in a transient neither-value-nor-
empty-state — causing `expect.soft(...)` calls to burn their full timeout
repeatedly and the whole test to hit its 180s cap. This is what looked like the
"~50 min vs ~14 min" slowdown and the "~1.2 min action-menu hangs."

Fix: `dashboard.suiteFactory.js`'s internal `goToDashboard(page)` helper
re-navigates to the SAME dashboard URL (and waits for the widget grid to
mount) at the START of every generated test, not just the first one — giving
each test a freshly-mounted widget grid instead of accumulating interaction
state on one continuously-open page. Confirmed live: SDN's 7-test suite went
from a 12+-minute hang (killed) to a clean 56s run. Any `extraTests` hook gets
the same helper via `ctx.goToDashboard(page)` — call it at the top of each
custom test body (see APM's per-row TYPE-icon check for a worked example).

## Coverage levels

- **Precise** — tile/chart/grid + exact columns + action-menu, verified against
  live data. The strongest coverage; requires the dashboard's widgets to be
  populated on the environment when the config was built.
- **Presence** (`widgetPresence`) — kind-agnostic smoke check: navigate loads and
  every widget panel mounts + renders. This is the honest maximum for a
  dashboard whose widgets are all empty on the current environment (no data to
  verify populated structure against). Upgrade to precise checks when the suite
  is later run against a server that actually monitors that tech.

Every built suite includes `widgetPresence` for full-coverage smoke plus precise
checks layered on wherever data was available.

## Status (built & registered)

Verified live — Server/Network(minus Aruba)/Overview/Database(minus MySQL)/
Applications(minus Apache HTTP)/Log(Log Statistics, Windows Log Analysis)/Flow
(Flow Summary)/Cloud(Azure)/Virtualization(Hyper-V) on **172.16.8.218** (build
8.2.6.1), 2026-07-10. Everything else (all of SDN/HCI, Aruba Wireless, AWS
Cloud, Citrix Xen, VMWare, Apache HTTP Overview, MySQL Overview, 7 Log
dashboards, Flow Statistics) discovered and verified live on **172.16.15.68**
(build 8.2.6), 2026-07-13 — this is now the authoritative environment.

| # | Category | Dashboards (tree order) | Coverage |
|---|---|---|---|
| 01 | Overview | Alert Summary (precise charts + presence), Performance Summary (precise) | Precise + presence |
| 02 | Server | Linux Server Overview, Server Overview, Windows Server Overview | Precise |
| 03 | Network | Aruba Wireless (precise, .68), Cisco Wireless, Network Overview, Ruckus Wireless | Precise |
| 04 | SDN | Cisco Catalyst SD-WAN | Mixed (tiles/grids precise; 2 donut/heatmap widgets presence-only) |
| 05 | Cloud | AWS Cloud (5 tiles precise, rest presence), Azure Cloud (presence — empty on .218) | Mixed |
| 06 | Virtualization | Citrix Xen (precise), Hyper-V (presence — empty on .218), VMWare (precise) | Mixed |
| 07 | HCI | Nutanix | Precise |
| 08 | Applications | Apache HTTP Overview (precise charts), Apache Tomcat/IIS/Nginx (presence), RabbitMQ Overview (precise) | Mixed |
| 09 | Database | MySQL Overview, Oracle DB Overview, PostgreSQL Overview | Precise |
| 10 | Log | Fortinet-Traffic/UTM Analysis, Linux Log Analysis, Log Statistics, Palo Alto-Config/Threat/Traffic Analysis (all precise charts/grids/tiles), SonicWall-Traffic Analysis (presence — empty on .68), Windows Log Analysis (presence — empty on .218) | Mixed |
| 11 | Flow | Flow Statistics (precise), Flow Summary (precise charts + presence) | Precise + presence |
| 12 | APM | APM Statistics | Precise |

Excluded from every category (confirmed custom/test dashboards visible in the
same tree nodes, NOT default/system dashboards): `QA_TEST_Dashboard_Feature_01`,
`test`, `timestamp`, `Copy of VMWare`, `dsad`, `Copy of Flow Summary`, `aaa`,
`APM_Test`, `gghj`.

## Parallelism: `--workers=3`

`npm run test:dashboard` runs with `--workers=3` — a CLI flag, not a
`playwright.config.js` change, so the repo-wide `workers: '55%'` default is
untouched for every other suite. This value is empirically justified, not
arbitrary; measured on the same dev machine running the full 36-dashboard
suite (172.16.15.156, build 8.2.6):

| Workers | Total time | Result |
|---|---|---|
| 1 | ~19–30 min | Fully reliable |
| 2 | fast, clean | Fully reliable |
| **3** | **~9 min** | **Fully reliable — all 36 dashboards accounted for, 0 crashes** |
| 4 | ~7 min | 8 dashboards skipped: a category's `beforeAll` (shared login) crashed under CPU contention from 4 simultaneous Chromium instances |

3 is the highest worker count that ran clean with zero skipped/crashed tests
across repeated runs — 4 was faster but unreliable on this hardware (login or
initial navigation intermittently timed out under the extra concurrent
browser load). If this suite runs noticeably slower or shows unexplained
"did not run" / instant (0ms) `beforeAll` failures on a different machine
(e.g., a CI runner with fewer cores), that's this same ceiling reasserting
itself on weaker hardware — drop to `--workers=2` or `1` rather than assuming
a real regression. Conversely, a beefier runner may safely support more; re-run
the same measurement (a full suite pass at each worker count, checking the
HTML report's "Skipped"/"did not run" count is 0) before raising it.

## Known issue: trace-file I/O race between sequential dashboards

Running several dashboards back-to-back in one file with the repo's global
`trace: 'on'` occasionally hits a Playwright-internal race: `ENOENT` on
trace-artifact cleanup, or `"Tracing is already stopping"`, surfacing as an
instant (0ms) failure on whichever dashboard's `Navigate` test runs right
after another context's teardown. **This is non-deterministic, not a real bug
in the widget/assertion code** — re-running the same suite typically gets
further or passes cleanly.

## Widget kinds without a precise assertion helper yet

Covered by `widgetPresence` (they render, panel mounts) but NOT by a precise
check — build and verify a helper live before asserting their internals, same
pattern as `expectGridOrEmpty`/`expectChartOrEmpty`:
hexagon/heatmap grids (e.g. "Infrastructure Heatmap", "…Health Summary"),
multi-ring donut tiles (e.g. "…Availability", "Alert Count"), live alert-stream
lists ("Alert Stream"), and "…by Group" treemaps.

## Running

```bash
npx playwright test --project=dashboard_02_server --list   # dry-compile
npx playwright test --project=dashboard_02_server          # run
```

Each dashboard folder needs its own `playwright.config.js` project entry
(see the `dashboardProjects` array) — `testMatch: ['tests/Dashboard/NN-<Name>/*.spec.js']`.
