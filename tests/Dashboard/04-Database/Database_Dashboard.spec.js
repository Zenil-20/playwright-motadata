/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Database dashboard smoke automation.
 */

import { test } from '@playwright/test';
import { loginToDashboard, logoutFromDashboard } from '../_core/auth.js';
import { validateDashboard } from '../_core/dashboard.helpers.js';
import { dashboardCatalog } from '../_data/dashboard.devices.js';

test.describe.serial('Dashboard | Database', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(120000);
    await loginToDashboard(page);
  });

  test.afterAll(async () => {
    if (page && !page.isClosed()) {
      await logoutFromDashboard(page).catch(() => {});
      await page.close();
    }
  });

  for (const device of dashboardCatalog.database) {
    test(`Validate ${device.deviceName} dashboard`, async () => {
      test.setTimeout(300000);
      await validateDashboard(page, device);
    });
  }
});
