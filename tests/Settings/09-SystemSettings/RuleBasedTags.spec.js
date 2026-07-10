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
 * Created : 19 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const DEFAULT_DESCRIPTION = 'This is a test rule created by Playwright automation';

async function getPreviewTableState(page) {
  const previewTable = page.locator('table.k-grid-table').last();
  const tableRows = previewTable.locator('tbody tr.k-master-row');

  return { previewTable, tableRows };
}

const scenarios = [
  {
    name: 'monitor',
    appliesTo: 'Monitor',
    inventoryTab: 'Server & Apps',
    primaryTag: { key: 'KPI', value: 'High CPU' },
    dynamicTag: { key: 'dynamic', value: '{object.name}' },
    condition: {
      type: 'Include',
      counterSearch: 'object.ip',
      counterOption: 'object.ip',
      operator: 'Contains',
      value: '172',
    },
  },
  {
    name: 'interface',
    appliesTo: 'Interface',
    inventoryTab: 'Interface',
    primaryTag: { key: 'Interface KPI', value: 'High port utilization' },
    dynamicTag: { key: 'dynamic', value: '{object.ip}' },
    condition: {
      type: 'Include',
      counterSearch: 'interface.name',
      counterOption: 'interface.name',
      operator: 'Contains',
      value: 'a',
    },
  },
  {
    name: 'vm',
    appliesTo: 'VM',
    deviceMonitorSearch: 'esxi18.motadata.local',
    primaryTag: { key: 'VM KPI', value: 'High VM utilization' },
    dynamicTag: { key: 'dynamic', value: '{object.ip}' },
    condition: {
      type: 'Include',
      counterSearch: 'object.type',
      counterOption: 'object.type',
      operator: 'Contains',
      value: 'vm',
    },
    expectedConditionText: 'include object.type Contains vm',
    verifyPreview: async (page) => {
      const { previewTable, tableRows } = await getPreviewTableState(page);
      await expect(previewTable).toBeVisible();
      await expect(await tableRows.count()).toBeGreaterThan(0);
      await expect(tableRows.first()).not.toHaveText('');
    },
  },
  {
    name: 'access point',
    appliesTo: 'Access Point',
    deviceMonitorSearch: '10.20.40.4',
    primaryTag: { key: 'Access Point KPI', value: 'Access Point utilization' },
    dynamicTag: { key: 'dynamic', value: '{wireless.access.point}' },
    condition: {
      type: 'Exclude',
      counterSearch: 'ip',
      counterOption: 'wireless.access.point.ip.address',
      operator: 'Contains',
      value: '40.25',
    },
    expectedConditionText: 'exclude wireless.access.point.ip.address Contains 40.25',
    verifyPreview: async (page) => {
      const { previewTable, tableRows } = await getPreviewTableState(page);
      await expect(previewTable).toBeVisible();
      await expect(await tableRows.count()).toBeGreaterThan(0);
      await expect(tableRows.first()).not.toHaveText('');
      await page.locator("//div[@class='mt-2 w-full flex items-center justify-between']//input[@placeholder='Search']").fill('40.25');
      await expect(previewTable).not.toContainText('40.25');
    },
  },
  {
    name: 'process',
    appliesTo: 'Process',
    inventoryTab: 'Process',
    primaryTag: { key: 'Process KPI', value: 'Process utilization' },
    dynamicTag: { key: 'dynamic', value: '{object.name}' },
    condition: {
      type: 'Exclude',
      counterSearch: 'object.name',
      counterOption: 'object.name',
      operator: 'Contains',
      value: 'motadata',
    },
    expectedConditionText: 'exclude object.name Contains motadata',
    verifyPreview: async (page) => {
      const { previewTable, tableRows } = await getPreviewTableState(page);
      await expect(previewTable).toBeVisible();
      await expect(await tableRows.count()).toBeGreaterThan(0);
      await expect(tableRows.first()).not.toHaveText('');
      await expect(previewTable).not.toContainText('motadata');
    },
  },
  {
    name: 'service',
    appliesTo: 'Service',
    inventoryTab: 'Service',
    primaryTag: { key: 'kpi', value: 'dnj' },
    dynamicTag: { key: 'dynamic', value: '{object.name}' },
    condition: {
      type: 'Exclude',
      counterSearch: 'object.name',
      counterOption: 'object.name',
      operator: 'Contains',
      value: 'dns',
    },
    expectedConditionText: 'exclude object.name Contains dns',
    verifyPreview: async (page) => {
      const { previewTable, tableRows } = await getPreviewTableState(page);
      await expect(previewTable).toBeVisible();
      await expect(await tableRows.count()).toBeGreaterThan(0);
      await expect(tableRows.first()).not.toHaveText('');
      await page.locator("//div[@class='mt-2 w-full flex items-center justify-between']//input[@placeholder='Search']").fill('dns');
      await expect(previewTable).not.toContainText('dns');
    },
  },
];

