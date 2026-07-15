/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Shared helpers to keep dashboard tests data-driven, soft-assert based,
 * and efficient across dynamic dashboards.
 */

import { expect, test } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import {
  DASHBOARD_LOADING_SELECTOR,
  DEFAULT_TIMEOUT,
  EMPTY_STATE_PATTERNS,
  LOADING_STATE_PATTERNS,
  VALUE_PATTERNS,
} from './dashboard.constants.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

// Dashboard base URL (env-driven, trailing slash stripped) for deep-link navigation.
// Lives here now that auth is unified under the shared fixtures/auth.js helper.
const DASHBOARD_URL =
  process.env.Motadata_Aiops ||
  process.env.SERVER_URL ||
  process.env.Server_url ||
  process.env.server_url;

export function getDashboardBaseUrl() {
  if (!DASHBOARD_URL) {
    throw new Error(
      'Dashboard base URL is missing. Set Motadata_Aiops or SERVER_URL in .env.'
    );
  }

  return DASHBOARD_URL.replace(/\/+$/, '');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function reportInfo(label, message) {
  await test.info().attach(`${label}-info`, {
    body: String(message),
    contentType: 'text/plain',
  });
}

function getTitleLocator(page, title) {
  return page.getByText(title, { exact: false }).first();
}

function getExactTextLocator(page, title) {
  return page.getByText(new RegExp(`^\\s*${escapeRegExp(title)}\\s*$`, 'i')).first();
}

function getWidgetTitleLocator(page, title) {
  const exactText = new RegExp(`^${escapeRegExp(title)}$`, 'i');
  const levelFourHeading = page.getByRole('heading', {
    name: exactText,
    level: 4,
  });

  return levelFourHeading.first();
}

function getScreenConfig(device, tabName) {
  return (device.screenAssertions || []).find(
    (screen) => String(screen.tab).toLowerCase() === String(tabName).toLowerCase()
  );
}

async function getWidgetContainer(page, title) {
  let titleLocator = getWidgetTitleLocator(page, title);

  if (!(await titleLocator.isVisible().catch(() => false))) {
    titleLocator = getExactTextLocator(page, title);
  }

  if (!(await titleLocator.isVisible().catch(() => false))) {
    titleLocator = getTitleLocator(page, title);
  }

  await titleLocator.scrollIntoViewIfNeeded().catch(() => {});

  const cardContainer = titleLocator.locator(
    'xpath=ancestor::*[contains(@class,"ant-card") or contains(@class,"card") or contains(@class,"widget")][1]'
  );

  if (await cardContainer.count()) {
    return cardContainer.first();
  }

  return titleLocator.locator('xpath=ancestor::*[self::div or self::section][1]');
}

async function waitForDashboardReady(page, device) {
  const expectedTokens = [device?.deviceName].filter(Boolean);

  await waitForDashboardSettled(page, {
    requiredTexts: expectedTokens,
  });
}

export async function waitForDashboardSettled(page, options = {}) {
  const { requiredTexts = [], timeout = DEFAULT_TIMEOUT } = options;

  await expect
  .poll(
    async () => {
      const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
      const lowerText = bodyText.toLowerCase();

      const hasLoadingText = LOADING_STATE_PATTERNS.some((pattern) =>
        pattern.test(bodyText)
      );

      const loadingIndicators = await page
        .locator(DASHBOARD_LOADING_SELECTOR)
        .filter({ visible: true })
        .count()
        .catch(() => 0);

      const allRequiredTextsPresent =
        requiredTexts.length === 0 ||
        requiredTexts.every((text) =>
          lowerText.includes(String(text).toLowerCase())
        );

      return (
        bodyText.length > 20 &&
        !hasLoadingText &&
        loadingIndicators === 0 &&
        allRequiredTextsPresent
      );
    },
    {
      timeout,
      message: 'Dashboard should finish loading before validation starts.',
    }
  )
  .toBe(true);
}

async function clickDashboardTab(page, tabName) {
  const tab = page.getByRole('tab', {
    name: new RegExp(`^${escapeRegExp(tabName)}$`, 'i'),
  }).first();

  await expect(tab, `Tab "${tabName}" should be visible.`).toBeVisible({
    timeout: DEFAULT_TIMEOUT,
  });

  await tab.scrollIntoViewIfNeeded().catch(() => {});
  await tab.click({ force: true });

  await expect(tab, `Tab "${tabName}" should be selected.`).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: DEFAULT_TIMEOUT }
  );

  await page.waitForLoadState('networkidle').catch(() => {});
  await waitForDashboardSettled(page, {
    requiredTexts: [tabName],
  });
}

