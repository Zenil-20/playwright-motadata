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

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata AIOps Discovery Flow For ServiceNow Integration', () => {
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
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to ServiceNow Integration', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('servicenow');

    const serviceNowLink = page.getByRole('link', { name: 'ServiceNow' });
    await expect(serviceNowLink).toBeVisible();
    await serviceNowLink.click();

    const serverUrlInput = page.locator('.ant-form-item:has(label:has-text("Server URL")) input').first();
    await expect(serverUrlInput).toBeVisible();
    const existingServerUrl = (await serverUrlInput.inputValue())?.trim();

    if (existingServerUrl) {
      console.log(`ServiceNow Server URL already configured ("${existingServerUrl}"). Skipping integration setup and logging out.`);
      await page.locator("//img[@alt='Avatar']").click();
      await page.getByText('Logout').click();
      await page.context().clearCookies();
      await page.context().clearPermissions();
      alreadyLoggedOut = true;
      return;
    }

    await serverUrlInput.fill(process.env.ServiceNow_InstanceUrl);
    await page.locator('#create-credential-btn-id').click();
    await page.locator('input#credential-profile-name-id').fill('Automation ServiceNow Credential Profile');

    // Username and password fields
    await page.locator('input#username-id').fill(process.env.ServiceNow_Username);
    await page.locator('input#password-id').fill(process.env.ServiceNow_Password);

    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();

    // Handle case where credential profile name already exists
    const credentialProfileName = 'Automation ServiceNow Credential Profile';
    const duplicateMsg = page.locator('.ant-message-error', { hasText: 'Profile Name is not unique' });
    const drawerClosed = page.locator('.ant-drawer-open').waitFor({ state: 'detached', timeout: 15000 }).then(() => 'closed').catch(() => null);
    const duplicateShown = duplicateMsg.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'duplicate').catch(() => null);
    const outcome = await Promise.race([drawerClosed, duplicateShown]);

    if (!outcome) {
      throw new Error('Credential profile creation: neither drawer closed nor duplicate toast appeared within 15s');
    }

    if (outcome === 'duplicate') {
      console.log('Credential profile already exists. Skipping remaining steps and logging out.');
      // Close the credential creation drawer if still open
      const closeBtn = page.locator("//button[@aria-label='Close' and contains(@class, 'ant-drawer-close')]");
      if (await closeBtn.count()) {
        await closeBtn.first().click().catch(() => {});
      }
      await page.locator("//img[@alt='Avatar']").click();
      await page.getByText('Logout').click();
      await page.context().clearCookies();
      await page.context().clearPermissions();
      alreadyLoggedOut = true;
      test.skip(true, 'ServiceNow credential profile already exists; skipping remaining steps.');
      return;
    }

    // Create Alert from Motadata AIOps as -> Incident
    // Ant Design's <input type=radio> is visually hidden — interact with the wrapper label
    const incidentRadio = page.locator('input.ant-radio-button-input[value="incident"]');
    const incidentLabel = page.locator('label.ant-radio-button-wrapper', { hasText: 'Incident' }).first();
    await expect(incidentLabel).toBeVisible();
    if (!(await incidentRadio.isChecked())) {
      await incidentLabel.click();
    }
    await expect(incidentRadio).toBeChecked();

    // If alert re-occurs -> Create new ticket (only renders after Incident is selected)
    const createNewTicketLabel = page.locator('label.ant-radio-button-wrapper', { hasText: 'Create new ticket' }).first();
    if (await createNewTicketLabel.count()) {
      await expect(createNewTicketLabel).toBeVisible();
      const createNewTicketRadio = createNewTicketLabel.locator('input.ant-radio-button-input');
      if (!(await createNewTicketRadio.isChecked())) {
        await createNewTicketLabel.click();
      }
      await expect(createNewTicketRadio).toBeChecked();
    }

    // Fail Over Email field
    const failoverEmailInput = page.locator('.ant-form-item:has(label:has-text("Fail Over Email")) input');
    await expect(failoverEmailInput).toBeVisible();
    await failoverEmailInput.fill('test@motadata.com');
    await failoverEmailInput.press('Enter');

    // Auto Sync (may not render in all builds)
    const autoSync = page
      .locator('.ant-form-item:has(label:has-text("Auto Sync"))')
      .getByRole('switch');
    if (await autoSync.count()) {
      if (!(await autoSync.isChecked())) {
        await autoSync.click();
      }
      await expect(autoSync).toBeChecked();
    }

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
      .filter({ hasText: /saved successfully!/i });
    await expect(successToast).toBeVisible({ timeout: 20000 });
  });

  test("Navigate to Integration Profile and create a new Profile for ServiceNow Integration", async () => {
    test.skip(alreadyLoggedOut, 'ServiceNow integration already configured; skipping Integration Profile creation.');
    test.setTimeout(300000);
    await page.locator("//input[@placeholder='Search']").first().fill('Integration Profile');
    await page.getByRole('link', { name: 'Integration Profile' }).click();
    await page.getByRole('button', { name: 'Create Integration Profile' }).click();
    await page.locator("//input[@placeholder='Must be unique']").fill('ServiceNow Integration Profile by Automation');
    await page
      .locator('.ant-form-item:has(label:has-text("Integration Type"))')
      .locator('input[data-cy="dropdown-trigger-input"]')
      .click();
    await page.locator("//input[@data-cy='dropdown-search-input']").fill('ServiceNow');
    await page.locator("//input[@data-cy='dropdown-search-input']").press('Enter');

    const selectDropdownValue = async (labelText, value) => {
      const trigger = page.locator(
        `xpath=//div[contains(@class,'ant-form-item') and .//label[normalize-space()='${labelText}']]//input[@data-cy='dropdown-trigger-input']`
      ).first();
      await expect(trigger).toBeVisible();

      const option = page
        .getByRole('option', { name: value, exact: true })
        .or(page.locator(`[title="${value}"]:visible`))
        .first();

      // ServiceNow dropdowns load options from the server, so the list is empty
      // for a moment after opening. Retry: open → wait for any option → search →
      // wait for the target option. This survives a too-early fill that returns 0.
      await expect(async () => {
        await trigger.evaluate((el) => {
          const wrapper = el.closest('.ant-input-affix-wrapper, .ant-select, [class*="dropdown"]') || el.parentElement;
          wrapper?.click();
          el.click();
        });
        const search = page.locator("//input[@data-cy='dropdown-search-input']").last();
        await expect(search).toBeVisible();
        // Wait for the dropdown's option list to actually populate before typing.
        await expect(page.locator('[role="option"]:visible, [title]:visible').first())
          .toBeVisible({ timeout: 10000 });
        await search.fill('');
        await search.fill(value);
        await expect(option).toBeVisible({ timeout: 8000 });
      }).toPass({ timeout: 45000, intervals: [1000, 2000, 3000] });

      await option.click();
    };

    await selectDropdownValue('Category', 'Database');
    await selectDropdownValue('Sub Category', 'DB2');
    await selectDropdownValue('Group', 'Service Desk');
    await selectDropdownValue('Technician', 'Beth Anglin');
    await selectDropdownValue('Impact', '3 - Low');
    await selectDropdownValue('Urgency', '2 - Medium');
    await selectDropdownValue('Service', 'Client Services');

    // Auto Close Ticket — enable it (default is OFF)
    const autoCloseTicket = page
      .locator('.ant-form-item:has(label:has-text("Auto Close Ticket"))')
      .getByRole('switch');
    if (!(await autoCloseTicket.isChecked())) {
      await autoCloseTicket.click();
    }
    await expect(autoCloseTicket).toBeChecked();

    await page
      .locator('.ant-drawer-open, .ant-modal')
      .getByRole('button', { name: 'Create Integration Profile' })
      .click();

    //Assertion for created profile
    await page.locator("//div[@class='col']//input[@placeholder='Search']").fill('ServiceNow Integration Profile by Automation');
    await expect(
  page.locator('tbody tr', {
    hasText: "ServiceNow Integration Profile by Automation"
  })
).toBeVisible();
  });

  test('Logout from AIOps', async () => {
    if (alreadyLoggedOut) {
      console.log('Already logged out during integration check. Skipping.');
      return;
    }
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
