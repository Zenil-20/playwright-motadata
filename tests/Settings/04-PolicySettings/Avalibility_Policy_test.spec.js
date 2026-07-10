
/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * This software and associated documentation are the confidential and
 proprietary information of Motadata.
 *
 * Unauthorized use, reproduction, disclosure, or distribution of this
 * material is strictly prohibited.
 *
 * You shall use this software only in accordance with the terms of the
 * license agreement entered into with Motadata.
 *
 * Author  : Zenil Kapadia
 * Created : 9 March 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For Linux Server Discovery', () => {
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

  test('Go to Metric Policy and create a new policy', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('metric policy');
    await page.locator('a[href="/settings/policy-settings/"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();
    await page.getByRole('menuitem', { name: 'Availability' }).click();
    await page.waitForURL('**/policies/availability/create');
    await page.locator("//input[@placeholder='Select Counter']").waitFor({ state: 'visible' });
    await page.locator('input#policy-name').click();
    await page.locator('input#policy-name').fill('172.16.8.165_Availability Policy');
    const tags = ['motadata:8.61', 'Automation@zen', 'sp@#$%^^&*()sp'];
    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of tags) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }
    await page.locator("//input[@placeholder='Select Counter']").click();
    const searchInput=  page.locator("//input[@placeholder='Search']");
    await searchInput.fill('status');
    await searchInput.press('Enter');
    await page.locator("//input[@placeholder='Everywhere']").click();
    await page.locator("//span[@title='Monitor']").click();
    await page.locator("input[readonly]").nth(2).click();
    await page.locator("//input[@id='assign-monitor-search']").fill(process.env.Sybase_linux_ip);
    // Target IP
    const ip = process.env.Sybase_linux_ip || "172.16.8.165";

    // Locate the row containing BOTH the IP and the Linux icon
    const linuxRow = page.locator('tr.k-master-row', {
      has: page.locator(`td`, { hasText: ip }) 
    }).filter({
      has: page.locator('img[alt="Linux"]')     
    });
    await linuxRow.scrollIntoViewIfNeeded();
    await linuxRow.locator("input[type='checkbox']").first().click();
    await page.locator('input#policy-name').click();
    //Notify Team 
    await page.locator('svg[data-icon="angle-down"]').nth(1).click();
    await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile or !syslog profile or SNMP trap Profile']").type('zenil.kapadia@motadata.com\n');
    await page.locator("//input[@readonly='readonly']").nth(1).click();
    await page.locator("//span[@title='DOWN']").click();
    // Close the severity dropdown before continuing
    await page.locator('input#policy-name').click();
    await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile or !syslog profile or SNMP trap Profile']").type('@admin\n');
    await page.locator('svg[data-icon="angle-up"]').click();
    //Set Alert Message
    await page.locator('svg[data-icon="angle-down"]').first().click();
    await expect(page.locator("input[name='subject']")).toHaveValue("$$$severity$$$ alert for $$$object.name$$$");
    await expect(page.locator("textarea[name='message']")).toHaveValue("$$$counter$$$ has entered into $$$severity$$$ state with value $$$value$$$ on $$$object.host$$$($$$object.ip$$$)");

    await page.locator('svg[data-icon="angle-up"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();
    await page.waitForLoadState('networkidle');
    await page.locator("//input[@name='search']").fill('172.16.8.165_Availability Policy');
    await page.setDefaultTimeout(1000);
    const row = page.locator('tr.k-master-row', {
      hasText: '172.16.8.165_Availability Policy'
    }).filter({
      hasText: 'Availability'
    });

    await expect(row).toBeVisible();
    // Verify visible tags in the row
    await expect(row.getByText(tags[0].toLowerCase(), { exact: true }).first()).toBeVisible();
    await expect(row.getByText(tags[1].toLowerCase(), { exact: true }).first()).toBeVisible();
    // 3rd tag is hidden behind "+1" overflow badge
    await expect(row.getByText('+1')).toBeVisible();
  });

test('Logout from AIOps', async () => {
    await logout(page);
  });
});