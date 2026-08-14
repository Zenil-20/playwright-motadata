
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
 * Created : 5 August 2026
 */ 
import { test,expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout, BASE_URL } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps test case for changing the logo from rebranding', () => {
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

    test('Go to System Settings and change the logo from rebranding', async () => {
        await page.goto(`${BASE_URL}/settings/system-settings/rebranding`);
        await expect(page.locator("(//span[normalize-space()='Browse Logo'])[1]")).toBeVisible({ timeout: 50000 });
        await page.locator("(//span[normalize-space()='Browse Logo'])[1]").click();
        // Two logo sections (Logo / Logo (Dark Theme)) each render their own hidden file input,
        // so the bare selector matches both (strict-mode violation). .first() correctly pairs
        // with the "Browse Logo" button just clicked above, which is also [1]/first (Light theme).
        await page.locator('input[type="file"]').first().setInputFiles('tests/Settings/_data/logo.png');
        await page.locator("//span[normalize-space()='Update']").click();
        await page.reload();
        // #rebranding-logo is a duplicate id shared by both the Light and Dark theme <img>
        // elements (invalid markup, but real) — .first() is the Light theme one we just
        // uploaded to, same pairing convention as the file input above.
        await expect(page.locator('#rebranding-logo').first()).toBeVisible({ timeout: 50000 });
        await expect(page.locator('#rebranding-logo').first()).toHaveAttribute('src', /file\.name=logo\.png/);
    });

    test('Logout from AIOps', async () => {
        await logout(page);
    });
});