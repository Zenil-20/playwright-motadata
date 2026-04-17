/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Linux-specific dashboard validation helpers focused on stable,
 * end-to-end checks for KPIs, gauges, graphs, legends, grids, and tabs.
 */

import { expect, test } from '@playwright/test';
import { openDashboardForDevice, waitForDashboardSettled } from './dashboard.helpers.js';

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

async function clickDashboardTab(page, tabName) {
  const tab = page.getByRole('tab', {
    name: new RegExp(`^${escapeRegExp(tabName)}$`, 'i'),
  }).last();

  await expect(tab, `Tab "${tabName}" should be visible.`).toBeVisible({
    timeout: 30000,
  });
  await tab.click();
  await expect(tab, `Tab "${tabName}" should be selected.`).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 15000 }
  );
  await page.waitForLoadState('networkidle').catch(() => {});
  await waitForDashboardSettled(page, {
    requiredTexts: [tabName],
    timeout: 60000,
  });
}

async function getPageText(page) {
  return normalizeText(await page.locator('body').innerText());
}

async function getVisibleSection(page, title) {
  const titleLocator = page
    .getByText(new RegExp(`^\\s*${escapeRegExp(title)}\\s*$`, 'i'))
    .filter({ visible: true })
    .first();

  await expect(titleLocator, `Section "${title}" should be visible.`).toBeVisible({
    timeout: 30000,
  });

  const section = titleLocator.locator(
    'xpath=ancestor::*[contains(@class,"widget-view") or contains(@class,"__panel") or contains(@class,"widget-title-styling")][1]'
  );

  await expect(section, `Section container for "${title}" should be visible.`).toBeVisible({
    timeout: 15000,
  });

  return section;
}

async function getVisibleSectionText(page, title) {
  const section = await getVisibleSection(page, title);
  return normalizeText(await section.innerText().catch(() => ''));
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
      device.ipAddress,
      'Response Time',
      'Interface Details',
      'Process Details',
    ],
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
  expect.soft(text, `${label} should not show "No data found".`).not.toContain(
    'No data found'
  );
}

async function expectTableWithHeaders(page, title, headers) {
  const section = await getTableSection(page, title);
  const grid = section.getByRole('grid').first();

  await expect(grid, `Table "${title}" should render a visible data grid.`).toBeVisible({
    timeout: 15000,
  });

  await expectNoDataAbsentInScope(section, `Table "${title}"`);

  for (const header of headers) {
    await expect(
      grid.getByRole('columnheader', {
        name: new RegExp(`^\\s*${escapeRegExp(header)}\\s*$`, 'i'),
      }).first(),
      `Table "${title}" should contain header "${header}".`
    ).toBeVisible({ timeout: 15000 });
  }

  const rows = grid.locator('tbody tr, [role="row"]').filter({
    hasNot: grid.getByRole('columnheader').first(),
  });
  await expect(rows.first(), `Table "${title}" should have data rows.`).toBeVisible({
    timeout: 15000,
  });
  expect(
    await rows.count(),
    `Table "${title}" should have at least one populated row.`
  ).toBeGreaterThan(0);
}

async function expectOverview(page, device) {
  await clickDashboardTab(page, 'Overview');
  await waitForOverviewReady(page, device);

  const overviewText = await getPageText(page);

  expect(overviewText).toContain(device.deviceName);
  expect(overviewText).toContain(device.ipAddress);
  expect(overviewText).toContain('Linux');

  for (const header of LINUX_OVERVIEW_HEADERS) {
    await expect(
      page
        .getByText(new RegExp(`^\\s*${escapeRegExp(header)}\\s*$`, 'i'))
        .filter({ visible: true })
        .first(),
      `Overview should contain the section/header "${header}".`
    ).toBeVisible({ timeout: 30000 });
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
    expect(overviewText, `Overview should match ${pattern}.`).toMatch(pattern);
  }

  expect(
    await page.locator('svg, canvas').count(),
    'Overview should render chart visuals.'
  ).toBeGreaterThan(5);

  await expectTableWithHeaders(page, 'Interface Details', [
    'Interface',
    'In Traffic',
    'Out Traffic',
    'Traffic',
    'Status',
  ]);

  const interfaceText = await getTableSectionText(page, 'Interface Details');
  expect(interfaceText).toMatch(
    /([a-z0-9._-]+)[\s\S]*\d+(?:\.\d+)?\s*(bps|kbps|mbps|gbps)[\s\S]*Up/i
  );

  await expectTableWithHeaders(page, 'Process Details', [
    'Process',
    'CPU',
    'Memory',
    'Threads',
  ]);

  const processText = await getTableSectionText(page, 'Process Details');
  expect(processText).toMatch(
    /(rabbitmq|postgres|mysqld|beam\.smp|java|mongod)[\s\S]*\d+(?:\.\d+)?%?[\s\S]*\d+(?:\.\d+)?\s*(KB|MB|GB)[\s\S]*\d+/i
  );

  await scrollOverviewIntoView(page);
  await reportOptionalOverviewSection(page, 'Application Status');
}

