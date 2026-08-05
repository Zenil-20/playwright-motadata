/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * This software and associated documentation are the confidential and
 proprietary information of Motadata.
 *
 * Unauthorized use, reproduction, disclosure, or distribution of this
 * material is strictly prohibited.
 *
 * You shall use this software only in accordance with the terms of the
 * license agreement entered into with Motadata.
 *
 * Author  : Anant Awishkar
 * Created : 15 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';


dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Create Application Registration for APM Java, DotNet, NodeJS, Python, Ruby, PHP', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // Create a single browser context and page shared across all tests
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });

  // Registration is a hard `dependencies: ['settings_07_apm']` for settings_04_policy_apm
  // (playwright.config.js), so this whole file re-runs on every APM policy run. The backend
  // rejects a duplicate service name, so without this guard a second run fails registration
  // outright and blocks the policy suite behind it. Skip-if-exists makes it idempotent.
  async function isServiceRegistered(serviceName) {
    await page.locator("//input[@name='search-application-registration']").fill(serviceName);
    const serviceRow = page.locator('tr.k-master-row', {
      has: page.locator(`span:has-text("${serviceName}")`),
    });
    try {
      await expect(serviceRow).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Navigate to Application Registration', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('APM');
    await page.getByRole('link', { name: 'Application Registration', exact: true }).click();
  });

  test('Navigate to Application Registration and create Service for Java', async () => {
    const serviceName = "hibernatewithmysql";
    const path = "/root/APM/APM/HibernateWithMySQLExample/spring_boot_crud_example_2_0.0.1_SNAPSHOT.jar";

    test.skip(await isServiceRegistered(serviceName), `${serviceName} already registered`);

    await page.getByRole('button', { name: 'Application Registration', exact: true }).click();
    await page.locator("//input[@placeholder='Select Agent']").click();
    await page.locator("//input[@id='assign-monitor-search']").fill(process.env.APM_Agent);

    // Select APM Agent — scope to the agent-selection popup so we don't
    // also match rows from the main grid sitting behind the dropdown.
    const agentPopup = page.locator('.ant-popover.picker-overlay.grid-dropdown:not(.ant-popover-hidden)');
    const rows = agentPopup.locator('tr.k-master-row');
    // Verify only one agent row is present in the filtered popup. The popup opens with ALL
    // monitors unfiltered (e.g. 5 rows) and narrows to the search match asynchronously — the
    // default 5s expect timeout isn't always enough for that filter to converge, so it's raised
    // here (toHaveCount already auto-retries; this just gives it a realistic window).
    await expect(rows).toHaveCount(1, { timeout: 30_000 });
    // Get the agent name text
    const agentName = rows.locator('td').nth(2).locator('span.text-ellipsis');
    // Verify the agent name
    await expect(agentName).toHaveText(new RegExp(process.env.APM_Agent, 'i'));
    // Perform operation only after validation
    await rows.locator('input[type="checkbox"]').first().click();
    // Close the picker explicitly: checking the row does NOT auto-dismiss it, and closing the
    // drawer later while it's left dangling causes the NEXT drawer open to hang on this same
    // "Select Agent" input (confirmed live 04-08-2026 — root cause of the flaky toHaveCount race).
    await page.keyboard.press('Escape');
    await page.locator("//input[@placeholder='Enter your service name']").fill(serviceName);
    await page.locator("//input[@placeholder='/home/user/app/application.jar']").fill(path);
    await page.getByRole('button', { name: 'Apply Configuration', exact: true }).click();

    // To Verify the service is created successfully
    const notification = page.locator('.ant-notification-notice-with-icon');
 
    await expect(notification).toContainText('Success', {
      timeout: 60_000
      });
 
    await expect(notification).toContainText(
      'Trace Service created successfully',
      {
        timeout: 60_000
      }
    );

    // To Close the registration drawer
    const closeDrawerBtn = page.locator('button.ant-drawer-close');
 
    await expect(closeDrawerBtn).toBeVisible({
      timeout: 300_000 // 5 minutes
  });
 
    await closeDrawerBtn.click();

    await page.locator("//input[@name='search-application-registration']").fill(serviceName);

    const serviceRow = page.locator('tr.k-master-row', {
  has: page.locator(`span:has-text("${serviceName}")`)
});
// Assert row is visible
await expect(serviceRow).toBeVisible({
  timeout: 60_000
});

  });


  // ---------------------------------------------------------------------------
  // Shared helpers for the remaining language flows. Same shape as the Java
  // test above: pick the agent, pick the language tile, fill service name
  // (and optional path), apply, verify success + grid row.
  // ---------------------------------------------------------------------------

  const LANGUAGE_ICONS = {
    dotnet: 'svg[data-icon="dotnet"]',
    php: 'svg[data-icon="php"]',
    nodejs: 'svg[data-icon="nodejs"]',
    python: 'svg[data-icon="python"]',
    go: 'svg[data-icon="go"]',
    ruby: 'svg[data-icon="ruby"]',
  };

  async function selectAgent() {
    await page.getByRole('button', { name: 'Application Registration', exact: true }).click();
    await page.locator("//input[@placeholder='Select Agent']").click();
    await page.locator("//input[@id='assign-monitor-search']").fill(process.env.APM_Agent);

    const agentPopup = page.locator('.ant-popover.picker-overlay.grid-dropdown:not(.ant-popover-hidden)');
    const rows = agentPopup.locator('tr.k-master-row');
    // The popup opens with ALL monitors unfiltered (e.g. 5 rows) and narrows to the search
    // match asynchronously — the default 5s expect timeout isn't always enough for that filter
    // to converge (observed: count flapping 0/5, never settling to 1, within 5s on 04-08-2026).
    await expect(rows).toHaveCount(1, { timeout: 30_000 });
    await expect(rows.locator('td').nth(2).locator('span.text-ellipsis')).toHaveText(/apmagentanant/i);
    await rows.locator('input[type="checkbox"]').first().click();
    // Close the picker explicitly — see the identical comment in the Java test above.
    await page.keyboard.press('Escape');
  }

  async function createService({ language, serviceName, path }) {
    await selectAgent();

    const icon = page.locator(LANGUAGE_ICONS[language]).first();
    await expect(icon).toBeVisible();
    await icon.click();

    await page.locator("//input[@placeholder='Enter your service name']").fill(serviceName);

    if (path) {
      const pathInput = page.locator('input[placeholder^="/"]').first();
      await expect(pathInput).toBeVisible();
      await pathInput.fill(path);
    }

    await page.getByRole('button', { name: 'Apply Configuration', exact: true }).click();

    const notification = page.locator('.ant-notification-notice-with-icon');
    await expect(notification).toContainText('Success', { timeout: 60_000 });
    await expect(notification).toContainText('Trace Service created successfully', { timeout: 60_000 });

    const closeDrawerBtn = page.locator('button.ant-drawer-close');
    await expect(closeDrawerBtn).toBeVisible({ timeout: 300_000 });
    await closeDrawerBtn.click();

    await page.locator("//input[@name='search-application-registration']").fill(serviceName);
    const serviceRow = page.locator('tr.k-master-row', {
      has: page.locator(`span:has-text("${serviceName}")`),
    });
    await expect(serviceRow).toBeVisible({ timeout: 60_000 });
  }

  test('Create Service for Dotnet', async () => {
    const serviceName = 'ProductCatalog_dotnet.';
    test.skip(await isServiceRegistered(serviceName), `${serviceName} already registered`);
    await createService({ language: 'dotnet', serviceName });
  });

  test('Create Service for Dotnet (Host/VM)', async () => {
    const serviceName = 'APMPlayGround_RedisWebAPI';
    test.skip(await isServiceRegistered(serviceName), `${serviceName} already registered`);
    await createService({ language: 'dotnet', serviceName });
  });

  test('Create Service for NodeJS', async () => {
    const serviceName = 'NodeJs_mongodb';
    test.skip(await isServiceRegistered(serviceName), `${serviceName} already registered`);
    await createService({ language: 'nodejs', serviceName });
  });

  test('Create Service for Python', async () => {
    const serviceName = 'flask_app';
    test.skip(await isServiceRegistered(serviceName), `${serviceName} already registered`);
    await createService({ language: 'python', serviceName });
  });

  test('Create Service for Ruby', async () => {
    const serviceName = 'Qwitch';
    test.skip(await isServiceRegistered(serviceName), `${serviceName} already registered`);
    await createService({ language: 'ruby', serviceName });
  });

  test('Create Service for PHP', async () => {
    const serviceName = 'laravel_app';
    test.skip(await isServiceRegistered(serviceName), `${serviceName} already registered`);
    await createService({
      language: 'php',
      serviceName,
      path: '/opt/remi/php84/root/usr/bin/php',
    });
  });

  test('Create Service for Go', async () => {
    const serviceName = 'Go_TestInstGo';
    test.skip(await isServiceRegistered(serviceName), `${serviceName} already registered`);
    await createService({
      language: 'go',
      serviceName,
      path: '/root/APM/APM_Go/apps_to_qa/go-instrumentation-test-copy/go-app-1.23',
    });
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });


});