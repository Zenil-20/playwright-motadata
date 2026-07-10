/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Linux dashboard deep automation for Server and Apps.
 */

import { test } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import { validateDashboard } from '../_core/dashboard.helpers.js';
import { validateLinuxDashboardE2E } from '../_core/linux.dashboard.helpers.js';
import { dashboardCatalog } from '../_data/dashboard.devices.js';

test.describe.serial('Dashboard | Server and Apps', () => {
  let page;
  const linuxDeviceId = 'linux-ubuntu8165';
  const linuxDevice = dashboardCatalog.serverAndApps.find(
    (device) => device.id === linuxDeviceId
  );
  const nonLinuxDevices = dashboardCatalog.serverAndApps.filter(
    (device) => device.id !== linuxDeviceId
  );

  if (!linuxDevice) {
    throw new Error(
      `Linux Server and Apps device "${linuxDeviceId}" was not found in dashboardCatalog.serverAndApps.`
    );
  }

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1800, height: 2200 },
    });
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

  test(`Validate Linux dashboard end to end for ${linuxDevice.deviceName}`, async () => {
    test.setTimeout(300000);
    await validateLinuxDashboardE2E(page, linuxDevice);
  });

  for (const device of nonLinuxDevices) {
    test(`Validate ${device.deviceName} dashboard across all monitor screens`, async () => {
      test.setTimeout(300000);
      await validateDashboard(page, device);
    });
  }
});