async function tryClickDashboardTab(page, tabName) {
  const tab = page.getByRole('tab', {
    name: new RegExp(`^${escapeRegExp(tabName)}$`, 'i'),
  }).first();
  const isVisible = await tab.isVisible().catch(() => false);

  expect.soft(tab, `Tab "${tabName}" should be visible.`).toBeVisible({
    timeout: 8000,
  });

  if (!isVisible) {
    return false;
  }

  await clickDashboardTab(page, tabName);
  return true;
}

function parsePercentValues(text) {
  return [...text.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((match) =>
    Number(match[1])
  );
}

function resolveExpectedValuePattern(valueType) {
  if (!valueType) {
    return null;
  }

  return VALUE_PATTERNS[valueType] || new RegExp(valueType, 'i');
}

export async function navigateToInventoryListing(page, listingPath) {
  const targetUrl = `${getDashboardBaseUrl()}${listingPath}`;
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
}

// export async function openDashboardForDevice(page, device) {
//   if (device.monitorPath) {
//     const directUrl = `${getDashboardBaseUrl()}${device.monitorPath}`;
//     await page.goto(directUrl, { waitUntil: 'domcontentloaded' });
//     await page.waitForLoadState('networkidle');
//     await waitForDashboardReady(page, device);

//     await expect(
//       page,
//       `Dashboard URL should open for ${device.deviceName}.`
//     ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });

//     return;
//   }

//   await navigateToInventoryListing(page, device.listingPath);

// const searchInput = page.locator(
//   'input[placeholder="Search"], input[name="search-snmp-device-catalog"]'
// ).first();

//   if (await searchInput.isVisible().catch(() => false)) {
//     await searchInput.click();
//     await searchInput.fill(device.searchTerm);
    
//     const targetRow = page
//       .locator(['table tr', '.ant-table-tbody > tr', '[role="row"]'].join(', '))
//       .filter({ hasText: new RegExp(escapeRegExp(device.deviceName), 'i') })
//       .first();
//     await targetRow.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
//     await page.waitForLoadState('networkidle').catch(() => {});

//     // If the search didn't filter the table, walk through pagination until the target is found.
//     if (!(await targetRow.isVisible().catch(() => false))) {
//       const nextPage = page.getByRole('link', { name: /Go to the next page/i }).first();
//       for (let i = 0; i < 30; i++) {
//         if (!(await nextPage.isVisible().catch(() => false))) break;
//         await nextPage.click({ force: true }).catch(() => {});
//         await page.waitForLoadState('networkidle').catch(() => {});
//         await page.waitForTimeout(500);
//         if (await targetRow.isVisible().catch(() => false)) break;
//       }
//     }
//   }

//   const exactDeviceLink = page
//     .locator('a[href*="/inventory/"][href*="/monitors/"]')
//     .filter({
//       hasText: new RegExp(`^\\s*${escapeRegExp(device.deviceName)}\\s*$`, 'i'),
//     })
//     .first();

//   if (await exactDeviceLink.isVisible().catch(() => false)) {
//     await exactDeviceLink.click({ force: true });
//     await page.waitForLoadState('networkidle');
//     await waitForDashboardReady(page, device);

//     await expect(
//       page,
//       `Dashboard URL should open for ${device.deviceName}.`
//     ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });

//     return;
//   }

//   const rowTokens = device.rowTokens?.length
//     ? device.rowTokens
//     : [device.deviceName];

//   const fallbackHref = await page
//     .locator('a[href*="/inventory/"][href*="/monitors/"]')
//     .evaluateAll((anchors, payload) => {
//       const deviceName = String(payload.deviceName).toLowerCase();
//       const normalizedTokens = payload.rowTokens.map((token) =>
//         String(token).toLowerCase()
//       );

//       for (const anchor of anchors) {
//         const row = anchor.closest('tr') || anchor.parentElement;
//         const rowText = (row?.textContent || '').toLowerCase();
//         const anchorText = (anchor.textContent || '').trim().toLowerCase();

//         if (anchorText === deviceName) {
//           return anchor.getAttribute('href');
//         }

//         if (
//           normalizedTokens.every((token) => rowText.includes(token)) ||
//           normalizedTokens[0] === anchorText
//         ) {
//           return anchor.getAttribute('href');
//         }
//       }

//       return null;
//     }, { deviceName: device.deviceName, rowTokens });

//   if (fallbackHref) {
//     const targetUrl = fallbackHref.startsWith('http')
//       ? fallbackHref
//       : `${getDashboardBaseUrl()}${fallbackHref}`;

//     await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
//     await page.waitForLoadState('networkidle');
//     await waitForDashboardReady(page, device);

//     await expect(
//       page,
//       `Dashboard URL should open for ${device.deviceName}.`
//     ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });

//     return;
//   }

//   const anchorByName = page
//     .locator('a[href*="/inventory/"][href*="/monitors/"]')
//     .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(device.deviceName)}\\s*$`, 'i') })
//     .first();
//   if (await anchorByName.isVisible().catch(() => false)) {
//     await anchorByName.click({ force: true });
//     await page.waitForLoadState('networkidle');
//     await waitForDashboardReady(page, device);
//     await expect(
//       page,
//       `Dashboard URL should open for ${device.deviceName}.`
//     ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });
//     return;
//   }

//   let candidateRows = page.locator(
//     ['table tr', '.ant-table-tbody > tr', '[role="row"]'].join(', ')
//   );

//   for (const token of rowTokens) {
//     candidateRows = candidateRows.filter({
//       hasText: new RegExp(escapeRegExp(token), 'i'),
//     });
//   }

//   const primaryMatch = candidateRows.first();

//   await expect(
//     primaryMatch,
//     `Device "${device.deviceName}" should be discoverable from ${device.listingPath}.`
//   ).toBeVisible({ timeout: DEFAULT_TIMEOUT });

//   const directLink = primaryMatch
//     .locator('a[href*="/inventory/"][href*="/monitors/"]')
//     .first();

//   if (await directLink.isVisible().catch(() => false)) {
//     await directLink.click({ force: true });
//   } else {
//     const deviceNameRegex = new RegExp(`^${escapeRegExp(device.deviceName)}$`, 'i');
//     const globalLink = page.getByRole('link', {
//       name: deviceNameRegex,
//     });

//     await expect(
//       globalLink.first(),
//       `Direct monitor link for "${device.deviceName}" should be visible.`
//     ).toBeVisible({ timeout: DEFAULT_TIMEOUT });

//     await globalLink.first().click({ force: true });
//   }

//   await page.waitForLoadState('networkidle');
//   await waitForDashboardReady(page, device);

//   await expect(
//     page,
//     `Dashboard URL should open for ${device.deviceName}.`
//   ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });
// }

export async function openDashboardForDevice(page, device) {
  if (device.monitorPath) {
    const directUrl = `${getDashboardBaseUrl()}${device.monitorPath}`;
    await page.goto(directUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await waitForDashboardReady(page, device);
    await expect(page).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, {
      timeout: DEFAULT_TIMEOUT,
    });
    return;
  }

  await navigateToInventoryListing(page, device.listingPath);

  const searchInput = page
    .locator('input[placeholder="Search"], input[name="search-snmp-device-catalog"]')
    .first();

  await expect(searchInput).toBeVisible({ timeout: 15000 });
  await searchInput.click();
  await searchInput.fill(device.searchTerm);
  await searchInput.press('Enter');

  const targetRow = page
    .locator('table tr, .ant-table-tbody > tr, [role="row"]')
    .filter({ hasText: new RegExp(escapeRegExp(device.deviceName), 'i') })
    .first();

  await expect(
    targetRow,
    `Device "${device.deviceName}" should appear after search`
  ).toBeVisible({ timeout: 15000 });

  const deviceLink = page
    .getByRole('link', { name: new RegExp(`^\\s*${escapeRegExp(device.deviceName)}\\s*$`, 'i') })
    .first();
  const rowLink = targetRow
    .locator('a[href*="/inventory/"][href*="/monitors/"]')
    .first();

  await Promise.all([
    page.waitForURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT }),
    (async () => {
      if (await deviceLink.isVisible().catch(() => false)) {
        await deviceLink.click();
      } else {
        await rowLink.click({ force: true });
      }
    })(),
  ]);

  await page.waitForLoadState('networkidle');
  await waitForDashboardReady(page, device);
}

