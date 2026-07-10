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
    name: 'settings_07_apm',
    testMatch: ['tests/Settings/07-APM/*.spec.js'],
  },
  {
  name: 'settings_08_slo',
  testMatch: ['tests/Settings/08-SLO/*.spec.js'],
},
{
  name: 'settings_09_proxy_server',
  testMatch: ['tests/Settings/09-SystemSettings/ProxyServerSettings.spec.js'],
},
{
  name: 'settings_10_integrations',
  testMatch: ['tests/Settings/10-Integrations/*.spec.js'],
},
{
  name: 'settings_11_rediscovery',
  testMatch: ['tests/Settings/11-rediscovery/*.spec.js'],
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
  /* Keep tests inside each file ordered unless a spec opts into parallelism. */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /*
   * Run the Settings projects independently so a failure in one folder
   * does not block the remaining folders from executing.
   */
  workers: process.env.CI ? 2 : 4,
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

  /* Configure ordered Settings projects on Chromium */
  projects: [...settingsProjects, ...dashboardProjects, ...apmExplorerProjects].map((project) => ({
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
