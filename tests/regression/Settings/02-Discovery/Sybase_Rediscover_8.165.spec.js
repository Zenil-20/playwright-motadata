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
 * Created : 5 March 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login } from '../../fixtures/auth.js';

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
   const context = await browser.newContext();
   page = await context.newPage();
   page.setDefaultTimeout(500000);

   await login(page);
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Linux Server', async () => {
    await page.locator("//input[@id='profile-id']").fill('172.16.8.165-linux');
    await page.locator("//input[@id='ip-address-id']").fill(process.env.Sybase_linux_ip);
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('172.16.8.165');
    await page.locator("//input[@id='username-id']").fill(process.env.Sybase_linux_username);
    await page.locator("//input[@id='password-id']").fill(process.env.Sybase_linux_password);
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(process.env.Sybase_linux_ip);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful');
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await page.locator('#save-run-btn-id').click();
    await expect(page.getByRole('gridcell', { name: process.env.Sybase_linux_ip })).toBeVisible({ timeout: 100000 });
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully')).toBeVisible();
    await closeProvisionStatus(page);
  });

  test('Rediscover for Sybase Database', async () => {
await page.locator("//input[@placeholder='Search']").first().fill('Rediscover Settings');
await page.getByRole('link', { name: 'Rediscover Settings' }).click();
await page.locator("//input[@name='search']").fill('weekly');
await page.waitForTimeout(1000); // 1 second pause
await page.locator('#start-rediscovery').click();
  await page.locator('input[name="search"]').nth(1).fill('sybase', { timeout: 128000 });
  const row = page.locator(".rediscover-row")
    .filter({ hasText: "Sybase" })
    .filter({ hasText: "172.16.8.165" });
  await row.waitFor({ state: "attached" });
  await row.scrollIntoViewIfNeeded();
  await row.waitFor({ state: "visible" });
  await row.click({ force: true });
  await page.locator("//input[@id='instance-jdbc']").click();
  await page.locator("//input[@id='instance-jdbc']").fill(process.env.Sybase_instance_name);
  await page.locator('#create-credential-btn-id').click();
  await page.locator("//input[@id='credential-profile-name-id']").fill("172.16.8.165-sybase");
  await page.locator("//input[@id='username-id']").fill(process.env.Sybase_username);
  await page.locator("//input[@id='password-id']").fill(process.env.Sybase_password);
  await page.locator("//button[@id='create-credential-profile-btn-id']").click();
  await page.locator("//button[@id='run']").click();
  await page.locator("//button[@id='confirm-yes']").click();
  try {
  await row.waitFor({ state: "visible", timeout: 60000 });
  throw new Error("Sybase Rediscovery failed");
} catch (error) {
  console.log("Successfully provisioned sybase rediscovery");
}
  await page.locator('//div[@class="ant-drawer ant-drawer-right ant-drawer-open rediscover-result-drawer discovery-boat-panel"]//button[2]').click();
  await page.locator("//input[@placeholder='Search']").first().fill('device monitor settings');
  await page.getByRole('link', { name: 'Device Monitor Settings' }).click();
  await page.waitForTimeout(1000);
  await page.locator("//input[@placeholder='Search']").nth(1).fill('172.16.8.165', { timeout: 128000 } );
  // The Rediscover Result drawer surfaces a "Sybase" card per discovered host (here
  // 172.16.8.165 and 172.21.0.1), so an unscoped getByText is a strict-mode violation.
  // The first card is the searched host (172.16.8.165) — scope to it.
  await expect(page.getByText('Sybase').first()).toBeVisible({ timeout: 120000 });
  await page.waitForTimeout(1000);
  await page.locator('svg[data-icon="ellipsis-v"]').click();
  await page.locator("#metric-collection-time").click();
  await expect(page.getByRole('tab', { name: 'Sybase' })).toBeVisible();
  const updateBtn = page.locator('#update-metric-collection-time');
  await expect(updateBtn).toBeVisible({ timeout: 30000 });
  await expect(updateBtn).toBeEnabled();
  await updateBtn.click();
  });

 test.afterAll(async () => {
  if (page && !page.isClosed()) {
    await page.close();
  }
});
});
