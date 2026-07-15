
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
 * Created : 09 July 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// Range-based ping discovery over the whole /24. The result counts (Discovered /
// Failed Objects) are DYNAMIC — real hosts on the subnet come and go — so the spec
// never asserts on a count. It asserts only that at least one monitor provisions
// successfully, which is the stable success signal.
const PING_IP_RANGE = process.env.Ping_IpRange_Discovery_ip_range;
const NOTIFICATION_EMAIL = process.env.Ping_IpRange_Discovery_notification_email;

// Human-readable IST timestamp, colon-separated (DD:MM:YYYY:HH:MM:SS). Used to keep the
// discovery-profile name unique across runs without resorting to an opaque epoch value.
function istStamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour12: false,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.day}:${p.month}:${p.year}:${p.hour}:${p.minute}:${p.second}`;
}

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

test.describe.serial('Motadata AIOps Discovery Flow For Ping (Other > IP Range)', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // One browser context/page shared across the serial steps.
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

  test('Create & run Ping IP-Range discovery, then provision one host', async () => {
    // Range ping over a full /24 is slow — every host is probed. Give the scan room.
    test.setTimeout(600000);

    // Category "Other" > sub-type "Ping" (both getByText-exact, verified count()===1).
    await page.getByText('Other', { exact: true }).click();
    await page.getByText('Ping', { exact: true }).click();

    // Discovery mode: IP Range (vs. single IP/Host).
    await page.locator("//span[normalize-space()='IP Range']").click();

    // Profile names must be UNIQUE (backend rejects duplicates), so append a
    // human-readable IST timestamp. NOTE: on this Other/Ping form the input id
    // 'profile-id' is duplicated (Ant wraps the <input> in a same-id <span> -> count 2),
    // so scope by name instead.
    await page.locator("input[name='profile-name']").fill(`ping-172.16.15.1-255 ${istStamp()}`);

    // Same duplicate-id trap on the range field: use name='ip-range' (count 1), not #ip-range-id (2).
    await page.locator("input[name='ip-range']").fill(PING_IP_RANGE);

    // Notification: this is a mention/tag input. Typing an email then pressing Enter
    // commits it as a chip and clears the input (verified live). We fill ONLY an email.
    const notification = page.locator("input[placeholder='@User or Email or /Handle or #User Profile or Mobile Number']");
    await notification.click();
    await notification.fill(NOTIFICATION_EMAIL);
    await notification.press('Enter');

    // Save & Run kicks off the range scan.
    await page.locator('#save-run-btn-id').click();

    // Wait for the discovery RESULT ROWS (the scan can take minutes for a /24). Do NOT
    // gate on the profile-name heading — it renders immediately and would pass early.
    await expect(page.locator('tr.k-master-row').first()).toBeVisible({ timeout: 540000 });

    // Select all discovered objects (first checkbox = header select-all) and add/provision.
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();

    // Success signal is stable even though the object counts are dynamic: at least one
    // monitor must report "provisioned successfully" in the Provision Status popup.
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });

    // Close the Provision Status drawer/popup.
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
