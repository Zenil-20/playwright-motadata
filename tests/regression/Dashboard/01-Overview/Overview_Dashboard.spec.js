/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-14
 *
 * "Overview" category default/system dashboards: Performance Summary and Alert
 * Summary. Widget titles / grid columns verified live (172.16.8.218, build
 * 8.2.6.1). All dashboards in ONE file → single worker (see 07-Server for why).
 *
 * `grids` column names are the EXACT rendered header text (kept uppercase as
 * captured); expectGridOrEmpty matches case-insensitively so the case here is
 * cosmetic. `widgetPresence` lists every unique widget for a kind-agnostic
 * "panel mounted + visible" smoke check — this also covers the widget kinds
 * that have no precise assertion helper yet (hexagon heatmap, ring-group donut,
 * live alert-stream, "…by Group" treemap) and any widget empty on this env.
 * The duplicate-title trap ("Metric Analysis") does not occur on these two.
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Overview', [
{
  dashboardId: '10000000001004',
  dashboardTitle: 'Alert Summary',
  widgetPresence: [
    'Infrastructure Heatmap', 'Alert Count', 'Top Network Monitors by Alert Count',
    'Top Server Monitors by Alert Count', 'Top Cloud Monitors by Alert Count',
    'Top Policy by Alert Count', 'Top Monitor by Alert Count', 'Alert Stream',
    'Monitor Availability', 'Top Virtualization Monitors by Alert Count',
    'Top Wireless Monitors by Alert Count',
  ],
  // The four populated "Top … by Alert Count" widgets are Highcharts (pie/bar);
  // expectChartOrEmpty is kind-agnostic about pie-vs-line so it covers them. The
  // three Cloud/Virtualization/Wireless variants are empty on this env and the
  // heatmap/donut/alert-stream widgets have no precise helper — all covered by
  // widgetPresence above. No action-menu check here: a pie's menu omits "Export
  // as CSV" and discovery can't distinguish pie from bar, so asserting the exact
  // item set would be a guess (action-menu behavior is already proven elsewhere).
  trendCharts: [
    'Top Network Monitors by Alert Count', 'Top Server Monitors by Alert Count',
    'Top Policy by Alert Count', 'Top Monitor by Alert Count',
  ],
},

{
  dashboardId: '10000000001026',
  dashboardTitle: 'Performance Summary',
  widgetPresence: [
    'Top Monitor by CPU Utilization', 'Top Monitor by Memory Percent',
    'Memory Used Bytes by Group', 'System CPU Percent by Group',
    'Top Monitor by Disk Used Percent', 'Top Monitor by Latency',
    'Top Monitor by Network Packets per Second', 'Top Monitor by Low Disk Space',
    'Top Monitor Interface by Dropped Packets', 'Top Monitor Interface by Error Packets',
    'Top Monitor by Disk IOPS', 'Top Monitor by Network Bits/s',
  ],
  trendCharts: ['Top Monitor by Disk Used Percent', 'Top Monitor by Low Disk Space'],
  grids: [
    { title: 'Top Monitor by CPU Utilization', columns: ['MONITOR', 'CPU PERCENT'] },
    { title: 'Top Monitor by Memory Percent', columns: ['MONITOR', 'MEMORY USED PERCENT'] },
    { title: 'Top Monitor by Latency', columns: ['MONITOR', 'LATENCY'] },
    { title: 'Top Monitor by Network Packets per Second', columns: ['MONITOR', 'NETWORK IN PACKETS/S', 'NETWORK OUT PACKETS/S'] },
    { title: 'Top Monitor Interface by Dropped Packets', columns: ['MONITOR', 'INTERFACE', 'DROPPED PACKETS'] },
    { title: 'Top Monitor Interface by Error Packets', columns: ['MONITOR', 'NETWORK INTERFACE', 'ERROR PACKETS'] },
    { title: 'Top Monitor by Disk IOPS', columns: ['MONITOR', 'DISK IOPS'] },
    { title: 'Top Monitor by Network Bits/s', columns: ['MONITOR', 'NETWORK BITS/S'] },
  ],
  // "by Group" widgets: every row must show both a value (with its unit) and the group name.
  // Verified live (172.16.15.170): CPU group in %, Memory group in bytes (GB/MB/KB).
  groupTiles: [
    { title: 'System CPU Percent by Group', unit: '%' },
    { title: 'Memory Used Bytes by Group', unit: /\b[KMGT]?B\b/ },
  ],
  // Hover every chart/sparkline and confirm the tooltip shows a value in the expected unit —
  // units captured live from each widget's Highcharts tooltip. The all-zero "…Error Packets"
  // grid renders no sparkline on this env, so it has no chart to hover (export-only below).
  chartHovers: [
    { title: 'Top Monitor by CPU Utilization', unit: '%' },
    { title: 'Top Monitor by Memory Percent', unit: '%' },
    { title: 'Top Monitor by Latency', unit: 'ms' },
    { title: 'Top Monitor by Network Bits/s', unit: 'bps' },
    { title: 'Top Monitor by Network Packets per Second' },
    { title: 'Top Monitor Interface by Dropped Packets' },
    { title: 'Top Monitor by Disk IOPS' },
    { title: 'Top Monitor by Disk Used Percent', unit: '%' },
    { title: 'Top Monitor by Low Disk Space', unit: '%' },
  ],
  actionMenuChecks: [
    { title: 'Top Monitor by CPU Utilization', kind: 'grid', fullScreen: true, exportCsv: true },
    { title: 'Top Monitor Interface by Error Packets', kind: 'grid', exportCsv: true },
  ],
},
]);
