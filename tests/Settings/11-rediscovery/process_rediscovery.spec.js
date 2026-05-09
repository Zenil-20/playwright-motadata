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
 * Created : 07 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const TARGET = {
  PROCESS_NAME: 'system',
  MONITOR_IP: '172.16.10.134',
  SEARCH_PROCESS_KEYWORD: 'dns',
  EXPECTED_PROCESS: 'dns.exe',
  SCHEDULER_HOUR: '00:00',
};

test.describe.serial('Motadata AIOps Process Rediscovery Flow', () => {
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

  // On any failure, dump the full DOM, aria snapshot and screenshot so the
  // next iteration can pick selectors from the actual page state instead of
  // guessing. Files land under test-results as Playwright attachments.
//   test.afterEach(async ({}, testInfo) => {
//     if (testInfo.status === testInfo.expectedStatus || !page || page.isClosed()) return;
//     try {
//       const html = await page.content();
//       await testInfo.attach('page-content.html', { body: html, contentType: 'text/html' });
//     } catch {}
//     try {
//       const aria = await page.locator('body').ariaSnapshot();
//       await testInfo.attach('aria-snapshot.yaml', { body: aria, contentType: 'text/yaml' });
//     } catch {}
//     try {
//       const png = await page.screenshot({ fullPage: true });
//       await testInfo.attach('failure.png', { body: png, contentType: 'image/png' });
//     } catch {}
//     try {
//       await testInfo.attach('url.txt', { body: page.url(), contentType: 'text/plain' });
//     } catch {}
//   });

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('domcontentloaded');
  });

  test('Add "system" process in Process Monitor Settings', async () => {
    test.setTimeout(90000);

    // Navigate: Settings -> search "Process Monitor Settings"
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('Process Monitor Settings');
    await page.getByRole('link', { name: 'Process Monitor Settings' }).click();

    // Create process
    await page.locator('#btn-create-process').click();

    // The new row exposes an input with the "Process..." placeholder
    const processNameInput = page.locator('input[placeholder^="Proc"]').first();
    await expect(processNameInput).toBeVisible();
    await processNameInput.fill(TARGET.PROCESS_NAME);

    // Save (tick) — keep Application Type / OS Type as default
    await page.locator('#btn-update-process').click();

    // Verify the row exists
    await page.locator("//input[@placeholder='Search']").last().fill(TARGET.PROCESS_NAME);
    await expect(page.locator('tbody tr', { hasText: TARGET.PROCESS_NAME }).first())
      .toBeVisible({ timeout: 15000 });
  });

  test('Create rediscover scheduler for Process on monitor 172.16.10.134', async () => {
    test.setTimeout(90000);

    // Navigate: Rediscover Settings
    await page.locator("//input[@placeholder='Search']").first().fill('Rediscover Settings');
    await page.getByRole('link', { name: 'Rediscover Settings' }).click();

    // Switch to Process tab
    await page.getByRole('tab', { name: 'Process' }).first().click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Process']").first().click();
      });

    // Open Create Scheduler drawer
    await page.getByRole('button', { name: 'Create Scheduler' }).click();

    // Pick the monitor (IP 172.16.10.134)
    const monitorTrigger = page.locator('//div[@id="monitors"]//input[@placeholder="Select"]');
    await monitorTrigger.click();
    // A popup opens with its own search box
    const monitorSearch = page.locator("//input[@id='assign-monitor-search']");
    await monitorSearch.fill('134');
    const monitorRow = page.locator('tr', { hasText: TARGET.MONITOR_IP }).first();
    await expect(monitorRow).toBeVisible({ timeout: 10000 });
    await monitorRow.locator('input[type="checkbox"]').first().check();
    // Close the picker (click outside / scheduler heading)
    await page.getByRole('heading', { name: /Process Scheduler/i }).click();

    // Scheduler Type: Once is selected by default per UI snapshot — leave it.

    // Hours dropdown
    const hoursTrigger = page.locator('//div[@id="schedule-time-picker"]//input[@placeholder="Select"]').first();
    if (await hoursTrigger.count()) {
      await hoursTrigger.click();
    } else {
      // Fallback: the Hours field is the second "Select" trigger in the drawer
      await page.locator('input[placeholder="Select"]').nth(1).click();
    }
    const hoursSearch = page.locator("//input[@data-cy='dropdown-search-input']").last();
    if (await hoursSearch.count()) {
      await hoursSearch.fill(TARGET.SCHEDULER_HOUR);
    }
    await page.locator(`//span[@title='${TARGET.SCHEDULER_HOUR}']`).first().click();

    // Submit
    await page.locator('#submit-btn').click();

    // The scheduler row should now appear in the list
    await expect(page.locator('tbody tr', { hasText: 'Once' }).first())
      .toBeVisible({ timeout: 10000 });
  });

  test('Run the scheduler and provision dns.exe', async () => {
    test.setTimeout(150000);

    // Trigger the run for the Once scheduler we just created
    const onceRow = page.locator('tbody tr', { hasText: 'Once' }).first();
    await onceRow.locator('#start-rediscovery, [id*="start-rediscover"], button[title*="Run" i]').first().click()
      .catch(async () => {
        // Fallback to the action-icon column on that row
        await onceRow.locator('td').last().locator('svg, button').first().click();
      });

    // The Process drawer that opens has its own search input in its toolbar
    const resultsSearch = page.locator("//div[@class='flex justify-between']//input[@placeholder='Search']").last();
    await expect(resultsSearch).toBeVisible({ timeout: 50000 });
    await resultsSearch.fill(TARGET.SEARCH_PROCESS_KEYWORD);

    // Searching "dns" matches cmd.exe, dns.exe and svchost.exe (Dnscache); scope
    // the provision icon to the dns.exe row specifically.
    const dnsRow = page.locator('tr.k-master-row', { hasText: TARGET.EXPECTED_PROCESS }).first();
    await expect(dnsRow).toBeVisible({ timeout: 50000 });
    await dnsRow.locator('svg[data-icon="provision"]').click();

    // Confirm provisioning if a confirm dialog appears
    const confirm = page.getByRole('button', { name: /^(Yes|Confirm|Provision)$/i }).first();
    if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirm.click();
    }

    // Close the Process drawer (circle X button at the top-right)
    const closeBtn = page.locator('button.ant-btn-circle:has(svg[data-icon="times"])').last();
    await closeBtn.click({ timeout: 10000 });
  });

  test('Verify dns.exe appears under Windows Process in Device Monitor Settings', async () => {
    test.setTimeout(120000);

    // Navigate directly — the settings-nav search + link click is fragile because
    // multiple "Device Monitor Settings" labels exist (breadcrumb, nav link).
    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/settings/monitoring/device-monitor-settings`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    // Wait for the first grid row to render before touching the search,
    // otherwise the Ant search input is unbound and fill() gets wiped on hydration.
    await expect(page.locator('.k-master-row').first())
      .toBeVisible({ timeout: 60000 });

    // Pick the search input inside the grid toolbar, not the settings nav.
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

    // Switch to "Windows Process" tab
    await page.getByRole('tab', { name: 'Windows Process' }).click()
      .catch(async () => {
        await page.locator("//div[normalize-space()='Windows Process']").first().click();
      });

    // Search for dns.exe and assert the row appears
    const metricSearch = page.locator("//input[@name='search-object-metric']").last();
    await metricSearch.fill(TARGET.EXPECTED_PROCESS);

    const dnsResult = page.locator('tr', { hasText: TARGET.EXPECTED_PROCESS }).first();
    await expect(dnsResult).toBeVisible({ timeout: 30000 });

    //delete the process from process monitor settings
    await page.locator('//td[@dataindex="1"]//input[@type="checkbox"]').nth(1).check();
    await page.getByRole('button', { name: 'Delete Selected Windows Processes' }).click();

    //delete the System process from process monitor settings
    const processUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${processUrl}/settings/monitoring/processes`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    // Wait for the grid to render before searching, otherwise fill() lands on
    // an unbound input and the value gets wiped on hydration.
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30000 });

    const processSearch = page.locator("//input[@placeholder='Search']").nth(1);
    await expect(processSearch).toBeEnabled({ timeout: 15000 });
    await processSearch.fill(TARGET.PROCESS_NAME);
    await expect(processSearch).toHaveValue(TARGET.PROCESS_NAME, { timeout: 5000 });

    // Wait for the filter to actually apply — the row must be visible AND it
    // must be the only/first row, so the kebab below targets the right entry.
    const systemProcessRow = page.locator('tbody tr', { hasText: TARGET.PROCESS_NAME }).first();
    await expect(systemProcessRow).toBeVisible({ timeout: 15000 });

    // Scope the action menu to the filtered row, not the global first one.
    await systemProcessRow.locator('[data-cy="grid-action"]').first().click();
    await page.locator("#delete").click();
    await page.locator("#confirm-yes").click();


  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
