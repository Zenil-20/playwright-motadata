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
 * Created : 02 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For Motadata ServiceOps Integration', () => {
  let page;
  let alreadyLoggedOut = false;

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
    await login(page);
  });

  test('Navigate to Motadata ServiceOps Integration', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('serviceops');

    const serviceOpsLink = page.getByRole('link', { name: 'Motadata ServiceOps' });
    await expect(serviceOpsLink).toBeVisible();
    await serviceOpsLink.click();

    const serverUrlInput = page.locator('.ant-form-item:has(label:has-text("Server URL")) input').first();
    await expect(serverUrlInput).toBeVisible();
    const existingServerUrl = (await serverUrlInput.inputValue())?.trim();

    if (existingServerUrl) {
      console.log(`ServiceOps Server URL already configured ("${existingServerUrl}"). Skipping integration setup and logging out.`);
      await page.locator("#user-avatar").click();
      await page.getByText('Logout').click();
      await page.context().clearCookies();
      await page.context().clearPermissions();
      alreadyLoggedOut = true;
      return;
    }

    await serverUrlInput.fill(process.env.Motadata_ServiceOps_ServerUrl);
    await page.locator('#create-credential-btn-id').click();
    await page.locator('input#credential-profile-name-id').fill('Automation ServiceOps Credential Profile');

    // Username, password, client.id and client.secret fields
    await page.locator('input#username-id').fill(process.env.Motadata_ServiceOps_Username);
    await page.locator('input#password-id').fill(process.env.Motadata_ServiceOps_Password);

    const drawer = page.locator('.ant-drawer-open');

    await drawer
      .locator('.ant-form-item:has(label:has-text("Client ID")) input')
      .fill(process.env.Motadata_ServiceOps_clientid);

    await drawer
      .locator('.ant-form-item:has(label:has-text("Client Secret")) input')
      .fill(process.env.Motadata_ServiceOps_clientSecret);

    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();

    // Handle case where credential profile name already exists
    const credentialProfileName = 'Automation ServiceOps Credential Profile';
    const duplicateMsg = page.locator('.ant-message-error', { hasText: 'Profile Name is not unique' });
    const drawerClosed = page.locator('.ant-drawer-open').waitFor({ state: 'detached', timeout: 15000 }).then(() => 'closed').catch(() => null);
    const duplicateShown = duplicateMsg.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'duplicate').catch(() => null);
    const outcome = await Promise.race([drawerClosed, duplicateShown]);

    if (!outcome) {
      throw new Error('Credential profile creation: neither drawer closed nor duplicate toast appeared within 15s');
    }

    if (outcome === 'duplicate') {
      console.log('Credential profile already exists. Selecting the existing profile.');
      await page.locator("//button[@aria-label='Close' and contains(@class, 'ant-drawer-close')]").click();
      await expect(page.locator('.ant-drawer-open')).toHaveCount(0);

      const credentialDropdown = page.locator('#credential-profile-picker-id');
      await credentialDropdown.click();

      const searchInput = page.locator("//input[@data-cy='dropdown-search-input']");
      await expect(searchInput).toBeVisible();
      await searchInput.fill(credentialProfileName);

      const existingOption = page.locator(`//span[@title='${credentialProfileName}']`);
      await expect(existingOption).toBeVisible();
      await existingOption.click();
    }

    // Source field
    const sourceInput = page.locator('.ant-form-item:has(label:has-text("Source")) input');
    await expect(sourceInput).toBeVisible();
    await sourceInput.fill('aiops');

    // Fail Over Email field
    const failoverEmailInput = page.locator('.ant-form-item:has(label:has-text("Fail Over Email")) input');
    await expect(failoverEmailInput).toBeVisible();
    await failoverEmailInput.fill('test@motadata.com');

    await page.locator('button[type="submit"]').nth(0).click();

    // Auto Sync
    const autoSync = page
      .locator('.ant-form-item:has(label:has-text("Auto Sync"))')
      .getByRole('switch');
    await expect(autoSync).toBeVisible();
    if (!(await autoSync.isChecked())) {
      await autoSync.click();
    }
    await expect(autoSync).toBeChecked();

    // Use Proxy Server
    const proxy = page
      .locator('.ant-form-item:has(label:has-text("Use Proxy Server"))')
      .getByRole('switch');
    await expect(proxy).toBeVisible();
    if (!(await proxy.isChecked())) {
      await proxy.click();
    }
    await expect(proxy).toBeChecked();

    await page.getByRole('button', { name: 'Test' }).click();

    const msg = page.locator('#test-message');
    await expect(msg).toBeVisible({ timeout: 20000 });

    const text = await msg.textContent();
    if (text?.includes('succeeded')) {
      console.log('Test Passed');
    } else if (text?.includes('failed')) {
      throw new Error(`Test Failed: ${text}`);
    } else {
      throw new Error(`Unexpected response: ${text}`);
    }

    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeVisible({ timeout: 20000 });
    await saveButton.click();

    const successToast = page
      .locator('.ant-notification-notice-message')
      .filter({ hasText: 'Integration saved successfully!' });
    await expect(successToast).toBeVisible({ timeout: 20000 });
  });

  test("Navigate to Integration Profile and create a new Profile for Motadata serviceOps Integration", async () => {
    test.skip(alreadyLoggedOut, 'ServiceOps integration already configured; skipping Integration Profile creation.');
    test.setTimeout(300000);
    await page.locator("//input[@placeholder='Search']").first().fill('Integration Profile');
    await page.getByRole('link', { name: 'Integration Profile' }).click();
    await page.getByRole('button', { name: 'Create Integration Profile' }).click();
    await page.locator("//input[@placeholder='Must be unique']").fill('Motadata ServiceOps Integration Profile by Automation');
    await page
      .locator('.ant-form-item:has(label:has-text("Integration Type"))')
      .locator('input[data-cy="dropdown-trigger-input"]')
      .click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill('Serviceops');
    await page.locator("//input[@data-cy='dropdown-search-input']").press('Enter');

    const selectDropdownValue = async (labelText, value) => {
      const trigger = page.locator(
        `xpath=//div[contains(@class,'ant-form-item') and .//label[normalize-space()='${labelText}']]//input[@data-cy='dropdown-trigger-input']`
      ).first();
      await expect(trigger).toBeVisible();
      // Click the parent wrapper (the input is readonly; the click handler is on the wrapper).
      await trigger.evaluate((el) => {
        const wrapper = el.closest('.ant-input-affix-wrapper, .ant-select, [class*="dropdown"]') || el.parentElement;
        wrapper?.click();
        el.click();
      });
      const search = page.locator("//input[@data-cy='dropdown-search-input']").last();
      await expect(search).toBeVisible();
      await search.fill(value);
      const option = page.locator(`//span[@title='${value}']`).first();
      await expect(option).toBeVisible();
      await option.click();
    };

    // Impact
    await selectDropdownValue('Impact', 'On Department');
    // Location
    await selectDropdownValue('Location', 'Asia');
    // Category
    await selectDropdownValue('Category', 'Software');
    // Department
    await selectDropdownValue('Department', 'IT');
    // Urgency
    await selectDropdownValue('Urgency', 'Medium');

    // Group (text input)
    await page
      .locator('.ant-form-item:has(label:has-text("Group"))')
      .locator('input')
      .first()
      .fill('tags');

    // Auto Close Ticket — leave ON (it's the default). Toggle only if currently OFF.
    const autoCloseTicket = page
      .locator('.ant-form-item:has(label:has-text("Auto Close Ticket"))')
      .getByRole('switch');
    if (!(await autoCloseTicket.isChecked())) {
      await autoCloseTicket.click();
    }
    await expect(autoCloseTicket).toBeChecked();

    // Ticket Status — pick "Closed" radio (already default, but assert/select for safety)
    await page.getByRole('radio', { name: 'Closed' }).check();

    await page.locator("//button[@id='external-storage-btn']").click();

    //Assertion for created profile
    await page.locator("//div[@class='col']//input[@placeholder='Search']").fill('Motadata ServiceOps Integration Profile by Automation');
    await expect(
  page.locator('tbody tr', {
    hasText: "Motadata ServiceOps Integration Profile by Automation"
  })
).toBeVisible();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
