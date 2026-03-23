
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
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill('admin');
    await page.locator("//input[@placeholder='Password']").fill('admin');
    await page.locator("//button[@type='submit']").click();
    await page.waitForLoadState('networkidle');
  });

  test('Go to Metric Policy and create a new policy', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('metric policy');
    await page.locator('a[href="/settings/policy-settings/"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();
    await page.locator('input#policy-name').fill('172.16.8.165-Metric-Policy');
    const tags = ['motadata:8.61', 'Automation@zen', 'sp@#$%^^&*()sp'];
    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of tags) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }
    await page.locator("//input[@placeholder='Select Metric']").click();
    await page.locator("//input[@placeholder='Search']").fill('system.cpu.percent');
    await page.locator("//span[@title='system.cpu.percent']").click();
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
    await page.locator("//input[@name='critical']").fill('0');
    await page.locator("//input[@name='warning']").fill('50');
    //Notify Team 
    await page.locator('svg[data-icon="angle-down"]').nth(1).click();
    await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile']").type('zenil.kapadia@motadata.com\n');
    await page.locator("//input[@readonly='readonly']").nth(1).click();
    await page.locator("//span[@title='CRITICAL']").click();
    await page.locator('svg[data-icon="angle-up"]').click();
    //Set Alert Message
    await page.locator('svg[data-icon="angle-down"]').first().click();
    await expect(page.locator("input[name='subject']")).toHaveValue("$$$severity$$$ alert for $$$object.name$$$");
    await expect(page.locator("textarea[name='message']")).toHaveValue("$$$counter$$$ has entered into $$$severity$$$ state with value $$$value$$$ on $$$object.host$$$($$$object.ip$$$)");
    const kpiDescription = page.locator("textarea[name='kpiDescription']");

    // scroll to textarea
    await kpiDescription.scrollIntoViewIfNeeded();

    const expectedKpiText = `Here's what this alert indicates:
$$$counter$$$ $$$counter.description$$$ $$$counter.interpretation.high$$$ $$$counter.interpretation.low$$$

This situation often arises due to:
$$$counter.rootcause$$$.

To fix this:
$$$counter.recommended.action$$$

For further diagnosis, analyze related metrics like:
$$$counter.related.metrics$$$ will give you a broader picture of your system's behavior and confirm recovery.`;

    // assertion
    await expect(kpiDescription).toHaveValue(expectedKpiText);
    await page.locator('svg[data-icon="angle-up"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();
  });
});