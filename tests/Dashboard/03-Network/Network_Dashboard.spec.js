/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-14
 *
 * End-to-end coverage for the "Network" category default/system dashboards,
 * in tree order: Aruba Wireless, Cisco Wireless, Network Overview, Ruckus
 * Wireless. Aruba Wireless widget titles/columns discovered live on
 * 172.16.15.68 (build 8.2.6) — NOW populated there (unlike 172.16.8.218, where
 * every widget was empty). Cisco Wireless/Network Overview/Ruckus Wireless
 * verified on 172.16.8.218.
 *
 * "Metric Analysis" is a duplicate, non-unique widget title on BOTH Aruba
 * Wireless and Ruckus Wireless (it appears twice on Ruckus alone) — excluded
 * from every config since widgetByTitle's `[title="..."]` lookup requires
 * count()===1, which a duplicate title can never satisfy.
 *
 * Each dashboard also has 1-2 widgets intentionally excluded because they're
 * ring-group donuts or hexagon heatmaps (same widget kinds skipped on the
 * Server category — no assertion helper for either exists yet): "Cisco
 * Wireless Alert Summary", "Network Health Summary", "Network Alert Summary",
 * "Ruckus Wireless Alert Overview", "Aruba Wireless Client Summary".
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Network', [
{
  dashboardId: '10000000001014',
  dashboardTitle: 'Aruba Wireless',
  widgetPresence: [
    'Aruba Rogue Client', 'Aruba Rogue AP', 'Aruba Wireless Clients', 'Aruba Wireless Alert Summary',
    'Aruba Wireless AP Traffic Summary', 'Top Aruba Wireless Client by Traffic Bytes',
    'Aruba Wireless Client Signal Strength', 'Aruba Wireless APs', 'Aruba Wireless Client Summary',
    'Aruba Wireless Rogue Channel', 'Aruba WLC CPU Percent', 'Aruba WLC Memory Percent',
    'Top Aruba AP by Clients', 'Aruba Wireless AP Interface Bits/s', 'Aruba Wireless Wlan Summary',
    'Aruba Wireless AP Summary', 'Top Aruba Wireless Wlan by Traffic Bits/s',
    'Top Aruba Client by Sent Traffic', 'Top Aruba Client by Received Traffic',
  ],
  metricTiles: [
    'Aruba Rogue Client', 'Aruba Rogue AP', 'Aruba Wireless Clients',
    'Aruba Wireless APs', 'Aruba WLC CPU Percent', 'Aruba WLC Memory Percent',
  ],
  trendCharts: [
    'Aruba Wireless AP Interface Bits/s', 'Top Aruba Wireless Wlan by Traffic Bits/s',
    'Top Aruba Client by Sent Traffic', 'Top Aruba Client by Received Traffic',
  ],
  grids: [
    { title: 'Aruba Wireless AP Traffic Summary', columns: ['Monitor', 'AP Interface', 'Sent Bytes', 'Received Bytes'] },
    { title: 'Top Aruba Wireless Client by Traffic Bytes', columns: ['Client', 'Client IP', 'Traffic Bytes'] },
    { title: 'Aruba Wireless Client Signal Strength', columns: ['Client', 'Client IP', 'Client Signal Strength'] },
    { title: 'Aruba Wireless Rogue Channel', columns: ['Monitor', 'Rogue AP', 'Rogue AP Channel'] },
    { title: 'Top Aruba AP by Clients', columns: ['Monitor', 'AP', 'Clients'] },
    { title: 'Aruba Wireless Wlan Summary', columns: ['Monitor', 'Wlan', 'APs', 'Clients'] },
    { title: 'Aruba Wireless AP Summary', columns: ['Monitor', 'aruba.wireless.access.point', 'AP', 'Model', 'IP Address', 'Location', 'Started Time'] },
  ],
  actionMenuChecks: [
    { title: 'Aruba Wireless Clients', kind: 'tile' },
    { title: 'Aruba Wireless AP Traffic Summary', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001011',
  dashboardTitle: 'Cisco Wireless',
  widgetPresence: [
    'Cisco Rogue Clients', 'Cisco Rogue AP', 'Cisco Wireless Alert Summary',
    'Cisco Wireless Wlan Summary', 'Cisco Wireless Clients', 'Cisco Wireless AP Count',
    'Cisco Wireless Rogue AP Channel', 'Top Cisco Wireless Client by Signal Strength',
    'Cisco Wireless Client Summary', 'Top Cisco Wireless AP by Client',
    'Top Cisco Wireless Client by Traffic', 'Cisco WLC CPU Percent', 'Cisco WLC Memory Percent',
    'Cisco Wireless AP Summary', 'Top Cisco Wireless Client by Received Traffic',
    'Top Cisco Wireless Client by Sent Traffic',
  ],
  metricTiles: [
    'Cisco Rogue Clients',
    'Cisco Rogue AP',
    'Cisco Wireless Clients',
    'Cisco Wireless AP Count',
    'Cisco WLC CPU Percent',
    'Cisco WLC Memory Percent',
  ],
  trendCharts: ['Top Cisco Wireless Client by Received Traffic', 'Top Cisco Wireless Client by Sent Traffic'],
  grids: [
    { title: 'Cisco Wireless Wlan Summary', columns: ['Monitor', 'Wlan', 'Wlan Id', 'Wlan Clients', 'Wlan Status'] },
    { title: 'Cisco Wireless Rogue AP Channel', columns: ['Monitor', 'Rogue AP', 'Rogue AP Channel'] },
    { title: 'Top Cisco Wireless Client by Signal Strength', columns: ['Client', 'Client IP', 'SNR', 'Signal Strength'] },
    { title: 'Cisco Wireless Client Summary', columns: ['Monitor', 'AP', 'Client', 'Username', 'Wlan', 'Channel', 'OS', 'Client Status'] },
    { title: 'Top Cisco Wireless AP by Client', columns: ['Monitor', 'AP', 'Clients'] },
    { title: 'Top Cisco Wireless Client by Traffic', columns: ['Client', 'Client IP', 'Traffic Bytes'] },
    { title: 'Cisco Wireless AP Summary', columns: ['Monitor', 'AP', 'Model', 'IP Address', 'Location', 'Admin Status', 'Operational Status'] },
  ],
  actionMenuChecks: [
    { title: 'Cisco Wireless Clients', kind: 'tile' },
    { title: 'Cisco Wireless Wlan Summary', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001019',
  dashboardTitle: 'Network Overview',
  widgetPresence: [
    'Top Network Monitor by CPU Percent', 'Top Interface by Error Packet',
    'Top Network Monitor by Latency', 'Network Health Summary', 'Network Alert Summary',
    'Top Network Monitor by Memory Usage', 'Network Monitor Availability',
    'Top Network Monitor by Downtime', 'Network Interface Availability',
    'Top Interface by Traffic Utilization Percent',
  ],
  trendCharts: ['Network Monitor Availability', 'Network Interface Availability'],
  grids: [
    { title: 'Top Network Monitor by CPU Percent', columns: ['Monitor', 'CPU Percent'] },
    { title: 'Top Interface by Error Packet', columns: ['Monitor', 'Interface', 'Error Packets'] },
    { title: 'Top Network Monitor by Latency', columns: ['Monitor', 'Latency'] },
    { title: 'Top Network Monitor by Memory Usage', columns: ['Monitor', 'Memory Used Percent'] },
    { title: 'Top Network Monitor by Downtime', columns: ['Monitor', 'Downtime'] },
    { title: 'Top Interface by Traffic Utilization Percent', columns: ['Monitor', 'Interface', 'Traffic Utilization'] },
  ],
  actionMenuChecks: [
    { title: 'Network Monitor Availability', kind: 'pie' },
    { title: 'Top Network Monitor by CPU Percent', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001015',
  dashboardTitle: 'Ruckus Wireless',
  // "...Active Wlans", "...Rogue AP Channel", "...Disconnected APs", "...Excellent Clients",
  // "Top ...AP by CPU Percent" are currently empty on this environment too (kind unverifiable) —
  // excluded from the PRECISE checks below for the same reason Aruba Wireless is excluded, but
  // they ARE in widgetPresence so they're still reported by name if they show "No data found".
  // "Metric Analysis" (appears twice) is excluded everywhere — a duplicate title can't be scoped.
  widgetPresence: [
    'Ruckus Wireless Alert Overview', 'Ruckus Wireless Clients', 'Ruckus Wireless Rogue APs',
    'Ruckus Wireless Active Wlans', 'Ruckus Wireless APs', 'Top Ruckus Wireless Client by Traffic',
    'Top Ruckus Wireless Client by Connection Retries', 'Top Ruckus Wireless Client by Signal Strength',
    'Ruckus Wireless Rogue AP Channel', 'Ruckus Wireless Wlan Summary', 'Top Ruckus Wireless Wlan by Traffic',
    'Ruckus Wireless Disconnected APs', 'Ruckus Wireless Excellent Clients', 'Top Ruckus Wireless AP by CPU Percent',
    'Top Ruckus Wireless AP by Traffic', 'Top Ruckus Wireless AP by Client', 'Ruckus Wireless Client Summary',
    'Ruckus Wireless AP Received Bytes', 'Ruckus Wireless AP Sent Bytes',
  ],
  metricTiles: ['Ruckus Wireless Clients', 'Ruckus Wireless Rogue APs', 'Ruckus Wireless APs'],
  trendCharts: [
    'Top Ruckus Wireless AP by Client',
    'Ruckus Wireless AP Received Bytes',
    'Ruckus Wireless AP Sent Bytes',
  ],
  grids: [
    { title: 'Top Ruckus Wireless Client by Traffic', columns: ['Client', 'Sent Bytes', 'Received Bytes'] },
    { title: 'Top Ruckus Wireless Client by Connection Retries', columns: ['Client', 'Client IP', 'Retry Count'] },
    { title: 'Top Ruckus Wireless Client by Signal Strength', columns: ['Client', 'SNR', 'Signal Strength'] },
    { title: 'Ruckus Wireless Wlan Summary', columns: ['Monitor', 'Wireless Wlan', 'Wlan Id', 'Access Vlan', 'Wlan Clients'] },
    { title: 'Top Ruckus Wireless Wlan by Traffic', columns: ['Monitor', 'Wlan', 'Sent Bytes', 'Received Bytes'] },
    { title: 'Top Ruckus Wireless AP by Traffic', columns: ['Monitor', 'AP', 'Sent Bytes', 'Received Bytes'] },
    { title: 'Ruckus Wireless Client Summary', columns: ['Monitor', 'Client', 'AP', 'Wlan', 'Channel', 'OS', 'Auth Status', 'Health'] },
  ],
  actionMenuChecks: [
    { title: 'Ruckus Wireless Clients', kind: 'tile' },
    { title: 'Ruckus Wireless Wlan Summary', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},
]);
