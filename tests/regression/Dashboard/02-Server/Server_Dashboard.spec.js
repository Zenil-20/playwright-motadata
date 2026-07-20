/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-14
 *
 * End-to-end coverage for the "Server" category default/system dashboards:
 * Server Overview, Linux Server Overview, Windows Server Overview. Widget
 * titles and grid columns verified live (172.16.8.218, build 8.2.6.1).
 *
 * All three dashboards live in ONE file deliberately (not one file each) —
 * multiple spec files in the same folder run in separate PARALLEL workers by
 * default, and each dashboard's beforeAll logs in independently; concurrent
 * logins on the same account caused an instant navigation failure on one
 * dashboard when this was split across 3 files. One file keeps them in a
 * single worker, same as the (always-reliable) single-file APM Statistics spec.
 *
 * Every grid here shares a "Monitor [+ dimension columns] + Sparkline" shape,
 * but "Sparkline" is deliberately NOT in any `columns` list below — live on
 * 172.16.15.68 its header renders inconsistently (some grids expose the text
 * "Sparkline" via getByText, some don't, even within the same dashboard) —
 * asserting it produced flaky failures unrelated to real regressions. The
 * column still exists visually; it's covered by widgetPresence, just not by
 * the precise per-column check.
 *
 * Three widget kinds per dashboard are intentionally NOT covered: a ring-group
 * donut (Availability: Up/Down/Unreachable/Maintenance; Alert Summary/Overview:
 * Critical/Warning) and a hexagon heatmap (Health Summary). Neither has an
 * assertion helper in dashboard.widgetAssertions.js yet — build and verify one
 * live before adding them, same rigor as expectGridOrEmpty/expectChartOrEmpty.
 *
 * Don't assume the three dashboards mirror each other's widget-kind choices —
 * verified live, several differ: "Top Windows Server by Latency" and "...by
 * Disk Usage" are PIES on Windows (grids on Server/Linux Overview), "...by CPU
 * Usage" is a grid whose actual column text is "CPU Percent" (not "CPU
 * Usage"), and the network-interface grid's metric column reads "Interface
 * Bits per Sec." on Windows vs "Network Bits per Sec." on Server/Linux — same
 * widget shape, different real column text.
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Server', [
{
  dashboardId: '10000000001016',
  dashboardTitle: 'Linux Server Overview',
  widgetPresence: [
    'Linux Server Health Summary', 'Linux Server Availability', 'Linux Server Alert Summary',
    'Top Linux Server by CPU Percent', 'Top Linux Server by CPU User Percent',
    'Top Linux Server by Memory Used', 'Top Linux Server by Disk Operations/s',
    'Top Linux Process by CPU Percent', 'Top Linux Process by Memory Usage',
    'Top Linux Interface by Network Bits per Sec', 'Top Linux Server by Disk Usage',
    'Top Linux Server by Latency',
  ],
  trendCharts: ['Top Linux Server by CPU User Percent', 'Top Linux Server by Disk Usage'],
  grids: [
    { title: 'Top Linux Server by CPU Percent', columns: ['Monitor', 'CPU Percent'] },
    { title: 'Top Linux Server by Memory Used', columns: ['Monitor', 'Memory Used Percent'] },
    { title: 'Top Linux Server by Disk Operations/s', columns: ['Monitor', 'Disk Operations/s'] },
    { title: 'Top Linux Server by Latency', columns: ['Monitor', 'Latency'] },
    { title: 'Top Linux Interface by Network Bits per Sec', columns: ['Monitor', 'Interface Name', 'Network Bits per Sec.'] },
    { title: 'Top Linux Process by CPU Percent', columns: ['Monitor', 'Process', 'Process CPU Percent'] },
    { title: 'Top Linux Process by Memory Usage', columns: ['Monitor', 'Process', 'Memory Usage'] },
  ],
  actionMenuChecks: [
    { title: 'Top Linux Server by CPU User Percent', kind: 'pie' },
    { title: 'Top Linux Server by CPU Percent', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001009',
  dashboardTitle: 'Server Overview',
  widgetPresence: [
    'Server Availability', 'Server Health Summary', 'Server Alert Summary',
    'Top Server Monitor by CPU Percent', 'Top Server Monitor by Memory Used',
    'Top Server Monitor by CPU User Percent', 'Top Server Monitor by Disk Usage',
    'Top Server Monitor by Disk Operations/s', 'Top Server Monitor by Latency',
    'Top Server Interface by Network Bits per Sec', 'Top Server Process by CPU Percent',
    'Top Server Process by Memory Usage',
  ],
  trendCharts: ['Top Server Monitor by CPU User Percent', 'Top Server Monitor by Disk Usage'],
  grids: [
    { title: 'Top Server Monitor by CPU Percent', columns: ['Monitor', 'CPU Percent'] },
    { title: 'Top Server Monitor by Memory Used', columns: ['Monitor', 'Memory Used Percent'] },
    { title: 'Top Server Monitor by Disk Operations/s', columns: ['Monitor', 'Disk Operations/s'] },
    { title: 'Top Server Monitor by Latency', columns: ['Monitor', 'Latency'] },
    { title: 'Top Server Interface by Network Bits per Sec', columns: ['Monitor', 'Interface Name', 'Network Bits per Sec.'] },
    { title: 'Top Server Process by CPU Percent', columns: ['Monitor', 'Process', 'Process CPU Percent'] },
    { title: 'Top Server Process by Memory Usage', columns: ['Monitor', 'Process', 'Memory Usage'] },
  ],
  actionMenuChecks: [
    { title: 'Top Server Monitor by CPU User Percent', kind: 'pie' },
    { title: 'Top Server Monitor by CPU Percent', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001021',
  dashboardTitle: 'Windows Server Overview',
  widgetPresence: [
    'Windows Server Health Summary', 'Windows Server Alert Overview',
    'Top Windows Process by CPU Percent', 'Top Windows Server by CPU User Percent',
    'Top Windows Server by CPU Usage', 'Top Windows Server by Latency',
    'Top Windows Server by Memory Used', 'Top Windows Server by Disk Usage',
    'Top Windows Server by Disk IOPS', 'Windows Server Availability',
    'Windows Network Interface Bits per Sec', 'Disk Volume by Low Disk Space',
  ],
  trendCharts: [
    'Top Windows Server by CPU User Percent',
    'Top Windows Server by Latency',
    'Top Windows Server by Disk Usage',
  ],
  grids: [
    { title: 'Top Windows Process by CPU Percent', columns: ['Monitor', 'Process', 'Process CPU Percent'] },
    { title: 'Top Windows Server by CPU Usage', columns: ['Monitor', 'CPU Percent'] },
    { title: 'Top Windows Server by Memory Used', columns: ['Monitor', 'Memory Used Percent'] },
    { title: 'Top Windows Server by Disk IOPS', columns: ['Monitor', 'Disk Read IOPS', 'Disk Write IOPS'] },
    { title: 'Windows Network Interface Bits per Sec', columns: ['Monitor', 'Interface Name', 'Interface Bits per Sec.'] },
    { title: 'Disk Volume by Low Disk Space', columns: ['Monitor', 'Disk Volume', 'Disk Volume Free Bytes'] },
  ],
  actionMenuChecks: [
    { title: 'Top Windows Server by CPU User Percent', kind: 'pie' },
    { title: 'Top Windows Process by CPU Percent', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},
]);
