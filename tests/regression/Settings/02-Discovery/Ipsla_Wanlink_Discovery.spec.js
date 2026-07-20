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
 * Created : 27 February 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For ipsla_wanlink', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(90000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 90000 });
    await page.locator("//input[@placeholder='Username']").fill('admin');
    await page.locator("//input[@placeholder='Password']").fill('admin');
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

  test('Create Discovery for Network 172.16.14.51-52 for v1 creds', async () => {
    await page.getByText('Network', { exact: true }).click();
    await page.locator("//span[normalize-space()='IP Range']").click();
    await page.locator('input[name="profile-name"]').fill('172.16.14.51-52');
    await page.locator("//input[@id='ip-range-id']").fill(process.env.ipsla_wanlink_Discovery_ip_range);

    await page.locator('#credential-profile-picker-id').click();
    const searchInput = page.locator("//input[@data-cy='dropdown-search-input']");
    await searchInput.fill("Default SNMP");
    await searchInput.press('Enter');

    await page.locator('#save-run-btn-id').click();

    const deviceName = process.env.ipsla_wanlink_Discovery_ip_range;
    expect(deviceName).toBeTruthy();
    await expect(page.getByText(deviceName, { exact: false })).toBeVisible({ timeout: 90000 });

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible();
    await page.locator('svg[data-icon="times"]').click();
  });

  test('Create write private and write public credentials', async () => {
    await page.getByRole('link', { name: 'Credential Profile' }).click();

    // Write Public
    let createBtn = page.locator("//button[@id='create-credential-profile-btn']");
    await createBtn.waitFor({ state: 'visible', timeout: 90000 });
    await expect(createBtn).toBeEnabled({ timeout: 90000 });
    await createBtn.click();
    await page.locator("//input[@placeholder='Select']").click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill("SNMP V1/V2c");
    await page.locator("//span[@title='SNMP V1/V2c']").click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('write public');
    await page.locator('#version-id').click();
    await page.locator("//span[@title='V2c']").click();
    await page.locator("//input[@id='community-id']").fill('public');
    await page.locator("//input[@id='write-community-id']").fill('public');
    await page.locator("//button[@id='credential-profile-submit-btn']").click();
    // Wait for the new profile to appear in the table
    await expect(page.getByText('write public')).toBeVisible({ timeout: 10000 });

    // Wait for UI to be ready for next action
    await page.waitForTimeout(1000);

    // Write Private
    createBtn = page.locator("//button[@id='create-credential-profile-btn']"); // reacquire locator after DOM update
    await createBtn.waitFor({ state: 'visible', timeout: 90000 });
    await expect(createBtn).toBeEnabled({ timeout: 90000 });
    await createBtn.click();
    await page.locator("//input[@placeholder='Select']").click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill("SNMP V1/V2c");
    await page.locator("//span[@title='SNMP V1/V2c']").click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('write private');
    await page.locator('#version-id').click();
    await page.locator("//span[@title='V2c']").click();
    await page.locator("//input[@id='community-id']").fill('private');
    await page.locator("//input[@id='write-community-id']").fill('private');
    await page.locator("//button[@id='credential-profile-submit-btn']").click();
  });

  test('Provision WAN link service with write private and public creds and validate inventory', async () => {
    await page.getByRole('menuitem', { name: 'Monitors' }).click();
    await page.getByRole('tab', { name: 'Network' }).click();
    await page.locator("//input[@placeholder='Search']").fill("172.16.14.52");
    await page.getByRole('link', { name: 'site2.test2.com' }).click();
    await page.getByRole('button', { name: 'Add WAN Link' }).click();

    await page.locator("//input[@placeholder='Enter']").first().click();
    await page.locator('#credential-profile-picker-id').click();
    await page.locator("//input[@placeholder='Search']").fill('write public'); 
    await page.locator("//span[@title='write public']").click();

    await page.locator("//input[@placeholder='Enter']").first().fill("jio");
    await page.locator("//input[@placeholder='Enter']").nth(2).fill("65.65.65.2");
    await page.locator("//input[@placeholder='Enter']").nth(6).fill("30");
    await page.locator("//div[9]//div[2]//div[1]//div[1]//div[2]//div[1]//span[1]//input[1]").fill("30");

    await page.locator("//button[@id='submit-btn']").click();
    await expect(page.getByText('Initializing WAN-Link configuration on source: site2.test2.com')).toBeVisible();
   
    //Write public
    await page.getByRole('menuitem', { name: 'Monitors' }).click();
    await page.getByRole('tab', { name: 'Network' }).click();
    await page.locator("//input[@placeholder='Search']").fill("172.16.14.51");
    await page.getByRole('link', { name: 'site1.test1.com' }).click();
    await page.getByRole('button', { name: 'Add WAN Link' }).click();

    await page.locator("//input[@placeholder='Enter']").first().click();
    await page.locator('#credential-profile-picker-id').click();
    await page.locator("//input[@placeholder='Search']").fill('write private'); 
    await page.locator("//span[@title='write private']").click();

    await page.locator("//input[@placeholder='Enter']").first().fill("jio");
    await page.locator("//input[@placeholder='Enter']").nth(2).fill("55.55.55.1");
    await page.locator("//input[@placeholder='Enter']").nth(6).fill("30");
    await page.locator("//div[9]//div[2]//div[1]//div[1]//div[2]//div[1]//span[1]//input[1]").fill("30");

    await page.locator("//button[@id='submit-btn']").click();
    await expect(page.getByText('Initializing WAN-Link configuration on source: site1.test1.com')).toBeVisible();

  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});