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
 * Author  : Anant Awishkar
 * Created : 08 July 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { selectApmCounter } from './_apm.helpers.js';
import { login, logout } from '../../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata ObserveOps APM Trace Metric Policy creation', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) {
      await logout(page);
      await page.close();
    }
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Go to APM Policy and create a new policy', async () => {
    // APM trace data takes a ~4-5 min propagation floor after 07-APM registration;
    // the counter gate below can wait up to 7 min, so lift the 120s per-test cap.
    test.setTimeout(600000);

    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('apm policy');
    await page.locator('a[href="/settings/policy-settings/apm"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();

    await page.locator('input#policy-name').fill('APM Playwright Policy');

    const tags = ['apm', 'automation', 'trace metric'];
    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of tags) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }

    // Select Counter — gated: waits (up to 7 min) for the trace counter to
    // propagate after 07-APM registration before selecting it.
    await selectApmCounter(page, 'service.traces.volume.bytes');

    // Source Filter -> Monitor, then select all monitors
    await page.locator("//input[@placeholder='Select']").first().click();
    await page.getByText('Monitor', { exact: true }).click();
    await page.locator("//input[@placeholder=' ']").click(); // Source picker
    await page.locator('thead input[type="checkbox"]').click(); // select-all checkbox
    await page.locator('body').click({ position: { x: 400, y: 308 } }); // close the picker

    // Thresholds
    const setThreshold = async (rowLocator, value) => {
      await rowLocator.locator("input[placeholder='Select']").click();
      await page.getByText('Greater Than or Equal', { exact: true }).click();
      await rowLocator.locator("input[placeholder='Value']").fill(value);
    };

    const criticalRow = page.locator('text=critical').locator('xpath=ancestor::*[self::div][1]');
    const majorRow = page.locator('text=major').locator('xpath=ancestor::*[self::div][1]');
    const warningRow = page.locator('text=warning').locator('xpath=ancestor::*[self::div][1]');

    await setThreshold(criticalRow, '10240');
    await setThreshold(majorRow, '5124');
    await setThreshold(warningRow, '3068');

    // Set Alert Message, Notification, and Declare Incident are left at their
    // default values — no changes made to those sections.

    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Verify the policy was created
    await expect(
      page.locator('td', { hasText: 'APM Playwright Policy' })
    ).toBeVisible();
  });
});