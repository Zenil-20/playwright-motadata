/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-13
 *
 * "Database" category default/system dashboards: MySQL Overview, Oracle DB
 * Overview, PostgreSQL Overview. MySQL widget titles/columns discovered live
 * on 172.16.15.68 (build 8.2.6) — fully populated. Oracle DB Overview and
 * PostgreSQL Overview verified on 172.16.8.218, both POPULATED.
 *
 * "Metric Analysis" is a duplicate title on Oracle/PostgreSQL — excluded. Grid
 * column names are the exact rendered header text (case-insensitively matched).
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Database', [
{
  dashboardId: '10000000001020',
  dashboardTitle: 'MySQL Overview',
  widgetPresence: [
    'Top MySQL Server by Connections', 'MySQL Received Bits/s', 'MySQL Questions',
    'Top MySQL Commands', 'MySQL Slow Queries', 'MySQL Thread Summary', 'MySQL Sent Bit/s',
    'Top MySQL Aborted Clients and Connections', 'Top MySQL Key Read/Write per Sec.',
    'MySQL Query Cache Hit Ratio', 'Top MySQL Open Entities',
  ],
  trendCharts: ['MySQL Received Bits/s', 'MySQL Questions', 'MySQL Slow Queries', 'MySQL Sent Bit/s', 'MySQL Query Cache Hit Ratio'],
  grids: [
    { title: 'Top MySQL Server by Connections', columns: ['Monitor', 'Connections'] },
    { title: 'Top MySQL Commands', columns: ['Monitor', 'SELECT', 'DELETE', 'INSERT', 'UPDATE'] },
    { title: 'MySQL Thread Summary', columns: ['Monitor', 'Delayed Insert Thread', 'Slow Launch Thread', 'Cached Thread', 'Connected Thread', 'Created Thread', 'Running Thread'] },
    { title: 'Top MySQL Aborted Clients and Connections', columns: ['Monitor', 'Aborted Connections', 'Aborted Clients'] },
    { title: 'Top MySQL Key Read/Write per Sec.', columns: ['Monitor', 'Reads/s', 'Writes/s'] },
    { title: 'Top MySQL Open Entities', columns: ['Monitor', 'Open Tables', 'Open Files', 'Open Streams'] },
  ],
  actionMenuChecks: [
    { title: 'Top MySQL Server by Connections', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001005',
  dashboardTitle: 'Oracle DB Overview',
  widgetPresence: [
    'Top Oracle Database Summary', 'Top Oracle Sorts Summary', 'Top Oracle SQL Cache Hit Ratio',
    'Oracle Active Sessions', 'Oracle Session Summary', 'Oracle Logins', 'Oracle Disk Sorts',
    'Oracle Table Scans', 'Oracle User Calls', 'Oracle User Commits', 'Oracle User Rollbacks',
    'Top Oracle Pool Memory Summary', 'Oracle Enqueue Timeouts', 'Top Oracle Cache Summary',
  ],
  trendCharts: [
    'Oracle Active Sessions', 'Oracle Logins', 'Oracle Disk Sorts', 'Oracle Table Scans',
    'Oracle User Calls', 'Oracle User Commits', 'Oracle User Rollbacks', 'Oracle Enqueue Timeouts',
  ],
  grids: [
    { title: 'Top Oracle Database Summary', columns: ['MONITOR', 'USED BYTES', 'ALLOCATED BYTES', 'OCCUPIED BYTES', 'FREE BYTES'] },
    { title: 'Top Oracle Sorts Summary', columns: ['MONITOR', 'ROW SORTS', 'MEMORY SORTS', 'DISK SORTS'] },
    { title: 'Top Oracle SQL Cache Hit Ratio', columns: ['MONITOR', 'ORACLE SQL CACHE HIT RATIO'] },
  ],
  actionMenuChecks: [
    { title: 'Top Oracle Database Summary', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},

{
  dashboardId: '10000000001022',
  dashboardTitle: 'PostgreSQL Overview',
  widgetPresence: [
    'Top PostgreSQL by Active Connections', 'Top PostgreSQL Work Memory', 'Top PostgreSQL Row Summary',
    'PostgreSQL Block Hits/s', 'Top PostgreSQL Buffers Summary', 'Top PostgreSQL Queries',
    'Top PostgreSQL Temporary Bytes', 'Top PostgreSQL Commits & Rollbacks',
    'Requested vs Scheduled Checkpoints', 'PostgreSQL Connection Used', 'Top PostgreSQL Locks',
    'PostgreSQL Work Memory Bytes', 'Postgresql Severity Count',
  ],
  trendCharts: [
    'PostgreSQL Block Hits/s', 'Requested vs Scheduled Checkpoints',
    'PostgreSQL Connection Used', 'PostgreSQL Work Memory Bytes',
  ],
  grids: [
    { title: 'Top PostgreSQL by Active Connections', columns: ['MONITOR', 'POSTGRESQL ACTIVE CONNECTIONS'] },
    { title: 'Top PostgreSQL Work Memory', columns: ['MONITOR', 'WORK MEMORY BYTES'] },
    { title: 'Top PostgreSQL Row Summary', columns: ['MONITOR', 'INSERTED ROWS/S', 'UPDATED ROW/S', 'DELETED ROWS/S'] },
    { title: 'Top PostgreSQL Buffers Summary', columns: ['MONITOR', 'ALLOCATED BUFFERS', 'CHECKPOINT BUFFERS', 'BACKEND BUFFERS', 'BACKEND FSYNC BUFFERS'] },
    { title: 'Top PostgreSQL Queries', columns: ['MONITOR', 'ACTIVE QUERIES', 'WAITING QUERIES'] },
    { title: 'Top PostgreSQL Temporary Bytes', columns: ['MONITOR', 'TEMP BYTES'] },
    { title: 'Top PostgreSQL Commits & Rollbacks', columns: ['MONITOR', 'COMMITS/S', 'ROLLBACKS/S'] },
    { title: 'Top PostgreSQL Locks', columns: ['MONITOR', 'HELD LOCKS', 'WAIT LOCKS'] },
  ],
  actionMenuChecks: [
    { title: 'Top PostgreSQL by Active Connections', kind: 'grid', fullScreen: true, exportCsv: true },
  ],
},
]);
