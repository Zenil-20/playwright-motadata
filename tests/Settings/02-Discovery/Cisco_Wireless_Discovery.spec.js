
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
 * Created : 14 February 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// The provision-status popup renders as a role=document popover (NOT role=dialog), so a
// dialog-scoped match times out. Target the cross <a> inside the flex header that holds
// the "Provision Status" heading — this also avoids the page-level times icons.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}
test.describe.serial('Motadata AIOps Discovery Flow For Cisco Wireless Discovery', () => {
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
    await login(page);
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Cisco Wireless', async () => {
    await page.getByText('Wireless', { exact: true }).click();
    await page.getByRole('link', { name: 'Cisco Wireless' }).click();
    await page.locator('input[name="profile-name"]').fill('ciscowirelessdiscovery');
    await page.locator('input[name="wireless-ip-address"]').fill(process.env.Cisco_Wireless_172_16_9_44);
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('ciscowirelesscredential');
    await page.locator("//div[@id='version-id']//input[@placeholder='Select']").click();
    await page.getByRole('menuitem', { name: 'V2c' }).click();
    await page.locator("//input[@id='community-id']").fill('public');
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(process.env.Cisco_Wireless_172_16_9_44);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful');
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await page.locator('#save-run-btn-id').click();
    await expect(page.getByText(process.env.Cisco_Wireless_172_16_9_44)).toBeVisible({ timeout: 60000 });
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible();
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
