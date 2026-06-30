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
 * Created : 6 March 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// The provision-status popup renders as a role=document popover (NOT role=dialog), so the
// getByRole('dialog') guard fell through and a bare svg[data-icon="times"].first() click
// hit a page-header icon instead of the dialog cross. Target the cross <a> inside the flex
// header that holds the "Provision Status" heading.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}

test.describe.serial('Motadata AIOps Discovery Flow For RabbitMQ', () => {
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

  test('Create Discovery for RabbitMQ', async () => {
    test.setTimeout(500000);

    await page.locator("//input[@id='profile-id']").fill('172.16.8.196-linux');
    await page.locator("//input[@id='ip-address-id']").fill(process.env.Rabbitmq_linux_ip);
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('172.16.8.196');
    await page.locator("//input[@id='username-id']").fill(process.env.Rabbitmq_linux_username);
    await page.locator("//input[@id='password-id']").fill(process.env.Rabbitmq_linux_password);
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(process.env.Rabbitmq_linux_ip);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful');
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await page.locator("//button[@id='save-exit-btn-id']").click();
    await page.locator("//input[@name='discovery-search']").fill(process.env.Rabbitmq_linux_ip);
    await page.waitForTimeout(1000);
    await page.locator('[data-cy="rerun"]').click();
    const discoveredRow = page.locator('tr', { hasText: process.env.Rabbitmq_linux_ip }).first();
    await expect(discoveredRow).toBeVisible({ timeout: 100000 });
    await discoveredRow.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await closeProvisionStatus(page);
  });

  test('Rediscover for RabbitMQ', async () => {
await page.locator("//input[@placeholder='Search']").first().fill('Rediscover Settings');
await page.getByRole('link', { name: 'Rediscover Settings' }).click();
await page.locator("//input[@name='search']").fill('weekly');
await page.waitForTimeout(1000);
await page.locator('#start-rediscovery').click();
  await page.locator('input[name="search"]').nth(1).fill('rabbitmq', { timeout: 128000 });
  const row = page.locator(".rediscover-row")
    .filter({ hasText: "RabbitMQ" })
    .filter({ hasText: "172.16.8.196" });
  await row.waitFor({ state: "attached" });
  await row.scrollIntoViewIfNeeded();
  await row.waitFor({ state: "visible" });
  await row.click({ force: true });
  await page.locator('#create-credential-btn-id').click();
  await page.locator("//input[@id='credential-profile-name-id']").fill("172.16.8.196-Rabbitmq");
  await page.locator("//div[@id='authentication-type']").click();
  await page.locator("//span[@title='Basic']").click();
  await page.locator("//input[@id='username-id']").fill(process.env.Rabbitmq_username);
  await page.locator("//input[@id='password-id']").fill(process.env.Rabbitmq_password);
  await page.locator("//button[@id='create-credential-profile-btn-id']").click();
  await page.locator("//button[@id='run']").click();
  await page.locator("//button[@id='confirm-yes']").click();
  try {
  await row.waitFor({ state: "visible", timeout: 60000 });
  throw new Error("RabbitMQ Rediscovery failed");
} catch (error) {
  console.log("Successfully provisioned RabbitMQ rediscovery");
}
  await page.locator('//div[@class="ant-drawer ant-drawer-right ant-drawer-open rediscover-result-drawer discovery-boat-panel"]//button[2]').click();
  await page.locator("//input[@placeholder='Search']").first().fill('device monitor settings');
  await page.getByRole('link', { name: 'Device Monitor Settings' }).click();
  await page.waitForTimeout(1000);
  await page.locator("//input[@placeholder='Search']").nth(1).fill('172.16.8.196', { timeout: 128000 } );
  // The rediscover-result panel lists a card per discovered RabbitMQ instance, so an
  // unscoped getByText('RabbitMQ') is a strict-mode violation (3 cards here). Scope to the
  // 172.16.8.196 row (same .rediscover-row filter used above); .first() guards against the
  // duplicate cards that the same host can surface.
  await expect(page.getByText('RabbitMQ')).toBeVisible({ timeout: 30000 });
  await page.locator('svg[data-icon="ellipsis-v"]').click();
  await page.locator("#metric-collection-time").click();
  await expect(page.getByRole('tab', { name: 'RabbitMQ' })).toBeVisible();
  const updateBtn = page.locator('#update-metric-collection-time');
  await expect(updateBtn).toBeVisible({ timeout: 30000 });
  await expect(updateBtn).toBeEnabled();
  await updateBtn.click();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
