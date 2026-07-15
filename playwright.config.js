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
  },
  {
    name: 'settings_03_netroute',
    testMatch: ['tests/Settings/03-NetrouteSettings/*.spec.js'],
  },
  {
    name: 'settings_04_policy',
    testMatch: ['tests/Settings/04-PolicySettings/**/*.spec.js'],
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
}
];

const dashboardProjects = [
  {
    name: 'dashboard_01_server_and_apps',
    testMatch: ['tests/Dashboard/01-ServerAndApps/*.spec.js'],
  },
  {
    name: 'dashboard_02_network',
    testMatch: ['tests/Dashboard/02-Network/*.spec.js'],
  },
  {
    name: 'dashboard_03_virtualization',
    testMatch: ['tests/Dashboard/03-Virtualization/*.spec.js'],
  },
  {
    name: 'dashboard_04_database',
    testMatch: ['tests/Dashboard/04-Database/*.spec.js'],
  },
  {
    name: 'dashboard_05_service_check',
    testMatch: ['tests/Dashboard/05-ServiceCheck/*.spec.js'],
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
   * Fire the SNMP-trap propagation batch at the VERY START of the run, and clean it up at the end.
   * The AIOps datastore flush is a fixed ~5-min floor before traps show in Trap Explorer; firing
   * here means that wait overlaps the whole suite, so TrapPropagation just VERIFIES later (no block).
   * Disable with TRAP_FIRE=0. (Harmless no-op if the trap env isn't configured.)
   */
  globalSetup: './tests/Settings/15-SNMPTrap/_helpers/global-trap-setup.js',
  globalTeardown: './tests/Settings/15-SNMPTrap/_helpers/global-trap-teardown.js',
  /*
   * Temporarily excluded from every `npx playwright test` run. The files and their
   * code are kept intact — they are just never collected/executed. Remove an entry
   * here to re-enable that spec.
   */
  testIgnore: [
    '**/Esxi13_Discovery.spec.js',
    '**/Windows_Cidr_RangeBased_Discovery.spec.js',
  ],
  /* Keep tests inside each file ordered unless a spec opts into parallelism. */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /*
   * Workers scale DYNAMICALLY with the machine instead of a fixed 4: '75%' uses a
   * fraction of the CPU cores, so a bigger box runs more spec FILES in parallel and a
   * smaller box stays safe — without ever pinning the CPU (25% headroom for the OS +
   * Chromium). This changes ONLY how many files run concurrently; each file is still
   * serial internally, so test logic is unaffected (0 impact on the test cases).
   *
   * The real ceiling for this suite is the SHARED Motadata server + per-file data
   * isolation, not local cores — so override per run with PW_WORKERS when needed:
   *   PW_WORKERS=8 npx playwright test   (server has spare capacity / push throughput)
   *   PW_WORKERS=4 npx playwright test   (pin back to the old behaviour)
   */
  workers: process.env.CI ? 5 : (process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : '55%'),
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
    ...[...settingsProjects, ...dashboardProjects, ...apmExplorerProjects, ...metricExplorerProjects, ...nccmProjects].map((project) => ({
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
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/user.json' },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