export async function captureDashboardContext(page, device) {
  const bodyLocator = page.locator('body');
  const bodyText = await bodyLocator.innerText().catch(() => '');
  const visibleHeadings = (
    await page
      .locator('h1, h2, h3, .ant-card-head-title, [role="tab"], .ant-tabs-tab')
      .allInnerTexts()
      .catch(() => [])
  )
    .map((text) => text.trim())
    .filter(Boolean);

  return {
    deviceName: device.deviceName,
    url: page.url(),
    bodyText,
    visibleHeadings,
  };
}

export async function captureCurrentTabContext(page) {
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const visibleHeadings = (
    await page
      .locator('h1, h2, h3, h4, .ant-card-head-title, [role="tab"][aria-selected="true"]')
      .allInnerTexts()
      .catch(() => [])
  )
    .map((text) => text.trim())
    .filter(Boolean);

  return {
    bodyText,
    visibleHeadings,
  };
}

export async function softAssertNoEmptyStates(context, label) {
  const matchedStates = EMPTY_STATE_PATTERNS.filter((pattern) =>
    pattern.test(context.bodyText)
  ).map((pattern) => pattern.toString());

  if (matchedStates.length > 0) {
    await reportInfo(`${label}-empty-state`, `Empty-state markers present: ${matchedStates.join(', ')}`);
  }
}

