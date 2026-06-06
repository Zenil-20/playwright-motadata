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
 * Created : 03 June 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const LINUX_SERVER_IP = '172.16.15.234';
const LINUX_SERVER_USERNAME = 'motadata';
const LINUX_SERVER_PASSWORD = 'motadata';
const PROFILE_NAME = 'Linux Server 172.16.15.234 by Automation Playwright';
const CRED_PROFILE_NAME = 'Linux Server 172.16.15.234';

// Master Motadata server base URL, derived from .env (Motadata_Aiops). Trailing
// slash stripped so paths like `/inventory/...` append cleanly.
const BASE_URL = (process.env.Motadata_Aiops || '').replace(/\/+$/, '');

test.describe.serial('Motadata AIOps Discovery Flow For Linux Server 172.16.15.234', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // Single browser context and page shared across all tests.
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    // Smart wait — Motadata streams in the background, so networkidle never settles.
    await expect(page.locator("//img[@alt='Avatar']")).toBeVisible();
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Linux Server 172.16.15.234', async () => {
    await page.locator("//input[@id='profile-id']").fill(PROFILE_NAME);
    await page.locator("//input[@id='ip-address-id']").fill(LINUX_SERVER_IP);

    // Create a new SSH credential profile for the Linux server.
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(CRED_PROFILE_NAME);
    await page.locator("//input[@id='username-id']").fill(LINUX_SERVER_USERNAME);
    await page.locator("//input[@id='password-id']").fill(LINUX_SERVER_PASSWORD);

    // Test the credential against the device before saving.
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(LINUX_SERVER_IP);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful', { timeout: 120000 });
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();

    // Save and run the discovery.
    await page.locator('#save-run-btn-id').click();

    // Wait for the discovered device to appear in the results table.
    await expect(page.getByText(LINUX_SERVER_IP, { exact: true }).first())
      .toBeVisible({ timeout: 480000 });

    // Tick the discovered row (nth(0) is the header select-all) and provision it.
    const discoveredRow = page.locator('tr.k-master-row', { hasText: LINUX_SERVER_IP }).first();
    await discoveredRow.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();

    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await page.locator('svg[data-icon="times"]').click();
  });

  test('Provision the containers supported in Linux Server 172.16.15.234', async () => {
    // Navigate to the Server inventory on the master server set in .env (not a hardcoded IP).
    await page.goto(`${BASE_URL}/inventory/Server/groups`);
    // Smart wait — the Search box is ready once the inventory grid has rendered.
    await expect(page.locator("//input[@placeholder='Search']")).toBeVisible();
    await page.locator("//input[@placeholder='Search']").fill('motadata234');
    // Wait for the grid to filter down to the searched device, then open that device.
    await expect(page.getByRole('link', { name: 'motadata234' })).toBeVisible();
    await page.getByRole('link', { name: 'motadata234' }).click();
    // Only proceed once the device detail page has opened (Container Runtime is present).
    await expect(page.getByRole('button', { name: 'Container Runtime' })).toBeVisible();
    await page.getByRole('button', { name: 'Container Runtime' }).click();
    await page.getByRole('button', { name: 'Create Credential Profile' }).click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('Docker Credential Profile');
    await page.locator("//input[@id='username-id']").fill('motadata');
    await page.locator("//input[@id='password-id']").fill('motadata');
    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();

    // Discover all available containers — turn auto-sync on if it is currently OFF.
    const toggle = page.locator('#auto-sync-id');
    if ((await toggle.textContent())?.trim() === 'OFF') {
      await toggle.click();
    }

    // Save and run.
    await page.getByRole('button', { name: 'Save & Run' }).click();
    // Select all via the header checkbox.
    await page.locator("//input[@type='checkbox']").first().click();
    // Provision.
    await page.getByRole('button', { name: 'Provision' }).click();
    await expect(page.getByText('No data found')).toBeVisible();
    await page.locator("button:has(svg[data-icon='times'])").click();
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
