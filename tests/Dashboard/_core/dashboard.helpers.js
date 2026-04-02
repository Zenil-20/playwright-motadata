/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Shared helpers to keep dashboard tests data-driven, soft-assert based,
 * and efficient across dynamic dashboards.
 */

import { expect } from '@playwright/test';
import {
  DEFAULT_TIMEOUT,
  EMPTY_STATE_PATTERNS,
  VALUE_PATTERNS,
} from './dashboard.constants.js';
import { getDashboardBaseUrl } from './auth.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const expectedTokens = [
    device?.deviceName,
    ...(device?.identityTokens || []),
  ].filter(Boolean);

  await page.waitForFunction(
    (tokens) => {
      const text = document.body?.innerText?.trim() || '';
      if (!text || text === 'Loading...') {
        return false;
      }

      if (!tokens.length) {
        return text.length > 20;
      }

      const lowerText = text.toLowerCase();
      return tokens.some((token) => lowerText.includes(String(token).toLowerCase()));
    },
    expectedTokens,
    { timeout: DEFAULT_TIMEOUT }
  );
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

export async function openDashboardForDevice(page, device) {
  if (device.monitorPath) {
    const directUrl = `${getDashboardBaseUrl()}${device.monitorPath}`;
    await page.goto(directUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await waitForDashboardReady(page, device);

    await expect(
      page,
      `Dashboard URL should open for ${device.deviceName}.`
    ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });

    return;
  }

  await navigateToInventoryListing(page, device.listingPath);

  const searchInput = page
    .locator(
      [
        'input[placeholder="Search"]',
        'input[name="search"]',
        'input[type="search"]',
      ].join(', ')
    )
    .first();

  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill(device.searchTerm);
    await page.waitForTimeout(500);
  }

  const exactDeviceLink = page
    .locator('a[href*="/inventory/"][href*="/monitors/"]')
    .filter({
      hasText: new RegExp(`^\\s*${escapeRegExp(device.deviceName)}\\s*$`, 'i'),
    })
    .first();

  if (await exactDeviceLink.isVisible().catch(() => false)) {
    await exactDeviceLink.click({ force: true });
    await page.waitForLoadState('networkidle');
    await waitForDashboardReady(page, device);

    await expect(
      page,
      `Dashboard URL should open for ${device.deviceName}.`
    ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });

    return;
  }

  const rowTokens = device.rowTokens?.length
    ? device.rowTokens
    : [device.deviceName];

  const fallbackHref = await page
    .locator('a[href*="/inventory/"][href*="/monitors/"]')
    .evaluateAll((anchors, payload) => {
      const deviceName = String(payload.deviceName).toLowerCase();
      const normalizedTokens = payload.rowTokens.map((token) =>
        String(token).toLowerCase()
      );

      for (const anchor of anchors) {
        const row = anchor.closest('tr') || anchor.parentElement;
        const rowText = (row?.textContent || '').toLowerCase();
        const anchorText = (anchor.textContent || '').trim().toLowerCase();

        if (anchorText === deviceName) {
          return anchor.getAttribute('href');
        }

        if (
          normalizedTokens.every((token) => rowText.includes(token)) ||
          normalizedTokens[0] === anchorText
        ) {
          return anchor.getAttribute('href');
        }
      }

      return null;
    }, { deviceName: device.deviceName, rowTokens });

  if (fallbackHref) {
    const targetUrl = fallbackHref.startsWith('http')
      ? fallbackHref
      : `${getDashboardBaseUrl()}${fallbackHref}`;

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await waitForDashboardReady(page, device);

    await expect(
      page,
      `Dashboard URL should open for ${device.deviceName}.`
    ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });

    return;
  }

  let candidateRows = page.locator(
    ['table tr', '.ant-table-tbody > tr', '[role="row"]'].join(', ')
  );

  for (const token of rowTokens) {
    candidateRows = candidateRows.filter({
      hasText: new RegExp(escapeRegExp(token), 'i'),
    });
  }

  const primaryMatch = candidateRows.first();

  await expect(
    primaryMatch,
    `Device "${device.deviceName}" should be discoverable from ${device.listingPath}.`
  ).toBeVisible({ timeout: DEFAULT_TIMEOUT });

  const directLink = primaryMatch
    .locator('a[href*="/inventory/"][href*="/monitors/"]')
    .first();

  if (await directLink.isVisible().catch(() => false)) {
    await directLink.click({ force: true });
  } else {
    const deviceNameRegex = new RegExp(`^${escapeRegExp(device.deviceName)}$`, 'i');
    const globalLink = page.getByRole('link', {
      name: deviceNameRegex,
    });

    await expect(
      globalLink.first(),
      `Direct monitor link for "${device.deviceName}" should be visible.`
    ).toBeVisible({ timeout: DEFAULT_TIMEOUT });

    await globalLink.first().click({ force: true });
  }

  await page.waitForLoadState('networkidle');
  await waitForDashboardReady(page, device);

  await expect(
    page,
    `Dashboard URL should open for ${device.deviceName}.`
  ).toHaveURL(/\/inventory\/.+\/monitors\/\d+/, { timeout: DEFAULT_TIMEOUT });
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

