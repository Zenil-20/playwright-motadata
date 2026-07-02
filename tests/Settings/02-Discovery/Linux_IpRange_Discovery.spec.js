
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
 * Created : 1 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// The provision-status popup renders as a role=document popover (NOT role=dialog), so a
// dialog-scoped match is unreliable and a bare svg[data-icon="times"] click can hit a
// page-header icon instead (strict-mode violation / wrong element). Target the cross <a>
// inside the flex header that holds the "Provision Status" heading.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}

test.describe.serial('Motadata AIOps Discovery Flow For Linux Server Discovery', () => {
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

  test('Create Discovery for Linux Devices Ip Ranged based', async () => {
    await page.locator("//input[@id='profile-id']").fill('Linux Server IP Range');
    // Select IP Range radio and fill the range
    await page.locator("//label[@class='ant-radio-button-wrapper']//span[contains(text(),'IP Range')]").click();
    await page.locator("//input[@id='ip-range-id']").fill(process.env.Linux_IpRange_Discovery_ip_range);
    // Exclude IP range
    await page.locator("//div[@id='exclude-ipType']//span[contains(text(),'IP Range')]").click();
    await page.locator("//input[@placeholder='e.g. IP Range']").fill(process.env.Linux_IpRange_Discovery_Excluded_ip_range);
    await page.locator("//form[@class='flex-grow flex ant-form ant-form-vertical']//button[@type='submit']").click();
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('Linux Device IP Range Credential');
    await page.locator("//input[@id='username-id']").fill(process.env.Linux_IpRange_Discovery_Credential_username);
    await page.locator("//input[@id='password-id']").fill(process.env.Linux_IpRange_Discovery_Credential_password);
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(process.env.Linux_server_172_16_15_132);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful', { timeout: 120000 });
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await expect(page.locator("//button[@id='create-credential-profile-btn-id']")).toBeHidden({ timeout: 10000 });
    await page.locator('#save-run-btn-id').click();
    await expect(page.locator("//div[contains(text(),'Discovered Objects')]")).toBeVisible({ timeout: 120000 });
    await page.locator('input[type="checkbox"]').nth(0).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect.soft(page.getByText('provisioned successfully').first()).toBeVisible();
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
