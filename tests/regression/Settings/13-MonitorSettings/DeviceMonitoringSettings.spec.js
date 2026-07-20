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
 * Created : 21 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const SOURCE_SEARCH = 'aruba';
const NEW_SPEED = '99';
const BULK_TAG = 'automation:playwright';
// Disable / Poll-Now / re-enable is exercised against this one specific firewall monitor only
const FIREWALL_MONITOR = 'fg_firewall.mindarray.com';
// Docker-capable monitor whose Metric Settings expose the Docker / Docker Container tabs
const DOCKER_MONITOR = '172.16.15.234';

test.describe.serial('Motadata AIOps Device Monitor Settings flow', () => {
  let page;

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

  test('Bulk change interface speed for Aruba monitor', async () => {
    test.setTimeout(180000);

    // Navigate to Device Monitor Settings
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('device monitor');
    await page.getByRole('link', { name: 'Device Monitor Settings' }).click();

    // Open the Configure Interface (bulk change speed) panel
    const bulkSpeedBtn = page.locator('#bulk-interface-speed');
    await expect(bulkSpeedBtn).toBeVisible();
    await bulkSpeedBtn.click();

    // Source Filter -> Monitor
    const sourceFilterTrigger = page.locator('input[placeholder="Everywhere"][data-cy="dropdown-trigger-input"]');
    await expect(sourceFilterTrigger).toBeVisible({ timeout: 15000 });
    await sourceFilterTrigger.click();
    await page.locator('#Monitor').click();

    // Source dropdown -> search aruba -> tick the monitor row
    const sourceTrigger = page.locator('input[readonly][placeholder=" "]').first();
    await sourceTrigger.click();

    const monitorSearch = page.locator('input#assign-monitor-search');
    await expect(monitorSearch).toBeVisible({ timeout: 15000 });
    await monitorSearch.fill(SOURCE_SEARCH);

    // Scope the row lookup to the dropdown popover that owns the search input
    const sourcePopover = page.locator('.ant-popover:visible, .ant-dropdown:visible, .v-popover-popover:visible').last();
    const monitorRow = sourcePopover.locator('tr.k-master-row', { hasText: /aruba/i }).first();
    await expect(monitorRow).toBeVisible({ timeout: 15000 });
    await monitorRow.locator("//span[@class='ant-checkbox']//input[@type='checkbox']").check();

    // Run the search
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    // Wait for the interface grid to populate
    const interfaceRows = page.locator('tr.k-master-row');
    await expect(interfaceRows.first()).toBeVisible({ timeout: 30000 });

    // Select-all header checkbox (first column header)
    await page.locator("//div[contains(@class,'flex flex-col min-h-0 flex-1 w-full')]//thead[contains(@role,'presentation')]//input[contains(@type,'checkbox')]").click();

    // Click the bulk "Change Speed" button in the toolbar to open the speed modal
    await page.getByRole('button', { name: 'Change Speed', exact: true }).first().click();

    // Speed modal: enter speed and submit
    const speedInput = page.locator("//input[contains(@placeholder,'Enter Speed')]");
    await expect(speedInput).toBeVisible({ timeout: 15000 });
    await speedInput.fill(NEW_SPEED);

    await page.locator('//div[contains(@class,"col text-right")]//button[@id="change-speed-btn"]').click();

    // Persist the bulk change
    await page.locator('#update-interface-speed-btn').click();

    // Verify success toast
    const successToast = page.locator('.ant-notification-notice-description', {
      hasText: /Interface speeds updated successfully/i,
    });
    await expect(successToast).toBeVisible({ timeout: 20000 });
  });

  test('Verify updated speed in Metric Settings -> Network Interface', async () => {
    test.setTimeout(120000);

    // Search "aruba" in the device monitor grid
    const gridSearch = page.locator("//input[@placeholder='Search']").last();
    await gridSearch.fill(SOURCE_SEARCH);

    const arubaRow = page.locator('tr.k-master-row', { hasText: 'ArubaMC-VA_BB_8A_50' }).first();
    await expect(arubaRow).toBeVisible({ timeout: 30000 });

    // Open kebab -> Metric Settings
    await arubaRow.locator('a[data-cy="grid-action"]').click();
    await page.getByText('Metric Settings', { exact: false }).first().click();

    // Switch to Network Interface tab
    await page.getByRole('tab', { name: 'Network Interface', exact: true }).click();

    // Assert every speed input shows 99
    const speedInputs = page.locator('div.ant-drawer-open input.ant-input-number-input');
    await expect(speedInputs.first()).toBeVisible({ timeout: 30000 });

    const count = await speedInputs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(speedInputs.nth(i)).toHaveValue(NEW_SPEED);
    }

    // Close the drawer
    await page.locator('button.ant-drawer-close').first().click();
  });

  test('Bulk assign tag to a monitor and verify on Device Monitor Settings', async () => {
    //For clearing the search filter and showing all the monitors in the grid for selecting the first row checkbox
    await page.reload();
    test.setTimeout(120000);

    // Tick the first row checkbox in the grid
    await page.locator("//input[@type='checkbox']").first().click();

    // Open the bulk Tag panel — the toolbar button surfaces once rows are selected.
    await page.locator('#bulk-tag-toggle').click();

    // Add the tag via the ant-select tag input
    const tagPlaceholder = page.getByText('Add Tags');
    await expect(tagPlaceholder).toBeVisible();
    await tagPlaceholder.click();

    const tagInput = page.locator('input.ant-select-search__field').last();
    await tagInput.fill(BULK_TAG);
    await tagInput.press('Enter');

    // Save
    await page.locator('#apply-btn').click();

    // Ensure the Tags column is visible via the eye / show-hide-columns button
    const tagsHeader = page.locator('th.k-header', { hasText: /^Tags?$/i }).first();
    if (!(await tagsHeader.isVisible().catch(() => false))) {
      await page.locator('#btn-show-hide-columns').click();
      const columnSearch = page.locator("input[data-cy='dropdown-search-input']").last();
      await expect(columnSearch).toBeVisible();
      await columnSearch.fill('Tags');
      await page.getByText('Tags', { exact: true }).first().click();
      await page.keyboard.press('Escape');
      await expect(tagsHeader).toBeVisible();
    }

    // The tagged row should now show the new tag value
    await expect(page.locator('td', { hasText: BULK_TAG }).first()).toBeVisible();
  });

  test('Disable the firewall monitor from grid action and verify status changes to Disable', async () => {
    test.setTimeout(120000);
    await page.reload();

    // Scope to the one firewall monitor so only that device is disabled
    await page.locator("//input[@placeholder='Search']").nth(1).fill(FIREWALL_MONITOR);

    const firewallRow = page.locator('tr.k-master-row', { hasText: FIREWALL_MONITOR }).first();
    await expect(firewallRow).toBeVisible({ timeout: 30000 });
    await firewallRow.locator('svg[data-icon="ellipsis-v"]').click();
    await page.locator('a#disable').click();
    await page.locator('#confirm-yes').click();

    await expect(firewallRow.locator('td', { hasText: /^\s*Disable\s*$/ })).toBeVisible();
  });

  test('Poll Now on disabled firewall monitor shows error, then re-enable it', async () => {
    test.setTimeout(120000);

    // Target only the firewall monitor disabled in the previous test
    const monitorName = FIREWALL_MONITOR;

    // Open the monitor from "All" inventory and trigger Poll Now
    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    await page.goto(`${baseUrl}/inventory/All/groups`, { waitUntil: 'domcontentloaded' });
    await page.locator("input[placeholder='Search']").first().fill(monitorName);
    await page.locator('tr.k-master-row', { hasText: monitorName }).first()
      .getByText(monitorName, { exact: true }).first().click();

    await expect(page.locator('.ant-tag.tag-red', { hasText: /Disable/i }).first()).toBeVisible();
    await page.locator('button[title="Poll Now"]').click();
    await expect(
      page.locator('.ant-notification-notice, .ant-message-error', { hasText: /Monitor is in Disable state/i }).first()
    ).toBeVisible();

    // Re-enable the monitor from Device Monitor Settings
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('device monitor');
    await page.getByRole('link', { name: 'Device Monitor Settings' }).click();
    await page.locator("//input[@placeholder='Search']").nth(1).fill(monitorName);

    const settingsRow = page.locator('tr.k-master-row', { hasText: monitorName }).first();
    await settingsRow.locator('svg[data-icon="ellipsis-v"]').click();
    await page.locator('a#enable').click();
    await page.locator('#confirm-yes').click();
    await expect(settingsRow.locator('td', { hasText: /^\s*Enable\s*$/ })).toBeVisible();
  });

  test('Put vCenter monitor in Maintenance, verify Poll Now is blocked, then turn it off', async () => {
    test.setTimeout(180000);
    await page.reload();

    const MONITOR = '172.16.10.180';
    await page.locator("//input[@placeholder='Search']").nth(1).fill(MONITOR);

    // Put the vCenter monitor On Maintenance
    const settingsRow = page.locator('tr.k-master-row', { hasText: MONITOR }).first();
    await settingsRow.locator('svg[data-icon="ellipsis-v"]').click();
    await page.locator('a#on-maintainance').click();
    await page.locator("//textarea[@placeholder='Add a remark for maintenance']").fill('Automation: maintenance window');
    await page.locator('#confirm-yes').click();
    await expect(settingsRow.locator('td', { hasText: /^\s*Maintenance\s*$/ })).toBeVisible();

    // Open the monitor from "All" inventory and confirm Poll Now is blocked
    const baseUrl = new URL(process.env.Motadata_Aiops).origin;
    const openMonitor = async () => {
      await page.goto(`${baseUrl}/inventory/All/groups`, { waitUntil: 'domcontentloaded' });
      await page.locator("input[placeholder='Search']").first().fill(MONITOR);
      await page.locator('tr.k-master-row', { hasText: MONITOR }).first()
        .getByText(MONITOR, { exact: true }).first().click();
    };

    await openMonitor();
    await page.locator('button[title="Poll Now"]').click();
    await expect(page.getByText(/Monitor is in Maintenance state/i).first()).toBeVisible();
    await expect(page.locator('div.ant-tag', { hasText: 'Maintenance' })).toBeVisible();

    // Turn maintenance Off from Device Monitor Settings
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('device monitor');
    await page.getByRole('link', { name: 'Device Monitor Settings' }).click();
    await page.locator("//input[@placeholder='Search']").nth(1).fill(MONITOR);

    await settingsRow.locator('svg[data-icon="ellipsis-v"]').click();
    await page.locator("//span[normalize-space()='Off Maintenance']").click();
    await page.locator('#confirm-yes').click();
    await expect(settingsRow.locator('td', { hasText: /^\s*Enable\s*$/ })).toBeVisible();

    // Poll Now should now succeed (request queued)
    await openMonitor();
    await page.locator('button[title="Poll Now"]').click();
    await expect(page.getByText(/Polling request is queued/i).first()).toBeVisible();
  });

  test('Update the metric collection time for Aruba Wireless monitor and change the polling time between 60-90 seconds, then verify the changes are reflected in the Metric Settings drawer', async () => {
    test.setTimeout(120000);

    // The previous test left us on the inventory page — go to Settings → Device Monitor
    // Settings and scope the grid to the Aruba Wireless monitor first.
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('device monitor');
    await page.getByRole('link', { name: 'Device Monitor Settings' }).click();
    await page.locator("//input[@placeholder='Search']").nth(1).fill(SOURCE_SEARCH);

    const arubaMonitorRow = page.locator('tr.k-master-row', { hasText: 'ArubaMC-VA_BB_8A_50' }).first();
    await expect(arubaMonitorRow).toBeVisible({ timeout: 30000 });
    await arubaMonitorRow.locator('input[type="checkbox"]').first().check();

    // Random polling time in [60, 90]
    const pollTime = String(Math.floor(Math.random() * 31) + 60);

    // Open the bulk Metric Collection Time drawer scoped to Network Interface
    await page.locator('#bulk-metric-collection-type').click();
    await page.locator('//div[@id="metric-picker"]//input[@placeholder="Select"]').click();
    await page.locator('//input[@data-cy="dropdown-search-input"]').fill('network');
    await page.getByText('Network Interface').click();

    // Select all interface rows
    await page.locator('//div[@class="k-widget k-grid k-grid-virtual"]//thead[@role="presentation"]//input[@type="checkbox"]').check();

    // Set the polling time and trigger update
    await page.locator("//input[@placeholder='Poll Time']").fill(pollTime);
    await page.locator('#update-metric-collection-time-btn').click();

    // Confirmation modal text is dynamic — assert it reflects our value
    await expect(page.locator('.ant-modal-body')).toContainText(pollTime);
    await page.locator('#confirm-yes').click();

    // Verify in the Metric Settings drawer
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('device monitor');
    await page.getByRole('link', { name: 'Device Monitor Settings' }).click();
    await page.locator("//input[@placeholder='Search']").nth(1).fill(SOURCE_SEARCH);

    const arubaRow = page.locator('tr.k-master-row', { hasText: 'ArubaMC-VA_BB_8A_50' }).first();
    await arubaRow.locator('svg[data-icon="ellipsis-v"]').click();
    await page.getByText('Metric Settings', { exact: false }).first().click();

    // The Network Interface row's poll-time cell holds an input — assert on its value
    const interfaceRow = page.locator('div.ant-drawer-open tr', { hasText: 'Network Interface' }).first();
    await expect(interfaceRow.locator('input[placeholder="Poll Time"]')).toHaveValue(pollTime);

    await page.locator('#update-metric-collection-time').click();
  });

  test('Verify Metric Settings for 172.16.15.234 exposes Docker and Docker Container tabs', async () => {
    test.setTimeout(120000);

    // Navigate to Device Monitor Settings
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('device monitor');
    await page.getByRole('link', { name: 'Device Monitor Settings' }).click();

    // Searching by IP returns several monitors that share 172.16.15.234 (MongoDB, Oracle,
    // Oracle RAC, Kubernetes, Linux). Only the Linux server monitor exposes the Docker tabs,
    // so scope the row by its "Linux" type icon — filtering by the shared IP would match 5
    // rows and .first() lands on MongoDB (no Docker tabs).
    await page.locator("//input[@placeholder='Search']").nth(1).fill(DOCKER_MONITOR);
    const monitorRow = page.locator('tr.k-master-row')
      .filter({ has: page.getByRole('img', { name: 'Linux', exact: true }) })
      .first();
    await expect(monitorRow).toBeVisible({ timeout: 30000 });

    // Open kebab -> Metric Settings
    await monitorRow.locator('svg[data-icon="ellipsis-v"]').click();
    await page.getByText('Metric Settings', { exact: false }).first().click();

    // The Metric Settings drawer should expose both Docker tabs
    const drawer = page.locator('div.ant-drawer-open');
    const dockerContainerTab = drawer.getByRole('tab', { name: 'Docker Container', exact: true });
    const dockerTab = drawer.getByRole('tab', { name: 'Docker', exact: true });

    await expect(dockerContainerTab).toBeVisible({ timeout: 30000 });
    await expect(dockerTab).toBeVisible();

    // Activate Docker Container tab — container names are dynamic, so assert only the tab state + static header
    await dockerContainerTab.click();
    await expect(dockerContainerTab).toHaveAttribute('aria-selected', 'true');
    await expect(drawer.locator('th', { hasText: /Container Name/i }).first()).toBeVisible();

    // Activate Docker tab and confirm it becomes the selected tab
    await dockerTab.click();
    await expect(dockerTab).toHaveAttribute('aria-selected', 'true');

    // Close the drawer
    await page.locator('button.ant-drawer-close').first().click();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
