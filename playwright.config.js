// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

// ---------------------------------------------------------------------------
// Named project groups (run one group with:  npx playwright test --project <name>)
// Regression specs live under tests/regression/; data-driven under automation/.
// ---------------------------------------------------------------------------
const REG = 'tests/regression';

const settingsProjects = [
  { name: 'settings_01_agent_monitoring', testMatch: [`${REG}/Settings/01-AgentMonitoringSettings/*.spec.js`] },
  { name: 'settings_02_discovery',        testMatch: [`${REG}/Settings/02-Discovery/*.spec.js`] },
  { name: 'settings_03_netroute',         testMatch: [`${REG}/Settings/03-NetrouteSettings/*.spec.js`] },
  { name: 'settings_04_policy',           testMatch: [`${REG}/Settings/04-PolicySettings/*.spec.js`] },
  { name: 'settings_05_runbook',          testMatch: [`${REG}/Settings/05-Runbook/*.spec.js`] },
  { name: 'settings_06_user_settings',    testMatch: [`${REG}/Settings/06-UserSettings/*.spec.js`] },
  { name: 'settings_08_slo',              testMatch: [`${REG}/Settings/08-SLO/*.spec.js`] },
  { name: 'settings_09_proxy_server',     testMatch: [`${REG}/Settings/09-SystemSettings/*.spec.js`] },
  { name: 'settings_10_integrations',     testMatch: [`${REG}/Settings/10-Integrations/*.spec.js`] },
  { name: 'settings_11_rediscovery',      testMatch: [`${REG}/Settings/11-rediscovery/*.spec.js`] },
  { name: 'settings_12_metric_plugin',    testMatch: [`${REG}/Settings/12-MetricPlugin/*.spec.js`] },
  { name: 'settings_13_Device_Monitoring',testMatch: [`${REG}/Settings/13-MonitorSettings/*.spec.js`] },
];

const dashboardProjects = [
  { name: 'dashboard_01_server_and_apps', testMatch: [`${REG}/Dashboard/01-ServerAndApps/*.spec.js`] },
  { name: 'dashboard_02_network',         testMatch: [`${REG}/Dashboard/02-Network/*.spec.js`] },
  { name: 'dashboard_03_virtualization',  testMatch: [`${REG}/Dashboard/03-Virtualization/*.spec.js`] },
  { name: 'dashboard_04_database',        testMatch: [`${REG}/Dashboard/04-Database/*.spec.js`] },
  { name: 'dashboard_05_service_check',   testMatch: [`${REG}/Dashboard/05-ServiceCheck/*.spec.js`] },
];

const metricExplorerProjects = [
  { name: 'metric_explorer_01_instance_kpi_anomaly', testMatch: [`${REG}/metricExplorer/Instance_KPI_Anomaly_Metric_Explore_Screen.spec.js`] },
  { name: 'metric_explorer_02_instance_kpi_compare',  testMatch: [`${REG}/metricExplorer/Instance_KPI_Compare_Metric_Explore_Screen.spec.js`] },
];

const nccmProjects = [
  { name: 'nccm_01_device_discovery', testMatch: [`${REG}/nccm/*.spec.js`] },
];

// Consolidated, data-driven suite (one script × many device rows).
// See tests/scenarios/Discovery_DataDriven.spec.js + tests/data/discovery-*.csv
const dataDrivenProjects = [
  { name: 'discovery_data_driven', testMatch: ['tests/scenarios/*.spec.js'] },
];

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '.',
  /* Run tests sequentially, not in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Single worker to ensure sequential execution */
  workers: 1,
  /* Test timeout - increase for slow networks, decrease for production */
  timeout: 120000,
  /* Reporters: html (people) + list (console) + failure-triage JSON (feeds the failure-triager agent) */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./framework/core/reporters/failure-reporter.js'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace - kept 'on' so the failure-triager always has a trace to read */
    trace: 'on',

    /* Ignore HTTPS errors for self-signed certificates */
    ignoreHTTPSErrors: true,
  },

  /* Ordered projects, all on Chromium */
  projects: [
    ...settingsProjects,
    ...dashboardProjects,
    ...metricExplorerProjects,
    ...nccmProjects,
    ...dataDrivenProjects,
  ].map((project) => ({
    ...project,
    use: { ...devices['Desktop Chrome'] },
  })),

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
