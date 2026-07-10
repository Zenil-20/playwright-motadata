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
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const TARGET = {
  MONITOR_IP: '172.16.10.1',
  MONITOR_NAME: 'fg_firewall.mindarray.com',
  SCHEDULER_HOUR: '00:00',
};

// Captured at runtime from the first row of the firewall's Network Interface
// list, so the test follows whichever port is currently provisioned (port12,
// port16, etc.) instead of hardcoding a name that may change with config.
let capturedInterfaceName;

test.describe.serial('Motadata AIOps Interface Rediscovery Flow', () => {
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
    await login(page);
  });

  test('Delete the network interface from Device Monitor Settings', async () => {
    test.setTimeout(120000);

    // Navigate directly to Device Monitor Settings
    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/settings/monitoring/device-monitor-settings`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    // Wait for the device grid to render
    await expect(page.locator('.k-master-row').first()).toBeVisible({ timeout: 60000 });

    // Filter the grid by the firewall monitor IP
    const tableSearch = page
      .locator('.search-box input.ant-input, [class*="search"] input.ant-input')
      .last();

    // Exact IP match — '172.16.10.1' is a substring of '172.16.10.180' etc., so a
    // hasText match would pick the wrong row before the filter narrows the grid.
    const ipRegex = new RegExp(`^\\s*${TARGET.MONITOR_IP.replace(/\./g, '\\.')}\\s*$`);
    const monitorRow = page.locator('.k-master-row', {
      has: page.locator('td', { hasText: ipRegex })
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

    // Switch to "Network Interface" tab
    await page.getByRole('tab', { name: 'Network Interface' }).click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Network Interface']").first().click();
      });

    // Scope all interactions to the open Metric Settings drawer — the device
    // grid behind it also has .k-master-row, which would otherwise match first.
    const drawer = page.locator('.ant-drawer-open').last();

    // Capture the first interface name (e.g. port12, port16) so we delete and
    // re-verify whichever port is currently provisioned.
    const firstRow = drawer.locator('.k-master-row').first();
    await expect(firstRow).toBeVisible({ timeout: 30000 });
    capturedInterfaceName = (await firstRow.locator('td').nth(1).textContent())?.trim();
    expect(capturedInterfaceName, 'Failed to read interface name').toBeTruthy();

    const metricSearch = drawer.locator("//input[@name='search-object-metric']").last();
    await metricSearch.fill(capturedInterfaceName);

    const interfaceRow = drawer.locator('.k-master-row', {
      has: page.locator('td', { hasText: capturedInterfaceName })
    }).first();
    await expect(interfaceRow).toBeVisible({ timeout: 30000 });

    // Click the Ant checkbox wrapper (the inner input is visually hidden which
    // sometimes hangs .check()).
    await interfaceRow.locator('label.ant-checkbox-wrapper, .ant-checkbox').first().click();
    await page.locator('#delete-metric-collection-time').click();

    // Confirm if a confirmation dialog appears
    const confirm = page.getByRole('button', { name: /^(Yes|Confirm|Delete)$/i }).first();
    if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirm.click();
    }
  });

  test('Create rediscover scheduler for Interface on firewall monitor', async () => {
    test.setTimeout(90000);

    // Navigate: Rediscover Settings
    await page.locator("//input[@placeholder='Search']").first().fill('Rediscover Settings');
    await page.getByRole('link', { name: 'Rediscover Settings' }).click();

    // Switch to Interface tab
    await page.getByRole('tab', { name: 'Interface' }).first().click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Interface']").first().click();
      });

    // Open Create Scheduler drawer
    await page.getByRole('button', { name: 'Create Scheduler' }).click();

    // Pick the firewall monitor
    const monitorTrigger = page.locator('//div[@id="monitors"]//input[@placeholder="Select"]');
    await monitorTrigger.click();
    const monitorSearch = page.locator("//input[@id='assign-monitor-search']");
    // Searching "firewall" matches many tag-based rows; narrow further by IP so
    // the firewall row reaches the top of the (virtualized) list.
    await monitorSearch.fill(TARGET.MONITOR_IP);
    const monitorRow = page.getByRole('row', { name: new RegExp(TARGET.MONITOR_NAME) }).first();
    await expect(monitorRow).toBeVisible({ timeout: 15000 });
    await expect(monitorRow).toBeVisible({ timeout: 10000 });
    const row = page.locator("//tr[.//span[contains(normalize-space(),'fg_firewall.mindarray.com')]]");

await expect(row).toHaveCount(1);

await row.locator("//input[@type='checkbox']").check();
    await page.getByRole('heading', { name: /Interface Scheduler/i }).click()
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

  test('Run the scheduler and provision the interface', async () => {
    test.setTimeout(150000);

    // Trigger the run for OUR Once scheduler — scope by the firewall monitor name
    // so we don't click an older Once row for a different monitor.
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
    await resultsSearch.fill(capturedInterfaceName);

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

  test('Verify interface reappears under Network Interface tab', async () => {
    test.setTimeout(150000);

    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/settings/monitoring/device-monitor-settings`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    // Wait for the device grid to render
    await expect(page.locator('.k-master-row').first()).toBeVisible({ timeout: 60000 });

    // Filter the grid by the firewall monitor IP
    const tableSearch = page
      .locator('.search-box input.ant-input, [class*="search"] input.ant-input')
      .last();

    // Exact IP match — '172.16.10.1' is a substring of '172.16.10.180' etc., so a
    // hasText match would pick the wrong row before the filter narrows the grid.
    const ipRegex = new RegExp(`^\\s*${TARGET.MONITOR_IP.replace(/\./g, '\\.')}\\s*$`);
    const monitorRow = page.locator('.k-master-row', {
      has: page.locator('td', { hasText: ipRegex })
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

    // Switch to "Network Interface" tab
    await page.getByRole('tab', { name: 'Network Interface' }).click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Network Interface']").first().click();
      });

    // Search for the same interface we deleted and assert it reappears
    const metricSearch = page.locator("//input[@name='search-object-metric']").last();
    await metricSearch.fill(capturedInterfaceName);

    const interfaceResult = page.locator('.k-master-row', {
      has: page.locator('td', { hasText: capturedInterfaceName })
    }).first();
    await expect(interfaceResult).toBeVisible({ timeout: 120000 });

    // Close the Metric Settings drawer so the next test (logout) is not blocked.
    await page.locator('button.ant-drawer-close[aria-label="Close"]').first().click();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
