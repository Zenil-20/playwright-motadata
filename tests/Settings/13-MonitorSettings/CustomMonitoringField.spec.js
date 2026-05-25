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
 * Created : 20 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const CANDIDATE_ORIGINAL_FIELDS = ['Environment', 'Floor', 'Location', 'Owner', 'Serial Number'];
const TARGET_UPDATED_NAME = 'playwright-motadata';

const DEVICE_IP = '10.20.40.4';
const CUSTOM_FIELD_VALUE = 'Playwright_Automation';

test.describe.serial('Motadata AIOps Custom Monitoring Field flow', () => {
  let page;
  let alreadyEdited = false;

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

  async function login() {
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await page.waitForLoadState('networkidle');
  }

  async function logout() {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  }

  async function openCustomMonitoringFieldPage() {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('custom');
    await page.getByRole('link', { name: 'Custom Monitoring Field' }).click();
    await page.waitForLoadState('networkidle');
  }

  function fieldRow(fieldName) {
    return page.locator('tr.k-master-row').filter({
      has: page.getByText(fieldName, { exact: true }),
    }).first();
  }

  async function editAnyCandidateField(candidates, updatedName) {
    const updatedRow = fieldRow(updatedName);
    if (await updatedRow.count() > 0 && await updatedRow.isVisible().catch(() => false)) {
      console.log(`Custom monitoring field "${updatedName}" already exists. Test passed.`);
      alreadyEdited = true;
      return;
    }

    let pickedOriginal = null;
    let row = null;
    for (const candidate of candidates) {
      const candidateRow = fieldRow(candidate);
      if (await candidateRow.count() > 0 && await candidateRow.isVisible().catch(() => false)) {
        pickedOriginal = candidate;
        row = candidateRow;
        break;
      }
    }

    if (!pickedOriginal) {
      const allRows = page.locator('tr.k-master-row');
      const rowCount = await allRows.count();
      if (rowCount === 0) {
        throw new Error('No custom monitoring field rows found on the page.');
      }
      const randomIndex = Math.floor(Math.random() * rowCount);
      row = allRows.nth(randomIndex);
      pickedOriginal = `<random row #${randomIndex}>`;
      console.log(
        `None of [${candidates.join(', ')}] are present. Falling back to a random row (index ${randomIndex}).`
      );
    }

    console.log(`Renaming custom monitoring field "${pickedOriginal}" -> "${updatedName}".`);

    await row.locator("a[data-cy='grid-action']").click();
    await page.locator('a#edit').click();

    const editInput = page.locator("//input[@placeholder='field Name']");
    await expect(editInput).toBeVisible();
    await editInput.fill(updatedName);

    await page.locator("button#monitoring-field-update-btn").click();
    await page.waitForLoadState('networkidle');

    await expect(fieldRow(updatedName)).toBeVisible();
  }

  async function openDeviceMonitoringPage() {
    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/settings/monitoring/device-monitor-settings`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('.k-master-row').first()).toBeVisible({ timeout: 60000 });
  }

  async function addCustomMonitoringFieldToDevice(fieldName, fieldValue) {
    const tableSearch = page
      .locator('.search-box input.ant-input, [class*="search"] input.ant-input')
      .last();

    const ipRegex = new RegExp(`^\\s*${DEVICE_IP.replace(/\./g, '\\.')}\\s*$`);
    const deviceRow = page.locator('.k-master-row', {
      has: page.locator('td', { hasText: ipRegex }),
    }).first();

    await expect(async () => {
      await tableSearch.click();
      await tableSearch.fill(DEVICE_IP);
      await expect(tableSearch).toHaveValue(DEVICE_IP, { timeout: 3000 });
      await expect(deviceRow).toBeVisible({ timeout: 8000 });
    }).toPass({ timeout: 45000, intervals: [1000, 2000, 3000] });

    await deviceRow.locator('svg[data-icon="ellipsis-v"]').first().click();
    await page.locator('a#edit').click();

    const drawer = page.locator('.ant-drawer-open').last();
    await expect(drawer).toBeVisible({ timeout: 30000 });

    const fieldDropdowns = drawer.locator("div#custom-monitoring-field");
    const valueInputs = drawer.locator("input#custom-monitoring-value");
    const rowCount = Math.min(await fieldDropdowns.count(), await valueInputs.count());

    let matched = false;
    let needValueFix = -1;
    let needFieldFix = -1;

    for (let i = 0; i < rowCount; i++) {
      const fieldText = ((await fieldDropdowns.nth(i).textContent()) || '').trim();
      const valueText = await valueInputs.nth(i).inputValue().catch(() => '');
      const fieldOk = fieldText.includes(fieldName);
      const valueOk = valueText === fieldValue;
      if (fieldOk && valueOk) { matched = true; break; }
      if (fieldOk && !valueOk && needValueFix === -1) needValueFix = i;
      if (!fieldOk && valueOk && needFieldFix === -1) needFieldFix = i;
    }

    if (matched) {
      console.log(`Device ${DEVICE_IP} already has ${fieldName}=${fieldValue}. Closing drawer without changes.`);
      await drawer.locator('button.ant-drawer-close').click();
      await expect(drawer).toBeHidden({ timeout: 10000 }).catch(() => {});
      return;
    }

    if (needValueFix >= 0) {
      console.log(`Row ${needValueFix} has field "${fieldName}" but wrong value — fixing value to "${fieldValue}".`);
      const vi = valueInputs.nth(needValueFix);
      await vi.fill('');
      await vi.fill(fieldValue);
    } else if (needFieldFix >= 0) {
      console.log(`Row ${needFieldFix} has value "${fieldValue}" but wrong field — fixing field to "${fieldName}".`);
      await fieldDropdowns.nth(needFieldFix).locator("input[placeholder='Select']").click();
      await page.getByText(fieldName, { exact: true }).click();
    } else {
      console.log(`No matching custom monitoring field row — adding a new one (${fieldName}=${fieldValue}).`);
      await drawer.getByRole('button', { name: /Add (Custom )?Monitoring Field/i }).click();
      await drawer.locator("div#custom-monitoring-field").last().locator("input[placeholder='Select']").click();
      await page.getByText(fieldName, { exact: true }).click();
      await drawer.locator("input#custom-monitoring-value").last().fill(fieldValue);
    }

    await drawer.locator("button#update-monitor-btn").click();
    await page.waitForLoadState('networkidle');
  }

  async function openInventoryNetworkPage() {
    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/inventory/Network/groups`, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('.k-master-row').first()).toBeVisible({ timeout: 60000 });
  }

  async function verifyCustomFieldColumn(fieldName, fieldValue) {
    const tableSearch = page
      .locator('.search-box input.ant-input, [class*="search"] input.ant-input')
      .first();

    const ipRegex = new RegExp(`^\\s*${DEVICE_IP.replace(/\./g, '\\.')}\\s*$`);
    const deviceRow = page.locator('.k-master-row', {
      has: page.locator('td', { hasText: ipRegex }),
    }).first();

    await expect(async () => {
      await tableSearch.click();
      await tableSearch.fill(DEVICE_IP);
      await expect(tableSearch).toHaveValue(DEVICE_IP, { timeout: 3000 });
      await expect(deviceRow).toBeVisible({ timeout: 8000 });
    }).toPass({ timeout: 45000, intervals: [1000, 2000, 3000] });

    const valueCell = deviceRow.locator('td', { hasText: fieldValue }).first();
    const valueAlreadyVisible =
      (await valueCell.count()) > 0 && (await valueCell.isVisible().catch(() => false));

    if (valueAlreadyVisible) {
      console.log(`Value "${fieldValue}" already visible in the row — no need to toggle via eye button.`);
      return;
    }

    await page.locator('#btn-show-hide-columns').click();

    const columnSearch = page.locator("input[data-cy='dropdown-search-input']").last();
    await expect(columnSearch).toBeVisible({ timeout: 10000 });
    await columnSearch.fill(fieldName);

    const option = page.getByText(fieldName, { exact: true }).first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();

    await page.keyboard.press('Escape');

    await expect(page.locator('th.k-header', { hasText: fieldName }).first()).toBeVisible({ timeout: 15000 });
    await expect(deviceRow.locator('td', { hasText: fieldValue }).first()).toBeVisible({ timeout: 15000 });
  }

  test('Login to Motadata AIOps', async () => {
    await login();
  });

  test('Navigate to Custom Monitoring Field settings page', async () => {
    await openCustomMonitoringFieldPage();
    await expect(page).toHaveURL(/.*\/settings\/monitoring\/custom-monitoring-field.*/);
    await expect(page.getByRole('link', { name: 'Custom Monitoring Field' })).toBeVisible();
  });

  test(`Edit any available candidate field to "${TARGET_UPDATED_NAME}"`, async () => {
    await editAnyCandidateField(CANDIDATE_ORIGINAL_FIELDS, TARGET_UPDATED_NAME);
  });

  test(`Add custom monitoring field to device ${DEVICE_IP}`, async () => {
    await openDeviceMonitoringPage();
    await addCustomMonitoringFieldToDevice(TARGET_UPDATED_NAME, CUSTOM_FIELD_VALUE);
  });

  test(`Verify custom monitoring field column on monitor screen for ${DEVICE_IP}`, async () => {
    await openInventoryNetworkPage();
    await verifyCustomFieldColumn(TARGET_UPDATED_NAME, CUSTOM_FIELD_VALUE);
  });

  test('Logout from AIOps', async () => {
    await logout();
  });
});
