
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

test.describe.serial('Motadata AIOps Discovery Flow For vCenter Discovery', () => {
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

  test('Create Discovery for vCenter Virtualization', async () => {
    await page.getByText('Virtualization', { exact: true }).click();
    await page.getByRole('link', { name: 'VMWare' }).click();

    await page.getByRole('textbox', { name: 'Must be unique' }).fill('172.16.10.180-Vcenter');
    await page.getByRole('textbox', { name: 'e.g. 192.168.1.1 or fd00::1' }).fill(process.env.vCenter_Server_172_16_10_180);

    // Open credential drawer and fill fields (scoped to drawer to avoid conflicts)
    await page.getByRole('button', { name: 'Create Credential Profile' }).click();
    const credentialDrawer = page.locator('.ant-drawer-open');
    await credentialDrawer.getByRole('textbox', { name: 'Must be unique' }).fill('172.16.10.180-vCenter-Credential');
    await page.locator("//input[@id='username-id']").first().fill(process.env.vCenter_Server_172_16_10_180_username);
    await page.locator("//input[@id='password-id']").first().fill(process.env.vCenter_Server_172_16_10_180_password);

    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();
    await page.getByRole('button', { name: 'Save and Run' }).click();

    await expect(page.getByText(process.env.vCenter_Server_172_16_10_180)).toBeVisible();

    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.getByRole('button', { name: 'Add Selected' }).click();

    await expect(page.getByText('provisioned successfully')).toBeVisible();
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
