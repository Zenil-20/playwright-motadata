
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
 * Created : 27 February 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For MongoDB Discovery', () => {
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

  test('Create Discovery for MongoDB Server', async () => {
    await page.getByText('Database', { exact: true }).click();
    await page.locator("//input[@data-cy='dropdown-trigger-input']").first().click();
    await page.locator("//span[@title='MongoDB']").click();
    await page.locator("//input[@id='profile-id']").fill('MongoDB Database');
    await page.locator("//input[@id='ip-address-id']").fill(process.env.MongoDB_ip);
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('172.16.8.137-MongoDB Server');
    await page.locator("//input[@id='username-id']").fill(process.env.MongoDB_username);
    await page.locator("//input[@id='password-id']").fill(process.env.MongoDB_password);
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await page.locator('#save-run-btn-id').click();
    await expect(page.getByText(process.env.MongoDB_ip).first()).toBeVisible();
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully')).toBeVisible();
    await page.locator("//i[@class='anticon text-neutral-light']//*[name()='svg']").click();
    await page.locator("//input[@name='discovery-search']").fill(process.env.MongoDB_ip);
    await expect(page.getByRole('gridcell', { name: process.env.MongoDB_ip })).toBeVisible();
    await expect(page.getByRole('img', { name: 'MongoDB' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'MongoDB Database' })).toBeVisible();
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});