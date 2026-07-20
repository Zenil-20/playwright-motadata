/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-14
 *
 * End-to-end coverage for the APM Statistics dashboard — the default/system
 * dashboard shipped with APM (Dashboards > APM Statistics). Its id,
 * 10000000001100, is a stable SYSTEM id (verified identical across two
 * separate live instances), unlike per-device dashboards.
 *
 * The generic test shape (navigate, tiles, charts, chart+grid pairs, action
 * menus) lives in tests/Dashboard/_core/dashboard.suiteFactory.js — this file
 * is just the config: which widgets exist and what their columns are. See that
 * file's header comment for the shared rationale (widget scoping around the
 * floating DEV overlay, empty-state handling, kebab-menu-close race, etc.).
 *
 * The per-row TYPE service-icon check below is genuinely APM-specific (its
 * grids have a Type column with a service-language icon; other dashboards
 * don't), so it's added via extraChecks rather than folded into the factory.
 */

import { createDefaultDashboardSuite } from '../_core/dashboard.suiteFactory.js';
import { widgetByTitle, safeScroll, expectGridRowIcons } from '../_core/dashboard.widgetAssertions.js';

const SERVICE_WIDGET_PAIRS = [
  { chart: 'Top Services by Events', grid: 'Services by Event', columns: ['service.name', 'Type', 'Event Count'] },
  { chart: 'Top Services by Trace Count', grid: 'Services by Trace Count', columns: ['service.name', 'Type', 'Trace Count'] },
  { chart: 'Top Services by Span Count', grid: 'Services by Span Count', columns: ['service.name', 'Type', 'Span Count'] },
  { chart: 'Top Services by Ingestion Volume', grid: 'Services by Ingestion Volume', columns: ['service.name', 'Type', 'Ingestion Volume'] },
];

createDefaultDashboardSuite({
  dashboardId: '10000000001100',
  dashboardTitle: 'APM Statistics',
  // Every widget on the dashboard — drives the "reports any showing No data found" test so an
  // empty widget is surfaced by name even if the precise checks below all had data.
  widgetPresence: [
    'Service Count', 'Total Events', 'Total Trace Volume', 'Total Span Volume',
    'Trace per Minute', 'Trace Volume', 'Span Volume',
    'Top Services by Events', 'Services by Event',
    'Top Services by Trace Count', 'Services by Trace Count',
    'Top Services by Span Count', 'Services by Span Count',
    'Top Services by Ingestion Volume', 'Services by Ingestion Volume',
  ],
  metricTiles: ['Service Count', 'Total Events', 'Total Trace Volume', 'Total Span Volume'],
  trendCharts: ['Trace per Minute', 'Trace Volume', 'Span Volume'],
  chartGridPairs: SERVICE_WIDGET_PAIRS,
  actionMenuChecks: [
    { title: 'Service Count', kind: 'tile' },
    { title: 'Trace per Minute', kind: 'chart', fullScreen: true, exportCsv: true },
  ],
  afterNavigate: async (page) => {
    // Floating Vue "DEV" widget-inspector overlay present on this account/env — collapse it
    // back to its small badge so it can't sit on top of a widget's kebab (⋮) icon and
    // intercept the click. The badge form doesn't overlap the widget grid.
    const devPanelClose = page.getByRole('button', { name: '×', exact: true });
    if (await devPanelClose.count() > 0) await devPanelClose.first().click().catch(() => {});
  },
  extraChecks: async ({ page, goToDashboard }) => {
    for (const { grid } of SERVICE_WIDGET_PAIRS) {
      await goToDashboard(page);
      const gridWidget = widgetByTitle(page, grid);
      await safeScroll(gridWidget);
      const rowCount = await gridWidget.locator('tr.k-master-row').count();
      await expectGridRowIcons(gridWidget, rowCount, grid);
    }
  },
});
