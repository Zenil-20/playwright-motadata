/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-13
 *
 * "Applications" category default/system dashboards:
 *   - Apache HTTP Overview — widget titles discovered live on 172.16.15.68
 *     (build 8.2.6): 5 populated Highcharts widgets, 1 empty.
 *   - Apache Tomcat Overview, IIS Overview, Nginx Overview — all widgets EMPTY
 *     on 172.16.8.218 (verified there): widgetPresence smoke check only, add
 *     precise checks when run against a server that monitors them.
 *   - RabbitMQ Overview — POPULATED on 172.16.8.218: precise grid/chart checks.
 *
 * "Metric Analysis" is a duplicate title on every one of these dashboards —
 * excluded everywhere (widgetByTitle requires count()===1). Grid column names
 * are the exact rendered header text (case-insensitively matched).
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Applications', [
{
  dashboardId: '10000000001002',
  dashboardTitle: 'Apache HTTP Overview',
  widgetPresence: [
    'Apache Requests/s', 'Apache Traffic Bits/s', 'Apache Active Requests',
    'Apache Traffic Volume Bytes', 'Apache Busy Workers', 'Apache Idle Workers',
  ],
  trendCharts: [
    'Apache Requests/s', 'Apache Traffic Bits/s', 'Apache Active Requests',
    'Apache Traffic Volume Bytes', 'Apache Busy Workers',
  ],
  actionMenuChecks: [
    { title: 'Apache Requests/s', kind: 'chart' },
  ],
},

{
  dashboardId: '10000000001010',
  dashboardTitle: 'Apache Tomcat Overview',
  widgetPresence: [
    'Tomcat Connection Summary', 'Top Tomcat Sessions Summary', 'Top Tomcat Thread Pool Connections',
    'Top Tomcat JDBC Connections', 'Tomcat Requests', 'Tomcat Received Bytes', 'Tomcat Sent Bytes', 'Tomcat Errors',
  ],
},

{
  dashboardId: '10000000001003',
  dashboardTitle: 'IIS Overview',
  widgetPresence: [
    'Top IIS Connections', 'IIS Requests Overview', 'IIS Sent Bytes', 'IIS Received Bytes',
    'Top IIS Requests Summary', 'IIS 404 Errors', 'IIS Logon Attempts', 'Top IIS Files Summary',
  ],
},

{
  dashboardId: '10000000001001',
  dashboardTitle: 'Nginx Overview',
  widgetPresence: [
    'Nginx Active Connections', 'Top Nginx Connection Summary', 'Top Nginx Connections State',
    'Nginx Requests', 'Nginx Connection',
  ],
},

{
  dashboardId: '10000000001017',
  dashboardTitle: 'RabbitMQ Overview',
  widgetPresence: [
    'RabbitMQ Queue Summary', 'RabbitMQ Memory', 'RabbitMQ Summary', 'Top RabbitMQ Messages Summary',
    'Top RabbitMQ Channel Messages Summary', 'RabbitMQ Node Memory Used Bytes', 'RabbitMQ Node Memory Limit Bytes',
  ],
  trendCharts: ['RabbitMQ Node Memory Used Bytes', 'RabbitMQ Node Memory Limit Bytes'],
  grids: [
    { title: 'RabbitMQ Queue Summary', columns: ['MONITOR', 'RABBITMQ QUEUE', 'QUEUE PUBLISHES/S', 'QUEUE GETS/S', 'QUEUE ACKS/S', 'QUEUE REDELIVERS/S'] },
    { title: 'RabbitMQ Memory', columns: ['MONITOR', 'NODE', 'MEMORY USED BYTES', 'QUEUE MEMORY BYTES', 'MSG INDEX MEMORY BYTES', 'CODE MEMORY BYTES'] },
    { title: 'RabbitMQ Summary', columns: ['MONITOR', 'CHANNELS', 'CONSUMERS', 'CONNECTIONS', 'QUEUES', 'MESSAGES'] },
    { title: 'Top RabbitMQ Messages Summary', columns: ['MONITOR', 'MESSAGES', 'READY MESSAGES', 'UNACKNOWLEDGED MESSAGES'] },
  ],
  actionMenuChecks: [
    { title: 'RabbitMQ Summary', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},
]);
