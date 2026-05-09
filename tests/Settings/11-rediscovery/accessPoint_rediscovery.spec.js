/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * This software and associated documentation are the confidential and
 * proprietary information of Motadata.
 *
 * Unauthorized use, reproduction, disclosure, or distribution of this
 * material is strictly prohibited.
 *
 * You shall use this software only in accordance with the terms of the
 * license agreement entered into with Motadata.
 *
 * Author  : Zenil Kapadia
 * Created : 08 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const TARGET = {
  MONITOR_IP: '10.20.40.4',
  MONITOR_NAME: 'motadata-contoller',
  ACCESS_POINT: '11th-R550-40.16',
  SEARCH_KEYWORD: '11th',
  SCHEDULER_HOUR: '00:00',
};

test.describe.serial('Motadata AIOps Access Point Rediscovery Flow', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(60000);
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('domcontentloaded');
  });

  test('Delete the Ruckus access point from Device Monitor Settings', async () => {
    test.setTimeout(120000);

    // Navigate directly to Device Monitor Settings
    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/settings/monitoring/device-monitor-settings`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    // Wait for the device grid to render
    await expect(page.locator('.k-master-row').first()).toBeVisible({ timeout: 60000 });

    // Filter the grid by the Ruckus monitor IP
    const tableSearch = page
      .locator('.search-box input.ant-input, [class*="search"] input.ant-input')
      .last();

    const monitorRow = page.locator('.k-master-row', {
      has: page.locator('td', { hasText: TARGET.MONITOR_IP })
    }).first();

    await expect(async () => {
      await tableSearch.click();
      await tableSearch.fill(TARGET.MONITOR_IP);
      await expect(tableSearch).toHaveValue(TARGET.MONITOR_IP, { timeout: 3000 });
      await expect(monitorRow).toBeVisible({ timeout: 8000 });
    }).toPass({ timeout: 45000, intervals: [1000, 2000, 3000] });

    // Open kebab -> Metric Settings
    await monitorRow.locator('svg[data-icon="ellipsis-v"]').first().click();
    await page.getByText('Metric Settings', { exact: false }).first().click();

    // Switch to "Ruckus Wireless Access Point" tab
    await page.getByRole('tab', { name: 'Ruckus Wireless Access Point' }).click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Ruckus Wireless Access Point']").first().click();
      });

    // Search for the access point by name
    const metricSearch = page.locator("//input[@name='search-object-metric']").last();
    await metricSearch.fill(TARGET.ACCESS_POINT);

    const apRow = page.locator('tr', { hasText: TARGET.ACCESS_POINT }).first();
    await expect(apRow).toBeVisible({ timeout: 30000 });

    // Select the access point and delete it
    await apRow.locator('input[type="checkbox"]').first().check();
    await page.locator('#delete-metric-collection-time').click();

    // Confirm if a confirmation dialog appears
    const confirm = page.getByRole('button', { name: /^(Yes|Confirm|Delete)$/i }).first();
    if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirm.click();
    }
  });

  test('Create rediscover scheduler for Access Point on Ruckus monitor', async () => {
    test.setTimeout(90000);

    // Navigate: Rediscover Settings
    await page.locator("//input[@placeholder='Search']").first().fill('Rediscover Settings');
    await page.getByRole('link', { name: 'Rediscover Settings' }).click();

    // Switch to Access Point tab
    await page.getByRole('tab', { name: 'Access Point' }).first().click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Access Point']").first().click();
      });

    // Open Create Scheduler drawer
    await page.getByRole('button', { name: 'Create Scheduler' }).click();

    // Pick the Ruckus monitor
    const monitorTrigger = page.locator('//div[@id="monitors"]//input[@placeholder="Select"]');
    await monitorTrigger.click();
    const monitorSearch = page.locator("//input[@id='assign-monitor-search']");
    await monitorSearch.fill('ruckus');
    const monitorRow = page.locator('tr', { hasText: TARGET.MONITOR_IP }).first();
    await expect(monitorRow).toBeVisible({ timeout: 10000 });
    await monitorRow.locator('input[type="checkbox"]').first().check();
    await page.getByRole('heading', { name: /Access Point Scheduler/i }).click()
      .catch(async () => {
        await page.getByRole('heading').first().click();
      });

    // Hours dropdown
    const hoursTrigger = page.locator('//div[@id="schedule-time-picker"]//input[@placeholder="Select"]').first();
    if (await hoursTrigger.count()) {
      await hoursTrigger.click();
    } else {
      await page.locator('input[placeholder="Select"]').nth(1).click();
    }
    const hoursSearch = page.locator("//input[@data-cy='dropdown-search-input']").last();
    if (await hoursSearch.count()) {
      await hoursSearch.fill(TARGET.SCHEDULER_HOUR);
    }
    await page.locator(`//span[@title='${TARGET.SCHEDULER_HOUR}']`).first().click();
    // Hours picker is multi-select and stays open; close it so it doesn't
    // intercept pointer events on the notify submit button below.
    await page.keyboard.press('Escape');

    // Notify team field
    await page.locator('//input[@placeholder="@User or Email or /Handle or #User Profile or Mobile Number"]')
      .fill('zenil.p@motadata.com');
    await page.locator('button[type="submit"].ant-btn-circle').click();

    // Submit scheduler
    await page.locator('#submit-btn').click();

    // The scheduler row should now appear in the list
    await expect(page.locator('tbody tr', { hasText: 'Once' }).first())
      .toBeVisible({ timeout: 10000 });
  });

  test('Run the scheduler and provision the access point', async () => {
    test.setTimeout(150000);

    // Trigger the run for OUR Once scheduler — the grid may already contain
    // older Once rows for other monitors, so scope by the Ruckus monitor name.
    const onceRow = page.locator('tbody tr', { hasText: 'Once' })
      .filter({ hasText: TARGET.MONITOR_NAME })
      .first();
    await expect(onceRow).toBeVisible({ timeout: 15000 });
    await onceRow.locator('#start-rediscovery, [id*="start-rediscover"], button[title*="Run" i]').first().click()
      .catch(async () => {
        await onceRow.locator('td').last().locator('svg, button').first().click();
      });

    // Drawer's own search input
    const resultsSearch = page.locator("//div[@class='flex justify-between']//input[@placeholder='Search']").last();
    await expect(resultsSearch).toBeVisible({ timeout: 50000 });
    await resultsSearch.fill(TARGET.SEARCH_KEYWORD);

    // Click the provision icon for the filtered row
    const provisionIcon = page.locator('svg[data-icon="provision"]').first();
    await expect(provisionIcon).toBeVisible({ timeout: 50000 });
    await provisionIcon.click();

    // Confirm provisioning if a confirm dialog appears
    const confirm = page.getByRole('button', { name: /^(Yes|Confirm|Provision)$/i }).first();
    if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirm.click();
    }

    // Close the drawer
    const closeBtn = page.locator('button.ant-btn-circle:has(svg[data-icon="times"])').last();
    await closeBtn.click({ timeout: 10000 });
  });

  test('Verify access point reappears under Ruckus Wireless Access Point tab', async () => {
    test.setTimeout(150000);

    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/settings/monitoring/device-monitor-settings`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    // Wait for the device grid to render
    await expect(page.locator('.k-master-row').first()).toBeVisible({ timeout: 60000 });

    // Filter the grid by the Ruckus monitor IP
    const tableSearch = page
      .locator('.search-box input.ant-input, [class*="search"] input.ant-input')
      .last();

    const monitorRow = page.locator('.k-master-row', {
      has: page.locator('td', { hasText: TARGET.MONITOR_IP })
    }).first();

    await expect(async () => {
      await tableSearch.click();
      await tableSearch.fill(TARGET.MONITOR_IP);
      await expect(tableSearch).toHaveValue(TARGET.MONITOR_IP, { timeout: 3000 });
      await expect(monitorRow).toBeVisible({ timeout: 8000 });
    }).toPass({ timeout: 45000, intervals: [1000, 2000, 3000] });

    // Open kebab -> Metric Settings
    await monitorRow.locator('svg[data-icon="ellipsis-v"]').first().click();
    await page.getByText('Metric Settings', { exact: false }).first().click();

    // Switch to "Ruckus Wireless Access Point" tab
    await page.getByRole('tab', { name: 'Ruckus Wireless Access Point' }).click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Ruckus Wireless Access Point']").first().click();
      });

    // Search for the access point and assert it reappears
    const metricSearch = page.locator("//input[@name='search-object-metric']").last();
    await metricSearch.fill(TARGET.ACCESS_POINT);

    const apResult = page.locator('.k-master-row', {
      has: page.locator('td', { hasText: TARGET.ACCESS_POINT })
    }).first();
    await expect(apResult).toBeVisible({ timeout: 120000 });

    // Close the Metric Settings drawer so the next test (logout) is not blocked.
    await page.locator('button.ant-drawer-close[aria-label="Close"]').first().click();
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
