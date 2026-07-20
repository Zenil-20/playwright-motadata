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
 * Created : 25 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// Trace ON for debugging. The alert-fire step refreshes by RE-NAVIGATING (SPA nav), never
// page.reload(), because reload() while trace:'on' races the trace-chunk files on Windows (ENOENT).
test.use({ trace: 'on' });

// Human-readable IST timestamp, colon-separated -> unique policy names per run (the backend
// rejects duplicate policy names).
function istStamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour12: false,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.day}:${p.month}:${p.year}:${p.hour}:${p.minute}:${p.second}`;
}

const AIOPS = (process.env.Motadata_Aiops || '').replace(/\/+$/, '');
const STAMP = istStamp();
const POLICY_NAME = `Netroute-SrcToDst-Playwright ${STAMP}`;
const HOP_POLICY_NAME = `Netroute-HopToHop-Playwright ${STAMP}`;
const COUNTER = 'netroute.min.latency.ms';
const NETROUTE_TARGET = process.env.Netroute_Policy_target || 'www.chatgpt.com';
const TAGS = ['motadata:netroute', 'Automation@playwright'];

// NetRoute alerts surface on the global Alerts > NetRoute tab, split into nested tabs by route
// evaluation type. The alert row carries the POLICY NAME in the ALERT column.
const NESTED_TAB = {
  'Source to destination': 'netroute-source-to-destination',
  'Hop to Hop': 'netroute-hop-to-hop',
};

// Assert a NetRoute policy's alert fires. latency >= 0 always breaches, but the alert takes a few
// minutes to surface (netroute poll + global-alert flush). Navigate ONCE to the nested tab, then
// poll by clicking the Refresh button (button[title='Refresh']) — a reload-free refresh, so it is
// safe with trace:'on' (page.reload()/repeated goto race the trace chunks -> ENOENT on Windows).
async function assertNetrouteAlertFires(page, policyName, routeType) {
  await page.goto(`${AIOPS}/alerts/Server/netroute?view=live&stream=all&nestedTabId=${NESTED_TAB[routeType]}`, {
    waitUntil: 'domcontentloaded',
  });
  // HARDENED: the alert row must contain BOTH the unique policy name AND the netroute destination,
  // so it can only match a real alert for our target on this alerts grid — not a stray name match.
  const alertRow = page.locator('tr.k-master-row')
    .filter({ hasText: policyName })
    .filter({ hasText: NETROUTE_TARGET });
  await expect(async () => {
    await page.locator("button[title='Refresh']").click();
    await expect(alertRow.first()).toBeVisible({ timeout: 8000 });
  }).toPass({ timeout: 480000, intervals: [15000, 20000, 30000, 30000] });
}

// The "Source NetRoute" picker is a Select DROPDOWN (search + options), NOT a Kendo grid.
// Scope the trigger to the Source NetRoute form-item.
const SOURCE_NETROUTE_TRIGGER =
  "//div[contains(@class,'ant-form-item')][.//*[normalize-space()='Source NetRoute']]//input[@placeholder='Select']";

// DEV builds (172.16.15.68) render a component-inspector overlay (dev-trigger/dev-body/cp-empty)
// that covers bottom-of-form SUBMIT buttons and intercepts the click. Inject pointer-events:none
// so clicks reach the real controls. No-op on prod builds.
async function killDevOverlay(page) {
  await page.addStyleTag({
    content:
      '[class*="dev-trigger"],[class*="dev-body"],[class*="cp-empty"],[class*="cp-container"],[class*="dev-tools"]{pointer-events:none !important;}',
  }).catch(() => {});
}

test.describe.serial('Motadata AIOps Netroute Policy Flow', () => {
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

  // Navigate Settings -> Netroute Policy -> Create Policy form
  const openCreatePolicyForm = async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('netroute policy');
    await page.getByRole('link', { name: 'Netroute Policy' }).click();
    await page.getByRole('button', { name: 'Create Policy' }).click();
  };

  // Fill the full Netroute policy form and submit.
  // routeType: 'Source to destination' (default) or 'Hop to Hop'
  const createNetroutePolicy = async ({ name, routeType }) => {
    await openCreatePolicyForm();

    await page.locator('input#policy-name').fill(name);

    // Tags
    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of TAGS) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }

    // Route Evaluation Type (only switch if not the default)
    if (routeType === 'Hop to Hop') {
      await page.locator("//span[normalize-space()='Hop to Hop']").click();
    }

    // Counter
    await page.locator("//input[@placeholder='Select Metric']").click();
    await page.locator("//input[@placeholder='Search']").last().fill(COUNTER);
    const counterOpt = page.locator(`//span[@title='${COUNTER}']`);
    await counterOpt.waitFor({ state: 'visible', timeout: 15000 });
    await counterOpt.click();

    // Source Filter: NetRoute
    await page.locator('[data-cy="dropdown-trigger-input"]').nth(3).click();
    await page.locator("//span[@title='NetRoute']").click();
    await page.waitForTimeout(600);

    // Source NetRoute: the Select DROPDOWN -> search -> pick the target option (exact).
    await page.locator(SOURCE_NETROUTE_TRIGGER).first().click();
    await page.locator("//input[@data-cy='dropdown-search-input']").last().fill(NETROUTE_TARGET);
    await page.getByText(NETROUTE_TARGET, { exact: true }).first().click();
    await page.locator('input#policy-name').click(); // close the dropdown

    // Operator + Value (layout differs between the two route evaluation types)
    if (routeType === 'Hop to Hop') {
      await page.locator("//input[@placeholder='Select Operator']").click();
      await page.getByText('Greater than or Equal').click();
      await page.locator("//input[@placeholder='Value']").fill('0');
    } else {
      await page.locator("//div[@id='warning-severity']//input[@placeholder='Select']").click();
      await page.locator("//span[@title='Greater Than or Equal']").click();
      await page.locator("//input[@name='warning']").fill('0');
    }

    // Submit (neutralise the dev overlay so the click lands on the button).
    await killDevOverlay(page);
    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Verify the new row in the policy list.
    const search = page.locator("//input[@name='search']").first();
    await expect(search).toBeVisible({ timeout: 60000 });
    await search.fill(name);
    await expect(page.locator('tr.k-master-row', { hasText: name }).first()).toBeVisible({ timeout: 60000 });
  };

  test('Login to Motadata AIOps', async () => {
    await login(page);
    await killDevOverlay(page);
  });

  test('Create Netroute Policy with Source-to-destination route evaluation', async () => {
    test.setTimeout(180000);
    await createNetroutePolicy({ name: POLICY_NAME, routeType: 'Source to destination' });
  });

  test('Create Netroute Policy with Hop to Hop route evaluation', async () => {
    test.setTimeout(180000);
    await createNetroutePolicy({ name: HOP_POLICY_NAME, routeType: 'Hop to Hop' });
  });

  test('Source-to-destination policy alert fires', async () => {
    test.setTimeout(540000);
    await assertNetrouteAlertFires(page, POLICY_NAME, 'Source to destination');
  });

  test('Hop-to-Hop policy alert fires', async () => {
    test.setTimeout(540000);
    await assertNetrouteAlertFires(page, HOP_POLICY_NAME, 'Hop to Hop');
  });

  // Note: the two NetRoute policies are intentionally KEPT (never deleted).

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
