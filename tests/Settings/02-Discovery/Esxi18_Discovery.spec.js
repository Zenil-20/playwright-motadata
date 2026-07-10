
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
 * Created : 15 February 2026
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

const APP_USERNAME = process.env.Motadata_Username;
const APP_PASSWORD = process.env.Motadata_Password;

test.describe.serial('Motadata AIOps Discovery Flow For Esxi-18 Discovery', () => {
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

  test('Create Discovery for Esxi-18 Virtualization', async () => {
    await page.getByText('Virtualization', { exact: true }).click();
    await page.getByRole('link', { name: 'VMWare' }).click();

    // We have to do the discovery for esxi
    await page.locator("//span[normalize-space()='ESX/ESXi']").click();

    await page.getByRole('textbox', { name: 'Must be unique' }).fill('discoveresxi18');
    await page.getByRole('textbox', { name: 'e.g. 192.168.1.1 or fd00::1' }).fill(process.env.Esxi_Host_172_16_10_18);

    await page.getByRole('button', { name: 'Create Credential Profile' }).click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('172.16.10.18-Esxi-Credential');
    await page.locator("//input[@id='username-id']").first().fill(process.env.Esxi_Host_172_16_10_18_username);
    await page.locator("//input[@id='password-id']").first().fill(process.env.Esxi_Host_172_16_10_18_password);

    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();
    await page.getByRole('button', { name: 'Save and Run' }).click();

    await expect(page.getByText(process.env.Esxi_Host_172_16_10_18)).toBeVisible({ timeout: 400000 });

    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.getByRole('button', { name: 'Add Selected' }).click();

    // Verify the Provision Status dialog appears with at least one success message
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    
    // Close the dialog using the X button
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
