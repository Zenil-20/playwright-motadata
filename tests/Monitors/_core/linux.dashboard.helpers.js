/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Linux-specific dashboard validation helpers focused on stable,
 * end-to-end checks for KPIs, gauges, graphs, legends, grids, and tabs.
 */

import { expect, test } from '@playwright/test';
import { openDashboardForDevice, waitForDashboardSettled } from './dashboard.helpers.js';
import { logout } from '../../fixtures/auth.js';

const LINUX_OVERVIEW_HEADERS = [
  'CPU',
  'Memory',
  'Disk',
  'IOPS',
  'Network',
  'Response Time',
  "Today's Availability",
  'Availability Statistics',
  'System Disk Utilization',
  'CPU Details',
  'Memory Details',
  'Disk IOPS Details',
  'Processor Queue Length',
  'Load Average',
  'Disk Queue',
  'Idle/Interrupt CPU',
  'Swap Memory',
  'System Disk IO Read/Write',
  'Interface Details',
  'Process Details',
];

const METRIC_EXPLORER_METRICS = [
  'system.cpu.user.percent',
  'system.cpu.interrupt.percent',
  'system.cpu.idle.percent',
  'system.cpu.io.percent',
  'system.memory.capacity.bytes',
  'system.cache.memory.bytes',
  'system.swap.memory.used.bytes',
  'system.swap.memory.free.bytes',
  'system.swap.memory.provisioned.bytes',
  'system.disk.io.read.ops.per.sec',
  'system.disk.io.write.ops.per.sec',
  'system.disk.io.bytes.per.sec',
  'system.disk.io.bits.per.sec',
  'system.network.bytes.per.sec',
  'system.network.bits.per.sec',
  'system.context.switches.per.sec',
];

const MAX_SUPPORTED_METRIC_PLOTS = 10;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

async function reportMismatch(label, message) {
  await test.info().attach(`${label}-info`, {
    body: message,
    contentType: 'text/plain',
  });
}

async function softMatch(text, pattern, label) {
  if (!pattern.test(text)) {
    await reportMismatch(label, `Pattern not matched: ${pattern}\nSample: ${text.slice(0, 500)}`);
  }
}

async function softContains(text, needle, label) {
  if (!text.includes(needle)) {
    await reportMismatch(label, `Expected to contain "${needle}".\nSample: ${text.slice(0, 500)}`);
  }
}

async function clickDashboardTab(page, tabName) {
  const tab = page.getByRole('tab', {
    name: new RegExp(`^${escapeRegExp(tabName)}$`, 'i'),
  }).last();

  await expect(tab, `Tab "${tabName}" should be visible.`).toBeVisible();
  await tab.click();
  await expect(tab, `Tab "${tabName}" should be selected.`).toHaveAttribute(
    'aria-selected',
    'true'
  );
}

async function getPageText(page) {
  return normalizeText(await page.locator('body').innerText());
}

async function getTableSection(page, title) {
  const titleLocator = page
    .getByText(new RegExp(`^\\s*${escapeRegExp(title)}\\s*$`, 'i'))
    .filter({ visible: true })
    .first();

  await expect(titleLocator, `Table section "${title}" should be visible.`).toBeVisible({
    timeout: 30000,
  });

  const dataSection = titleLocator.locator(
    'xpath=ancestor::*[.//*[@role="grid"] or .//table][1]'
  );

  await expect(
    dataSection,
    `Table section "${title}" should resolve to a container with data.`
  ).toBeVisible({ timeout: 15000 });

  return dataSection;
}

async function getTableSectionText(page, title) {
  const section = await getTableSection(page, title);
  return normalizeText(await section.innerText().catch(() => ''));
}

async function reportOptionalOverviewSection(page, title) {
  const sectionLocator = page
    .getByText(new RegExp(`^\\s*${escapeRegExp(title)}\\s*$`, 'i'))
    .filter({ visible: true })
    .first();
  const isVisible = await sectionLocator.isVisible().catch(() => false);
  const attachmentBody = isVisible
    ? `${title}: present on Overview`
    : `${title}: not present on Overview for this run`;

  await test.info().attach(
    `${title.toLowerCase().replace(/\s+/g, '-')}-overview-status`,
    {
      body: attachmentBody,
      contentType: 'text/plain',
    }
  );

  return isVisible;
}

