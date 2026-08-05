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
 * Created : 08 July 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { selectApmCounter, runTag } from './_apm.helpers.js';
import { login, logout } from '../../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

test.describe.serial('Motadata ObserveOps APM Trace Metric Policy creation', () => {
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

  test('Go to APM Policy and create a new policy', async () => {
    // APM trace data takes a ~4-5 min propagation floor after 07-APM registration;
    // the counter gate below can wait up to 10 min, so lift the 120s per-test cap.
    test.setTimeout(900000);

    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('apm policy');
    await page.locator('a[href="/settings/policy-settings/apm"]').click();
    await page.getByRole('button', { name: 'Create Policy' }).click();

    const policyName = `Trace Rate Playwright Policy ${runTag()}`;
    await page.locator('input#policy-name').fill(policyName);

    const tags = ['apm', 'automation', 'trace metric'];
    const tagBox = page.locator('[role="combobox"]');
    await tagBox.click();
    for (const tag of tags) {
      await page.keyboard.type(tag);
      await page.keyboard.press('Enter');
    }

    // Select Counter — gated: waits (up to 7 min) for the trace counter to
    // propagate after 07-APM registration before selecting it.
    await selectApmCounter(page, 'service.traces.per.min');

    // Source Filter -> Monitor, then select all monitors
    await page.locator("//input[@placeholder='Select']").first().click();
    await page.getByText('Monitor', { exact: true }).click();
    // Wait for an actual DATA ROW before clicking the header select-all: the header renders
    // before the grid body, and clicking it with zero rows loaded selects nothing (leaving
    // Source empty, so "Create Policy" silently won't submit). Same picker component as the
    // TA specs — mirrors their already-verified guard. # verified 2026-07-20 on 172.16.15.177
    await page.locator("//input[@placeholder=' ']").click(); // Source picker
    const firstSourceRowCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await firstSourceRowCheckbox.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {
      throw new Error(
        'Source picker has no rows ("No records available") — no APM source hosts to select. ' +
        'Needs 07-APM registered + trace data propagated; run WITHOUT --no-deps.',
      );
    });
    await page.locator('thead input[type="checkbox"]').click(); // select-all (rows present now)
    await page.keyboard.press('Escape'); // close the picker

    // Thresholds
    const setThreshold = async (rowLocator, value) => {
      await rowLocator.locator("input[placeholder='Select']").click();
      await page.getByText('Greater Than or Equal', { exact: true }).click();
      await rowLocator.locator("input[placeholder='Value']").fill(value);
    };

    // Severity rows: scope to the actual row container (div.label-highlight-select-value),
    // which holds the operator Select + Value inputs. The old ancestor::*[self::div][1]
    // resolved to the label-only cell (div.severity, 0 inputs), so the operator click hung
    // until the worker was torn down. # verified 2026-07-20 on 172.16.15.177
    const severityRow = (sev) =>
      page.locator('div.label-highlight-select-value').filter({ has: page.locator(`span.text.${sev}`) });
    const criticalRow = severityRow('critical');
    const majorRow = severityRow('major');
    const warningRow = severityRow('warning');

    await setThreshold(criticalRow, '50');
    await setThreshold(majorRow, '30');
    await setThreshold(warningRow, '10');

    // Set Alert Message, Notification, and Declare Incident are left at their
    // default values â no changes made to those sections.

    await page.getByRole('button', { name: 'Create Policy' }).click();

    // Verify the policy was created
    await expect(
      page.locator('td', { hasText: policyName })
    ).toBeVisible({ timeout: 30000 });
  });
});
