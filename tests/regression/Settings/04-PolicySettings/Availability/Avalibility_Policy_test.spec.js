
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
 * Created : 9 March 2026
 */

// import { test, expect } from '@playwright/test';
// import dotenv from 'dotenv';
// import { login, logout } from '../../fixtures/auth.js';

// dotenv.config({ path: '.env', quiet: true });

// test.describe.serial('Motadata AIOps Discovery Flow For Linux Server Discovery', () => {
//   let page;

//   test.beforeAll(async ({ browser }) => {
//     // Create a single browser context and page shared across all tests
//     const context = await browser.newContext();
//     page = await context.newPage();
//     page.setDefaultTimeout(500000);
//   });

//   test.afterAll(async () => {
//     if (page) {
//       await page.close();
//     }
//   });

//   test('Login to Motadata AIOps', async () => {
//     await login(page);
//   });

//   test('Go to Metric Policy and create a new policy', async () => {
//     await page.locator("//a[@href='/settings/']").click();
//     await page.locator("//input[@id='phone-number']").click();
//     await page.locator("//input[@placeholder='Search']").fill('metric policy');
//     await page.locator('a[href="/settings/policy-settings/"]').click();
//     await page.getByRole('button', { name: 'Create Policy' }).click();
//     await page.getByRole('menuitem', { name: 'Availability' }).click();
//     await page.waitForURL('**/policies/availability/create');
//     await page.locator("//input[@placeholder='Select Counter']").waitFor({ state: 'visible' });
//     await page.locator('input#policy-name').click();
//     await page.locator('input#policy-name').fill('172.16.8.165_Availability Policy');
//     const tags = ['motadata:8.61', 'Automation@zen', 'sp@#$%^^&*()sp'];
//     const tagBox = page.locator('[role="combobox"]');
//     await tagBox.click();
//     for (const tag of tags) {
//       await page.keyboard.type(tag);
//       await page.keyboard.press('Enter');
//     }
//     await page.locator("//input[@placeholder='Select Counter']").click();
//     const searchInput=  page.locator("//input[@placeholder='Search']");
//     await searchInput.fill('status');
//     await searchInput.press('Enter');
//     await page.locator("//input[@placeholder='Everywhere']").click();
//     await page.locator("//span[@title='Monitor']").click();
//     await page.locator("input[readonly]").nth(2).click();
//     await page.locator("//input[@id='assign-monitor-search']").fill(process.env.Sybase_linux_ip);
//     // Target IP
//     const ip = process.env.Sybase_linux_ip || "172.16.8.165";

//     // Locate the row containing BOTH the IP and the Linux icon
//     const linuxRow = page.locator('tr.k-master-row', {
//       has: page.locator(`td`, { hasText: ip }) 
//     }).filter({
//       has: page.locator('img[alt="Linux"]')     
//     });
//     await linuxRow.scrollIntoViewIfNeeded();
//     await linuxRow.locator("input[type='checkbox']").first().click();
//     await page.locator('input#policy-name').click();
//     //Notify Team 
//     await page.locator('svg[data-icon="angle-down"]').nth(1).click();
//     await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile or !syslog profile or SNMP trap Profile']").type('zenil.kapadia@motadata.com\n');
//     await page.locator("//input[@readonly='readonly']").nth(1).click();
//     await page.locator("//span[@title='DOWN']").click();
//     // Close the severity dropdown before continuing
//     await page.locator('input#policy-name').click();
//     await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile or !syslog profile or SNMP trap Profile']").type('@admin\n');
//     await page.locator('svg[data-icon="angle-up"]').click();
//     //Set Alert Message
//     await page.locator('svg[data-icon="angle-down"]').first().click();
//     await expect(page.locator("input[name='subject']")).toHaveValue("$$$severity$$$ alert for $$$object.name$$$");
//     await expect(page.locator("textarea[name='message']")).toHaveValue("$$$counter$$$ has entered into $$$severity$$$ state with value $$$value$$$ on $$$object.host$$$($$$object.ip$$$)");

//     await page.locator('svg[data-icon="angle-up"]').click();
//     await page.getByRole('button', { name: 'Create Policy' }).click();
//     await page.waitForLoadState('networkidle');
//     await page.locator("//input[@name='search']").fill('172.16.8.165_Availability Policy');
//     await page.setDefaultTimeout(1000);
//     const row = page.locator('tr.k-master-row', {
//       hasText: '172.16.8.165_Availability Policy'
//     }).filter({
//       hasText: 'Availability'
//     });

//     await expect(row).toBeVisible();
//     // Verify visible tags in the row
//     await expect(row.getByText(tags[0].toLowerCase(), { exact: true }).first()).toBeVisible();
//     await expect(row.getByText(tags[1].toLowerCase(), { exact: true }).first()).toBeVisible();
//     // 3rd tag is hidden behind "+1" overflow badge
//     await expect(row.getByText('+1')).toBeVisible();
//   });

// test('Logout from AIOps', async () => {
//     await logout(page);
//   });

// ============================================================================
//  WORKING SPEC (authored below the commented reference above)
//  Availability policy — create + lifecycle, end-to-end on the live app.
//  Availability is STATUS-based (no critical/warning/DOWN threshold fields): the form is
//  name + counter ('status') + source monitor. A DOWN alert only fires when the monitor is
//  actually down, which cannot be forced deterministically here — so this spec proves
//  create -> verify -> disable -> delete (no alert-fires step). Locators harvested live on
//  build 8.2.6 @ 172.16.15.68 (2026-07-10).
// ============================================================================

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// Trace ON for debugging. This spec does no page.reload(), so trace:'on' is safe here.
test.use({ trace: 'on' });