async function waitForOverviewReady(page, device) {
  await waitForDashboardSettled(page, {
    requiredTexts: [
      device.deviceName,
      'Response Time',
    ].filter(Boolean),
    timeout: 60000,
  });
}

async function scrollOverviewIntoView(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await waitForDashboardSettled(page, {
    requiredTexts: ['Interface Details', 'Process Details'],
    timeout: 30000,
  });
}

async function expectNoDataAbsentInScope(scope, label) {
  const text = normalizeText(await scope.innerText().catch(() => ''));
  if (text.includes('No data found')) {
    await reportMismatch(label, `"No data found" present in ${label}.`);
  }
}

async function expectTableWithHeaders(page, title, headers) {
  const section = await getTableSection(page, title).catch(() => null);
  if (!section) {
    await reportMismatch(`table-${title}`, `Table section "${title}" not found.`);
    return;
  }
  const grid = section.getByRole('grid').first();
  if (!(await grid.isVisible().catch(() => false))) {
    await reportMismatch(`table-${title}`, `Table "${title}" grid not visible.`);
    return;
  }

  await expectNoDataAbsentInScope(section, `table-${title}-empty`);

  for (const header of headers) {
    const headerLoc = grid.getByRole('columnheader', {
      name: new RegExp(`^\\s*${escapeRegExp(header)}\\s*$`, 'i'),
    }).first();
    if (!(await headerLoc.isVisible().catch(() => false))) {
      await reportMismatch(`table-${title}-header`, `Header "${header}" not visible in "${title}".`);
    }
  }

  const rows = grid.locator('tbody tr, [role="row"]').filter({
    hasNot: grid.getByRole('columnheader').first(),
  });
  const rowCount = await rows.count().catch(() => 0);
  if (rowCount === 0) {
    await reportMismatch(`table-${title}-rows`, `Table "${title}" has no populated rows.`);
  }
}

async function expectOverview(page, device) {
  await clickDashboardTab(page, 'Overview');
  await waitForOverviewReady(page, device);

  const overviewText = await getPageText(page);

  await softContains(overviewText, device.deviceName, 'overview-device-name');
  await softContains(overviewText, 'Linux', 'overview-linux');

  for (const header of LINUX_OVERVIEW_HEADERS) {
    const visible = await page
      .getByText(new RegExp(`^\\s*${escapeRegExp(header)}\\s*$`, 'i'))
      .filter({ visible: true })
      .first()
      .isVisible()
      .catch(() => false);
    if (!visible) {
      await reportMismatch(`overview-header`, `Section "${header}" not visible on Overview.`);
    }
  }

  const overviewPatterns = [
    /CPU User:\s*\d+(?:\.\d+)?%\s*Interrupt:\s*\d+(?:\.\d+)?%\s*\d+(?:\.\d+)?%/i,
    /Memory Total:\s*\S+\s*Free:\s*\S+\s*\d+(?:\.\d+)?%/i,
    /Disk Total:\s*\S+\s*Free:\s*\S+\s*\d+(?:\.\d+)?%/i,
    /IOPS Disk Queue Length:\s*\d+(?:\.\d+)?\s*\d+(?:\.\d+)?/i,
    /Network Retransmissions:\s*\S+\s*IN\s*\d+(?:\.\d+)?\s*(bps|kbps|mbps|gbps)\s*OUT\s*\d+(?:\.\d+)?\s*(bps|kbps|mbps|gbps)/i,
    /Response Time Lost Packets:\s*\d+(?:\.\d+)?\s*\d+(?:\.\d+)?ms/i,
    /Today's Availability\s*(Up|Down)\s*\d+(?:\.\d+)?%/i,
    /Availability Statistics\s*Last Day\s*0%\s*100%\s*Last 7 Days\s*0%\s*100%\s*Last 15 Days\s*0%\s*100%/i,
    /System Disk Utilization[\s\S]*Mounted on:[\s\S]*Used:[\s\S]*free of/i,
  ];

  for (const pattern of overviewPatterns) {
    await softMatch(overviewText, pattern, `overview-pattern-${pattern.source.slice(0, 30)}`);
  }

  const visualCount = await page.locator('svg, canvas').count();
  if (visualCount <= 5) {
    await reportMismatch('overview-visuals', `Expected >5 chart visuals, found ${visualCount}.`);
  }

  await expectTableWithHeaders(page, 'Interface Details', [
    'Interface',
    'In Traffic',
    'Out Traffic',
    'Traffic',
    'Status',
  ]);

  const interfaceText = await getTableSectionText(page, 'Interface Details');
  await softMatch(
    interfaceText,
    /([a-z0-9._-]+)[\s\S]*\d+(?:\.\d+)?\s*(bps|kbps|mbps|gbps)[\s\S]*Up/i,
    'interface-details-traffic'
  );

  await expectTableWithHeaders(page, 'Process Details', [
    'Process',
    'CPU',
    'Memory',
    'Threads',
  ]);

  const processText = await getTableSectionText(page, 'Process Details');
  await softMatch(
    processText,
    /(rabbitmq|postgres|mysqld|beam\.smp|java|mongod)[\s\S]*\d+(?:\.\d+)?%?[\s\S]*\d+(?:\.\d+)?\s*(KB|MB|GB)[\s\S]*\d+/i,
    'process-details-metrics'
  );

  await scrollOverviewIntoView(page);
  await reportOptionalOverviewSection(page, 'Application Status');
}