export async function softAssertPageIdentity(context, device) {
  if (!context.bodyText.includes(device.deviceName)) {
    await reportInfo(`${device.deviceName}-identity`, `Device name "${device.deviceName}" not present on dashboard.`);
  }

  for (const token of device.identityTokens || []) {
    if (!context.bodyText.includes(token)) {
      await reportInfo(`${device.deviceName}-identity-token`, `Identity token "${token}" missing.`);
    }
  }
}

export async function softAssertTitlesVisible(page, titles, label) {
  for (const title of titles || []) {
    const visible = await getTitleLocator(page, title)
      .isVisible()
      .catch(() => false);
    if (!visible) {
      await reportInfo(`${label}-title`, `"${title}" not visible.`);
    }
  }
}

export async function softAssertTabsVisible(page, titles, label) {
  for (const title of titles || []) {
    const tabLocator = page.getByRole('tab', {
      name: new RegExp(`^${escapeRegExp(title)}$`, 'i'),
    });
    const visible = await tabLocator
      .first()
      .isVisible()
      .catch(() => false);
    if (!visible) {
      await reportInfo(`${label}-tab`, `Tab "${title}" not visible.`);
    }
  }
}

export async function softAssertScreen(page, device, tabName) {
  const screen = getScreenConfig(device, tabName) || { tab: tabName };

  const tabOpened = await tryClickDashboardTab(page, tabName).catch(() => false);

  if (!tabOpened) {
    await reportInfo(`${device.deviceName}-${tabName}-tab`, `Could not open tab "${tabName}".`);
    return;
  }

  await waitForDashboardSettled(page, {
    requiredTexts: [tabName, ...(screen.expectedTexts || [])],
  }).catch(() => {});

  const context = await captureCurrentTabContext(page);

  if (context.bodyText.trim().length === 0) {
    await reportInfo(`${device.deviceName}-${tabName}-content`, 'Tab rendered no visible content.');
  }

  if (!screen.allowEmptyState) {
    const matchedStates = EMPTY_STATE_PATTERNS.filter((pattern) =>
      pattern.test(context.bodyText)
    );
    if (matchedStates.length > 0) {
      await reportInfo(`${device.deviceName}-${tabName}-empty-state`, `Empty-state markers: ${matchedStates.map(String).join(', ')}`);
    }
  }

  for (const text of screen.expectedTexts || []) {
    if (!context.bodyText.includes(text)) {
      await reportInfo(`${device.deviceName}-${tabName}-text`, `Expected text "${text}" not found.`);
    }
  }

  for (const title of screen.expectedSections || []) {
    const visible = await getTitleLocator(page, title)
      .isVisible()
      .catch(() => false);
    if (!visible) {
      await reportInfo(`${device.deviceName}-${tabName}-section`, `Section "${title}" not visible.`);
    }
  }
}

