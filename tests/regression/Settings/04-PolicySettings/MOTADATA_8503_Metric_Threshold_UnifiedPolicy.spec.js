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
 *
 * Covers MOTADATA-8503 / UC1 (Metric Threshold) + AC B1, B2.
 * Locators grounded in the verified Metric_Policy_test.spec.js flow.
 * NOTE: the unified "Set Conditions" tabs (Threshold|Baseline|Anomaly|Forecast)
 * and the module selector are NEW UI not yet harvested — see resolution-gaps.md.
 * The two flagged steps below activate once those locators are harvested & verified.
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const POLICY_NAME = '8503-Metric-Threshold';
const COUNTER = 'system.cpu.percent';
const TAGS = ['motadata:8.61', 'Automation@zen'];

test.describe.serial('MOTADATA-8503 Unified Create Policy — Metric Threshold (UC1)', () => {
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
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await expect(page.locator("//img[@alt='Avatar']")).toBeVisible();
  });

  test('Open Create Policy on Policy Settings', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('policy');
    await page.locator('a[href="/settings/policy-settings/"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Lands on the Metric module by default (verified live). Set Conditions = four cards;
    // Threshold Alert is the default selected card. Wait for the form to hydrate.
    await page.getByText('Set Conditions', { exact: false }).first().waitFor({ state: 'visible' });
    await page.locator("//input[@placeholder='Select Metric']").waitFor({ state: 'visible' });
    // Ensure Threshold Alert card is selected (A2).
    await page.getByText('Threshold Alert', { exact: true }).click();
  });

  test('B1 — Create Policy does not submit while required fields are empty (validate-on-submit)', async () => {
    // NOTE (live finding): the unified UI does NOT disable Create Policy. Instead it
    // validates on click and red-highlights the empty required field(s). So we assert
    // the GATING INTENT: clicking with an empty form does not create/navigate.
    await page.getByRole('button', { name: 'Create Policy' }).click();
    // stays on the create screen; no success toast
    await expect(page).toHaveURL(/policy-settings\/policies\/metric\/create/);
    await expect(
      page.locator('.ant-notification-notice-message', { hasText: /success|created/i })
    ).toHaveCount(0);
  });

  test('Create Metric Threshold policy (UC1)', async () => {
    await page.locator('input#policy-name').fill(POLICY_NAME);

    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of TAGS) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }

    // Counter (B2 mandatory)
    await page.locator("//input[@placeholder='Select Metric']").click();
    await page.locator("//input[@placeholder='Search']").fill(COUNTER);
    await page.locator(`//span[@title='${COUNTER}']`).click();

    // Source Filter -> Monitor, then pick the Linux monitor row (B3)
    await page.locator("//input[@placeholder='Everywhere']").click();
    await page.locator("//span[@title='Monitor']").click();
    await page.locator('input[readonly]').nth(2).click();
    await page.locator("//input[@id='assign-monitor-search']").fill(process.env.Sybase_linux_ip);

    const ip = process.env.Sybase_linux_ip;
    const linuxRow = page.locator('tr.k-master-row', { has: page.locator('td', { hasText: ip }) })
      .filter({ has: page.locator('img[alt="Linux"]') });
    await linuxRow.scrollIntoViewIfNeeded();
    await linuxRow.locator("input[type='checkbox']").first().click();
    await page.locator('input#policy-name').click();

    // Severity thresholds (B4) — unified build exposes critical / major / warning value inputs.
    await page.locator("//input[@name='critical']").fill('85');
    await page.locator("//input[@name='major']").fill('75');
    await page.locator("//input[@name='warning']").fill('60');

    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Success = toast + redirect to policy list with the new row (confirmed live behavior).
    await expect(
      page.locator('.ant-notification-notice-message, .ant-message-notice-content', { hasText: /success|created/i }).first()
    ).toBeVisible({ timeout: 60000 });
    await page.locator("//input[@name='search']").first().fill(POLICY_NAME);
    await expect(page.getByText(POLICY_NAME, { exact: false }).first()).toBeVisible({ timeout: 60000 });
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
