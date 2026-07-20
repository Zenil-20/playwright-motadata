/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-13
 *
 * "Cloud" category default/system dashboards: AWS Cloud, Azure Cloud. Widget
 * titles verified live on 172.16.15.68 (build 8.2.6).
 *
 * AWS Cloud: 5 metric tiles are populated (EC2 Instances, EBS Volumes, Service
 * Cost, Billing Forecast, S3 Bucket Objects); the rest are empty on this env or
 * unknown-kind (heatmap/donut, no precise helper) — presence-only.
 *
 * Azure Cloud: every widget is currently EMPTY on this environment (no Azure
 * monitors configured) — presence-only. "Metric Analysis" is a duplicate,
 * non-unique title on Azure Cloud — excluded (widgetByTitle requires count()===1).
 */

import { createDashboardCategorySuite } from '../_core/dashboard.suiteFactory.js';

createDashboardCategorySuite('Cloud', [
{
  dashboardId: '10000000001023',
  dashboardTitle: 'AWS Cloud',
  widgetPresence: [
    'AWS EBS Write Bytes per Second', 'Top EC2 Instance by CPU Usage',
    'Top AWS EC2 by Network Bytes per Sec.', 'Top AWS S3 Bucket by Size',
    'AWS EC2 Instances', 'AWS EBS Volumes', 'AWS Health Overview',
    'AWS Cloud Alert Overview', 'AWS EBS IOPS', 'AWS EBS Read Bytes per Second',
    'AWS RDS Disk IO Latency', 'AWS Service Cost', 'AWS Billing Forecast',
    'AWS RDS Instances', 'AWS S3 Bucket Objects', 'Top S3 Buckets by Requests',
    'Top EBS Volumes by Latency', 'Top RDS Instance by Database Connections',
    'Top RDS by Storage Free Bytes', 'RDS Disk IO Operations/s',
  ],
  metricTiles: [
    'AWS EC2 Instances', 'AWS EBS Volumes', 'AWS Service Cost',
    'AWS Billing Forecast', 'AWS S3 Bucket Objects',
  ],
  actionMenuChecks: [
    { title: 'AWS EC2 Instances', kind: 'tile' },
  ],
},

{
  dashboardId: '10000000001007',
  dashboardTitle: 'Azure Cloud',
  widgetPresence: [
    'Azure VM Count', 'Azure SQL Databases', 'Azure Cloud Health Summary',
    'Azure Cloud Alert Summary', 'Top Azure VM by CPU Percent', 'Azure Storage Transactions',
    'Azure MySQL Active Connections', 'Azure PostgreSQL Active Connections', 'Azure Billing Amount',
    'Azure Service Usage Amount', 'Azure Storage Accounts', 'Azure Web Apps',
    'Azure VM Network Received Bytes per Sec.', 'Azure VM Disk IO Write Ops/s',
    'Azure Storage Summary', 'Azure Blob Storage Latency', 'Azure PostgreSQL Server CPU Percent',
    'Azure MySQL Server CPU Percent',
  ],
},
]);
