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
 * Created : 03 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For Atlassian Jira Integration', () => {
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

  test('Navigate to Motadata Atlassian Jira Integration', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('atlassian jira');

    const jiraLink = page.getByRole('link', { name: 'Atlassian Jira' });
    await expect(jiraLink).toBeVisible();
    await jiraLink.click();

    const serverUrlInput = page.locator('.ant-form-item:has(label:has-text("Server URL")) input').first();
    await expect(serverUrlInput).toBeVisible();
    const existingServerUrl = (await serverUrlInput.inputValue())?.trim();

    if (existingServerUrl) {
      console.log(`Atlassian Jira Server URL already configured ("${existingServerUrl}"). Skipping integration setup and logging out.`);
      await page.locator("#user-avatar").click();
      await page.getByText('Logout').click();
      await page.context().clearCookies();
      await page.context().clearPermissions();
      alreadyLoggedOut = true;
      return;
    }

    await serverUrlInput.fill(process.env.Atlassian_Jira_ServerUrl);
    await page.locator('#create-credential-btn-id').click();
    await page.locator('input#credential-profile-name-id').fill('Automation Atlassian Jira Credential Profile');

    // Username and password fields
    await page.locator('input#username-id').fill(process.env.Atlassian_Jira_Username);
    await page.locator('input#password-id').fill(process.env.Atlassian_Jira_Password);

    const drawer = page.locator('.ant-drawer-open');

    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();

    // Handle case where credential profile name already exists
    const credentialProfileName = 'Automation Atlassian Jira Credential Profile';
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
      .filter({ hasText: /Atlassian Jira Integration Successful/i });
    await expect(successToast).toBeVisible({ timeout: 20000 });
  });

  test("Navigate to Integration Profile and create a new Profile for Atlassian Jira Integration", async () => {
    await page.locator("//input[@placeholder='Search']").first().fill('Integration Profile');
    await page.getByRole('link', { name: 'Integration Profile' }).click();
    // await page.getByRole('button', { name: 'Integration Profile' }).click();
    await page.getByRole('button', { name: 'Create Integration Profile' }).click();
    await page.locator("//input[@placeholder='Must be unique']").fill('Atlassian Jira Integration Profile by Automation');
    await page
      .locator('.ant-form-item:has(label:has-text("Integration Type"))')
      .locator('input[data-cy="dropdown-trigger-input"]')
      .click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill('Atlassian Jira');
    await page.locator("//input[@data-cy='dropdown-search-input']").press('Enter');
    //project
    await page
      .locator('.ant-form-item:has(label:has-text("Project"))')
      .locator('input[placeholder="Select"]')
      .click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill('motadata-aiops');
    await page.locator("//input[@data-cy='dropdown-search-input']").press('Enter');
    //issue type
    await page.locator("//input[@placeholder='Issue Type']").click();
    await page.locator("//span[@title='Task']").click();
    //Auto close issue
    await page.locator("//button[@role='switch']").click();
    //issue status
    await page
      .locator('.ant-form-item:has(label:has-text("Issue Status"))')
      .locator('input[placeholder="Select"]')
      .click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill('done');
    await page.locator("//span[@title='done']").click();

    await page
      .locator('.ant-drawer-open')
      .getByRole('button', { name: 'Create Integration Profile' })
      .click();

    //Assertion for created profile
    await page.locator("//div[@class='col']//input[@placeholder='Search']").fill('Atlassian Jira Integration Profile by Automation');
    await expect(
  page.locator('tbody tr', {
    hasText: "Atlassian Jira Integration Profile by Automation"
  })
).toBeVisible();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
