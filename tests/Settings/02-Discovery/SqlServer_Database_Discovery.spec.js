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
 * Created : 27 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const PROFILE_NAME = 'SQL Server Database';
const CRED_PROFILE_NAME = 'SQL Server Credential';

test.describe.serial('Motadata AIOps Discovery Flow For SQL Server Database', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
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

  test('Create Discovery for SQL Server', async () => {
    await page.getByText('Database', { exact: true }).click();
    await page.locator("//input[@data-cy='dropdown-trigger-input']").first().click();
    await page.locator("//span[@title='SQL Server']").click();

    // Main discovery form
    await page.locator("//input[@id='profile-id']").fill(PROFILE_NAME);
    await page.locator("//input[@id='ip-address-id']").fill(process.env.SqlServer_ip);
    await page.locator("//input[@id='db-service-name-id']").fill(process.env.SqlServer_instance);
    await page.locator("//input[@id='port-id']").fill(process.env.SqlServer_port);

    // Create + test the credential profile
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(CRED_PROFILE_NAME);
    await page.locator("//input[@id='username-id']").fill(process.env.SqlServer_username);
    await page.locator("//input[@id='password-id']").fill(process.env.SqlServer_password);

    // Test the credential against the target before saving it
    await page.locator('#test-btn').click();
    await page.locator("//input[@name='target']").fill(process.env.SqlServer_ip);
    await page.locator("//input[@name='port']").fill(process.env.SqlServer_port);
    await page.locator("//input[@name='database-name']").fill(process.env.SqlServer_instance);
    await page.locator('#run-test-btn').click();
    await expect(page.locator('#message')).toHaveText(/Successful/i, { timeout: 60000 });
    await page.locator('#close-btn-id').click();

    await page.locator("//button[@id='create-credential-profile-btn-id']").click();

    await page.locator('#save-run-btn-id').click();

    await expect(page.getByText(process.env.SqlServer_ip, { exact: true }).first())
      .toBeVisible({ timeout: 480000 });

    const discoveredRow = page.locator('tr.k-master-row', { hasText: process.env.SqlServer_ip }).first();
    await discoveredRow.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();

    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await page.locator("//i[@class='anticon text-neutral-light']//*[name()='svg']").click();

    await page.locator("//input[@name='discovery-search']").fill(process.env.SqlServer_ip);
    await expect(page.getByRole('gridcell', { name: process.env.SqlServer_ip })).toBeVisible();
    await expect(page.getByRole('img', { name: 'SQL Server' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: PROFILE_NAME })).toBeVisible();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