export function softAssertNoEmptyStates(context, label) {
  const matchedStates = EMPTY_STATE_PATTERNS.filter((pattern) =>
    pattern.test(context.bodyText)
  ).map((pattern) => pattern.toString());

  expect.soft(
    matchedStates,
    `${label} should not expose empty-state messages in a populated dashboard.`
  ).toEqual([]);
}

export function softAssertPageIdentity(context, device) {
  expect.soft(
    context.bodyText,
    `${device.deviceName} should be present on the dashboard page.`
  ).toContain(device.deviceName);

  for (const token of device.identityTokens || []) {
    expect.soft(
      context.bodyText,
      `Dashboard should include identity token "${token}" for ${device.deviceName}.`
    ).toContain(token);
  }
}

export async function softAssertTitlesVisible(page, titles, label) {
  for (const title of titles || []) {
    const titleLocator = getTitleLocator(page, title);
    await expect
      .soft(titleLocator, `${label} should expose "${title}".`)
      .toBeVisible({ timeout: 8000 });
  }
}

export async function softAssertTabsVisible(page, titles, label) {
  for (const title of titles || []) {
    const tabLocator = page.getByRole('tab', {
      name: new RegExp(`^${escapeRegExp(title)}$`, 'i'),
    });

    await expect
      .soft(tabLocator.first(), `${label} should expose "${title}".`)
      .toBeVisible({ timeout: 8000 });
  }
}

export async function softAssertWidget(page, widget) {
  const widgetContainer = await getWidgetContainer(page, widget.title);
  const widgetLabel = `Widget "${widget.title}"`;

  await expect.soft(widgetContainer, `${widgetLabel} should be visible.`).toBeVisible({
    timeout: DEFAULT_TIMEOUT,
  });

  const widgetText = (await widgetContainer.innerText().catch(() => '')).trim();

  expect.soft(
    widgetText.length > 0,
    `${widgetLabel} should have visible content.`
  ).toBeTruthy();

  if (!widgetText) {
    return;
  }

  const emptyStateMatched = EMPTY_STATE_PATTERNS.some((pattern) =>
    pattern.test(widgetText)
  );
  expect.soft(
    emptyStateMatched,
    `${widgetLabel} should not display a no-data placeholder.`
  ).toBeFalsy();

  const expectedPattern = resolveExpectedValuePattern(widget.valueType);

  if (
    widget.allowPlaceholder &&
    /^[-\s]+$/m.test(
      widgetText
        .replace(widget.title, '')
        .replace(/lost packets:|retransmissions:|query time|fetch time/gi, '')
        .trim()
    )
  ) {
    return;
  }

  if (expectedPattern) {
    expect.soft(
      widgetText,
      `${widgetLabel} should contain a valid ${widget.valueType} value.`
    ).toMatch(expectedPattern);
  }

  if (widget.valueType === 'percent') {
    const percentValues = parsePercentValues(widgetText);

    expect.soft(
      percentValues.length > 0,
      `${widgetLabel} should expose at least one percentage value.`
    ).toBeTruthy();

    for (const value of percentValues) {
      expect.soft(
        value >= 0 && value <= 100,
        `${widgetLabel} percentage ${value} should stay within 0-100.`
      ).toBeTruthy();
    }
  }
}

export async function softAssertWidgets(page, widgets) {
  for (const widget of widgets || []) {
    await softAssertWidget(page, widget);
  }
}

export async function validateDashboard(page, device) {
  await openDashboardForDevice(page, device);

  const context = await captureDashboardContext(page, device);
  softAssertPageIdentity(context, device);
  softAssertNoEmptyStates(context, device.deviceName);

  await softAssertTabsVisible(page, device.expectedTabs, `${device.deviceName} tabs`);
  await softAssertTitlesVisible(
    page,
    device.expectedSections,
    `${device.deviceName} sections`
  );
  await softAssertWidgets(page, device.expectedWidgets);
}
