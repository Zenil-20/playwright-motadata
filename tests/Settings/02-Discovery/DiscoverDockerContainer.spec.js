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
 * Created : 03 June 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout, ensureListView } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// The provision-status popup renders as a role=document popover (NOT role=dialog), so a
// dialog-scoped match is unreliable and a bare svg[data-icon="times"] click can hit a
// page-header icon instead (strict-mode violation / wrong element). Target the cross <a>
// inside the flex header that holds the "Provision Status" heading.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}

const LINUX_SERVER_IP = '172.16.15.234';
const LINUX_SERVER_USERNAME = 'motadata';
const LINUX_SERVER_PASSWORD = 'motadata';
const PROFILE_NAME = 'Linux Server 172.16.15.234 by Automation Playwright';
const CRED_PROFILE_NAME = 'Linux Server 172.16.15.234';

// Master Motadata server base URL, derived from .env (Motadata_Aiops). Trailing
// slash stripped so paths like `/inventory/...` append cleanly.
const BASE_URL = (process.env.Motadata_Aiops || '').replace(/\/+$/, '');

test.describe.serial('Motadata AIOps Discovery Flow For Linux Server 172.16.15.234', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // Single browser context and page shared across all tests.
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Linux Server 172.16.15.234', async () => {
    await page.locator("//input[@id='profile-id']").fill(PROFILE_NAME);
    await page.locator("//input[@id='ip-address-id']").fill(LINUX_SERVER_IP);

    // Create a new SSH credential profile for the Linux server.
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(CRED_PROFILE_NAME);
    await page.locator("//input[@id='username-id']").fill(LINUX_SERVER_USERNAME);
    await page.locator("//input[@id='password-id']").fill(LINUX_SERVER_PASSWORD);

    // Test the credential against the device before saving.
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(LINUX_SERVER_IP);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful', { timeout: 120000 });
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();

    // Save and run the discovery.
    await page.locator('#save-run-btn-id').click();

    // Wait for the discovered device to appear in the results table.
    await expect(page.getByText(LINUX_SERVER_IP, { exact: true }).first())
      .toBeVisible({ timeout: 480000 });

    // Tick the discovered row (nth(0) is the header select-all) and provision it.
    const discoveredRow = page.locator('tr.k-master-row', { hasText: LINUX_SERVER_IP }).first();
    await discoveredRow.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();

    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await closeProvisionStatus(page);
  });

  test('Provision the containers supported in Linux Server 172.16.15.234', async () => {
    test.setTimeout(300000);
    // Navigate to the Server inventory on the master server set in .env (not a hardcoded IP).
    await page.goto(`${BASE_URL}/inventory/Server/groups`);
    // The inventory can land in GRID/Dashboard view (no Search box). Force LIST view first,
    // otherwise the Search wait below hangs. ensureListView no-ops when already in list view.
    await ensureListView(page);
    await page.locator("//input[@placeholder='Search']").fill('motadata234');
    // Wait for the grid to filter down to the searched device, then open that device.
    await expect(page.getByRole('link', { name: 'motadata234' })).toBeVisible({ timeout: 60000 });
    await page.getByRole('link', { name: 'motadata234' }).click();
    // Only proceed once the device detail page has opened (Container Runtime is present).
    await expect(page.getByRole('button', { name: 'Container Runtime' })).toBeVisible({ timeout: 60000 });
    await page.getByRole('button', { name: 'Container Runtime' }).click();
    const drawer = page.locator('.ant-drawer-open').last();
    await expect(drawer).toBeVisible();

    // Create a fresh Docker credential. A UNIQUE name is essential: with a fixed
    // name the create silently fails on any later run (the profile already exists),
    // and the discovery then falls back to a host re-scan that returns no
    // containers — which is exactly why the container grid never appeared before.
    const dockerCred = `Docker Credential Profile ${Date.now()}`;
    await page.getByRole('button', { name: 'Create Credential Profile' }).click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(dockerCred);
    await page.locator("//input[@id='username-id']").fill('motadata');
    await page.locator("//input[@id='password-id']").fill('motadata');
    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();

    // "Discover Available Containers" ON = discover containers in every state
    // (running, exited, paused, created); OFF would surface running ones only.
    const toggle = page.locator('#auto-sync-id');
    if ((await toggle.textContent())?.trim() === 'OFF') {
      await toggle.click();
    }

    // Port defaults to 2375. Save & Run kicks off the discovery; the discovered
    // containers render as a Kendo grid INSIDE this drawer (not a modal/popup).
    await page.getByRole('button', { name: 'Save & Run' }).click();

    // The discovered containers render ASYNCHRONOUSLY as a Kendo grid; the panel can
    // briefly show a TRANSIENT "No data found" first, so wait for the actual rows
    // before deciding — otherwise provisioning is silently skipped.
    const rows = drawer.locator('tr.k-master-row');
    const noData = drawer.getByRole('heading', { name: 'No data found' });
    const hasContainers = await rows.first()
      .waitFor({ state: 'visible', timeout: 60000 })
      .then(() => true)
      .catch(() => false);

    if (hasContainers) {
      // Select ALL discovered containers via the header select-all checkbox, then
      // Provision (the button appears only once a selection exists). The grid then
      // clears to "No data found".
      await drawer.locator(".k-grid-header input[type='checkbox']").first().check({ force: true });
      const provisionBtn = drawer.getByRole('button', { name: 'Provision' });
      await expect(provisionBtn).toBeEnabled();
      await provisionBtn.click();
      await expect(noData).toBeVisible({ timeout: 120000 });
    } else {
      // Nothing left to provision (already provisioned) — verify the empty state.
      await expect(noData).toBeVisible();
    }

    // Close the drawer via its X (svg[data-icon='times']). Bounded timeout + catch
    // so a missing control can never hang the test (the page default is 500s).
    await page.locator('.ant-drawer-open svg[data-icon="times"]').first()
      .click({ timeout: 10000 }).catch(() => {});
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
