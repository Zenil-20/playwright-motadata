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
 * Created : 26 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const NCCM_DEVICE_IP = '172.16.14.6';
const RUNBOOK_NAME = 'Enable Cisco System Syslog';

test.describe.serial('Motadata AIOps NCCM Actions for 172.16.14.6', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Set the 172.16.14.6 as a baseline', async () => {
    await page.getByRole('link', { name: /NCCM/i }).click();
    await page.getByRole('tab', { name: 'Explorer' }).click();
    await page.locator("//input[@name='search']").fill(NCCM_DEVICE_IP);

    await expect(page.getByRole('gridcell', { name: NCCM_DEVICE_IP })).toHaveCount(1);

    const row = page.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first();
    await row.locator("a[data-cy='grid-action']").click();
    await page.locator("//span[normalize-space()='Set as Baseline']").click();
  });

  test('Toggle Baseline Version column via eye button and verify version 1.0', async () => {
    const row = page.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first();

    // Open the show-hide-columns ("eye") popover and tick "Baseline Version" if not already on.
    await page.locator('#btn-show-hide-columns').click();

    const columnSearch = page.locator("input[data-cy='dropdown-search-input']").last();
    await expect(columnSearch).toBeVisible({ timeout: 10000 });
    await columnSearch.fill('Baseline Version');

    const option = page.getByText('Baseline Version', { exact: true }).first();
    await expect(option).toBeVisible({ timeout: 10000 });

    // Click only if currently unchecked. The option row contains a checkbox in the popover.
    const popoverRow = page.locator('.ant-popover:visible, .ant-dropdown:visible')
      .last()
      .locator('li, div', { hasText: /^\s*Baseline Version\s*$/ })
      .first();
    const cb = popoverRow.locator('input[type="checkbox"]').first();
    if ((await cb.isChecked().catch(() => false)) === false) {
      await option.click();
    }
    await page.keyboard.press('Escape');

    // Column is now present — verify the 1.0 tag inside the device row's Baseline Version cell.
    await expect(page.locator('th.k-header', { hasText: 'Baseline Version' }).first())
      .toBeVisible({ timeout: 15000 });

    const baselineTag = row.locator("div.ant-tag[title='1.0']").first();
    await expect(baselineTag).toBeVisible({ timeout: 30000 });
    await expect(baselineTag).toHaveText(/\s*1\.0\s*/);
  });

  test('Assign 172.16.14.6 to "Enable Cisco System Syslog" default runbook', async () => {
    // Navigate Settings → Runbook
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('runbook');
    await page.getByRole('link', { name: 'Runbook', exact: true }).click();

    // Search the default runbook row using the grid's own search input.
    await page.locator("//input[@name='search']").fill(RUNBOOK_NAME);
    const runbookRow = page.locator('tr.k-master-row', { hasText: RUNBOOK_NAME }).first();
    await expect(runbookRow).toBeVisible({ timeout: 30000 });

    // Open the row action menu and pick "Assign Monitor".
    await runbookRow.locator("a[data-cy='grid-action']").click();
    await page.locator("//span[normalize-space()='Assign Monitor']").click();

    // Assign Monitor drawer — search the device.
    const drawer = page.locator('.ant-drawer-open').last();
    await expect(drawer.getByRole('heading', { name: 'Assign Monitor' })).toBeVisible({ timeout: 15000 });
    await drawer.locator("//input[@placeholder='Search']").first().fill(NCCM_DEVICE_IP);

    // Tick the monitor row.
    const monitorRow = drawer.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first();
    await expect(monitorRow).toBeVisible({ timeout: 15000 });
    await monitorRow.locator('input[type="checkbox"]').first().check();

    // Click Test, assert "Successful" appears in the Test column.
    await drawer.getByRole('button', { name: /^\s*Test\s*$/ }).click();
    await expect(monitorRow.locator('td', { hasText: /^\s*Successful\s*$/i }))
      .toBeVisible({ timeout: 240000 });

    // Confirm assignment.
    await drawer.getByRole('button', { name: /^\s*Assign Monitor\s*$/ }).click();

    // Drawer should close on success.
    await expect(drawer).toBeHidden({ timeout: 30000 });

    // Trigger the runbook via the row's Run (play) button.
    await runbookRow.locator("[data-cy='run']").click();

    // Wait for the spinning rerun loader to finish — the play-circle icon returns
    // when the runbook execution completes.
    await expect(runbookRow.locator("svg.fa-spin, [class*='loading-icon'], svg[data-icon='sync']"))
      .toHaveCount(0, { timeout: 300000 });
    await expect(runbookRow.locator("svg[data-icon='play-circle']")).toBeVisible({ timeout: 60000 });
  });

  test('Verify "Runbook Successful" appears under Last Performed Activity in NCCM Explorer', async () => {
    await page.getByRole('link', { name: /NCCM/i }).click();
    await page.getByRole('tab', { name: 'Explorer' }).click();
    await page.locator("//input[@name='search']").fill(NCCM_DEVICE_IP);

    const row = page.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first();
    await expect(row).toBeVisible({ timeout: 30000 });

    await expect(
      row.locator("button.button-transparent span.text-primary", { hasText: 'Runbook Successful' }).first()
    ).toBeVisible({ timeout: 240000 });
  });

  test('Backup Now triggers Conflict Detected, version 2.0, and updates Overview summaries', async () => {
    // 1. NCCM Explorer → search the device.
    await page.getByRole('link', { name: /NCCM/i }).click();
    await page.getByRole('tab', { name: 'Explorer' }).click();
    await page.locator("//input[@name='search']").fill(NCCM_DEVICE_IP);

    const row = page.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first();
    await expect(row).toBeVisible({ timeout: 30000 });

    // 2. Open row action menu → Back up Now.
    await row.locator("a[data-cy='grid-action']").click();
    await page.locator("//span[normalize-space()='Backup Now']").click();
    // 3. Assert the queued toast appears.
    await expect(
      page.locator('.ant-notification-notice-message', { hasText: /Config backup operation queued/i }).first()
    ).toBeVisible({ timeout: 30000 });

    // 4. Wait for backup to finish → "Conflict Detected" button + Current Version bumps to 2.0.
    await expect(
      row.locator("button.button-transparent span.text-secondary-red", { hasText: 'Conflict Detected' }).first()
    ).toBeVisible({ timeout: 300000 });

    await expect(row.locator("div.ant-tag[title='2.0']").first()).toBeVisible({ timeout: 30000 });

    // 5. Overview tab → verify both conflict summaries list 172.16.14.6.
    await page.getByRole('tab', { name: 'Overview' }).click();

    const baselineSummary = page.locator(
      "//div[@title='Baseline-Running Conflict Summary']/ancestor::*[contains(@class,'panel') or contains(@class,'card') or contains(@class,'__panel')][1]"
    ).first();
    await expect(baselineSummary.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first())
      .toBeVisible({ timeout: 60000 });

    const startupSummary = page.locator(
      "//div[@title='Startup-Running Conflict Summary']/ancestor::*[contains(@class,'panel') or contains(@class,'card') or contains(@class,'__panel')][1]"
    ).first();
    await expect(startupSummary.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first())
      .toBeVisible({ timeout: 60000 });

    // 6. Back to Explorer, open Conflict drawer and verify the inserted "logging host <automation IP>" line,
    //    then run Sync, run another Backup, and finally Compare — asserting Modified=0, Inserted=1, Deleted=0.
    await page.getByRole('tab', { name: 'Explorer' }).click();
    await page.locator("//input[@name='search']").fill(NCCM_DEVICE_IP);

    const explorerRow = page.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first();
    await expect(explorerRow).toBeVisible({ timeout: 30000 });

    // Extract the automation server IP from the env URL (e.g. https://172.16.15.247/ → 172.16.15.247)
    const automationIp = (process.env.Motadata_Aiops || '').match(/\/\/([^/:]+)/)?.[1];
    expect(automationIp, 'Motadata_Aiops env var must be set').toBeTruthy();
    const loggingHostText = `logging host ${automationIp}`;

    // Open the Conflict Detected drawer.
    await explorerRow.locator("button.button-transparent span.text-secondary-red", { hasText: 'Conflict Detected' })
      .first()
      .click();

    // Click the "Inserted" button and assert the logging host line is present.
    const conflictDrawer = page.locator('.ant-drawer-open').last();
    await conflictDrawer.getByRole('button', { name: /Inserted/i }).click();
    await expect(
      conflictDrawer.locator('span.insert.changesScroll', { hasText: loggingHostText }).first()
    ).toBeVisible({ timeout: 30000 });

    // Close the conflict drawer via its top-right close button.
    await conflictDrawer.locator("//div[@class='col text-right']//button[@type='button']").first().click();
    await expect(conflictDrawer).toBeHidden({ timeout: 15000 });

    // 7. Action menu → Sync. Assert queued toast and final "Sync Successful" + "In Sync".
    await explorerRow.locator("a[data-cy='grid-action']").click();
    await page.locator('a#sync').click();
    await expect(
      page.locator('.ant-notification-notice-message', { hasText: /Config sync operation queued/i }).first()
    ).toBeVisible({ timeout: 30000 });

    await expect(
      explorerRow.locator("button.button-transparent span.text-primary", { hasText: 'Sync Successful' }).first()
    ).toBeVisible({ timeout: 300000 });
    await expect(explorerRow.locator('span.text-secondary-green', { hasText: 'In Sync' }).first())
      .toBeVisible({ timeout: 30000 });

    // 8. Action menu → Backup Now. Assert queued toast and "Backup Successful".
    await explorerRow.locator("a[data-cy='grid-action']").click();
    await page.locator('a#backup').click();
    await expect(
      page.locator('.ant-notification-notice-message', { hasText: /Config backup operation queued/i }).first()
    ).toBeVisible({ timeout: 30000 });

    const backupSuccessBtn = explorerRow.locator(
      "button.button-transparent span.text-primary", { hasText: 'Backup Successful' }
    ).first();
    await expect(backupSuccessBtn).toBeVisible({ timeout: 300000 });

    // Open the Backup Successful drawer, then close it.
    await backupSuccessBtn.click();
    await page.locator("//div[@class='col text-right']//button[@type='button']").first().click();

    // 9. Action menu → Compare. Switch left side to Startup config @ version 2.0
    //    and verify diff counts are all zero (0/0/0).
    await explorerRow.locator("a[data-cy='grid-action']").click();
    await page.locator('a#compare').click();

    const compareModal = page.locator('.ant-modal:visible, .ant-drawer-open').last();
    await expect(compareModal).toBeVisible({ timeout: 15000 });

    // Left panel: pick Startup file type.
    await compareModal.locator("input[type='radio'][value='startup.config']").first().check({ force: true });

    // Left panel: change Version to 2.0 (open the first Version dropdown in the modal).
    await compareModal.locator("//label[normalize-space()='Version']/ancestor::div[contains(@class,'ant-form-item')][1]//input[@placeholder='Select']")
      .first()
      .click();
    await page.locator("//li[contains(@class,'ant-dropdown-menu-item')]//span[@title='2.0']").first().click();

    // All three diff counts should now be 0.
    await expect(compareModal.getByRole('button', { name: /Modified/i })
      .locator('span.count.replace')).toHaveText(/^\s*0\s*$/, { timeout: 60000 });
    await expect(compareModal.getByRole('button', { name: /Inserted/i })
      .locator('span.count.insert')).toHaveText(/^\s*0\s*$/);
    await expect(compareModal.getByRole('button', { name: /Deleted/i })
      .locator('span.count.delete')).toHaveText(/^\s*0\s*$/);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
