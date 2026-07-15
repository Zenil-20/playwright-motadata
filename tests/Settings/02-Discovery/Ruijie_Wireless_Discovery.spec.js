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
 * Created : 14 July 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// The dummy SNMP device for Ruijie runs on a non-standard UDP port (1611), so the
// discovery Port must be overridden from the default 161. Credentials use the
// shared "Default SNMP" profile (community v2c public) selected from the picker.
const RUIJIE_IP = process.env.Ruijie_Wireless_IP || '172.16.15.160';
const RUIJIE_PORT = process.env.Ruijie_Wireless_Port || '1611';

// Readable IST (Asia/Kolkata) timestamp as YYYYMMDD-HHmmss — filename-safe, used to
// keep each discovery profile name unique (backend rejects duplicates).
function istStamp() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return `${p.year}${p.month}${p.day}-${p.hour}${p.minute}${p.second}`;
}

// The provision-status popup renders as a role=document popover (NOT role=dialog), so a
// dialog-scoped match times out. Target the cross <a> inside the flex header that holds
// the "Provision Status" heading.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}

test.describe.serial('Motadata AIOps Discovery Flow For Ruijie Wireless Discovery', () => {
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
    await login(page);
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Ruijie Wireless', async () => {
    // Discovery + provision can take several minutes; the config's 120s test cap would
    // kill the 480s results wait below. Raise the per-test timeout.
    test.setTimeout(720000);

    await page.getByText('Wireless', { exact: true }).click();
    await page.getByRole('link', { name: 'Ruijie Wireless' }).click();

    // Profile name must be UNIQUE (backend rejects duplicates) — append a timestamp.
    await page.locator('input[name="profile-name"]').fill(`ruijie-wireless-${istStamp()}`);
    // Wireless discovery form uses name="wireless-ip-address" (NOT the id='ip-address-id'
    // used by the Server/Network forms) — verified against Ruckus_Wireless_Discovery.spec.js.
    await page.locator('input[name="wireless-ip-address"]').fill(RUIJIE_IP);

    // Select the shared "Default SNMP" credential profile from the picker.
    await page.locator('#credential-profile-picker-id').click();
    const searchInput = page.locator("//input[@data-cy='dropdown-search-input']");
    await searchInput.fill('Default SNMP');
    await searchInput.press('Enter');

    // Override the SNMP port to the dummy's port (default in the form is 161).
    await page.locator('input[name="port"]').fill(RUIJIE_PORT);

    // The in-app dev overlay (span.cp-global-name "Refresh page widgets") floats over the
    // bottom-right and covers this button. A forced click still lands positionally on the
    // overlay, so dispatch the DOM click event directly on the button to bypass hit-testing.
    await page.locator('#save-run-btn-id').dispatchEvent('click');

    // Wait for the discovery RESULT rows, then confirm the target IP was discovered.
    await expect(page.locator('tr.k-master-row').first()).toBeVisible({ timeout: 480000 });
    await expect(page.getByText(RUIJIE_IP).first()).toBeVisible({ timeout: 120000 });

    // Select the discovered object (first checkbox = header select-all) and provision.
    await page.locator('input[type="checkbox"]').first().check({ force: true });
    // Same dev overlay can cover this button — dispatch the click directly.
    await page.locator("//button[@id='add-selected-btn-id']").dispatchEvent('click');
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
