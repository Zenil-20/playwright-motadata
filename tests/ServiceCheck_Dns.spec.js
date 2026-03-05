
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

test.describe.serial('Motadata AIOps Discovery Flow For Service check dns Discovery', () => {
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

  test('Create Discovery for Service check dns', async () => {
    await page.getByText('Service Check', { exact: true }).click();
    await page.locator('input[name="profile-name"]').fill('172.16.8.57');
    await page.locator('#service-type-id').click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill('dns');
    await page.locator("//span[normalize-space()='DNS']").click();
    await page.locator("//span[normalize-space()='IP/Host']").click();
    await page.locator("//input[@id='ip-address-id']").fill("172.16.10.134");
    await page.locator("//input[@id='lookup-address-id']").fill("bhavyaqa.local");
    await page.locator("//div[@id='dns-id']//input[@placeholder='Select']").click();
    await page.locator('#A').first().click();
    await page.locator('#save-run-btn-id').click();
    await expect(page.getByText("172.16.10.134").first()).toBeVisible({ timeout: 480000 });
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