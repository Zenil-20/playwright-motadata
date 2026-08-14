// @ts-check
import { defineConfig, devices } from '@playwright/test';

const settingsProjects = [
  {
    name: 'settings_01_agent_monitoring',
    testMatch: ['tests/Settings/01-AgentMonitoringSettings/*.spec.js'],
  },
  {
    name: 'settings_02_discovery',
    testMatch: ['tests/Settings/02-Discovery/*.spec.js'],
    // The broad Ping IP-range sweep (172.16.15.1-255) can disturb the other
    // discoveries, so it is carved out into settings_02_discovery_ping_last and
    // gated to run AFTER this whole project finishes. Keep the globally-ignored
    // specs excluded here too, since a project-level testIgnore overrides global.
    testIgnore: [
      '**/Ping_IpRange_Discovery.spec.js',
      '**/Windows_Cidr_RangeBased_Discovery.spec.js',
    ],
  },
  {
    // Runs LAST: depends on the full discovery project, so Playwright completes
    // every other 02-Discovery spec (across workers, in parallel) before starting
    // this broad ping-range sweep.
    name: 'settings_02_discovery_ping_last',
    testMatch: ['tests/Settings/02-Discovery/Ping_IpRange_Discovery.spec.js'],
    dependencies: ['settings_02_discovery'],
  },
  {
    name: 'settings_03_netroute',
    testMatch: ['tests/Settings/03-NetrouteSettings/*.spec.js'],
  },
  {
    name: 'settings_04_policy',
    testMatch: ['tests/Settings/04-PolicySettings/**/*.spec.js'],
    // The APM policy specs need the 07-APM service registered AND its trace data
    // propagated first, so they are carved out into settings_04_policy_apm (which
    // depends on settings_07_apm). Exclude them here so they don't also run in this
    // project without that ordering guarantee.
    testIgnore: ['**/APM/*.spec.js'],
  },
  {
    // APM policy specs. MUST run after 07-APM registration so the trace-derived
    // counters (service.span.duration.us, service.trace.error.rate, …) exist. The
    // in-test selectApmCounter() then smart-waits (up to 10 min) for the ~4-5 min
    // propagation floor before selecting the counter. This dependency guarantees the
    // ordering on a plain `npx playwright test` — registration finishes, then these run.
    name: 'settings_04_policy_apm',
    testMatch: ['tests/Settings/04-PolicySettings/APM/*.spec.js'],
    dependencies: ['settings_07_apm'],
  },
  {
    name: 'settings_05_runbook',
    testMatch: ['tests/Settings/05-Runbook/*.spec.js'],
  },
  {
    name: 'settings_06_user_settings',
    testMatch: ['tests/Settings/06-UserSettings/*.spec.js'],
  },
  {
    name: 'settings_07_apm',
    testMatch: ['tests/Settings/07-APM/*.spec.js'],
  },
  {
  name: 'settings_08_slo',
  testMatch: ['tests/Settings/08-SLO/*.spec.js'],
},
{
  name: 'settings_09_proxy_server',
  testMatch: ['tests/Settings/09-SystemSettings/*.spec.js'],
},
{
  name: 'settings_10_integrations',
  testMatch: ['tests/Settings/10-Integrations/*.spec.js'],
},
{
  name: 'settings_11_rediscovery',
  testMatch: ['tests/Settings/11-rediscovery/*.spec.js'],
},
{
  name: 'settings_12_metric_plugin',
  testMatch: ['tests/Settings/12-MetricPlugin/*.spec.js'],
},
{
  name: 'settings_13_Device_Monitoring',
  testMatch: ['tests/Settings/13-MonitorSettings/*.spec.js'],
},
{
  name: 'settings_14_real_user_monitoring',
  testMatch: ['tests/Settings/14-RealUserMonitoring/*.spec.js'],
},
{
  name: 'settings_15_snmp_trap',
  testMatch: ['tests/Settings/15-SNMPTrap/*.spec.js'],
  // Live-server suite: auto-retry transient network blips (ERR_NETWORK_CHANGED / connection
  // timeouts to 151) so an infra hiccup during a long run doesn't fail an otherwise-green test.
  retries: 2,
},
{
  name: 'settings_16_flow',
  testMatch: ['tests/Settings/16-Flow/*.spec.js'],
  // Live-server suite driving a real UDP flow pipeline: the same transient-blip retry rationale as
  // the trap project. Note the retries interact with the ingest window — a retried propagation test
  // re-polls rather than re-waiting, because the traffic was already generated at globalSetup.
  retries: 2,
}
];

// Per-device monitor dashboards (moved from tests/Dashboard → tests/Monitors).
const monitorsProjects = [
  {
    name: 'monitors_01_server_and_apps',
    testMatch: ['tests/Monitors/01-ServerAndApps/*.spec.js'],
  },
  {
    name: 'monitors_02_network',
    testMatch: ['tests/Monitors/02-Network/*.spec.js'],
  },
  {
    name: 'monitors_03_virtualization',
    testMatch: ['tests/Monitors/03-Virtualization/*.spec.js'],
  },
  {
    name: 'monitors_04_database',
    testMatch: ['tests/Monitors/04-Database/*.spec.js'],
  },
  {
    name: 'monitors_05_service_check',
    testMatch: ['tests/Monitors/05-ServiceCheck/*.spec.js'],
  },
];

