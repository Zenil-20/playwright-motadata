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
 * Author  : Zenil Kapadia
 * Created : 23 February 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Create Netroute', () => {
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

  test('Navigate to Netroute Settings and Create a Netroute', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('netroute settings');
    await page.getByRole('link', { name: 'NetRoute Settings' }).click();
    await page.locator('#create-netroute-btn').click();
    await page.locator("//input[@id='path-name']").fill('www.chatgpt.com');
    await page.locator("//input[@id='destination']").fill('www.chatgpt.com');
    await page.locator("//input[@id='port-id']").fill('443');
    await page.locator('[data-cy="dropdown-trigger-input"]').first().click();
    await page.locator("//input[@id='assign-monitor-search']").fill('172.16.8.61');

  const checkbox = await page.locator('.ant-checkbox-input').first();
  await expect(checkbox).toBeVisible({ timeout: 5000 });
  await checkbox.evaluate(node => node.parentElement.click());
//   await expect(checkbox).toBeChecked({ timeout: 5000 });

  const submitBtn = page.locator("//button[@id='submit-btn']");
  await expect(submitBtn).toBeVisible({ timeout: 5000 });
  await expect(submitBtn).toBeEnabled(); // Ensure button is enabled
  await submitBtn.click();
    await page.locator("//input[@name='netroute-search']").fill('www.chatgpt.com');
    await expect(page.getByRole('table')).toContainText('www.chatgpt.com');
  });

  test('Logout from AIOps', async () => {
    const drawerCloseButton = page.locator('.ant-drawer-close').last();
    if (await drawerCloseButton.isVisible().catch(() => false)) {
      await drawerCloseButton.click();
      await expect(drawerCloseButton).toBeHidden({ timeout: 10000 });
    }

    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

});
