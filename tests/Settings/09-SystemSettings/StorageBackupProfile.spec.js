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
 * Created : 22 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Storage and Backup Profile Settings', () => {
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

  test('Navigate to Storage and create SCP/SFTP', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('storage profile');
    await page.getByRole('link', { name: 'Storage Profile' }).click();
    await page.getByRole('button', { name: 'Create Storage Profile' }).click();
    await page.locator("input#storage-profile-name").fill('SCPplugin By Playwright');
    await page.locator("//input[@id='ip/host']").fill('172.16.13.50');
    await page.locator("input#port-id").fill('22');
    await page.locator("//input[@placeholder='Select']").click();
    await page.locator("//span[@title='SCP/SFTP']").click();
    await page.locator("//input[@name='user-name']").fill('motadata');
    await page.locator("//input[@id='password-id']").fill('motadata');
    await page.locator("#test-btn").click();
    await expect(page.locator('#test-message'))
    .toHaveText(/Storage Profile tested successfully/i, {
    timeout: 40000
  });
  await page.locator("#close-id").click();
  await page.locator("#external-storage-btn").click();
  });

  test('Navigate to Storage and create TFTP', async () => {
    await page.getByRole('button', { name: 'Create Storage Profile' }).click();
    await page.locator("input#storage-profile-name").fill('TFTPplugin By Playwright');
    await page.locator("//input[@id='ip/host']").fill('172.16.15.208');
    await page.locator("input#port-id").fill('69');
    await page.locator("//input[@placeholder='Select']").click();
    await page.locator("//span[@title='TFTP']").click();
    await page.locator("#test-btn").click();
    await expect(page.locator('#test-message'))
    .toHaveText(/Storage Profile tested successfully/i, {
    timeout: 40000
  });
  await page.locator("#close-id").click();
  await page.locator("#external-storage-btn").click();
  });

  test('Navigate to Storage and create FTP', async () => {
    await page.getByRole('button', { name: 'Create Storage Profile' }).click();
    await page.locator("input#storage-profile-name").fill('ftp-8.57plugin By Playwright');
    await page.locator("//input[@id='ip/host']").fill('172.16.8.57');
    await page.locator("//input[@name='user-name']").fill('administrator');
    await page.locator("//input[@id='password-id']").fill('Motadata@8');
    await page.locator("input#port-id").fill('21');
    await page.locator("//input[@placeholder='Select']").click();
    await page.locator("//span[@title='FTP']").click();
    await page.locator("#test-btn").click();
    await expect(page.locator('#test-message'))
    .toHaveText(/Storage Profile tested successfully/i, {
    timeout: 40000
  });
  await page.locator("#close-id").click();
  await page.locator("#external-storage-btn").click();
  });

  test('Attach storage profiles to Config DB Backup Profile, run, then swap and rerun', async () => {
    test.setTimeout(600000);

    const SCP_STORAGE = 'SCPplugin By Playwright';
    const TFTP_STORAGE = 'TFTPplugin By Playwright';

    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('backup profile');
    await page.getByRole('link', { name: 'Backup Profile' }).click();
    await page.locator("//input[@name='search-rpe']").fill('Config DB Backup Profile');

    const configRow = page.locator('tr.k-master-row', { hasText: 'Config DB Backup Profile' }).first();

    // Helper: edit the row, pick a storage profile, save
    const setStorageProfile = async (name) => {
      await configRow.locator('[data-cy="grid-action"]').click();
      await page.locator('#edit').click();
      await page.locator("//div[@title='Config DB Backup Storage Profile']//input[@placeholder='Select']").click();
      await page.locator("//input[@data-cy='dropdown-search-input']").last().fill(name);
      await page.locator(`//span[@title='${name}']`).click();
      await page.locator('#btn-submit-trap-forwarding').click();
    };

    // Helper: trigger run and wait the known ~1 min duration (UI shows no completion signal)
    const runAndWait = async () => {
      await configRow.locator('#start-rediscovery').click();
      await page.waitForTimeout(70000);
    };

    // First run with SCP/SFTP
    await setStorageProfile(SCP_STORAGE);
    await runAndWait();

    // Swap to TFTP and rerun
    await setStorageProfile(TFTP_STORAGE);
    await runAndWait();
  });

});