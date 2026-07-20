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
 * Created : 30 April 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Proxy Server Settings flow', () => {
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
    await login(page);
  });

  test('Navigate to Proxy Server Settings and add a new proxy server', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('proxy server');
    await page.getByRole('link', { name: 'Proxy Server Settings' }).click();

    // Scope to the row containing the "Proxy Server Enable" label so we don't
    // accidentally grab the Authentication Required switch (which can share IDs).
    const proxyEnableRow = page
      .locator('div', { has: page.locator('text="Proxy Server Enable"') })
      .filter({ has: page.locator('button[role="switch"]') })
      .last();
    const proxyEnableToggle = proxyEnableRow.locator('button[role="switch"]').first();

    await expect(proxyEnableToggle).toBeVisible();

    const toggleHtml = await proxyEnableToggle.evaluate((el) => el.outerHTML);
    console.log(`Proxy Server Enable toggle HTML: ${toggleHtml}`);

    const isToggleOn = await proxyEnableToggle.evaluate((el) => {
      if (el.getAttribute('aria-checked') === 'true') return true;
      const cls = (el.className || '').toString().toLowerCase();
      if (cls.includes('ant-switch-checked') || cls.includes('checked')) return true;
      const text = (el.innerText || el.textContent || '').trim().toUpperCase();
      if (text === 'ON') return true;
      return false;
    });

    console.log(`Proxy Server toggle state detected as: ${isToggleOn ? 'ON' : 'OFF'}`);

    test.skip(isToggleOn, 'Proxy Server is already enabled — skipping configuration test.');

    await proxyEnableToggle.click();
    await page.locator("input#smtp-server-id").fill("172.16.9.102");
    await page.locator("//input[@name='proxy-server-port']").fill("3128");
    await page.locator("//input[@name='timeout']").fill("60");
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@id='recipient-email-id']").fill("https://google.com");
    await page.locator("//button[@id='send-test-email-id']").click();
    const successMsg = page.locator('#test-message');

await successMsg.waitFor({ state: 'visible', timeout: 10000 });
await expect(successMsg).toContainText('Proxy server tested successfully');
await page.locator("//button[@id='configure-btn']").click();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
