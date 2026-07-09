
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
 * Created : 7 February 2026
 */ 

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For Proxmox Discovery', () => {
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
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to Credential Profile and create credential profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('credential profile');
    await page.getByRole('link', { name: 'Credential Profile' }).click();
    await page.getByRole('button', { name: 'Create Credential Profile' }).click();
    const credentialDrawer = page.locator('.ant-drawer-open');
    await credentialDrawer.getByRole('textbox', { name: 'Must be unique' }).fill('credentialforproxmox');
    await page.locator("//input[@placeholder='Select']").click();
    await page.locator("input[data-cy-id='protocol']").fill('https');
    await page.locator("//span[@title='HTTP/HTTPS']").click();
    await page.locator('input#username-id').fill(process.env.Proxmox_username);
    await page.locator('input#password-id').fill(process.env.Proxmox_password);
    await page.getByRole('button', { name: 'Add Credential Profile' }).click();

  });

  test('Create Discovery for Proxmox Virtualization', async () => {
    await page.locator("input[placeholder='Search']").first().fill("discovery profile");
    await page.getByRole('link', { name: 'Discovery Profile' }).click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
    await page.getByText('Virtualization', { exact: true }).click();
    await page.getByRole('link', { name: 'Proxmox VE' }).click();

    await page.getByRole('textbox', { name: 'Must be unique' }).fill('discoverproxmox');
    await page.getByRole('textbox', { name: 'e.g. 192.168.1.1 or fd00::1' }).fill(process.env.Proxmox_ip);

    // Open credential drawer and fill fields (scoped to drawer to avoid conflicts)
    const tags = ['PROXMOx', 'Automation@zen', 'sp@#$%^^&*()sp'];

    const tagBox = page.locator('[role="combobox"]');

    await tagBox.click();

    for (const tag of tags) {
          await page.keyboard.type(tag);
          await page.keyboard.press('Enter');
        }
    await page.locator("//input[@id='profile-name']").click();
    await page.locator("//div[@id='credential-profile-picker-id']").click();
    const searchInput = page.locator("input[data-cy='dropdown-search-input']");
    await searchInput.fill('credentialforproxmox');
    await searchInput.press('Enter');
    await page.getByRole('button', { name: 'Save and Run' }).click();

    await expect(page.getByText(process.env.Proxmox_ip)).toBeVisible();

    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.getByRole('button', { name: 'Add Selected' }).click();

    const successMessages = page.getByText('provisioned successfully');
    await expect(successMessages.first()).toBeVisible();
    await page.locator('.svg-inline--fa.fa-times.fa-w-16.fa-lg').click();
    await page.locator("input[placeholder='Search']").first().fill("device monitor settings", { timeout: 60000 });
    page.getByRole('link', { name: 'Device Monitor Settings' }).click();
    await page.waitForTimeout(1000);
    await page.locator("//input[@placeholder='Search']").nth(1).fill('proxmox', { timeout: 128000 } );
    await expect(page.locator('img[alt="Proxmox VE"]')).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '172.16.12.117' }).first()).toBeVisible();
    await expect(page.locator('[title="Virtualization > Proxmox VE"]')).toBeVisible();
    await page.locator("//i[@class='anticon excluded-header-icon']").click();
    await page.locator("//span[normalize-space()='Edit']").click();
    for (const tag of tags) {
    await expect(page.getByText(tag.toLowerCase(), { exact: true })).toBeVisible();
    }
    await page.locator('svg[data-icon="close"]').click();
    });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
