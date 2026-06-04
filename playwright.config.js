// @ts-check
import { defineConfig, devices } from '@playwright/test';

<<<<<<< Updated upstream
=======
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
    testMatch: ['tests/Settings/04-PolicySettings/*.spec.js'],
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

>>>>>>> Stashed changes
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
  // Custom test execution order for Settings module
testMatch: [
  'tests/Settings/01-AgentMonitoringSettings/*.spec.js',
  'tests/Settings/02-Discovery/*.spec.js',
  'tests/Settings/03-NetrouteSettings/*.spec.js',
  'tests/Settings/04-PolicySettings/*.spec.js',
  'tests/Settings/05-Runbook/*.spec.js',
  'tests/Settings/06-UserSettings/*.spec.js',
],
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
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace - 'on' always, 'retain-on-failure' only on failures */
    trace: 'on',

    /* Ignore HTTPS errors for self-signed certificates */
    ignoreHTTPSErrors: true,
  },

<<<<<<< Updated upstream
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
=======
  /* Configure ordered Settings projects on Chromium */
  projects: [...settingsProjects, ...dashboardProjects, ...metricExplorerProjects, ...nccmProjects].map((project) => ({
    ...project,
    use: { ...devices['Desktop Chrome'] },
  })),
>>>>>>> Stashed changes

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

