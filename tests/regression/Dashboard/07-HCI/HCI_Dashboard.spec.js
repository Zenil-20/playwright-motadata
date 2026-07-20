/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-14
 *
 * "HCI" category default/system dashboard: Nutanix. Widget titles and grid
 * columns discovered live on 172.16.15.68 (build 8.2.6). "Sparkline" grids
 * share the same trailing whitespace-only header quirk documented for the
 * Server category (real column, non-`.k-link` markup) — the trailing column
 * on every "Top Nutanix ... by ..." grid is that Sparkline column.
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('HCI', [
{
  dashboardId: '10000000001039',
  dashboardTitle: 'Nutanix',
  widgetPresence: [
    'Nutanix Clusters', 'Nutanix Hosts', 'Nutanix Storage Containers', 'Nutanix Disks',
    'Nutanix Volume Group', 'Nutanix VMs', 'Top Nutanix Cluster by CPU Usage',
    'Top Nutanix Cluster by Memory Usage', 'Top Nutanix Cluster by IO Latency',
    'Top Nutanix Host by CPU Usage', 'Top Nutanix Host by Memory Usage',
    'Top Nutanix Host by IO Latency', 'Top Nutanix VM by CPU Usage',
    'Top Nutanix VM by Memory Usage', 'Top Nutanix VM by IO Latency',
  ],
  metricTiles: [
    'Nutanix Clusters', 'Nutanix Hosts', 'Nutanix Storage Containers',
    'Nutanix Disks', 'Nutanix Volume Group', 'Nutanix VMs',
  ],
  trendCharts: [
    'Top Nutanix Cluster by CPU Usage', 'Top Nutanix Cluster by Memory Usage',
    'Top Nutanix Cluster by IO Latency',
  ],
  grids: [
    { title: 'Top Nutanix Host by CPU Usage', columns: ['Monitor', 'CPU Usage', 'IP'] },
    { title: 'Top Nutanix Host by Memory Usage', columns: ['Monitor', 'Memory Usage', 'IP'] },
    { title: 'Top Nutanix Host by IO Latency', columns: ['Monitor', 'IO Latency', 'IP'] },
    { title: 'Top Nutanix VM by CPU Usage', columns: ['VM Name', 'Vm IP', 'CPU Usage'] },
    { title: 'Top Nutanix VM by Memory Usage', columns: ['VM Name', 'VM IP', 'Memory Usage'] },
    { title: 'Top Nutanix VM by IO Latency', columns: ['VM Name', 'VM IP'] },
  ],
  actionMenuChecks: [
    { title: 'Nutanix Clusters', kind: 'tile' },
    { title: 'Top Nutanix Host by CPU Usage', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},
]);
