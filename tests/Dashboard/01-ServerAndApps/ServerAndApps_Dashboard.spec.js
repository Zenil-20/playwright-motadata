/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Linux dashboard deep automation for Server and Apps.
 */

import { test } from '@playwright/test';
import { loginToDashboard, logoutFromDashboard } from '../_core/auth.js';
import { validateLinuxDashboardE2E } from '../_core/linux.dashboard.helpers.js';
import { dashboardCatalog } from '../_data/dashboard.devices.js';

test.describe.serial('Dashboard | Server and Apps', () => {
  let page;
  const linuxDevice = dashboardCatalog.serverAndApps.find(
    (device) => device.id === 'linux-ubuntu8165'
  );

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1800, height: 2200 },
    });
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

  test(`Validate Linux dashboard end to end for ${linuxDevice.deviceName}`, async () => {
    test.setTimeout(300000);
    await validateLinuxDashboardE2E(page, linuxDevice);
  });
});
