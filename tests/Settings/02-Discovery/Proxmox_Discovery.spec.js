
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
    await login(page);
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
    await page.locator('.ant-drawer-mask').waitFor({ state: 'hidden' }).catch(() => {});
    await page.waitForTimeout(200); 
    await page.getByRole('link', { name: 'Discovery Profile' }).click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
    await page.getByText('Virtualization', { exact: true }).click();
    await page.getByRole('link', { name: 'Proxmox VE' }).click();
    await page.getByRole('textbox', { name: 'Must be unique' }).fill('discoverproxmox');
    await page.getByRole('textbox', { name: 'e.g. 192.168.1.1 or fd00::1' }).fill(process.env.Proxmox_ip);
    // Open credential drawer and fill fields (scoped to drawer to avoid conflicts)
    const tags = ['pr0oxmox', 'Automation@zen', 'sp@#$%^^&*()sp'];

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

    // Hostname 'motadata' is already provisioned — rename it inline before adding.
    // Clicking the name span turns it into an input; do not click elsewhere in between.
    const discoveredRow = page.locator('tr.k-master-row', {
      has: page.locator('td', { hasText: process.env.Proxmox_ip })
    }).first();
    await discoveredRow.locator('span.text-ellipsis').first().click();
    // The first input in the row is the row checkbox; the name field is the textbox.
    const nameInput = discoveredRow.getByRole('textbox').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('proxmox');
    await nameInput.press('Enter');
    await expect(discoveredRow.locator('span.text-ellipsis', { hasText: 'proxmox' }).first())
      .toBeVisible({ timeout: 10000 });

    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.getByRole('button', { name: 'Add Selected' }).click();

    const successMessages = page.getByText('provisioned successfully');
    await expect(successMessages.first()).toBeVisible();
    await closeProvisionStatus(page);
    await page.locator("input[placeholder='Search']").first().fill("device monitor settings", { timeout: 60000 });
    page.getByRole('link', { name: 'Device Monitor Settings' }).click();
    await page.waitForTimeout(1000);
    await page.locator("//input[@placeholder='Search']").nth(1).fill('proxmox', { timeout: 128000 } );
    await expect(page.locator('img[alt="Proxmox VE"]')).toBeVisible();
    await expect(page.getByRole('gridcell', { name: '172.16.12.117' }).first()).toBeVisible();
    await expect(page.locator('[title="Virtualization > Proxmox VE"]')).toBeVisible();
    const rows = page.locator('tr.k-master-row');
    await expect(rows).toHaveCount(1, { timeout: 10000 });
    await expect(rows.first()).toBeVisible();
    await rows.first().locator('.anticon.excluded-header-icon').click();
    await page.locator("//span[normalize-space()='Edit']").click();
    for (const tag of tags) {
    await expect(page.getByText(tag.toLowerCase(), { exact: true })).toBeVisible();
    }
    await page.locator('svg[data-icon="close"]').click();
    });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
