
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
 * Created : 25 February 2026
 */ 

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For Nutanix Discovery', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // Create a single browser context and page shared across all tests
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(90000);
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 90000 });
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Nutanix Virtualization', async () => {
    await page.locator("//div[contains(text(),'HCI')]").click();
    await page.locator("//a[normalize-space()='Nutanix']").click();
    

    await page.getByRole('textbox', { name: 'Must be unique' }).fill('172.16.10.212-Nutanix');
    await page.getByRole('textbox', { name: 'e.g. 192.168.1.1 or fd00::1' }).fill(process.env.Nutanix_ip);

    await page.getByRole('button', { name: 'Create Credential Profile' }).click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('172.16.10.212-Nutanix-Credential');
    await page.locator("//input[@id='username-id']").first().fill(process.env.Nutanix_username);
    await page.locator("//input[@id='password-id']").first().fill(process.env.Nutanix_password);

    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();
    await page.getByRole('button', { name: 'Save and Run' }).click();

    await expect(page.getByText(process.env.Nutanix_ip)).toBeVisible({ timeout: 90000 });

    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.getByRole('button', { name: 'Add Selected' }).click();

    // Verify the Provision Status dialog appears with at least one success message
    const provisionDialog = page.getByRole('dialog', { name: 'Provision Status' });
    await expect(provisionDialog).toBeVisible();
    await expect(provisionDialog.getByText('provisioned successfully').first()).toBeVisible();
    
    // Close the dialog using the X button
    await page.locator('.svg-inline--fa.fa-times.fa-w-16.fa-lg').click();

    await page.locator("//input[@name='discovery-search']").fill(process.env.Nutanix_ip);
    await expect(page.getByRole('link', { name: '172.16.10.212-Nutanix' })).toBeVisible();
    await expect(page.getByAltText('Prism')).toBeVisible();
    await expect(page.getByRole('gridcell', { name: process.env.Nutanix_ip })).toBeVisible();
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
