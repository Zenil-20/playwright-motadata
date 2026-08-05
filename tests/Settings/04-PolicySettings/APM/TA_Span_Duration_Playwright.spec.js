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
 * Author  : Anant Awishkar
 * Created : 09 July 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { selectApmCounter, runTag } from './_apm.helpers.js';
import { login, logout } from '../../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata ObserveOps APM Trace Analytics Policy creation', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) {
      await logout(page);
      await page.close();
    }
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Go to APM Policy and create a new Trace Analytics policy', async () => {
    // APM trace data takes a ~4-5 min propagation floor after 07-APM registration;
    // the counter gate below can wait up to 10 min, so lift the 120s per-test cap.
    test.setTimeout(900000);

    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('apm policy');
    await page.locator('a[href="/settings/policy-settings/apm"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Policy name
    const policyName = `Span Duration Playwright Policy ${runTag()}`;
    await page.locator('input#policy-name').fill(policyName);

    // Tags
    const tags = ['apm', 'automation', 'trace analytics'];
    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of tags) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }

    // APM Policy Type -> Trace Analytics
    await page.getByText('Trace Analytics', { exact: true }).click();

    // Counter -> select the counter FIRST (this drives Result By options).
    // Gated: waits (up to 7 min) for the trace counter to propagate after 07-APM.
    await selectApmCounter(page, 'service.span.duration.us');

    // Aggregation -> Avg
    await page.locator("//input[@placeholder='Select Aggr.']").click();
    await page.getByText('Avg', { exact: true }).click();

    // Operator -> Greater than or Equal
    await page.locator("//input[@placeholder='Select Operator.']").click();
    await page.getByText('Greater than or Equal', { exact: true }).click();

    // Value -> 0
    await page.locator("//input[@placeholder='Value']").fill('0');

    // Source Filter -> Source Host
    await page.locator("//input[@placeholder='Select']").first().click();
    await page.getByText('Source Host', { exact: true }).click();

    // Source -> open the picker and select all monitors. Source is required, so it MUST be
    // populated or "Create Policy" silently won't submit. Wait for an actual DATA ROW (a
    // row-level checkbox) before clicking the header select-all: the header renders before the
    // grid body, and clicking it with zero rows loaded selects nothing (leaving Source empty).
    // A genuinely empty grid ("No records available") still fails fast with a clear message.
    await page.locator("//input[@placeholder=' ']").click();       // Source picker
    const firstSourceRowCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await firstSourceRowCheckbox.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
      throw new Error(
        'Source picker has no rows ("No records available") — no APM source hosts to select. ' +
        'Needs 07-APM registered + trace data propagated; run WITHOUT --no-deps.',
      );
    });
    await page.locator('thead input[type="checkbox"]').click();    // select-all (rows present now)
    await page.keyboard.press('Escape');                           // close the picker

    // Result By -> service.span.service.name. This is a SPAN counter
    // (service.span.duration.us), so the Result By dimensions are the service.span.* family;
    // service.trace.service.name does not exist here. # verified 2026-07-20 on 172.16.15.177
    await page.locator("//input[@placeholder='Result By']").click();
    await page.locator("//input[@placeholder='Search']").fill('service.span.service.name');
    await page.getByText('service.span.service.name', { exact: true }).click();

    // Severity -> Major
    // Severity is an Ant radio-BUTTON: the real <input type="radio"> is visually hidden, so
    // click the visible label text. Scope to #main-content-container so a transient alert
    // notification (div.notification-header ... 'Major') can't collide (strict-mode).
    await page.locator('#main-content-container').getByText('Major', { exact: true }).click();

    // Set Alert Message, Notification, and Declare Incident are left at their
    // default values — no changes made to those sections.

    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Verify the policy was created
    await expect(
      page.locator('td', { hasText: policyName })
    ).toBeVisible({ timeout: 30000 });
  });
});