/*
 * Default/system feature dashboards (createDashboardCategorySuite framework).
 *
 * NO RETRIES on the dashboard projects — deliberate, unlike settings_15_snmp_trap,
 * settings_16_flow and reports above. A retry makes a red result ambiguous: you can no longer
 * tell "this passed" from "this failed once and got a second go", and a dashboard result is
 * meant to be a straight statement about what the product did.
 *
 * The consequence is real and must be managed rather than ignored: a transient blip on the AIOps
 * host now fails a dashboard outright. Measured on 172.16.15.86, 2026-08-14, at --workers=3:
 * seven infra-caused failures in one run (three 0ms `beforeAll` crashes, one worker OOM
 * `code=134`, one 5-minute page hang, two 60s load timeouts) — every one of which recovered on
 * its retry, i.e. none was a product problem.
 *
 * Without retries the mitigation is CONCURRENCY, not tolerance. Those failures were host
 * resource exhaustion (the same OOM that killed a plain `--list` on this machine). Run the
 * dashboard suite at --workers=1 or 2; see tests/Dashboard/README.md.
 */
const dashboardProjects = [
  {
    name: 'dashboard_01_overview',
    testMatch: ['tests/Dashboard/01-Overview/*.spec.js'],
  },
  {
    name: 'dashboard_02_server',
    testMatch: ['tests/Dashboard/02-Server/*.spec.js'],
  },
  {
    name: 'dashboard_03_network',
    testMatch: ['tests/Dashboard/03-Network/*.spec.js'],
  },
  {
    name: 'dashboard_04_sdn',
    testMatch: ['tests/Dashboard/04-SDN/*.spec.js'],
  },
  {
    name: 'dashboard_05_cloud',
    testMatch: ['tests/Dashboard/05-Cloud/*.spec.js'],
  },
  {
    name: 'dashboard_06_virtualization',
    testMatch: ['tests/Dashboard/06-Virtualization/*.spec.js'],
  },
  {
    name: 'dashboard_07_hci',
    testMatch: ['tests/Dashboard/07-HCI/*.spec.js'],
  },
  {
    name: 'dashboard_08_applications',
    testMatch: ['tests/Dashboard/08-Applications/*.spec.js'],
  },
  {
    name: 'dashboard_09_database',
    testMatch: ['tests/Dashboard/09-Database/*.spec.js'],
  },
  {
    name: 'dashboard_10_log',
    testMatch: ['tests/Dashboard/10-Log/*.spec.js'],
  },
  {
    name: 'dashboard_11_flow',
    testMatch: ['tests/Dashboard/11-Flow/*.spec.js'],
  },
  {
    name: 'dashboard_12_apm',
    testMatch: ['tests/Dashboard/12-APM/*.spec.js'],
  },
];

const apmExplorerProjects = [
  {
    name: 'apm_explorer_services',
    testMatch: ['tests/APM_Explorer/Services/*.spec.js'],
  },
];

const metricExplorerProjects = [
  {
    name: 'metric_explorer_01_instance_kpi_anomaly',
    testMatch: ['tests/metricExplorer/Instance_KPI_Anomaly_Metric_Explore_Screen.spec.js'],
  },
 {
    name: 'metric_explorer_02_instance_kpi_compare',
    testMatch: ['tests/metricExplorer/Instance_KPI_Compare_Metric_Explore_Screen.spec.js'],
 }
];

