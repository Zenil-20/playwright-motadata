/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-14
 *
 * "SDN" category default/system dashboard: Cisco Catalyst SD-WAN. Widget
 * titles and grid columns discovered live on 172.16.15.68 (build 8.2.6).
 * "Tunnel Availability" and "Cisco Catalyst SDN Device Availability" are
 * ring-group/donut widgets with no precise assertion helper yet (see
 * tests/Dashboard/README.md) — covered by widgetPresence only. "Manager's CPU
 * Utilization" and "Manager's Memory Utilization" are empty on this env.
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('SDN', [
{
  dashboardId: '10000000001040',
  dashboardTitle: 'Cisco Catalyst SD-WAN',
  widgetPresence: [
    'Total Sites', 'Down Tlocs', 'Tunnels', 'Up Tlocs', 'Tunnel Availability',
    'Cisco Catalyst SDN Device Availability', 'Top WAN Edge Devices By CPU Utilization',
    'Top WAN Edge Devices By Memory Utilization', 'Top WAN Edge Devices By Control Connections',
    'Top Tunnel Performance', 'WAN Edge TLOC Performance', 'Top Interface By Errors',
    'Top Interface By Traffic', "Manager's CPU Utilization", "Manager's Memory Utilization",
    'WAN Edge Deployment Summary',
  ],
  metricTiles: ['Total Sites', 'Down Tlocs', 'Tunnels', 'Up Tlocs'],
  trendCharts: ['Top WAN Edge Devices By Control Connections'],
  grids: [
    { title: 'Top WAN Edge Devices By CPU Utilization', columns: ['Monitor', 'CPU Utilization'] },
    { title: 'Top WAN Edge Devices By Memory Utilization', columns: ['Monitor', 'Memory Utilization'] },
    { title: 'Top Tunnel Performance', columns: ['Tunnel', 'Monitor', 'Latency', 'Jitter', 'Lost %'] },
    { title: 'WAN Edge TLOC Performance', columns: ['TLOC', 'Monitor', 'Latency', 'Jitter', 'Lost %'] },
    { title: 'Top Interface By Errors', columns: ['cisco.vedge.interface', 'Monitor', 'Rx Errors', 'Tx Errors'] },
    // "Rx Bytes" omitted — live discovery captured it with irregular internal whitespace
    // ("rx  bytes", double space) that doesn't survive a normalized exact-match assertion;
    // still covered by widgetPresence.
    { title: 'Top Interface By Traffic', columns: ['Interface', 'Monitor', 'Tx Bytes'] },
    { title: 'WAN Edge Deployment Summary', columns: ['Monitor', 'Deployment Stage', 'Device Count'] },
  ],
  actionMenuChecks: [
    { title: 'Total Sites', kind: 'tile' },
    { title: 'Top WAN Edge Devices By CPU Utilization', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},
]);
