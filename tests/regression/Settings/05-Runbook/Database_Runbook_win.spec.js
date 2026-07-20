
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
 * Created : 24 February 2026
 */ 

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const sqlScript = `SELECT * 
FROM pg_database 
WHERE datname = 'postgres';`;

test.describe.serial('Motadata AIOps Login', () => {
    let page;

    test.beforeAll(async ({ browser }) => {
        // Create a single browser context and page shared across all tests
        const context = await browser.newContext();
        page = await context.newPage();
        page.setDefaultTimeout(90000);
    });

    test.afterAll(async () => {
        if (page) {
            await page.close();
        }
    });

    test('Login to Motadata AIOps', async () => {
        await page.goto(process.env.Motadata_Aiops, { timeout: 90000 });
        await page.locator("//input[@placeholder='Username']").fill('admin');
        await page.locator("//input[@placeholder='Password']").fill('admin');
        await page.locator("//button[@type='submit']").click();
        await page.waitForLoadState('networkidle');
    });

    test('Navigate to Runbook and Create a Database Runbook which fetches all data from pg', async () => {
        await page.locator("//a[@href='/settings/']").click();
        await page.locator("//input[@id='phone-number']").click();
        await page.locator("//input[@placeholder='Search']").fill('runbook');
        await page.getByRole('link', { name: 'Runbook' }).click();
        await page.locator("//button[@id='create-runbook-btn']").click();
        await page.getByRole('menuitem', { name: 'Database' }).click();

        await page.locator("//input[@name='runbook-name']").fill("Test Database");
        await page.locator('[data-cy="dropdown-trigger-input"]').first().click();
        await page.locator("//input[@placeholder='Search']").fill('integration');
        await page.locator("//span[@title='Integration']").click();
        await page.locator("//div[@title='IBM Db2']//input[@placeholder='Select']").click();
        await page.locator("//input[@placeholder='Search']").fill("postgresql");
        await page.locator("//span[@title='PostgreSQL']").click();
        await page.locator("//input[@readonly='readonly']").click();
        await page.locator("//input[@id='assign-monitor-search']").fill("WIN-4PJMESL4SHA");
        await page.evaluate((code) => {
        const editor = document.querySelector('.CodeMirror').CodeMirror;
        editor.setValue(code);
        }, sqlScript);
        // Wait for the row with the searched device to appear
        const row = page.locator('tr', { hasText: 'WIN-4PJMESL4SHA' });
        await expect(row).toBeVisible({ timeout: 5000 });
        // Click the checkbox inside that row
        const checkbox = row.locator('input[type="checkbox"]');
        await expect(checkbox).toBeVisible({ timeout: 5000 });
        await checkbox.click();
          await page.locator("//input[@name='runbook-description']").fill("runbook to get all databases in postgres");
          await page.locator("//div[@id='credential-profile-picker-id']").click();
          await page.locator("//input[@placeholder='Search']").fill("172.16.10.134_postgresql");
          await page.locator("//span[@title='172.16.10.134_postgresql']").click();
          await page.getByRole('button', { name: 'Test' }).click();
          await page.locator("//div[@id='test-monitor-picker-id']").click();
          const checkbox1 = row.locator('input[type="checkbox"]');
          await expect(checkbox1).toBeVisible({ timeout: 5000 });
          await checkbox1.click();
          await page.locator("//button[@id='create-credential-profile-btn-id']").click();
          await page.getByRole('button', { name: 'Create Runbook Plugin' }).click({ timeout: 90000 });
          await page.locator("//input[@name='search']").fill("Test Database");
          await expect(page.getByRole('link', { name: 'Test Database' })).toBeVisible();
    });

    test('Logout from AIOps', async () => {
        await page.locator("//img[@alt='Avatar']").click();
        await page.getByText('Logout').click();
        await page.context().clearCookies();
        await page.context().clearPermissions();
    });
});