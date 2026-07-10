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
 * Created : 09 July 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata ObserveOps APM Trace Analytics Policy creation', () => {
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
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await page.waitForLoadState('networkidle');
  });

  test('Go to APM Policy and create a new Trace Analytics policy', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@placeholder='Search']").fill('apm policy');
    await page.locator('a[href="/settings/policy-settings/apm"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Policy name
    await page.locator('input#policy-name').fill('Trace Span Errors Playwright Policy');

    // Tags
    const tags = ['apm', 'automation', 'trace analytics'];
    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of tags) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }

    // APM Policy Type -> Trace Analytics
    await page.getByText('Trace Analytics', { exact: true }).click();

    // Counter -> select the counter FIRST (this drives Result By options)
    await page.locator("//input[@placeholder='Select Counter']").click();
    await page.locator("//input[@placeholder='Search']").fill('service.trace.span.errors');
    await page.getByText('service.trace.span.errors', { exact: true }).click();

    // Aggregation -> Avg
    await page.locator("//input[@placeholder='Select Aggr.']").click();
    await page.getByText('Avg', { exact: true }).click();

    // Operator -> Greater than or Equal
    await page.locator("//input[@placeholder='Select Operator.']").click();
    await page.getByText('Greater than or Equal', { exact: true }).click();

    // Value -> 0
    await page.locator("//input[@placeholder='Value']").fill('0');

    // Source Filter -> Source Host
    await page.locator("//input[@placeholder='Select']").first().click();
    await page.getByText('Source Host', { exact: true }).click();

    // Source -> open the picker and select all monitors
    await page.locator("//input[@placeholder=' ']").click();       // Source picker
    await page.locator('thead input[type="checkbox"]').click();    // select-all checkbox
    await page.keyboard.press('Escape');                           // close the picker

    // Result By -> service.trace.service.name (checkbox option)
    await page.locator("//input[@placeholder='Result By']").click();
    await page.locator("//input[@placeholder='Search']").fill('service.trace.service.name');
    await page.getByText('service.trace.service.name', { exact: true }).click();

    // Severity -> Warning
    await page.getByText('Warning', { exact: true }).click();

    // Set Alert Message, Notification, and Declare Incident are left at their
    // default values — no changes made to those sections.

    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Verify the policy was created
    await expect(
      page.locator('td', { hasText: 'Trace Span Errors Playwright Policy' })
    ).toBeVisible();
  });
});