test.describe.serial('Motadata AIOps Rule Based Tags flow', () => {
  let page;
  const createdRuleNames = [];

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

  // login(page) / logout(page) come from the shared ../../fixtures/auth.js helper.

  async function openRuleBasedTagsPage() {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('rule based');
    await page.getByRole('link', { name: 'Rule Based Tags' }).click();
  }

  async function verifyTagInInventory(tabName, tagKey) {
    await page.locator("//a[@href='/inventory/']").first().click();
    await page.waitForLoadState('networkidle');
    await page.locator(`//div[normalize-space()='${tabName}']`).first().click();
    await page.waitForLoadState('networkidle');

    await page.locator('button#btn-tag-inventory').click();
    const normalizedKey = tagKey.toLowerCase();
    const itemId = normalizedKey.replace(/\s+/g, '-');
    await page.locator("input[data-cy='dropdown-search-input']").last().fill(normalizedKey);
    await expect(page.locator(`div[id="${itemId}"]`).first()).toBeVisible();
    await page.keyboard.press('Escape');
  }

  async function verifyTagInDeviceMonitor(searchValue, tagKey) {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('device monitor');
    await page.getByRole('link', { name: 'Device Monitor Settings' }).click();

    await page.locator("//input[contains(@name,'search')]").fill(searchValue);

    const monitorRow = page.locator('tr.k-master-row', { hasText: searchValue }).first();
    await expect(monitorRow).toBeVisible();
    await monitorRow.locator("//div[contains(@class,'used-count-pill')]").click();

    const tagPills = page.locator(`text=/${tagKey}:/`);
    await expect(tagPills.first()).toBeVisible();

    await page.locator('button.ant-drawer-close').click();
  }

  function exactRuleRow(ruleName) {
    return page.locator('tr.k-master-row').filter({
      has: page.getByText(ruleName, { exact: true }),
    }).first();
  }

  async function openRowActionMenu(ruleName, menuItemId) {
    const searchInput = page.locator("//input[@name='rule-search']");
    await searchInput.fill(ruleName);

    const row = exactRuleRow(ruleName);
    await expect(row).toBeVisible();
    await row.locator("a[data-cy='grid-action']").click();
    await page.locator(`a#${menuItemId}`).click();
  }

  async function cloneServiceRule(serviceRuleName) {
    await openRowActionMenu(serviceRuleName, 'clone');

    await configureCondition({
      type: 'Exclude',
      counterSearch: 'object.name',
      counterOption: 'object.name',
      operator: 'Contains',
      value: 'dns',
    });

    await page.locator("//button[@id='submit-btn']").click();
    await page.reload();
  }

  async function flipServiceRuleAndRerun(serviceRuleName) {
    await openRowActionMenu(serviceRuleName, 'flip');
    await page.locator("//button[@id='submit-btn']").click();
    await page.reload();

    const flippedName = `Flip of ${serviceRuleName}`;
    const searchInput = page.locator("//input[@name='rule-search']");
    await searchInput.fill(flippedName);

    const flippedRow = exactRuleRow(flippedName);
    await expect(flippedRow).toBeVisible();
    await expect(flippedRow).toContainText('Remove');

    await flippedRow.locator('button#start-rediscovery').click();
  }

  async function bulkRerunRules() {
    const headerCheckbox = page.locator('thead tr th input[type="checkbox"]').first();
    await expect(headerCheckbox).toBeVisible();
    await headerCheckbox.check();

    await page.locator('button#btn-show-hide-columns').click();
    await page.getByText('Run', { exact: true }).click();
    await page.locator("//button[@id='confirm-yes']").click();
  }

  async function selectDropdownOption(inputLocator, optionTitle, searchValue) {
    await inputLocator.click();

    if (searchValue) {
      await page.locator("//input[@data-cy='dropdown-search-input']").last().fill(searchValue);
    }

    await page.locator(`span[title="${optionTitle}"]`).click();
  }

  async function fillTag(index, key, value) {
    await page.locator("//input[@id='assign-tag-key-id']").nth(index).fill(key);
    await page.locator("//input[@id='assign-tag-value-id']").nth(index).fill(value);
  }

  async function addDynamicTag(tag) {
    await page.locator('button')
      .filter({ has: page.locator('svg[data-icon="plus-circle"]') })
      .first()
      .click();

    await fillTag(1, tag.key, tag.value);
  }

  async function configureCondition(condition) {
    await selectDropdownOption(
      page.locator("//div[@class='flex items-center absolute mr-3 ml-2 mt-1']//div//input[@placeholder='Select']"),
      condition.type
    );

    await selectDropdownOption(
      page.locator("//input[@placeholder='Select Counter']"),
      condition.counterOption,
      condition.counterSearch
    );

    await selectDropdownOption(
      page.locator("//input[@placeholder='Select Operator']"),
      condition.operator,
      condition.operator
    );

    await page.locator("//input[@placeholder='Value']").fill(condition.value);
  }

  async function createRule({
    name,
    appliesTo,
    primaryTag,
    dynamicTag,
    condition,
    expectedConditionText,
    verifyPreview,
  }) {
    const ruleName = `Test Rule ${name} ${new Date().toISOString()}`;

    await page.getByRole('button', { name: 'Create Rule' }).click();
    await page.locator("//input[@id='rule-name-id']").fill(ruleName);
    await page.locator("//input[@id='description']").fill(DEFAULT_DESCRIPTION);

    await selectDropdownOption(
      page.locator("//div[@id='rules-applies-to']//input[@placeholder='Select']"),
      appliesTo
    );

    await fillTag(0, primaryTag.key, primaryTag.value);
    await addDynamicTag(dynamicTag);
    await configureCondition(condition);

    if (expectedConditionText) {
      await expect(page.locator('span.flex.w-full.flex-wrap')).toContainText(expectedConditionText);
    }

    if (verifyPreview) {
      await page.getByRole('button', { name: 'Preview' }).click();
      await verifyPreview(page);

      const previewCloseButton = page.locator('button').filter({
        has: page.locator("svg[data-icon='close']"),
      }).last();

      await expect(previewCloseButton).toBeVisible();
      await previewCloseButton.click();
    }

    await page.locator("//button[@id='submit-btn']").click();
    await page.reload();

    return ruleName;
  }

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  for (const scenario of scenarios) {
    test(`Navigate to System Settings and add a new rule based tag for type ${scenario.name}`, async () => {
      await openRuleBasedTagsPage();
      const ruleName = await createRule(scenario);
      createdRuleNames.push(ruleName);
    });
  }

  test('Rerun all created rule based tags', async () => {
    await openRuleBasedTagsPage();
    await bulkRerunRules();
  });

  test('Clone and flip service rule, then rerun the flipped rule', async () => {
    const serviceRuleName = createdRuleNames.find((name) => name.startsWith('Test Rule service '));
    expect(serviceRuleName).toBeTruthy();

    await openRuleBasedTagsPage();
    await cloneServiceRule(serviceRuleName);
    await flipServiceRuleAndRerun(serviceRuleName);
  });

  for (const scenario of scenarios) {
    if (scenario.name === 'service') continue;

    if (scenario.deviceMonitorSearch) {
      test(`Verify ${scenario.name} dynamic tag appears in Device Monitor Settings instance list`, async () => {
        await verifyTagInDeviceMonitor(scenario.deviceMonitorSearch, scenario.dynamicTag.key);
      });
      continue;
    }

    test(`Verify ${scenario.name} tag appears in ${scenario.inventoryTab} inventory`, async () => {
      await verifyTagInInventory(scenario.inventoryTab, scenario.primaryTag.key);
    });
  }

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
