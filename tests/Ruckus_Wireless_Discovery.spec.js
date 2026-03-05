
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
 * Created : 18 February 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

test.describe.serial('Motadata AIOps Discovery Flow For Ruckus Wireless Discovery', () => {
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
    await page.locator("//input[@placeholder='Username']").fill('admin');
    await page.locator("//input[@placeholder='Password']").fill('admin');
    await page.locator("//button[@type='submit']").click();
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Ruckus Wireless', async () => {
    await page.getByText('Wireless', { exact: true }).click();
    await page.getByRole('link', { name: 'Ruckus Wireless' }).click();
    await page.locator('input[name="profile-name"]').fill('discoverruckus');
    await page.locator('input[name="wireless-ip-address"]').fill(process.env.Ruckus_Wireless_10_20_40_4);
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('ruckuscred');
    await page.locator("//input[@id='username-id']").fill("mind123");
    await page.locator("//input[@id='password-id']").fill("Mind@123");
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await page.locator("#device-model").click();
    await page.locator("//span[@title='SmartZone']").click();
    await page.locator("//span[normalize-space()='HTTPS']").click();
    await page.locator('input[name="port"]').fill('8443');
    await page.locator('#save-run-btn-id').click();
    await expect(page.getByText(process.env.Ruckus_Wireless_10_20_40_4)).toBeVisible();
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible();
    await page.locator('svg[data-icon="times"]').click();
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});