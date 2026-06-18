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
  PATH: 'C:\\Windows',
  PATH_TYPE: 'Directory',
  OS_TYPE: 'Windows',
  MONITOR_IP: '172.16.10.134',
  SEARCH_KEYWORD: 'Windows',
  EXPECTED_PATH: 'C:\\Windows',
  SCHEDULER_HOUR: '00:00',
};

test.describe.serial('Motadata AIOps File/Directory Rediscovery Flow', () => {
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

  test('Add "C:\\Windows" path in File/Directory Settings', async () => {
    test.setTimeout(90000);

    // Navigate: Settings -> search "File/Directory Settings"
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('File/Directory Settings');
    await page.getByRole('link', { name: 'File/Directory Settings' }).click();

    // Wait for the grid toolbar to render before clicking the create button.
    const createBtn = page.locator('#btn-create-file-directory');
    await expect(createBtn).toBeVisible({ timeout: 30000 });
    await createBtn.click();

    // Fill the new row: Path input has name="path"
    const pathInput = page.locator('input[name="path"]').first();
    await expect(pathInput).toBeVisible({ timeout: 15000 });
    await pathInput.fill(TARGET.PATH);

    // Type dropdown -> Directory. Scope to the edit row and force-click the
    // trigger because the underlying input is readonly/hidden and only the
    // wrapper has visible bounds.
    const editRow = page.locator('tr', { has: page.locator('input[name="path"]') }).first();
    await editRow.locator('input[data-cy="dropdown-trigger-input"]').first().click({ force: true });
    await page.locator(`span[title="${TARGET.PATH_TYPE}"]`).first().click();

    // OS Type stays Windows by default per UI snapshot.

    // Save (tick) — the inline edit row exposes two unnamed action buttons
    // (save, cancel). The save button is the first one in that row.
    await editRow.locator('button').first().click();

    // Verify the row exists
    await page.locator("//input[@placeholder='Search']").last().fill(TARGET.PATH);
    await expect(page.locator('tbody tr', { hasText: TARGET.PATH }).first())
      .toBeVisible({ timeout: 15000 });
  });

  test('Create rediscover scheduler for File/Directory on monitor 172.16.10.134', async () => {
    test.setTimeout(90000);

    // Navigate: Rediscover Settings
    await page.locator("//input[@placeholder='Search']").first().fill('Rediscover Settings');
    await page.getByRole('link', { name: 'Rediscover Settings' }).click();

    // Switch to File/Directory tab
    await page.getByRole('tab', { name: 'File/Directory' }).first().click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='File/Directory']").first().click();
      });

    // Open Create Scheduler drawer
    await page.getByRole('button', { name: 'Create Scheduler' }).click();

    // Pick the monitor (IP 172.16.10.134)
    const monitorTrigger = page.locator('//div[@id="monitors"]//input[@placeholder="Select"]');
    await monitorTrigger.click();
    const monitorSearch = page.locator("//input[@id='assign-monitor-search']");
    await monitorSearch.fill('172.16.10.134');
    const monitorRow = page.locator('tr', { hasText: TARGET.MONITOR_IP }).first();
    await expect(monitorRow).toBeVisible({ timeout: 10000 });
    await monitorRow.locator('input[type="checkbox"]').first().check();
    await page.getByRole('heading', { name: /File\/Directory Scheduler/i }).click()
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
    // Hours picker is multi-select and stays open; close it so it doesn't --> BUG
    // intercept pointer events on the notify submit button below.
    await page.keyboard.press('Escape');

    //notify team field
    await page.locator('//input[@placeholder="@User or Email or /Handle or #User Profile or Mobile Number"]').fill('zenil.p@motadata.com');
    await page.locator('button[type="submit"].ant-btn-circle').click();

    // Submit
    await page.locator('#submit-btn').click();

    // The scheduler row should now appear in the list
    await expect(page.locator('tbody tr', { hasText: 'Once' }).first())
      .toBeVisible({ timeout: 10000 });
  });

  test('Run the scheduler and provision C:\\Windows', async () => {
    test.setTimeout(150000);

    // Trigger the run for the Once scheduler we just created
    const onceRow = page.locator('tbody tr', { hasText: 'Once' }).first();
    await onceRow.locator('#start-rediscovery, [id*="start-rediscover"], button[title*="Run" i]').first().click()
      .catch(async () => {
        await onceRow.locator('td').last().locator('svg, button').first().click();
      });

    // The drawer that opens has its own search input in its toolbar
    const resultsSearch = page.locator("//div[@class='flex justify-between']//input[@placeholder='Search']").last();
    await expect(resultsSearch).toBeVisible({ timeout: 50000 });
    await resultsSearch.fill(TARGET.SEARCH_KEYWORD);

    // Wait for the filtered row to appear, then click its provision icon.
    const provisionIcon = page.locator('svg[data-icon="provision"]').first();
    await expect(provisionIcon).toBeVisible({ timeout: 50000 });
    await provisionIcon.click();

    // Confirm provisioning if a confirm dialog appears
    const confirm = page.getByRole('button', { name: /^(Yes|Confirm|Provision)$/i }).first();
    if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirm.click();
    }

    // Close the drawer (circle X button at the top-right)
    const closeBtn = page.locator('button.ant-btn-circle:has(svg[data-icon="times"])').last();
    await closeBtn.click({ timeout: 10000 });
  });

  test('Verify C:\\Windows appears under Windows File/Directory in Device Monitor Settings', async () => {
    test.setTimeout(120000);

    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/settings/monitoring/device-monitor-settings`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    // Wait for the first grid row to render before touching the search.
    await expect(page.locator('.k-master-row').first())
      .toBeVisible({ timeout: 60000 });

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

    // Open the row's action menu (kebab) and click Metric Settings
    await monitorRow.locator('svg[data-icon="ellipsis-v"]').first().click();
    await page.getByText('Metric Settings', { exact: false }).first().click();

    // Switch to "Windows Directory" tab
    await page.getByRole('tab', { name: 'Windows Directory' }).click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Windows Directory']").first().click();
      });

    // Search for the path and assert the row appears
    const metricSearch = page.locator("//input[@name='search-object-metric']").last();
    await metricSearch.fill(TARGET.EXPECTED_PATH);

    const pathResult = page.locator('tr', { hasText: TARGET.EXPECTED_PATH }).first();
    await expect(pathResult).toBeVisible({ timeout: 30000 });

    // Delete the path from the device's Windows Directory list
    await page.locator('//td[@dataindex="1"]//input[@type="checkbox"]').nth(1).check();
    await page.locator('#delete-metric-collection-time').click();

    // Delete the C:\Windows entry from File/Directory Settings
    await page.goto(`${baseUrl}/settings/monitoring/file-directory-list`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30000 });

    const fdSearch = page.locator("//input[@placeholder='Search']").nth(1);
    await expect(fdSearch).toBeEnabled({ timeout: 15000 });
    await fdSearch.fill(TARGET.PATH);
    await expect(fdSearch).toHaveValue(TARGET.PATH, { timeout: 5000 });

    const pathRow = page.locator('tbody tr', { hasText: TARGET.PATH }).first();
    await expect(pathRow).toBeVisible({ timeout: 15000 });

    await pathRow.locator('[data-cy="grid-action"]').first().click();
    await page.locator('#delete').click();
    await page.locator('#confirm-yes').click();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