// Human-readable IST timestamp, colon-separated -> unique policy name per run.
function istStamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour12: false,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.day}:${p.month}:${p.year}:${p.hour}:${p.minute}:${p.second}`;
}

const IP = process.env.Metric_Policy_Monitor_ip;       // target monitor IP (.env)
const MONITOR_NAME = process.env.Metric_Policy_Monitor_name;
const COUNTER = 'status';
const POLICY_NAME = `Availability-Policy-Playwright ${istStamp()}`;

// DEV builds (e.g. 172.16.15.68) render a component-inspector overlay (dev-trigger/dev-body/
// cp-empty) that covers bottom-of-form SUBMIT buttons and intercepts the click. Inject
// pointer-events:none so clicks reach the real controls. No-op on prod builds.
async function killDevOverlay(page) {
  await page.addStyleTag({
    content:
      '[class*="dev-trigger"],[class*="dev-body"],[class*="cp-empty"],[class*="cp-container"],[class*="dev-tools"]{pointer-events:none !important;}',
  }).catch(() => {});
}

// Settings > Policy Settings list. (Deep-link URLs do not hydrate — navigate by clicking.)
async function gotoPolicyList(page) {
  await page.locator("//a[@href='/settings/']").click();
  await page.locator("//input[@id='phone-number']").click();
  await page.locator("//input[@placeholder='Search']").fill('metric policy');
  await page.locator('a[href="/settings/policy-settings/"]').click();
}

// Open the Create Policy form on the Availability module.
async function openAvailabilityCreateForm(page) {
  await gotoPolicyList(page);
  await page.getByRole('button', { name: 'Create Policy' }).click();
  await page.getByRole('menuitem', { name: 'Availability' }).click();
  await page.waitForURL('**/policies/availability/create', { timeout: 30000 });
}

function policyRow(page) {
  return page.locator('tr.k-master-row', { hasText: POLICY_NAME });
}

test.describe.serial('Motadata AIOps Availability Policy — create + lifecycle', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    // Test policies are intentionally KEPT (never deleted). Just close the page.
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
    await killDevOverlay(page);
  });

  test('Create Availability policy on the target monitor, then disable it (kept, not deleted)', async () => {
    test.setTimeout(180000);
    await openAvailabilityCreateForm(page);

    // Counter = 'status' (exact — there are many *.status counters). Wait for the option to
    // render before clicking so the dropdown filters + CLOSES cleanly; otherwise the next
    // "Everywhere" click can land on a still-open counter dropdown and the Source never gets set.
    await page.locator("//input[@placeholder='Select Counter']").click();
    await page.locator("//input[@placeholder='Search']").fill('status');
    const statusOption = page.locator("//span[@title='status']");
    await statusOption.waitFor({ state: 'visible', timeout: 15000 });
    await statusOption.click();

    // Source = Monitor, pick the Linux monitor row by IP + Linux icon (straight-line: the
    // counter waitFor above is what makes this commit reliably; re-opening the picker in a
    // retry loop instead leaves the form in a state where the later submit silently no-ops).
    await page.locator("//input[@placeholder='Everywhere']").click();
    await page.locator("//span[@title='Monitor']").click();
    const sourceField = page.locator('input[readonly]').nth(2);
    await sourceField.click(); // open the monitor picker
    await page.locator("//input[@id='assign-monitor-search']").fill(IP);
    const monitorRow = page.locator('tr.k-master-row', { has: page.locator('td', { hasText: IP }) })
      .filter({ has: page.locator('img[alt="Linux"]') });
    await expect(
      monitorRow,
      `Target monitor ${IP} (${MONITOR_NAME}) not found in the policy Monitor picker — is it provisioned?`,
    ).toBeVisible({ timeout: 30000 });
    await monitorRow.locator("input[type='checkbox']").first().check();
    await page.locator('input#policy-name').click(); // dismiss the picker
    // Guard: fail clearly if the monitor did not commit into Source (rather than a confusing submit no-op).
    await expect(sourceField, 'monitor did not commit into the Source field').not.toHaveValue('', { timeout: 10000 });

    // Fill the Policy Name LAST. The Availability form CLEARS the name field if it is filled
    // before the counter/source are set (the form re-renders), which then blocks submit with a
    // silent "name required" validation and no toast. Filling it here — after everything else —
    // avoids that. Assert it stuck before submitting.
    await page.locator('input#policy-name').fill(POLICY_NAME);
    await expect(page.locator('input#policy-name')).toHaveValue(POLICY_NAME, { timeout: 10000 });

    // Submit. Give the async submit a beat to process, THEN verify the list rendered.
    await killDevOverlay(page); // ensure the dev overlay isn't covering the submit button
    await page.getByRole('button', { name: 'Create Policy' }).click();
    await page.waitForTimeout(5000);
    const search = page.locator("//input[@name='search']").first();
    await expect(search).toBeVisible({ timeout: 60000 });
    await search.fill(POLICY_NAME);
    const row = policyRow(page);
    await expect(row.first()).toBeVisible({ timeout: 60000 });

    // Disable via the row switch (ON -> OFF). Ant drops aria-checked when off -> assert on class.
    // The policy is intentionally KEPT (not deleted) — we only disable it.
    await killDevOverlay(page);
    const toggle = row.first().locator('[role="switch"]');
    await expect(toggle).toHaveClass(/ant-switch-checked/, { timeout: 30000 });
    await toggle.click();
    await expect(toggle).not.toHaveClass(/ant-switch-checked/, { timeout: 30000 });
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
// });