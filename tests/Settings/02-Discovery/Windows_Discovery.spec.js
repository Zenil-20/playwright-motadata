
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
 * Created : 14 February 2026
 */ 

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For Windows Server Discovery', () => {
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
     await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Linux Server', async () => {
    //For Windows Select Windows Type
    await page.locator("//a[normalize-space()='Windows']").click();
    await page.locator("//input[@id='profile-id']").fill('172.16.10.134-Device');
    await page.locator("//input[@id='ip-address-id']").fill(process.env.Windows_server_172_16_10_134);
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('172.16.10.134-Device');
    await page.locator("//input[@id='username-id']").fill(process.env.Windows_server_172_16_10_134_username);
    await page.locator("//input[@id='password-id']").fill(process.env.Windows_server_172_16_10_134_password);
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(process.env.Windows_server_172_16_10_134);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful', { timeout: 120000 });
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await expect(page.locator("//button[@id='create-credential-profile-btn-id']")).toBeHidden({ timeout: 10000 });
    await page.locator('#save-run-btn-id').click({ force: true });
    await expect(page.getByText(process.env.Windows_server_172_16_10_134).first()).toBeVisible();
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully')).toBeVisible();
    await page.locator('svg[data-icon="times"]').click();
  });

  test('Postgresql Rediscovery For Windows Server', async () => {
    test.setTimeout(300000);

    await page.locator("//input[@placeholder='Search']").first().fill('Rediscover Settings');
    await page.getByRole('link', { name: 'Rediscover Settings' }).click();
    /*
    await page.getByRole('button', { name: 'Create Scheduler' }).click();
    await page.locator("//span[@class='flex flex-1 min-w-0 overflow-hidden monitor-type-picker']//input[@placeholder='Select']").click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill('postgresql');
    await page.locator("//input[@data-cy='dropdown-search-input']").press('Enter');
    await page.getByRole('textbox', { name: '@User or Email or /Handle or' }).fill("zenil.kapadia@motadata.com");
    await page.getByRole('textbox', { name: '@User or Email or /Handle or' }).press('Enter');
    await page.locator("//div[@id='schedule-time-picker']//input[@placeholder='Select']").click();
    await page.locator("input[type='checkbox']").nth(0).check();
    */
   //new code
   await page.getByRole('button', { name: 'Create Scheduler' }).click();
  await page.locator('#applications > .ant-row > .ant-form-item-control-wrapper > .ant-form-item-control > .ant-form-item-children > .flex.flex-1.min-w-0.overflow-hidden > .v-popover > .trigger > div > .flex.flex-1.flex-col.min-w-0.w-full > .flex.flex-1 > .flex > .dropdown-trigger-input > .ant-input-affix-wrapper > .ant-input-suffix > .anticon > .svg-inline--fa').click();
  await page.getByRole('textbox', { name: 'Search' }).nth(2).click();
  await page.getByRole('textbox', { name: 'Search' }).nth(2).fill('postgresql');
  await page.locator('#PostgreSQL > .ant-checkbox-wrapper > .ant-checkbox > .ant-checkbox-input').check();
  await page.locator('.anticon.cursor-pointer.text-neutral-light.dropdown-icon.is-open > .svg-inline--fa').click();
  await page.locator('#hours').getByRole('textbox', { name: 'Select' }).click();
  await page.getByRole('menuitem', { name: '00:00' }).getByLabel('', { exact: true }).check();
  await page.locator('.anticon.cursor-pointer.text-neutral-light.dropdown-icon.is-open > .svg-inline--fa').click();
  await page.getByRole('textbox', { name: '@User or Email or /Handle or' }).click();
  await page.getByRole('textbox', { name: '@User or Email or /Handle or' }).fill('zenilkapadia@motadata.com');
  await page.locator("//button[@id='submit-btn']").click();
  await page.locator('input[name="search"]').click();
  await page.locator('input[name="search"]').fill('postgresql');
  await page.locator("#start-rediscovery").first().click();
  const row = page.locator(".rediscover-row")
    .filter({ hasText: "PostgreSQL" })
    .filter({ hasText: "172.16.10.134" });
  await row.waitFor({ state: "attached", timeout: 180000 });
  await row.scrollIntoViewIfNeeded();
  await row.waitFor({ state: "visible", timeout: 180000 });
  await row.click({ force: true });
  await page.locator("//input[@id='instance-jdbc']").click();
  await page.locator("//input[@id='instance-jdbc']").fill("postgres");
  await page.locator('#create-credential-btn-id').click();
  await page.locator("//input[@id='credential-profile-name-id']").fill("172.16.10.134_postgresql");
  await page.locator("//input[@id='username-id']").fill("postgres");
  await page.locator("//input[@id='password-id']").fill("Mind@123");
  await page.locator("//button[@id='create-credential-profile-btn-id']").click();
  await page.locator("//button[@id='run']").click();
  await page.locator("//button[@id='confirm-yes']").click();
  await page.locator('//div[@class="ant-drawer ant-drawer-right ant-drawer-open rediscover-result-drawer discovery-boat-panel"]//button[2]').click();
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
