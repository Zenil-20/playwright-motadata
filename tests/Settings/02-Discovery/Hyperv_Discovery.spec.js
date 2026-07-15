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
 * Created : 14 July 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// Hyper-V is a Virtualization type; it authenticates with a Windows (WMI/WinRM)
// credential over port 5985 (the discovery form defaults to 443, so we override it).
const HYPERV_IP = process.env.Hyperv_ip || '172.16.8.98';
const HYPERV_USERNAME = process.env.Hyperv_username || 'administrator';
const HYPERV_PASSWORD = process.env.Hyperv_password || 'Mind@123';
const HYPERV_PORT = process.env.Hyperv_port || '5985';

// Readable IST (Asia/Kolkata) timestamp as YYYYMMDD-HHmmss — filename-safe, used to keep
// the discovery-profile and credential names unique (backend rejects duplicate names).
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
// dialog-scoped match is unreliable and a bare svg[data-icon="times"] click can hit a
// page-header icon instead. Target the cross <a> inside the flex header that holds the
// "Provision Status" heading.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}

test.describe.serial('Motadata AIOps Discovery Flow For Hyper-V Discovery', () => {
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

  test('Create Discovery for Hyper-V Virtualization', async () => {
    // Discovery + provision can take several minutes; the config's 120s test cap would
    // kill the long results wait below. Raise the per-test timeout.
    test.setTimeout(720000);

    await page.getByText('Virtualization', { exact: true }).click();
    await page.getByRole('link', { name: 'Hyper-V' }).click();
    // The form opens on the "Hyper-V" tab by default (vs "Hyper-V Cluster") — no extra click.

    await page.getByRole('textbox', { name: 'Must be unique' }).fill(`discover-hyperv-${istStamp()}`);
    await page.getByRole('textbox', { name: 'e.g. 192.168.1.1 or fd00::1' }).fill(HYPERV_IP);

    // Create the Windows credential inline. The drawer's Protocol defaults to "Powershell"
    // (WinRM/PowerShell remoting on port 5985) which is correct for Hyper-V, so we only fill
    // name/username/password — same shape as the Esxi/vCenter/Nutanix specs.
    await page.getByRole('button', { name: 'Create Credential Profile' }).click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(`hyperv-cred-${istStamp()}`);
    await page.locator("//input[@id='username-id']").first().fill(HYPERV_USERNAME);
    await page.locator("//input[@id='password-id']").first().fill(HYPERV_PASSWORD);
    // The DEV overlay sits over this bottom-right button — dispatch the click to bypass it.
    await page.getByRole('button', { name: 'Create Credentials Profile' }).dispatchEvent('click');

    // Override the port from the Hyper-V default (443) to WinRM 5985.
    await page.locator('input[name="port"]').fill(HYPERV_PORT);

    // The in-app dev overlay (span.cp-global-name "Refresh page widgets") floats over the
    // bottom-right and covers this button. A forced click still lands positionally on the
    // overlay, so dispatch the DOM click event directly on the button to bypass hit-testing.
    await page.locator('#save-run-btn-id').dispatchEvent('click');

    // Wait for the discovery RESULT rows, then confirm the target IP was discovered.
    await expect(page.locator('tr.k-master-row').first()).toBeVisible({ timeout: 480000 });
    await expect(page.getByText(HYPERV_IP).first()).toBeVisible({ timeout: 120000 });

    // Select the discovered object (nth(0) checkbox is the header select-all) and provision.
    await page.locator('input[type="checkbox"]').nth(1).check({ force: true });
    // Same dev overlay can cover this button — dispatch the click directly.
    await page.locator("//button[@id='add-selected-btn-id']").dispatchEvent('click');
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
