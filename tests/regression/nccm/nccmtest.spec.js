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

dotenv.config({ path: '.env', quiet: true });

const NCCM_DEVICE_IP = '172.16.14.6';
const RUNBOOK_NAME = 'Enable Cisco System Syslog';

test.describe.serial('Motadata AIOps NCCM Actions for 172.16.14.6', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(90000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 90000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await expect(page.locator("//img[@alt='Avatar']")).toBeVisible();
  });

  test('dummy func byu zenil', async () => {
        // Sync + Backup each poll up to 5 min; give the whole test room to finish.
        test.setTimeout(90000);
        // Navigate into the NCCM module first — after login the page sits on the
        // default dashboard, where the Explorer tab does not exist.
        await page.getByRole('link', { name: 'NCCM' }).click();
        await page.waitForURL('**/nccm/**', { timeout: 60000 });
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
        await page.setDefaultTimeout(15000);
        // Click the "Inserted" button and assert the logging host line is present.
        // The conflict view opens as an ant-modal (Comparison View), not a drawer.
        const conflictDrawer = page.locator('.ant-modal:visible, .ant-drawer-open').last();
        await expect(conflictDrawer).toBeVisible({ timeout: 15000 });
        await conflictDrawer.getByRole('button', { name: /Inserted/i }).click();
        await expect(
          conflictDrawer.locator('span.insert.changesScroll', { hasText: loggingHostText }).first()
        ).toBeVisible({ timeout: 30000 });
    
        // Close the conflict modal via its header close (X) button. This modal uses a
        // custom icon button (no .ant-modal-close, no accessible name) — it's the first
        // button in the dialog, since the header renders before the diff/filter buttons.
        await conflictDrawer.getByRole('button').first().click();
        await expect(conflictDrawer).toBeHidden({ timeout: 15000 });
    
        // 7. Action menu → Sync. Assert queued toast and final "Sync Successful" + "In Sync".
        await explorerRow.locator("a[data-cy='grid-action']").click();
        await page.locator('a#sync').click();
        await expect(
          page.locator('.ant-notification-notice-message', { hasText: /Config sync operation queued/i }).first()
        ).toBeVisible({ timeout: 30000 });
    
        await expect(
          explorerRow.locator("button.button-transparent span.text-primary", { hasText: 'Sync Successful' }).first()
        ).toBeVisible({ timeout: 90000 });
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
        await expect(backupSuccessBtn).toBeVisible({ timeout: 90000 });
    
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
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});