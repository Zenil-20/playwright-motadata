
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
* Created : 07 May 2026
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

test.describe.serial('Motadata AIOps Discovery Flow For 172.16.10.1 for v2c creds', () => {
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

  test('Create Discovery for Network 172.16.8.2 for v2c creds', async () => {
    await page.getByText('Network', { exact: true }).click();
    await page.locator('input[name="profile-name"]').fill('test discovery for snmpv3');
    await page.locator("//input[@id='ip-address-id']").fill(process.env.Network_Device_172_16_8_2);
    await page.locator("//button[@id='create-credential-btn-id']").click();
    await page.locator("//input[@id='credential-profile-name-id']").fill("testcredentialprofileforsmpv3");
    await page.locator("//div[@title='SNMP V1/V2c']//input[@data-cy='dropdown-trigger-input']").click();
    await page.locator("//span[@title='SNMP V3']").click();
    await page.locator('input[type="text"][name="security-user-name"]').fill(process.env.security_user_name);
    await page.locator('div#security-level-id > div > div > div > span > input').click();
    await page.locator('input[placeholder="Search"][type="text"][data-cy="dropdown-search-input"]').fill('Authentication privacy');
    await page.locator('//span[@title="Authentication Privacy"]').click();
   await page.locator('div#authentication-protocol-id > div > div > div > span > input').click();
   await page.locator('input[placeholder="Search"][type="text"][data-cy="dropdown-search-input"]').fill('sha');
   await page.locator('//span[text() = " SHA "]').click();
   await page.locator("div#privacy-protocol > div > div > div > span > input").click();
   await page.locator('input[placeholder="Search"][type="text"][data-cy="dropdown-search-input"]').fill('aes');
   await page.locator('//span[text() = " AES "]').click();
   await page.locator('input[type="password"][name="authentication-password"]').fill(process.env.security_user_name);
   await page.locator('input[type="password"][name="private-password"]').fill(process.env.security_user_name);
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(process.env.Network_Device_172_16_8_2);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message'))
    .toHaveText('Successful', { timeout: 480000 });
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();

    await page.locator('#save-run-btn-id').click();
    const deviceName = process.env.Network_Device_172_16_8_2;

    expect(deviceName).toBeTruthy(); // ensure env is set

   await expect(
   page.getByText(deviceName, { exact: true })
   ).toBeVisible({ timeout: 480000 });

    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible();
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});