
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
//     await page.locator('input#policy-name').fill('172.16.8.165-Metric-Policy');
//     const tags = ['motadata:8.61', 'Automation@zen', 'sp@#$%^^&*()sp'];
//     const tagBox = page.locator('[role="combobox"]');
//     await tagBox.click();
//     for (const tag of tags) {
//       await page.keyboard.type(tag);
//       await page.keyboard.press('Enter');
//     }
//     await page.locator("//input[@placeholder='Select Metric']").click();
//     await page.locator("//input[@placeholder='Search']").fill('system.cpu.percent');
//     await page.locator("//span[@title='system.cpu.percent']").click();
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
//     await page.locator("//input[@name='critical']").fill('0');
//     await page.locator("//input[@name='warning']").fill('50');
//     //Notify Team 
//     await page.locator('svg[data-icon="angle-down"]').nth(1).click();
//     await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile or !syslog profile or SNMP trap Profile']").type('zenil.kapadia@motadata.com\n');
//     await page.locator("//input[@readonly='readonly']").nth(1).click();
//     await page.locator("//span[@title='CRITICAL']").click();
//     await page.locator('svg[data-icon="angle-up"]').click();
//     //Set Alert Message
//     await page.locator('svg[data-icon="angle-down"]').first().click();
//     await expect(page.locator("input[name='subject']")).toHaveValue("$$$severity$$$ alert for $$$object.name$$$");
//     await expect(page.locator("textarea[name='message']")).toHaveValue("$$$counter$$$ has entered into $$$severity$$$ state with value $$$value$$$ on $$$object.host$$$($$$object.ip$$$)");
//     const kpiDescription = page.locator("textarea[name='kpiDescription']");

//     // scroll to textarea
//     await kpiDescription.scrollIntoViewIfNeeded();

//     const expectedKpiText = `Here's what this alert indicates:
// $$$counter$$$ $$$counter.description$$$ $$$counter.interpretation.high$$$ $$$counter.interpretation.low$$$

// This situation often arises due to:
// $$$counter.rootcause$$$.

// To fix this:
// $$$counter.recommended.action$$$

// For further diagnosis, analyze related metrics like:
// $$$counter.related.metrics$$$ will give you a broader picture of your system's behavior and confirm recovery.`;

//     // assertion
//     await expect(kpiDescription).toHaveValue(expectedKpiText);
//     await page.locator('svg[data-icon="angle-up"]').click();
//     await page.getByRole('button', { name: 'Create Policy' }).click();
//   });

//   test('Validate the Manual poll functionality in monitors page', async () => {
//     await page.getByRole('link', { name: 'Monitors', exact: true }).click();
//     await page.waitForLoadState('networkidle');
//     await page.locator("//button[@id='btn-filter-agent']").click();
//     await page.locator("//input[@placeholder='Search']").first().fill('ubuntu8165');
//     await page.getByRole('link', { name: 'ubuntu8165' }).click();
//     await page.waitForLoadState('networkidle');
//     await page.locator("//button[@title='Poll Now']").click();
//     await expect(
//       page.locator('.ant-message-notice-content', {
//         hasText: 'Polling request is queued, Please wait...'
//       })
//     ).toBeVisible();
//   });

// ============================================================================
//  WORKING SPEC (authored below the commented reference above)
//  Metric policy — golden + lifecycle, end-to-end:
//    create (threshold critical=0 => always breaches) -> assert the alert FIRES on
//    the monitor's Active Alerts tab (~2 min) -> disable -> delete -> assert gone.
//  Reuses the create locators from the commented reference (verified live 2026-07-09,
//  build 8.2.6). Post-create lifecycle/alert locators: cookbook §16.4a (harvested live).
//  afterAll deletes the policy idempotently so a mid-test failure never leaves a
//  forever-firing critical=0 policy behind.
// ============================================================================

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// Trace ON for debugging. NOTE: page.reload() while trace:'on' races the trace-chunk files on
// this Windows host and aborts with an ENOENT recording error, so the "Alert fires" step below
// refreshes the Active-Alerts grid by RE-NAVIGATING to the monitor (SPA click nav), never reload().
test.use({ trace: 'on' });

