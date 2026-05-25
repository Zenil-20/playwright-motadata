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
 * Created : 25 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const POLICY_NAME = 'Netroute-SrcToDstPolicy-Playwright';
const HOP_POLICY_NAME = 'Netroute-HopToHop-Playwright';
const COUNTER = 'netroute.min.latency.ms';
const NETROUTE_TARGET = 'www.chatgpt.com';
const TAGS = ['motadata:netroute', 'Automation@playwright'];

test.describe.serial('Motadata AIOps Netroute Policy Flow', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  // Navigate Settings -> Netroute Policy -> Create Policy form
  const openCreatePolicyForm = async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('netroute policy');
    await page.getByRole('link', { name: 'Netroute Policy' }).click();
    await page.getByRole('button', { name: 'Create Policy' }).click();
  };

  // Fill the full Netroute policy form and submit.
  // routeType: 'Source to destination' (default) or 'Hop to Hop'
  const createNetroutePolicy = async ({ name, routeType }) => {
    await openCreatePolicyForm();

    // Policy name
    await page.locator('input#policy-name').fill(name);

    // Tags
    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of TAGS) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }

    // Route Evaluation Type (only switch if not the default)
    if (routeType === 'Hop to Hop') {
      await page.locator("//span[normalize-space()='Hop to Hop']").click();
    }

    // Counter
    await page.locator("//input[@placeholder='Select Metric']").click();
    await page.locator("//input[@placeholder='Search']").last().fill(COUNTER);
    await page.locator(`//span[@title='${COUNTER}']`).click();

    // Source Filter: NetRoute
    await page.locator('[data-cy="dropdown-trigger-input"]').nth(3).click();
    await page.locator("//span[@title='NetRoute']").click();

    // Source NetRoute: pick target row
    await page.locator("input[readonly]").nth(2).click();
    await page.locator("//input[@placeholder='Search']").fill(NETROUTE_TARGET);
    await page.locator("input[type='checkbox']").first().click();
    await page.locator('input#policy-name').click(); // dismiss picker

    // Operator + Value (form layout differs between the two route evaluation types)
    if (routeType === 'Hop to Hop') {
      await page.locator("//input[@placeholder='Select Operator']").click();
      await page.getByText('Greater than or Equal').click();
      await page.locator("//input[@placeholder='Value']").fill('0');
    } else {
      await page.locator("//div[@id='warning-severity']//input[@placeholder='Select']").click();
      await page.locator("//span[@title='Greater Than or Equal']").click();
      await page.locator("//input[@name='warning']").fill('0');
    }

    // Submit
    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Verify row in the policy list
    await page.waitForLoadState('domcontentloaded');
    await page.locator("//input[@name='search']").fill(name);
    await expect(page.locator('tr.k-master-row', { hasText: name }).first()).toBeVisible();
  };

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await expect(page.locator("//img[@alt='Avatar']")).toBeVisible();
  });

  test('Create Netroute Policy with Source-to-destination route evaluation', async () => {
    await createNetroutePolicy({ name: POLICY_NAME, routeType: 'Source to destination' });
  });

  test('Create Netroute Policy with Hop to Hop route evaluation', async () => {
    await createNetroutePolicy({ name: HOP_POLICY_NAME, routeType: 'Hop to Hop' });
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
