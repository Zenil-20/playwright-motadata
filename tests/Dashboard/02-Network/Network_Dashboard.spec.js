/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Network dashboard smoke automation.
 */

import { test } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import { validateDashboard } from '../_core/dashboard.helpers.js';
import { dashboardCatalog } from '../_data/dashboard.devices.js';

test.describe.serial('Dashboard | Network', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(120000);
    await login(page);
  });

  test.afterAll(async () => {
    if (page && !page.isClosed()) {
      await logout(page).catch(() => {});
      await page.close();
    }
  });

  for (const device of dashboardCatalog.network) {
    test(`Validate ${device.deviceName} dashboard`, async () => {
      test.setTimeout(300000);
      await validateDashboard(page, device);
    });
  }
});
