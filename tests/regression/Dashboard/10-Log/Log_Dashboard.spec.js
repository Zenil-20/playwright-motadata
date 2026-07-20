/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-13
 *
 * "Log" category default/system dashboards, in tree order: Fortinet-Traffic
 * Analysis, Fortinet-UTM Analysis, Linux Log Analysis, Log Statistics,
 * Palo Alto-{Configuration,Threat,Traffic} Analysis, SonicWall-Traffic
 * Analysis, Windows Log Analysis.
 *
 * Fortinet/Linux/Palo Alto/SonicWall widget titles discovered live on
 * 172.16.15.68 (build 8.2.6) — mostly Highcharts widgets (pie/bar), a handful
 * of small 2-column grids, a few tiles on the Palo Alto Threat/Traffic
 * dashboards. Log Statistics and Windows Log Analysis verified on 172.16.8.218.
 *
 * No action-menu checks on the Fortinet/Palo Alto/SonicWall chart-only
 * dashboards — discovery can't distinguish pie from bar/line, and asserting
 * the exact kebab item set without knowing which would be a guess (see
 * 01-Overview's "Alert Summary" note for the same reasoning).
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Log', [
{
  dashboardId: '10000000001027',
  dashboardTitle: 'Fortinet - Traffic Analysis',
  widgetPresence: [
    'Top Application by Deny Action', 'Top Destination City by Byte Received',
    'Fortinet Service over Time', 'Top Source IP by Events', 'Top Apps by Bytes Sent',
    'Top Destination IP by Events', 'Top Application by Bytes Received',
    'Bytes Sent/Received over Time', 'Top Destination Port by Events',
    'Top Applications by Requests', 'Top Source by Requests', 'Top Source IP by Bytes Sent',
  ],
  trendCharts: [
    'Top Application by Deny Action', 'Fortinet Service over Time', 'Top Source IP by Events',
    'Top Apps by Bytes Sent', 'Top Destination IP by Events', 'Top Application by Bytes Received',
    'Bytes Sent/Received over Time', 'Top Destination Port by Events', 'Top Applications by Requests',
    'Top Source by Requests', 'Top Source IP by Bytes Sent',
  ],
},

{
  dashboardId: '10000000001024',
  dashboardTitle: 'Fortinet - UTM Analysis',
  widgetPresence: [
    'UTM Events by Threat', 'UTM Events by Action', 'UTM Events by Source IP',
    'UTM Events by Service', 'UTM Events by Protocol', 'UTM Events by Destination IP',
    'UTM Events by Destination Port', 'UTM Events by Sub-Type', 'UTM Events by URL',
    'UTM Events by Destination Domain', 'UTM Events by Severity', 'UTM Events by Application',
  ],
  trendCharts: [
    'UTM Events by Action', 'UTM Events by Source IP', 'UTM Events by Service',
    'UTM Events by Protocol', 'UTM Events by Destination IP', 'UTM Events by Destination Port',
    'UTM Events by Sub-Type', 'UTM Events by URL', 'UTM Events by Application',
  ],
},

{
  dashboardId: '10000000001006',
  dashboardTitle: 'Linux Log Analysis',
  widgetPresence: [
    'Linux Login Audit Events by Severity', 'Linux Login Audit Events by Remote IP',
    'Linux Login Audit Events by Status', 'Linux Logout Audit Events by Severity',
    'Linux Logout Audit Events by Log Source', 'Top Linux Syslog Events by Program',
    'Linux Syslog Events by Severity', 'Linux Syslog by Event Source',
    'Linux Logout Audit Events by Username',
  ],
  trendCharts: [
    'Linux Login Audit Events by Severity', 'Linux Login Audit Events by Remote IP',
    'Linux Logout Audit Events by Severity', 'Linux Logout Audit Events by Log Source',
    'Top Linux Syslog Events by Program', 'Linux Syslog Events by Severity',
    'Linux Syslog by Event Source', 'Linux Logout Audit Events by Username',
  ],
  grids: [
    { title: 'Linux Login Audit Events by Status', columns: ['User Name', 'Event Count', 'Audit Status'] },
  ],
  actionMenuChecks: [
    { title: 'Linux Login Audit Events by Status', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001034',
  dashboardTitle: 'Log Statistics',
  widgetPresence: [
    'Log Source Count', 'Total Events', 'Log Total Volume', 'Log Events per Second', 'Log Volume',
    'Log Source by Type', 'Log Source by Events', 'Top Log Source by Events', 'Log Events by Type',
    'Top Log Source by Volume', 'Log Source by Volume', 'Log Events',
  ],
  metricTiles: ['Log Source Count', 'Total Events', 'Log Total Volume'],
  trendCharts: [
    'Log Events per Second', 'Log Volume', 'Log Source by Type',
    'Top Log Source by Events', 'Top Log Source by Volume', 'Log Events',
  ],
  grids: [
    { title: 'Log Source by Events', columns: ['EVENT SOURCE', 'COUNT'] },
    { title: 'Log Events by Type', columns: ['EVENT SOURCE', 'COUNT'] },
    { title: 'Log Source by Volume', columns: ['EVENT SOURCE', 'LOG VOLUME'] },
  ],
  actionMenuChecks: [
    { title: 'Log Source Count', kind: 'tile' },
    { title: 'Log Source by Events', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001030',
  dashboardTitle: 'Palo Alto - Configuration Analysis',
  widgetPresence: [
    'Palo Alto - Configuration Status', 'Palo Alto - Configuration Status Trend',
    "Palo Alto - Top 10 IP's Used for Configuration", 'Palo Alto - Client Used',
    'Palo Alto - Top 10 Admin Users', 'Palo Alto - Commands Executed',
    'Palo Alto - Failed Configurations', 'Palo Alto - Failed Configurations by Admin User',
    'Palo Alto - Submitted Configurations', 'Palo Alto - Successful Configurations',
    'Palo Alto - Top 10 Failed Configurations', 'Palo Alto - Top 10 Submitted Configurations',
    'Palo Alto - Top 10 Successful Configurations', 'Palo Alto - Events by Serial Number',
  ],
  trendCharts: [
    'Palo Alto - Configuration Status', 'Palo Alto - Configuration Status Trend',
    "Palo Alto - Top 10 IP's Used for Configuration", 'Palo Alto - Client Used',
    'Palo Alto - Top 10 Admin Users', 'Palo Alto - Commands Executed',
  ],
  grids: [
    { title: 'Palo Alto - Failed Configurations', columns: ['Host IP', 'Event Count'] },
    { title: 'Palo Alto - Failed Configurations by Admin User', columns: ['Admin User Name', 'Event Name'] },
    { title: 'Palo Alto - Submitted Configurations', columns: ['Host IP', 'Event Count'] },
    { title: 'Palo Alto - Successful Configurations', columns: ['Host IP', 'Event Count'] },
  ],
  actionMenuChecks: [
    { title: 'Palo Alto - Failed Configurations', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001029',
  dashboardTitle: 'Palo Alto - Threat Analysis',
  widgetPresence: [
    'Palo Alto - Non Informational Threats', 'Palo Alto - Threat Direction by Content Type',
    'Palo Alto - Threat Content Type', 'Palo Alto - Threat Type by Severity',
    'Palo Alto - Top Threat Source IP', 'Palo Alto - Top Threat Destination IP',
    'Palo Alto - Threat by Category', 'Palo Alto - Destination IP with High Severity',
    'Palo Alto - Source IP with High Severity',
  ],
  metricTiles: ['Palo Alto - Non Informational Threats'],
  trendCharts: [
    'Palo Alto - Threat Content Type', 'Palo Alto - Threat Type by Severity',
    'Palo Alto - Top Threat Source IP', 'Palo Alto - Top Threat Destination IP',
    'Palo Alto - Threat by Category',
  ],
  grids: [
    { title: 'Palo Alto - Threat Direction by Content Type', columns: ['Content Type', 'Source IP', 'Destination IP', 'Event Count'] },
    { title: 'Palo Alto - Destination IP with High Severity', columns: ['Destination IP', 'High Event Count'] },
    { title: 'Palo Alto - Source IP with High Severity', columns: ['Source IP', 'High Event Count'] },
  ],
  actionMenuChecks: [
    { title: 'Palo Alto - Non Informational Threats', kind: 'tile' },
    { title: 'Palo Alto - Threat Direction by Content Type', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001033',
  dashboardTitle: 'Palo Alto - Traffic Analysis',
  widgetPresence: [
    'Palo Alto - Top Source IP by Events', 'Palo Alto - Top Destination IP by Events',
    'Palo Alto - Bytes Sent/Received over Time', 'Palo Alto - Top Application by Bytes Sent',
    'Palo Alto - Top Application by Bytes Received', 'Palo Alto - Top Destination Port by Events',
    'Palo Alto - Top Applications by Requests', 'Palo Alto - Top Destination City by Byte Received',
    'Palo Alto Top Source IP by Bytes Sent', 'Palo Alto- Threat by Severity',
    'Palo Alto - System Events by Severity', 'Palo Alto - Configuration Status',
    'Palo Alto - Non Informational Threats', 'Palo Alto - Non Informational System Events',
    'Palo Alto - Failed Configuration Events', 'Palo Alto - Traffic by Source City',
    'Palo Alto - Threat Type by Severity', 'Palo Alto - Dest IP Observing Multiple Threats',
    'Palo Alto - Source IP Generating Multiple Threats', 'Palo Alto - Threat Content Type',
  ],
  metricTiles: [
    'Palo Alto - Non Informational Threats', 'Palo Alto - Non Informational System Events',
    'Palo Alto - Failed Configuration Events',
  ],
  trendCharts: [
    'Palo Alto - Top Source IP by Events', 'Palo Alto - Top Destination IP by Events',
    'Palo Alto - Bytes Sent/Received over Time', 'Palo Alto - Top Application by Bytes Sent',
    'Palo Alto - Top Application by Bytes Received', 'Palo Alto - Top Destination Port by Events',
    'Palo Alto - Top Applications by Requests', 'Palo Alto Top Source IP by Bytes Sent',
    'Palo Alto- Threat by Severity', 'Palo Alto - System Events by Severity',
    'Palo Alto - Configuration Status', 'Palo Alto - Threat Type by Severity',
    'Palo Alto - Threat Content Type',
  ],
  grids: [
    { title: 'Palo Alto - Dest IP Observing Multiple Threats', columns: ['Destination IP', 'Unique Threats'] },
    { title: 'Palo Alto - Source IP Generating Multiple Threats', columns: ['Source IP', 'Unique Threats'] },
  ],
  actionMenuChecks: [
    { title: 'Palo Alto - Non Informational Threats', kind: 'tile' },
    { title: 'Palo Alto - Dest IP Observing Multiple Threats', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001028',
  dashboardTitle: 'SonicWall - Traffic Analysis',
  widgetPresence: [
    'SonicWall - Top Source IP by Events', 'SonicWall - Top Destination IP by Events',
    'SonicWall - Bytes Sent/Received over Time', 'SonicWall - Top Applications by Bytes Sent',
    'SonicWall - Top Applications by Bytes Received', 'SonicWall - Top Applications by Requests',
    'SonicWall - Top Destination City by Bytes Received', 'SonicWall - Top Source IP by Bytes Sent',
    'SonicWall - Events by Severity Level',
  ],
},

{
  dashboardId: '10000000001013',
  dashboardTitle: 'Windows Log Analysis',
  widgetPresence: [
    'Windows Events by Level', 'Windows Events by Provider', 'Windows Events by Task',
    'Windows Login Events by Status', 'Windows Login Events by Level', 'Windows Login Events by Remote Threat',
    'Windows Logout Events by Level', 'Windows Logout Events by Status', 'Windows Logout Events by Domain',
    'Windows Login Events by Workstation', 'Windows Login Events by Remote IP', 'Windows Login Events by Domain',
    'Windows Events by Event ID', 'Windows Events by Source', 'Events Count by Category',
  ],
},
]);
