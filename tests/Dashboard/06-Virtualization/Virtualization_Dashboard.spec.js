/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-14
 *
 * "Virtualization" category default/system dashboards: Citrix Xen, Hyper-V,
 * VMWare. Citrix Xen and VMWare widget titles/columns discovered live on
 * 172.16.15.68 (build 8.2.6); Hyper-V verified on 172.16.8.218 (all widgets
 * empty there — presence-only, unchanged).
 *
 * "Sparkline" is deliberately excluded from every grid's `columns` list — see
 * 02-Server's header comment for why (inconsistent header-text rendering
 * across grids on 172.16.15.68; still covered by widgetPresence). "Xen Server
 * Health"/"VM Summary"/"ESXi Health"/"ESXi VM Summary"/"Top VM by CPU Usage"
 * are heatmap/donut/unknown-kind widgets with no precise helper yet —
 * presence-only. "Metric Analysis" is a duplicate title on Hyper-V — excluded.
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Virtualization', [
{
  dashboardId: '10000000001008',
  dashboardTitle: 'Citrix Xen',
  widgetPresence: [
    'Xen Server Health', 'VM Summary', 'Xen Health Overview',
    'Top Xen Server Host by Memory Usage', 'Top Xen Server Host by No. of VMs',
    'Top Xen Server Host by CPU Usage', 'Top Xen Server Interface by Network Traffic',
    'Top Xen VM by CPU Usage', 'Top Xen VM by Network Bits per Sec.',
    'Top Xen Server Host by Disk Used Percent', 'Top Xen Server Host by Network Bits per Sec.',
    'Top Xen VM by Memory Usage', 'Top Xen VM by Disk Capacity',
    'Top Xen VM by Disk Latency', 'Top Xen VM by Disk IO Bytes/s',
  ],
  trendCharts: [
    'Top Xen Server Host by Memory Usage', 'Top Xen Server Host by No. of VMs',
    'Top Xen VM by Network Bits per Sec.', 'Top Xen Server Host by Disk Used Percent',
  ],
  grids: [
    { title: 'Top Xen Server Host by CPU Usage', columns: ['Monitor', 'CPU Percent'] },
    { title: 'Top Xen Server Interface by Network Traffic', columns: ['Monitor', 'Network Interface', 'Network Bits per sec.'] },
    { title: 'Top Xen VM by CPU Usage', columns: ['Monitor', 'VM', 'CPU Percent'] },
    { title: 'Top Xen Server Host by Network Bits per Sec.', columns: ['Monitor', 'Network Bits per sec.'] },
    { title: 'Top Xen VM by Disk Capacity', columns: ['Monitor', 'VM', 'Disk Capacity'] },
    { title: 'Top Xen VM by Disk Latency', columns: ['Monitor', 'VM', 'Disk Write Latency', 'Disk Read Latency'] },
    { title: 'Top Xen VM by Disk IO Bytes/s', columns: ['Monitor', 'VM', 'Disk IO Write bytes/s', 'Disk IO Read bytes/s'] },
  ],
  actionMenuChecks: [
    // kind: 'pie' (not 'chart') — verified live this widget's menu omits "Export as CSV" (no
    // exportable table), matching the tile/pie item set rather than area-chart/grid.
    { title: 'Top Xen Server Host by Memory Usage', kind: 'pie' },
    { title: 'Top Xen Server Host by CPU Usage', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001012',
  dashboardTitle: 'Hyper-V',
  widgetPresence: [
    'Hyper-V Hypervisor CPU Percent', 'Hyper-V CPU Percent', 'Hyper-V Network Bits per Sec.',
    'Hyper-V Disk I/O Ops. per Sec.', 'Hyper-V Disk Used Percent',
    'Top 10 Hyper-V Interface by Network Bits per Sec', 'Top VM by CPU Percent',
    'Hyper-V Disk Volume Used Percent', 'Hyper-V Cluster Node Memory Used Percent',
    'Hyper-V Cluster Nodes', 'Hyper-V Cluster VMs', 'Hyper-V Cluster CPU Cores',
    'Hyper-V Cluster Disk Free Percent', 'Hyper-V Availability', 'Hyper-V Health Summary',
    'Hyper-V Alert Summary', 'Top Hypervisor by CPU Percent', 'Hyper-V CPU Percent Usage',
    'Hyper-V Memory Usage', 'Top VM by Disk IOPS', 'Top VM by Network Bits per Sec.',
  ],
},

{
  dashboardId: '10000000001025',
  dashboardTitle: 'VMWare',
  widgetPresence: [
    'Top VM by CPU Usage', 'Top VM by Disk Usage', 'vCenter DataCenter CPU Usage',
    'vCenter Datacenter Memory Usage', 'vCenter Datastore Usage', 'Top ESXi Host by CPU Usage',
    'Top ESXi Host by Datastore Free Bytes', 'Top ESXi Interface by Network Traffic',
    'Top ESXi Host by Memory Usage', 'vCenter Cluster VMs', 'Top ESXi Host by No. of VMs',
    'ESXi Disk Latency', 'Storage Adapter Write Ops/s', 'ESXi Datastore Write Ops/s',
    'VM Network Bits per Sec.', 'Top VM by Memory Usage', 'ESXi Health', 'vCenter Clusters',
    'vCenter Datastores', 'ESXi Disk I/O Bytes per Sec.', 'VMWare Health Overview',
    'ESXi VM Summary', 'VM by Disk I/O Bytes per Sec.', 'ESXi Sensor Health',
  ],
  trendCharts: [
    'Top VM by Disk Usage', 'Top ESXi Host by Datastore Free Bytes', 'Top ESXi Host by No. of VMs',
    'ESXi Disk Latency', 'Storage Adapter Write Ops/s', 'ESXi Datastore Write Ops/s',
    'VM Network Bits per Sec.', 'ESXi Disk I/O Bytes per Sec.', 'VM by Disk I/O Bytes per Sec.',
  ],
  grids: [
    { title: 'Top ESXi Host by CPU Usage', columns: ['Monitor', 'CPU Percent'] },
    { title: 'Top ESXi Interface by Network Traffic', columns: ['Monitor', 'Network Interface', 'Bits per Sec.'] },
    { title: 'Top ESXi Host by Memory Usage', columns: ['Monitor', 'Memory Used Percent'] },
    { title: 'Top VM by Memory Usage', columns: ['Monitor', 'VM', 'Memory used percent'] },
    { title: 'ESXi Sensor Health', columns: ['Monitor', 'Sensor', 'Sensor Type', 'Sensor Health'] },
  ],
  actionMenuChecks: [
    { title: 'vCenter DataCenter CPU Usage', kind: 'tile' },
    { title: 'Top ESXi Host by CPU Usage', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},
]);