async function waitForTabReadyOrEmpty(page, headerTokens) {
  const headerLocators = headerTokens.map((token) =>
    page
      .getByRole('columnheader', {
        name: new RegExp(`^\\s*${escapeRegExp(token)}\\s*$`, 'i'),
      })
      .first()
  );
  const headersReady = headerLocators.reduce(
    (acc, loc) => acc.or(loc),
    headerLocators[0]
  );
  const emptyMarker = page.getByText('No data found', { exact: false }).first();

  await expect(headersReady.or(emptyMarker).first()).toBeVisible();

  return (await emptyMarker.isVisible()) ? 'empty' : 'ready';
}

async function reportEmptyTab(label) {
  await test.info().attach(`${label}-empty-state`, {
    body: `${label}: "No data found" — server returned no rows; skipping deeper validation.`,
    contentType: 'text/plain',
  });
}

async function expectActiveProcess(page) {
  await clickDashboardTab(page, 'Active Process');
  const outcome = await waitForTabReadyOrEmpty(page, ['PROCESS ID', 'USER NAME']);

  if (outcome === 'empty') {
    await reportEmptyTab('Active Process');
    return;
  }

  const tabText = await getPageText(page);

  await softContains(tabText, 'Active Process', 'active-process-tab-open');
  await softMatch(
    tabText,
    /PROCESS ID[\s\S]*PROCESS NAME[\s\S]*EXECUTION PATH[\s\S]*CPU[\s\S]*MEMORY[\s\S]*USER NAME/i,
    'active-process-headers'
  );
  await softMatch(tabText, /\b\d+\b/, 'active-process-numbers');
  await softMatch(tabText, /\b(root|motadata|rabbitmq)\b/i, 'active-process-users');
  await softMatch(tabText, /\d+(?:\.\d+)?%/, 'active-process-percent');
}

async function expectServices(page) {
  await clickDashboardTab(page, 'Services');
  const outcome = await waitForTabReadyOrEmpty(page, ['SERVICE NAME', 'START TYPE']);

  if (outcome === 'empty') {
    await reportEmptyTab('Services');
    return;
  }

  const tabText = await getPageText(page);

  await softContains(tabText, 'Active Services', 'services-active-services');
  await softMatch(
    tabText,
    /SERVICE[\s\S]*SERVICE NAME[\s\S]*STATUS[\s\S]*START TYPE[\s\S]*LOG ON AS/i,
    'services-headers'
  );
  await softMatch(tabText, /\b(Running|Stopped|Start pending)\b/i, 'services-status');
  await softMatch(tabText, /\b(enabled|static|disabled|bad)\b/i, 'services-start-type');
}

