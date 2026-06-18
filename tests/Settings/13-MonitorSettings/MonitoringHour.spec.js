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
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const MONITORING_HOUR_NAME = 'Test Monitor Hour By Playwright Automation';
const DEVICE_IP = '172.16.10.212';

test.describe.serial('Motadata AIOps Device Monitor Settings flow', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
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

  test('Navigate to Monitoring Settings and create a new monitor hour (skip if exists)', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('monitoring hour');
    await page.getByRole('link', { name: 'Monitoring Hour' }).click();

    // Skip creation if a monitoring hour with the same name already exists
    const existingRow = page.locator('tr.k-master-row', { hasText: MONITORING_HOUR_NAME }).first();
    if (await existingRow.isVisible().catch(() => false)) {
      console.log(`Monitoring hour "${MONITORING_HOUR_NAME}" already exists — skipping creation.`);
      return;
    }

    await page.getByRole('button', { name: 'Create Monitoring Hour' }).click();
    await page.locator('input#business-hour-name-id').fill(MONITORING_HOUR_NAME);

    // Check Monday–Friday (the day's row checkbox auto-selects all 24 hour cells)
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      await page.locator('tr', { hasText: day }).locator('input[type="checkbox"]').first().check();
    }

    await page.getByRole('button', { name: 'Create Monitoring Hour' }).click();

    // Either the form navigates back to the list (created) or a duplicate-name toast appears
    const duplicateToast = page.locator('.ant-notification-notice, .ant-message-error', {
      hasText: /not unique/i,
    });
    const outcome = await Promise.race([
      page.waitForURL(/\/settings\/monitoring\/monitoring-hours\/?$/).then(() => 'created').catch(() => null),
      duplicateToast.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'duplicate').catch(() => null),
    ]);

    if (outcome === 'duplicate') {
      console.log(`Monitoring hour "${MONITORING_HOUR_NAME}" already exists — skipping.`);
      await page.locator('//i[@id="back-btn-id"]').first().click();
      return;
    }

    await expect(
      page.locator('tr.k-master-row', { hasText: MONITORING_HOUR_NAME }).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test('Assign the new monitoring hour to a device (skip if already assigned)', async () => {
    // Navigate to Device Monitor Settings
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('device monitor');
    await page.getByRole('link', { name: 'Device Monitor Settings' }).click();

    // Find the device row and open Edit
    await page.locator("//input[@placeholder='Search']").nth(1).fill(DEVICE_IP);
    const deviceRow = page.locator('tr.k-master-row', { hasText: DEVICE_IP }).first();
    await deviceRow.locator('svg[data-icon="ellipsis-v"]').click();
    await page.locator('a#edit').click();

    // If the monitoring hour is already set, close the drawer and return
    const hourTrigger = page.locator("//div[@title='" + MONITORING_HOUR_NAME + "']//input[@placeholder='Select']");
    if (await hourTrigger.isVisible().catch(() => false)) {
      console.log(`Device ${DEVICE_IP} already uses "${MONITORING_HOUR_NAME}" — skipping update.`);
      await page.locator('button.ant-drawer-close').first().click();
      return;
    }

    // Open the Monitoring Hour dropdown, search and pick the custom hour
    await page.locator('#monitoring-hour-picker input[placeholder="Select"]').first().click();
    await page.locator("//input[@data-cy='dropdown-search-input']").last().fill(MONITORING_HOUR_NAME);
    await page.getByText(MONITORING_HOUR_NAME, { exact: true }).first().click();

    // Save
    await page.getByRole('button', { name: 'Update Monitor' }).click();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });

});