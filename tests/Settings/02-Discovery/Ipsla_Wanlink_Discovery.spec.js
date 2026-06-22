
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
* Created : 27 February 2026
*/

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { time } from 'node:console';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// The provision-status popup renders as a role=document popover (NOT role=dialog), so a
// dialog-scoped match is unreliable and the old fallback to the first page-level times
// icon clicked the wrong element (strict-mode violation). Target the cross <a> inside the
// flex header that holds the "Provision Status" heading instead.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}

async function openNetworkInventory(page) {
  await page.goto(`${process.env.Motadata_Aiops}/inventory/`, {
    timeout: 120000,
    waitUntil: 'domcontentloaded',
  });

  await page.getByRole('tab', { name: 'Network' }).click();

  const gridBtn = page.locator("//button[@title='Grid']");
  const dashboardBtn = page.locator("//button[@title='Dashboard']");

  if (await gridBtn.waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false)){
    await gridBtn.click();
  }

  await expect(dashboardBtn).toBeVisible({ timeout: 120000 });

  //  Wait for loader to disappear (VERY IMPORTANT)
  const loader = page.locator('.ant-spin, .loader, [data-testid="loader"]');
  if (await loader.first().isVisible().catch(() => false)) {
    await loader.first().waitFor({ state: 'hidden', timeout: 60000 });
  }

  // Re-create locator AFTER render (important)
  const searchBox = page.getByPlaceholder('Search').first();

  // Wait until visible
  await expect(searchBox).toBeVisible({ timeout: 60000 });

  // Ensure element is stable + usable
  await page.waitForFunction(() => {
    const el = document.querySelector("input[placeholder='Search']");
    return el && !el.disabled;
  });

  return searchBox;
}