const nccmProjects = [
  {
    name: 'nccm_01_device_discovery',
    testMatch: ['tests/nccm/*.spec.js'],
  }
];

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /*
   * Start every latency-bound ingest at the VERY START of the run, and clean it all up at the end.
   * Playwright allows only ONE globalSetup, so these aggregate the per-suite steps:
   *
   *   - SNMP trap : fires the trap batch (fixed ~5-min datastore flush before Trap Explorer shows it).
   *                 Disable with TRAP_FIRE=0.
   *   - Flow      : starts the flow batch (~5-min aggregation window before Flow Explorer shows it —
   *                 measured 294s with the window set to 3 min). Disable with FLOW_FIRE=0.
   *
   * Firing here means each wait overlaps the whole suite, so the propagation specs just VERIFY later
   * instead of blocking. Both steps are guarded and are harmless no-ops when their env isn't wired.
   */
  globalSetup: './tests/fixtures/global-setup.js',
  globalTeardown: './tests/fixtures/global-teardown.js',
  /*
   * Temporarily excluded from every `npx playwright test` run. The files and their
   * code are kept intact — they are just never collected/executed. Remove an entry
   * here to re-enable that spec.
   */
  testIgnore: [
    '**/Windows_Cidr_RangeBased_Discovery.spec.js',
  ],
  /* Keep tests inside each file ordered unless a spec opts into parallelism. */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /*
   * SINGLE USER (1 worker) is the default EVERYWHERE — local and pipeline alike.
   * The whole suite drives ONE shared Motadata server through ONE login (admin), so a
   * single worker means exactly one concurrent session: no competing admin logins, no
   * cross-file data races on shared entities (monitors, policies, discoveries), and each
   * spec sees the server in the state the previous spec left it. That is the reproducible
   * baseline we publish results from.
   *
   * Deliberately NOT branched on process.env.CI. If the pipeline ran a different worker
   * count than a developer's machine, a green local run would tell you nothing about CI —
   * the concurrency is the single biggest source of behaviour difference in this suite.
   *
   * Override per run when the box AND the server genuinely have spare capacity:
   *   PW_WORKERS=4 npx playwright test   (previous parallel behaviour)
   *   PW_WORKERS=8 npx playwright test   (aggressive — watch server push throughput)
   *
   * Note: specs that opt into `mode: 'parallel'` (report-validation, report-creation-matrix,
   * RestApi_ServiceCheck_Discovery) collapse to serial at 1 worker. Parallel mode only grants
   * permission to spread across workers; it cannot create them. The REPORT_CONCURRENCY /
   * REPORT_EXPORT_CONCURRENCY slot gates likewise cap out at 1 in flight, so they need no change.
   */
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 1,
  /* Test timeout - increase for slow networks, decrease for production */
  timeout: 120000,
  /* Reporters:
   *  - 'html'  : the standard Playwright report for the WHOLE run (every suite),
   *              with the full per-test trace — open with `npx playwright show-report`.
   *  - report-regression: the QA report for the REPORT MODULE only. It self-filters
   *              to tests under tests/Reports, so running the full framework (or just
   *              the reports project) always produces test-results/report-regression/
   *              index.html; running only other suites leaves it untouched.
   */
  reporter: [['html'], ['./tests/Reports/_core/html-reporter.js']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace - 'on' always, 'retain-on-failure' only on failures */
    trace: 'on',

    /* Ignore HTTPS errors for self-signed certificates */
    ignoreHTTPSErrors: true,
  },

  /* Configure ordered Settings projects on Chromium */
  projects: [
    /* One-time login for the report-regression suite. Writes storageState so the
     * 114 parallel per-report tests all start authenticated (tests/Reports/_core/
     * auth.setup.js). Only the `reports` project depends on it, so other suites
     * are unaffected. */
    {
      name: 'setup',
      testMatch: /tests[\\/]Reports[\\/]_core[\\/]auth\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    ...[...settingsProjects, ...monitorsProjects, ...dashboardProjects, ...apmExplorerProjects, ...metricExplorerProjects, ...nccmProjects].map((project) => ({
      ...project,
      use: { ...devices['Desktop Chrome'] },
    })),
    /* Report regression: validate every report + create-and-validate. Reuses the
     * setup login via storageState. report-validation opts into parallel mode so
     * it fans out across workers. */
    {
      name: 'reports',
      testMatch: ['tests/Reports/*.spec.js'],
      dependencies: ['setup'],
      /*
       * Auto-retry transient INFRA failures, same rationale as settings_15_snmp_trap /
       * settings_16_flow above.
       *
       * Every report test drives a fresh browser context through a cold SPA boot, and the
       * long creation tests (polling runs ~5 min) occasionally lose the browser outright —
       * observed "Target page, context or browser has been closed" mid-navigation, i.e. a
       * Chromium crash under host memory pressure, not a product or locator problem. That
       * cost an otherwise-green 142-test run its only failure.
       *
       * Retries only rescue genuinely transient failures: a real defect (empty PDF, UI/export
       * disagreement, a report that never renders) reproduces on every attempt and still fails.
       *
       * ONE retry, not two. A reproducible failure pays the retry cost in full, and the long
       * creation tests are expensive: 2 retries turned a 5-min polling failure into a 44-min
       * one. One retry absorbs a genuine one-off crash without tripling the worst case.
       */
      retries: 1,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
        /*
         * Bound EVERY action in the report suite.
         *
         * With no actionTimeout, Playwright's auto-wait has no upper limit, so any element that
         * is present-but-not-clickable (a spinner or Ant toast covering it fails the
         * "receives events" check) makes the action wait until the TEST timeout. Measured: a
         * single "Export As PDF" click consumed 11 of a test's 12 minutes and then surfaced as
         * "locator.click: Test timeout exceeded", which reads like an export defect rather than
         * a stuck click.
         *
         * 60s is far above any legitimate action here (the slow parts — SPA boot, report render,
         * async PDF export — are explicit waits with their own budgets, not actions), so this
         * only ever truncates a genuine hang. Scoped to this project so no other suite changes.
         */
        actionTimeout: 60_000,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