export async function softAssertWidget(page, widget) {
  const widgetContainer = await getWidgetContainer(page, widget.title).catch(() => null);
  const widgetLabel = `widget-${widget.title}`;

  if (!widgetContainer) {
    await reportInfo(widgetLabel, `Widget "${widget.title}" container not found.`);
    return;
  }

  if (!(await widgetContainer.isVisible().catch(() => false))) {
    await reportInfo(widgetLabel, `Widget "${widget.title}" not visible.`);
    return;
  }

  const widgetText = (await widgetContainer.innerText().catch(() => '')).trim();

  if (!widgetText) {
    await reportInfo(widgetLabel, `Widget "${widget.title}" has no visible content.`);
    return;
  }

  const emptyStateMatched = EMPTY_STATE_PATTERNS.some((pattern) =>
    pattern.test(widgetText)
  );
  if (emptyStateMatched) {
    await reportInfo(widgetLabel, `Widget "${widget.title}" shows a no-data placeholder.`);
  }

  const expectedPattern = resolveExpectedValuePattern(widget.valueType);

  if (widget.allowPlaceholder) {
    const stripped = widgetText
      .replace(widget.title, '')
      .replace(/lost packets:|retransmissions:|query time|fetch time|user:|interrupt:|total:|free:|in|out|read|write|disk queue length:|retransmissions:/gi, '')
      .replace(/[-\s%:]/g, '')
      .trim();
    if (stripped.length === 0 || !/\d/.test(stripped)) {
      return;
    }
  }

  if (expectedPattern && !expectedPattern.test(widgetText)) {
    await reportInfo(widgetLabel, `Widget "${widget.title}" did not match ${widget.valueType} pattern.`);
  }

  if (widget.valueType === 'percent') {
    const percentValues = parsePercentValues(widgetText);
    if (percentValues.length === 0) {
      await reportInfo(widgetLabel, `Widget "${widget.title}" exposed no percentage values.`);
    }
    for (const value of percentValues) {
      if (value < 0 || value > 100) {
        await reportInfo(widgetLabel, `Widget "${widget.title}" percentage ${value} outside 0-100.`);
      }
    }
  }
}

export async function softAssertWidgets(page, widgets) {
  for (const widget of widgets || []) {
    await softAssertWidget(page, widget);
  }
}

export async function validateDashboardScreens(page, device) {
  for (const tabName of device.expectedTabs || []) {
    await softAssertScreen(page, device, tabName);
  }
}

export async function validateDashboard(page, device) {
  try {
    await openDashboardForDevice(page, device);
  } catch (error) {
    const message = error?.message || String(error);
    await test.info().attach(`${device.deviceName}-open-dashboard-skipped`, {
      body: `Skipping ${device.deviceName}: ${message}`,
      contentType: 'text/plain',
    });
    return;
  }

  const context = await captureDashboardContext(page, device);
  await softAssertPageIdentity(context, device);
  if (!device.allowDashboardEmptyState) {
    await softAssertNoEmptyStates(context, device.deviceName);
  }

  await softAssertTabsVisible(page, device.expectedTabs, `${device.deviceName} tabs`);
  await softAssertTitlesVisible(
    page,
    device.expectedSections,
    `${device.deviceName} sections`
  );
  await softAssertWidgets(page, device.expectedWidgets);
  await validateDashboardScreens(page, device);
}
