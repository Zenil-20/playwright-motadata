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

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
     await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await page.waitForLoadState('networkidle');
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

    await page.getByRole('button', { name: 'Application Registration', exact: true }).click();
    await page.locator("//input[@placeholder='Select Agent']").click();
    await page.locator("//input[@id='assign-monitor-search']").fill('apmagentanant');

    // Select APM Agent — scope to the agent-selection popup so we don't
    // also match rows from the main grid sitting behind the dropdown.
    const agentPopup = page.locator('.ant-popover.picker-overlay.grid-dropdown:not(.ant-popover-hidden)');
    const rows = agentPopup.locator('tr.k-master-row');
    // Verify only one agent row is present in the filtered popup
    await expect(rows).toHaveCount(1);
    // Get the agent name text
    const agentName = rows.locator('td').nth(2).locator('span.text-ellipsis');
    // Verify the agent name
    await expect(agentName).toHaveText(/apmagentanant/i);
    // Perform operation only after validation
    await rows.locator('input[type="checkbox"]').first().click();
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
    await page.locator("//input[@id='assign-monitor-search']").fill('apmagentanant');

    const agentPopup = page.locator('.ant-popover.picker-overlay.grid-dropdown:not(.ant-popover-hidden)');
    const rows = agentPopup.locator('tr.k-master-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.locator('td').nth(2).locator('span.text-ellipsis')).toHaveText(/apmagentanant/i);
    await rows.locator('input[type="checkbox"]').first().click();
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
    await createService({ language: 'dotnet', serviceName: 'ProductCatalog_dotnet' });
  });

  test('Create Service for NodeJS', async () => {
    await createService({ language: 'nodejs', serviceName: 'NodeJs_mongodb' });
  });

  test('Create Service for Python', async () => {
    await createService({ language: 'python', serviceName: 'flask_app' });
  });

  test('Create Service for Ruby', async () => {
    await createService({ language: 'ruby', serviceName: 'Qwitch' });
  });

  test('Create Service for PHP', async () => {
    await createService({
      language: 'php',
      serviceName: 'laravel_app',
      path: '/opt/remi/php84/root/usr/bin/php',
    });
  });

  test('Create Service for Go', async () => {
    await createService({
      language: 'go',
      serviceName: 'Go_TestInstGo',
      path: '/root/APM/APM_Go/apps_to_qa/go-instrumentation-test-copy/go-app-1.23',
    });
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });


});