async function expectActiveProcess(page) {
  await clickDashboardTab(page, 'Active Process');
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    return text.includes('PROCESS ID') && text.includes('USER NAME');
  }, null, { timeout: 30000 });
  const tabText = await getPageText(page);

  expect(tabText).toContain('Active Process');
  expect.soft(tabText).not.toContain('No data found');

  await expect(page.locator('input[placeholder="Search"]').first()).toBeVisible({
    timeout: 15000,
  });

  expect(tabText).toMatch(
    /PROCESS ID[\s\S]*PROCESS NAME[\s\S]*EXECUTION PATH[\s\S]*CPU[\s\S]*MEMORY[\s\S]*USER NAME/i
  );
  expect(tabText).toMatch(/\b\d+\b/);
  expect(tabText).toMatch(/\b(root|motadata|rabbitmq)\b/i);
  expect(tabText).toMatch(/\d+(?:\.\d+)?%/);
}

async function expectServices(page) {
  await clickDashboardTab(page, 'Services');
  await page.waitForFunction(() => {
    const text = document.body?.innerText || '';
    return text.includes('SERVICE NAME') && text.includes('START TYPE');
  }, null, { timeout: 30000 });
  const tabText = await getPageText(page);

  expect(tabText).toContain('Active Services');
  expect.soft(tabText).not.toContain('No data found');

  await expect(page.locator('input[placeholder="Search"]').first()).toBeVisible({
    timeout: 15000,
  });

  expect(tabText).toMatch(
    /SERVICE[\s\S]*SERVICE NAME[\s\S]*STATUS[\s\S]*START TYPE[\s\S]*LOG ON AS/i
  );
  expect(tabText).toMatch(/\b(Running|Stopped|Start pending)\b/i);
  expect(tabText).toMatch(/\b(enabled|static|disabled|bad)\b/i);
}

async function expectMetricExplorer(page) {
  await clickDashboardTab(page, 'Metric Explorer');
  await expect
    .poll(
      async () => {
        const text = await getPageText(page);
        return METRIC_EXPLORER_METRICS.some((metricName) => text.includes(metricName));
      },
      {
        timeout: 30000,
        message: 'Metric Explorer should load at least one metric entry before validation.',
      }
    )
    .toBe(true);

  const metricText = await getPageText(page);
  expect.soft(metricText).not.toContain('No data found');

  expect(metricText).toContain('Save View');
  expect(metricText).toContain('Metric');
  expect(metricText).toContain('Drop metric here to view trend');

  expect(
    METRIC_EXPLORER_METRICS.some((metricName) => metricText.includes(metricName)),
    'Metric Explorer should list at least one metrics catalog entry.'
  ).toBeTruthy();

  const plusIcons = page.locator('svg[data-icon="plus-circle"]:visible');
  const initialPlusCount = await plusIcons.count();
  const initialEmptyCharts = await page
    .locator('text=/Drop metric here to view trend/i')
    .count();

  expect(
    initialPlusCount,
    'Metric Explorer should expose add (+) icons before plotting charts.'
  ).toBeGreaterThan(0);
  expect(
    initialEmptyCharts,
    'Metric Explorer should expose empty chart slots before plotting.'
  ).toBeGreaterThan(0);
  expect(
    initialEmptyCharts,
    'Metric Explorer should not expose more than 10 plot slots.'
  ).toBeLessThanOrEqual(MAX_SUPPORTED_METRIC_PLOTS);
}

export async function validateLinuxDashboardE2E(page, device) {
  await openDashboardForDevice(page, device);
  await expectOverview(page, device);
  await expectActiveProcess(page);
  await expectServices(page);
  await expectMetricExplorer(page);
}