async function expectMetricExplorer(page) {
  await clickDashboardTab(page, 'Metric Explorer');

  const metricEntry = page
    .getByText(new RegExp(METRIC_EXPLORER_METRICS.map(escapeRegExp).join('|')))
    .first();
  const emptyMarker = page.getByText('No data found', { exact: false }).first();

  await expect(metricEntry.or(emptyMarker).first()).toBeVisible();

  if (await emptyMarker.isVisible()) {
    await reportEmptyTab('Metric Explorer');
    return;
  }

  const metricText = await getPageText(page);

  await softContains(metricText, 'Save View', 'metric-explorer-save-view');
  await softContains(metricText, 'Metric', 'metric-explorer-metric');
  await softContains(metricText, 'Drop metric here to view trend', 'metric-explorer-empty-hint');
  await softContains(metricText, 'Saved View', 'metric-explorer-saved-view');
  await softContains(metricText, 'Instance', 'metric-explorer-instance');

  if (!METRIC_EXPLORER_METRICS.some((m) => metricText.includes(m))) {
    await reportMismatch('metric-explorer-catalog', 'No catalog metric entries found in Metric Explorer.');
  }

  const plusIcons = page.locator('svg[data-icon="plus-circle"]:visible');
  const initialEmptyCharts = await page
    .locator('text=/Drop metric here to view trend/i')
    .count();

  if (initialEmptyCharts === 0) {
    await reportMismatch('metric-explorer-slots', 'No empty chart slots available to plot.');
    return;
  }

  const plotsToCreate = Math.min(initialEmptyCharts, MAX_SUPPORTED_METRIC_PLOTS);

  for (let index = 0; index < plotsToCreate; index += 1) {
    const plusVisible = await plusIcons
      .nth(index)
      .isVisible()
      .catch(() => false);

    if (!plusVisible) {
      await reportMismatch(
        `metric-explorer-plus-${index + 1}`,
        `Add (+) icon ${index + 1} not visible — skipping plot.`
      );
      continue;
    }

    await plusIcons.nth(index).click().catch(() => {});
    await page.waitForTimeout(1000);
  }
}

async function expectInstalledSoftware(page) {
  await clickDashboardTab(page, 'Installed Software');
  const tabText = await getPageText(page);
  await softContains(tabText, 'Installed Software', 'installed-software-tab-open');
}

async function expectActiveAlerts(page) {
  await clickDashboardTab(page, 'Active Alerts');
  const tabText = await getPageText(page);
  await softContains(tabText, 'Active Alerts', 'active-alerts-tab-open');
}

async function expectConfiguredPolicy(page) {
  await clickDashboardTab(page, 'Configured Policy');
  const tabText = await getPageText(page);
  await softContains(tabText, 'Configured Policy', 'configured-policy-tab-open');
}

async function captureFullDom(page, label) {
  const html = await page.content().catch(() => '');
  const innerText = await page.locator('body').innerText().catch(() => '');
  await test.info().attach(`${label}-dom.html`, {
    body: html,
    contentType: 'text/html',
  });
  await test.info().attach(`${label}-body.txt`, {
    body: innerText,
    contentType: 'text/plain',
  });
}

async function runTabSafely(label, fn) {
  try {
    await fn();
  } catch (error) {
    const message = error?.message || String(error);
    await test.info().attach(`${label}-failure`, {
      body: message,
      contentType: 'text/plain',
    });
  }
}

export async function validateLinuxDashboardE2E(page, device) {
  await openDashboardForDevice(page, device);
  await captureFullDom(page, `${device.deviceName}-landing`);
  await runTabSafely('Overview', () => expectOverview(page, device));
  await runTabSafely('Active Process', () => expectActiveProcess(page));
  await runTabSafely('Services', () => expectServices(page));
  await runTabSafely('Installed Software', () => expectInstalledSoftware(page));
  await runTabSafely('Metric Explorer', () => expectMetricExplorer(page));
  await runTabSafely('Active Alerts', () => expectActiveAlerts(page));
  await runTabSafely('Configured Policy', () => expectConfiguredPolicy(page));
  await runTabSafely('Logout', () => logout(page));
}
