/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Linux-specific dashboard validation helpers focused on stable,
 * end-to-end checks for KPIs, gauges, graphs, legends, grids, and tabs.
 */

import { expect } from '@playwright/test';
import { openDashboardForDevice } from './dashboard.helpers.js';

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
  'Application Status',
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
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1200);
}

async function getPageText(page) {
  return normalizeText(await page.locator('body').innerText());
}

async function scrollOverviewIntoView(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
}

async function expectNoDataAbsentInScope(scope, label) {
  const text = normalizeText(await scope.innerText().catch(() => ''));
  expect.soft(text, `${label} should not show "No data found".`).not.toContain(
    'No data found'
  );
}

async function expectTableWithHeaders(page, title, headers) {
  const titleLocator = page
    .getByText(new RegExp(`^\\s*${escapeRegExp(title)}\\s*$`, 'i'))
    .first();

  await expect(titleLocator, `Table section "${title}" should be visible.`).toBeVisible({
    timeout: 30000,
  });

  const section = titleLocator.locator(
    'xpath=ancestor::*[contains(@class,"ant-card") or contains(@class,"card") or self::div][1]'
  );

  await expectNoDataAbsentInScope(section, `Table "${title}"`);

  for (const header of headers) {
    await expect(
      section.getByText(new RegExp(`^\\s*${escapeRegExp(header)}\\s*$`, 'i')).first(),
      `Table "${title}" should contain header "${header}".`
    ).toBeVisible({ timeout: 15000 });
  }

  const rows = section.locator('tbody tr');
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
  await scrollOverviewIntoView(page);

  const overviewText = await getPageText(page);
  expect.soft(overviewText).not.toContain('No data found');

  expect(overviewText).toContain(device.deviceName);
  expect(overviewText).toContain('172.16.8.165');
  expect(overviewText).toContain('Linux');

  for (const header of LINUX_OVERVIEW_HEADERS) {
    expect(
      overviewText,
      `Overview should contain the section/header "${header}".`
    ).toContain(header);
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

  expect(overviewText).toMatch(
    /Interface Details[\s\S]*INTERFACE[\s\S]*IN TRAFFIC[\s\S]*OUT TRAFFIC[\s\S]*TRAFFIC[\s\S]*STATUS/i
  );
  expect(overviewText).toMatch(
    /ens160[\s\S]*\d+(?:\.\d+)?\s*(bps|kbps|mbps|gbps)[\s\S]*Up/i
  );

  expect(overviewText).toMatch(
    /Process Details[\s\S]*PROCESS[\s\S]*CPU[\s\S]*MEMORY[\s\S]*THREADS/i
  );
  expect(overviewText).toMatch(
    /(rabbitmq|postgres|mysqld|beam\.smp)[\s\S]*\d+(?:\.\d+)?%[\s\S]*\d+(?:\.\d+)?\s*(KB|MB|GB)[\s\S]*\d+/i
  );

  expect(overviewText).toMatch(
    /Application Status[\s\S]*APPLICATION NAME[\s\S]*STATUS[\s\S]*Sybase[\s\S]*Up/i
  );
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
  const metricText = await getPageText(page);
  expect.soft(metricText).not.toContain('No data found');

  expect(metricText).toContain('Save View');
  expect(metricText).toContain('Metric');
  expect(metricText).toContain('Instance');
  expect(metricText).toContain('Saved View');
  expect(metricText).toContain('Drop metric here to view trend');

  for (const metricName of METRIC_EXPLORER_METRICS) {
    expect(
      metricText,
      `Metric Explorer should list "${metricName}".`
    ).toContain(metricName);
  }

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

  const plotsToCreate = Math.min(initialEmptyCharts, MAX_SUPPORTED_METRIC_PLOTS);

  for (let index = 0; index < plotsToCreate; index += 1) {
    await expect(
      plusIcons.nth(index),
      `A visible add (+) icon should exist before plotting chart ${index + 1}.`
    ).toBeVisible({ timeout: 15000 });

    await plusIcons.nth(index).click();
    await page.waitForTimeout(1000);

    const remainingEmptyCharts = await page
      .locator('text=/Drop metric here to view trend/i')
      .count();

    expect(
      remainingEmptyCharts,
      `Empty chart slots should reduce after plotting chart ${index + 1}.`
    ).toBe(initialEmptyCharts - (index + 1));
  }

  const plottedMetricChips = page.locator('div[title^="system."]');
  expect(
    await plottedMetricChips.count(),
    'Metric Explorer should show plotted metric chips after using the add (+) icon.'
  ).toBeGreaterThan(0);

  expect(
    await page.locator('text=/Drop metric here to view trend/i').count(),
    'All chart slots should be occupied after plotting the available charts.'
  ).toBe(0);

  expect(
    await page.locator('svg[data-icon="plus-circle"]:visible').count(),
    'The add (+) icon should not remain visible once the plot limit is reached.'
  ).toBe(0);
}

export async function validateLinuxDashboardE2E(page, device) {
  await openDashboardForDevice(page, device);
  await expectOverview(page, device);
  await expectActiveProcess(page);
  await expectServices(page);
  await expectMetricExplorer(page);
}