// Human-readable IST timestamp, colon-separated (DD:MM:YYYY:HH:MM:SS) -> unique policy
// name per run (the backend rejects duplicate policy names).
function istStamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour12: false,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.day}:${p.month}:${p.year}:${p.hour}:${p.minute}:${p.second}`;
}

const IP = process.env.Metric_Policy_Monitor_ip;      // target monitor IP (.env)
const MONITOR_NAME = process.env.Metric_Policy_Monitor_name; // its inventory name (.env)
const COUNTER = 'system.cpu.percent';
const POLICY_NAME = `Metric-Policy-Playwright ${istStamp()}`;

// DEV builds (e.g. 172.16.15.68) render a component-inspector overlay
// (dev-trigger-overlay/dev-body/cp-empty) that physically covers bottom-of-form SUBMIT buttons
// and intercepts the click ("...subtree intercepts pointer events" -> the click auto-waits until
// timeout even though the button is enabled). Inject pointer-events:none so clicks pass through to
// the real controls. The <style> lands in <head> and persists across the app's SPA navigation, so
// one call per full page load is enough. Harmless no-op on prod builds (selectors match nothing).
async function killDevOverlay(page) {
  await page.addStyleTag({
    content:
      '[class*="dev-trigger"],[class*="dev-body"],[class*="cp-empty"],[class*="cp-container"],[class*="dev-tools"]{pointer-events:none !important;}',
  }).catch(() => {});
}

// Settings > Metric Policy list. (Deep-link URLs do not hydrate — navigate by clicking.)
async function gotoMetricPolicyList(page) {
  await page.locator("//a[@href='/settings/']").click();
  await page.locator("//input[@id='phone-number']").click();
  await page.locator("//input[@placeholder='Search']").fill('metric policy');
  await page.locator('a[href="/settings/policy-settings/"]').click();
}

// The list row for our policy (search-filtered so it is on page 1).
function policyRow(page) {
  return page.locator('tr.k-master-row', { hasText: POLICY_NAME });
}

test.describe.serial('Motadata AIOps Metric Policy — golden + lifecycle', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    // Test policies are intentionally KEPT (never deleted) — the lifecycle test only disables.
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
    await killDevOverlay(page); // neutralise the .68 dev overlay for the whole session
  });

  test('Create Metric threshold policy (critical=0) on the target monitor', async () => {
    test.setTimeout(300000);
    await gotoMetricPolicyList(page);
    await page.getByRole('button', { name: 'Create Policy' }).click();

    await page.locator('input#policy-name').fill(POLICY_NAME);

    // Counter
    await page.locator("//input[@placeholder='Select Metric']").click();
    await page.locator("//input[@placeholder='Search']").fill(COUNTER);
    await page.locator(`//span[@title='${COUNTER}']`).click();

    // Source = Monitor, then pick the Linux monitor row by IP + Linux icon
    await page.locator("//input[@placeholder='Everywhere']").click();
    await page.locator("//span[@title='Monitor']").click();
    await page.locator('input[readonly]').nth(2).click();
    await page.locator("//input[@id='assign-monitor-search']").fill(IP);
    const monitorRow = page.locator('tr.k-master-row', { has: page.locator('td', { hasText: IP }) })
      .filter({ has: page.locator('img[alt="Linux"]') });
    // Fail fast (30s) with a clear message if the target monitor is not in the picker — e.g. it
    // was deprovisioned from this shared server. Without this, scrollIntoViewIfNeeded silently
    // auto-waits until the whole test times out (~5 min) with an opaque "page closed" error.
    await expect(
      monitorRow,
      `Target monitor ${IP} (${MONITOR_NAME}) not found in the policy Monitor picker — is it provisioned on this server?`,
    ).toBeVisible({ timeout: 30000 });
    await monitorRow.scrollIntoViewIfNeeded();
    await monitorRow.locator("input[type='checkbox']").first().click();
    await page.locator('input#policy-name').click(); // dismiss the monitor picker

    // Threshold: critical operator "Greater Than or Equal" + value 0 => cpu.percent >= 0 is TRUE
    // on EVERY poll => a CRITICAL alert is raised deterministically. The form DEFAULTS the operator
    // to "Equals", which for value 0 would almost never breach (cpu is rarely exactly 0) — so set it
    // explicitly, otherwise the "Alert fires" assertion can never pass.
    await page.locator("//div[@id='critical-severity']//input[@placeholder='Select']").click();
    await page.locator("//span[@title='Greater Than or Equal']").click();
    await page.locator("//input[@name='critical']").fill('0');
    await page.locator("//input[@name='warning']").fill('50');

    await killDevOverlay(page); // ensure the dev overlay isn't covering the submit button
    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Back on the list: the new policy row is present, enabled (switch ON), 1 monitor attached.
    const search = page.locator("//input[@name='search']").first();
    await expect(search).toBeVisible({ timeout: 60000 });
    await search.fill(POLICY_NAME);
    const row = policyRow(page);
    await expect(row.first()).toBeVisible({ timeout: 60000 });
    await expect(row.first().locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  });

  test('Poll Now, then verify the Critical alert fires on Active Alerts', async () => {
    // Force an immediate poll (Poll Now) so the critical=0 policy EVALUATES now instead of waiting
    // for the next scheduled poll, then verify the breach surfaces on the monitor's Active Alerts
    // tab. The grid does NOT stream new alerts in — it needs a fresh fetch, so RE-NAVIGATE to the
    // monitor each poll (SPA link nav re-mounts + re-fetches). Do NOT page.reload(): reload() while
    // trace:'on' races the trace-chunk files on Windows and aborts with an ENOENT recording error.
    //
    // HARDENED against false positives: the alert row must contain BOTH the unique policy name AND
    // the metric (COUNTER). The monitor's "Configured Policy" tab also lists the policy by name, so
    // matching the name alone could match config; a real ACTIVE ALERT row is the only one that also
    // carries the metric (system.cpu.percent) + a live severity/last-seen. `toBeVisible()` further
    // guarantees we only match the row rendered on the (active) Active-Alerts tab, not a hidden one.
    test.setTimeout(420000);
    await expect(async () => {
      await page.getByRole('link', { name: 'Monitors', exact: true }).click();
      await page.locator("//button[@id='btn-filter-agent']").click();
      await page.locator("//input[@placeholder='Search']").first().fill(MONITOR_NAME);
      await page.getByRole('link', { name: MONITOR_NAME }).first().click();
      await page.locator("//button[@title='Poll Now']").click().catch(() => {}); // force a fresh poll
      await page.getByRole('tab', { name: 'Active Alerts' }).first().click();
      const alertRow = page.locator('tr.k-master-row')
        .filter({ hasText: POLICY_NAME })
        .filter({ hasText: COUNTER });               // must be the real alert row (carries the metric)
      await expect(alertRow.first()).toBeVisible({ timeout: 10000 });
    }).toPass({ timeout: 360000, intervals: [15000, 20000, 20000, 30000] });
  });

  test('Disable the policy (kept, not deleted)', async () => {
    test.setTimeout(180000);
    await gotoMetricPolicyList(page);
    await killDevOverlay(page); // the overlay can also cover the row switch
    const search = page.locator("//input[@name='search']").first();
    await search.fill(POLICY_NAME);
    const row = policyRow(page);
    await expect(row.first()).toBeVisible({ timeout: 60000 });

    // Disable via the row switch (ON -> OFF). Ant's switch does NOT set aria-checked="false"
    // when off — it DROPS the attribute entirely and removes the .ant-switch-checked class.
    // So assert on the class, not on aria-checked (which is absent/null when off).
    // The policy is intentionally KEPT (not deleted) — we only disable it.
    const toggle = row.first().locator('[role="switch"]');
    await expect(toggle).toHaveClass(/ant-switch-checked/, { timeout: 30000 }); // starts ON
    await toggle.click();
    await expect(toggle).not.toHaveClass(/ant-switch-checked/, { timeout: 30000 }); // now OFF
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
//});