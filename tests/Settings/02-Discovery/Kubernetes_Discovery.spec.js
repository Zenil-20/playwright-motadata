
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
 * Created : 11 May 2026
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
      await page.getByRole('textbox', { name: 'Username' }).fill(process.env.Motadata_Username);
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.Motadata_Password);
      await page.getByTestId('login-btn-submit').click();
      await page.waitForLoadState('networkidle');
    });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Kubernetes in container orchestration', async () => {
    test.setTimeout(600000);
    await page.getByText('Container Orchestration', { exact: true }).click();
    await page.getByRole('link', { name: 'Kubernetes', exact: true }).click();
    await page.locator("//input[@id='profile-id']").fill('Kubernetes Discovery');
    await page.locator("//input[@id='ip-address-id']").fill(process.env.Kubernetes_Master_Node_IP);
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('Kubernetes Discovery Credential');
    await page.locator("//input[@id='username-id']").fill(process.env.Kubernetes_Master_Node_Username);
    await page.locator("//input[@id='password-id']").fill(process.env.Kubernetes_Master_Node_Password);
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(process.env.Kubernetes_Master_Node_IP);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful');
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await page.getByRole('button', { name: 'Save and Exit' }).click();
    await page.locator("//input[@name='discovery-search']").fill('Kubernetes Discovery');
    await page.getByRole('row', { name: /Kubernetes Discovery/i }).locator('svg').first().click();
    // await page.locator('#save-run-btn-id').click();
    await expect(page.getByText(process.env.Kubernetes_Master_Node_IP)).toBeVisible();
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully')).toBeVisible();
    await page.locator('svg[data-icon="times"]').click();
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
