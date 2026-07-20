/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-13
 *
 * "Flow" category default/system dashboards: Flow Statistics, Flow Summary.
 * Flow Statistics widget titles/columns discovered live on 172.16.15.68
 * (build 8.2.6) — mostly populated. Flow Summary verified on 172.16.8.218.
 *
 * "Flow Volume" is a DUPLICATE, non-unique title on Flow Statistics (appears
 * once as a tile, once as a chart) — excluded everywhere (widgetByTitle
 * requires count()===1), same as the established "Metric Analysis" pattern.
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Flow', [
{
  dashboardId: '10000000001035',
  dashboardTitle: 'Flow Statistics',
  widgetPresence: [
    'Event per Second (Last)', 'Flow Source Count', 'Total Events',
    'Flow Events per Second', 'Flow Events', 'Top Flow Source by Events',
    'Flow Source by Events', 'Top Flow Source by Volume', 'Flow Source by Volume',
  ],
  metricTiles: ['Event per Second (Last)', 'Flow Source Count', 'Total Events'],
  trendCharts: ['Flow Events per Second', 'Flow Events', 'Top Flow Source by Events', 'Top Flow Source by Volume'],
  grids: [
    { title: 'Flow Source by Events', columns: ['source.flows.sum', 'Event Source'] },
    { title: 'Flow Source by Volume', columns: ['source.flow.volume.bytes.sum', 'Event Source'] },
  ],
  actionMenuChecks: [
    { title: 'Flow Source Count', kind: 'tile' },
    { title: 'Flow Source by Events', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001018',
  dashboardTitle: 'Flow Summary',
  widgetPresence: [
    'Traffic from Source to Destination Country', 'Traffic by Source to Destination City',
    'Traffic by Source IP to Destination IP', 'Tree Map - Traffic by Destination Country',
    'Volume Bytes by Application', 'Traffic by Protocol', 'Packets by TCP Flags',
    'Traffic by Destination Port', 'Traffic by Destination Domain', 'Traffic by Source Domain',
  ],
  trendCharts: ['Traffic by Source to Destination City', 'Traffic by Source IP to Destination IP'],
},
]);