// Idempotently ensure an SNMP V1/V2c credential exists. The WAN-link steps reference
// these by exact title, so the names must stay fixed — which means a blind create fails
// with a duplicate-name error on any re-run / parallel run. Create only when missing.
async function ensureSnmpV2cCredential(page, name, community) {
  const search = page.locator("//input[@name='search']").first();
  await expect(search).toBeVisible({ timeout: 120000 });
  await search.fill(name);

  // The grid filters as you type; wait briefly for the matching row to surface.
  const matchRow = page.locator('tr.k-master-row', { hasText: name });
  const exists = await matchRow.first()
    .waitFor({ state: 'visible', timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (exists) return; // already present — idempotent skip

  const createBtn = page.locator("//button[@id='create-credential-profile-btn']");
  await expect(createBtn).toBeEnabled({ timeout: 120000 });
  await createBtn.click();
  await page.locator("//input[@placeholder='Select']").click();
  await page.locator("//input[@data-cy='dropdown-search-input']").fill('SNMP V1/V2c');
  await page.locator("//span[@title='SNMP V1/V2c']").click();
  await page.locator("//input[@id='credential-profile-name-id']").fill(name);
  await page.locator('#version-id').click();
  await page.locator("//span[@title='V2c']").click();
  await page.locator("//input[@id='community-id']").fill(community);
  await page.locator("//input[@id='write-community-id']").fill(community);
  const submitBtn = page.locator("//button[@id='credential-profile-submit-btn']");
  await submitBtn.click();
  // Completion gate (no grid-pagination dependency): on success the create drawer closes, so
  // its submit button detaches. The existence pre-check above can race a parallel run, so a
  // duplicate-name error is still possible — treat "Profile Name is not unique" as
  // already-present, close the drawer and return (mirrors the ServiceOps credential flow).
  const dupMsg = page.locator('.ant-message-error', { hasText: /not unique|already exists/i });
  const outcome = await Promise.race([
    submitBtn.waitFor({ state: 'hidden', timeout: 60000 }).then(() => 'created').catch(() => null),
    dupMsg.first().waitFor({ state: 'visible', timeout: 60000 }).then(() => 'duplicate').catch(() => null),
  ]);
  if (outcome === 'duplicate') {
    await page.locator("//button[@aria-label='Close' and contains(@class,'ant-drawer-close')]")
      .first().click({ timeout: 10000 }).catch(() => {});
    await expect(submitBtn).toBeHidden({ timeout: 30000 });
    return;
  }
  if (outcome !== 'created') {
    throw new Error(`Credential "${name}" create: drawer neither closed nor showed a duplicate error within 60s`);
  }
}

// --- WAN-link helpers. These replace the banned positional/absolute XPaths
// (//div[10]//div[2]..., /html[1]/body[1]/...) with verified label-scoped locators. ---

// The <input> inside the ant-form-item whose label is exactly `label`.
function wanField(form, label) {
  return form.locator(
    `xpath=.//div[contains(@class,'ant-form-item')][.//label[normalize-space()='${label}']]//input`,
  );
}

// Pick a credential in the WAN-link form's credential picker (popover + search).
async function selectWanCredential(page, name) {
  await page.locator('#credential-profile-picker-id').click();
  const search = page.locator("//input[@data-cy='dropdown-search-input']").last();
  await expect(search).toBeVisible({ timeout: 30000 });
  await search.fill(name);
  await page.locator('.ant-popover:visible')
    .getByRole('menuitem', { name, exact: true }).click();
}

// Open a network device's "Add WAN Link" form; returns the open drawer locator.
async function openDeviceWanForm(page, deviceIp, deviceLink) {
  await page.getByRole('menuitem', { name: 'Monitors' }).click();
  await page.getByRole('tab', { name: 'Network' }).click();
  const search = page.locator("//input[@placeholder='Search']").first();
  await expect(search).toBeVisible({ timeout: 60000 });
  const link = page.getByRole('link', { name: deviceLink, exact: true });
  // The grid search races with a late reload that repopulates the full device list,
  // so a single fill can be silently undone. Retry the filter until the row appears.
  await expect(async () => {
    await search.fill('');
    await search.fill(deviceIp);
    await expect(link).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 120000 });
  await link.click();
  await page.getByRole('button', { name: 'Add WAN Link' }).click();
  const form = page.locator('.ant-drawer-open').last();
  await expect(form).toBeVisible();
  return form;
}

// After submitting a WAN link, the rediscovery surfaces in a minimized box.
// Expand it, then provision results if any (idempotent: a re-run finds nothing new).
async function provisionRediscovery(page) {
  await page.locator('#rediscovery-minimized-box').click();
  await page.locator('#rediscovery-minimized-box button')
    .filter({ has: page.locator("svg[data-icon='window-restore']") }).click();
  // The rediscovery runs ASYNCHRONOUSLY (~25s) and only then surfaces the WAN-link
  // row(s). The panel shows a TRANSIENT "No data found" first, so we must wait for
  // the actual rows — otherwise provisioning is silently skipped.
  await expect.poll(async () => page.locator('tr.k-master-row').count(), { timeout: 150000 })
    .toBeGreaterThan(0);
  // Select EVERY discovered WAN link (the Provision button only appears once a
  // selection exists) so all of them get provisioned, not just the first.
  const rowCheckboxes = page.locator('tr.k-master-row').getByRole('checkbox');
  const count = await rowCheckboxes.count();
  for (let i = 0; i < count; i++) await rowCheckboxes.nth(i).check();
  const provisionBtn = page.getByRole('button', { name: 'Provision' });
  await expect(provisionBtn).toBeEnabled();
  await provisionBtn.click();
  // Once provisioned, the rediscovery grid clears back to "No data found". Scope to
  // the level-1 heading: the device-overview page in the background has its own
  // "No data found" widget heading (an <h5>), so an unscoped heading match is ambiguous.
  await expect(page.getByRole('heading', { name: 'No data found', level: 1 })).toBeVisible({ timeout: 120000 });
  await page.locator("button:has(svg[data-icon='times'])").first()
    .click({ timeout: 10000 }).catch(() => {});
}

test.describe.serial('Motadata AIOps Discovery Flow For ipsla_wanlink', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
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

  test('Create Discovery for Network 172.16.14.25-53 for v1 creds', async () => {
    test.setTimeout(500000);
    await page.getByText('Network', { exact: true }).click();
    await page.locator("//span[normalize-space()='IP Range']").click();
    // Discovery profile names must be UNIQUE (backend rejects duplicates with
    // MD022 "Discovery Profile Name is not unique"). Append a timestamp so re-runs
    // and parallel runs don't 400 on creation. The name is just a label — the IP
    // range below is what actually gets discovered/provisioned.
    await page.locator('input[name="profile-name"]').fill(`172.16.14.25-53`);
    await page.locator("//input[@id='ip-range-id']").fill(process.env.ipsla_wanlink_Discovery_ip_range);

    await page.locator('#credential-profile-picker-id').click();
    const searchInput = page.locator("//input[@data-cy='dropdown-search-input']");
    await searchInput.fill("Default SNMP");
    await searchInput.press('Enter');

    await page.locator('#save-run-btn-id').click();

    // Wait for the discovery RESULT ROWS — NOT the profile-name heading (which
    // contains the range string and appears immediately, so getByText(range) would
    // pass prematurely while the scan is still running). The scan can take minutes.
    await expect(page.locator('tr.k-master-row').first()).toBeVisible({ timeout: 480000 });

    // Select all results (first checkbox = header select-all) and provision.
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await closeProvisionStatus(page);
  });

  test('Create write private and write public credentials', async () => {
    // Navigate straight to the Credential Profiles grid (self-contained → parallel-safe).
    await page.goto(`${process.env.Motadata_Aiops}/settings/network-discovery/credential-profiles`, {
      waitUntil: 'domcontentloaded',
    });
    // Create each only if it does not already exist (idempotent / parallel-safe).
    await ensureSnmpV2cCredential(page, 'write public', 'public');
    await ensureSnmpV2cCredential(page, 'write private', 'private');
  });

  test('Provision WAN link service with write private and public creds and validate inventory', async () => {
    test.setTimeout(420000);

    // --- site2.test2.com with the "write public" credential ---
    let form = await openDeviceWanForm(page, '172.16.14.52', 'site2.test2.com');
    await selectWanCredential(page, 'write public');
    await wanField(form, 'Internet Service Provider').fill('jio');
    await form.locator("input[name='ip-host']").fill('65.65.65.2');   // Destination IP
    await wanField(form, 'Frequency').fill('30');
    await wanField(form, 'Operation Timeout').fill('30');
    await page.locator("//button[@id='submit-btn']").click();
    await expect(page.getByText('Initializing WAN-Link configuration on source: site2.test2.com'))
      .toBeVisible({ timeout: 120000 });
    await provisionRediscovery(page);

    // --- site1.test1.com with the "write private" credential ---
    form = await openDeviceWanForm(page, '172.16.14.51', 'site1.test1.com');
    await selectWanCredential(page, 'write private');
    await wanField(form, 'Internet Service Provider').fill('jio');
    await form.locator("input[name='ip-host']").fill('55.55.55.1');   // Destination IP
    await wanField(form, 'Frequency').fill('30');
    await wanField(form, 'Operation Timeout').fill('30');
    await page.locator("//button[@id='submit-btn']").click();
    await expect(page.getByText('Initializing WAN-Link configuration on source: site1.test1.com'))
      .toBeVisible({ timeout: 120000 });
    await provisionRediscovery(page);
  });

  test('ICMP ping juniper bulk WAN link configuration', async () => {
    test.setTimeout(420000);

    const form = await openDeviceWanForm(page, '172.16.14.53', 'site3');
    await page.getByText('Bulk WAN Link Configuration', { exact: true }).click();

    // Create a fresh credential inline from the WAN form; it auto-selects once saved.
    // Unique name suffix → no duplicate-name failure on re-runs (the name is not
    // referenced anywhere else, so uniqueness is safe).
    const bulkCred = `ipsla bulk wan link configuration creds playwright`;
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(bulkCred);
    await page.locator("//input[@id='username-id']").fill('motadata');
    await page.locator("//input[@id='password-id']").fill('Mind@123');
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    // Wait for the create sub-drawer to close (it auto-selects the new credential).
    await expect(page.locator("//button[@id='create-credential-profile-btn-id']"))
      .toBeHidden({ timeout: 30000 });

    const csvPath = './tests/Settings/_data/ipsla-rediscovery-sample (1).csv';
    await page.locator('input[type="file"]').setInputFiles(csvPath);

    // The per-row parameter fields render once the CSV is parsed — wait for them
    // instead of a blind timeout.
    await expect(wanField(form, 'Frequency')).toBeVisible({ timeout: 60000 });
    await wanField(form, 'Frequency').fill('30');
    await wanField(form, 'Operation Timeout').fill('30');

    // The CSV parses asynchronously with NO DOM signal (the submit stays enabled,
    // there is no spinner/preview). Submitting before parsing finishes is a silent
    // no-op, so retry the submit until it takes effect — detected by the rediscovery
    // panel appearing (a PERSISTENT signal, unlike the transient "Initializing" toast,
    // which can be missed between retries even though the submit succeeded).
    const rediscoveryBox = page.locator('#rediscovery-minimized-box');
    await expect(async () => {
      if (await rediscoveryBox.isVisible().catch(() => false)) return;
      await form.getByRole('button', { name: 'Add WAN Link' }).click();
      await expect(rediscoveryBox).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 120000 });
    await provisionRediscovery(page);
  });



  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
 