/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Dashboard inventory catalog.
 *
 * Keep this file data-only so adding a new device dashboard becomes a small,
 * low-risk change. Values can be overridden from environment variables when
 * monitor names differ between environments.
 */

function envValue(name, fallback) {
  return process.env[name] || fallback;
}

export const dashboardCatalog = {
  serverAndApps: [
    {
      id: 'linux-ubuntu8165',
      deviceName: envValue('DASHBOARD_LINUX_NAME', 'ubuntu8165'),
      searchTerm: envValue('DASHBOARD_LINUX_SEARCH', '172.16.8.165'),
      listingPath: envValue('DASHBOARD_LINUX_LISTING', '/inventory/All'),
      monitorPath: process.env.DASHBOARD_LINUX_MONITOR_PATH,
      rowTokens: [
        envValue('DASHBOARD_LINUX_NAME', 'ubuntu8165'),
        envValue('DASHBOARD_LINUX_SEARCH', '172.16.8.165'),
        'Linux',
      ],
      identityTokens: ['Linux', 'Server'],
      expectedTabs: ['Overview', 'Active Process', 'Services', 'Metric Explorer', 'Active Policies'],
      expectedSections: [],
      expectedWidgets: [],
    },
    {
      id: 'windows-server',
      deviceName: envValue('DASHBOARD_WINDOWS_NAME', 'WIN-4PJMESL4SHA'),
      searchTerm: envValue('DASHBOARD_WINDOWS_SEARCH', 'WIN-4PJMESL4SHA'),
      listingPath: envValue('DASHBOARD_WINDOWS_LISTING', '/inventory/All'),
      identityTokens: ['Windows', 'Server'],
      expectedTabs: ['Overview', 'Active Process', 'Services', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'System Disk Utilization',
        'CPU Details',
        'Memory Details',
        'Disk IOPS Details',
      ],
      expectedWidgets: [
        { title: 'CPU', valueType: 'percent' },
        { title: 'Memory', valueType: 'percent' },
        { title: 'Disk', valueType: 'percent' },
        { title: 'IOPS', valueType: 'number' },
        { title: 'Network', valueType: 'traffic' },
        { title: 'Response Time', valueType: 'time', allowPlaceholder: true },
      ],
    },
  ],
  network: [
    {
      id: 'aruba-wireless',
      deviceName: envValue('DASHBOARD_NETWORK_NAME', 'ArubaMC-VA_BB_8A_50'),
      searchTerm: envValue('DASHBOARD_NETWORK_SEARCH', 'ArubaMC-VA_BB_8A_50'),
      listingPath: envValue('DASHBOARD_NETWORK_LISTING', '/inventory/All'),
      identityTokens: ['Aruba Wireless', 'Wireless'],
      expectedTabs: ['Overview', 'Client', 'Rogue Device', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'Aruba CPU/Memory Utilization',
        'Aruba Top Clients by Packets',
        'Aruba Top Access Point Interface by Clients',
        'Aruba Top Wireless Clients by Traffic',
      ],
      expectedWidgets: [
        { title: 'Access Points', valueType: 'number' },
        { title: 'Rogues', valueType: 'number' },
        { title: 'Active Clients', valueType: 'number' },
        { title: 'WLAN', valueType: 'number' },
        { title: 'Response Time', valueType: 'time', allowPlaceholder: true },
        { title: 'Packet Lost', valueType: 'percent' },
      ],
    },
  ],
  virtualization: [
    {
      id: 'vcenter',
      deviceName: envValue('DASHBOARD_VCENTER_NAME', '172.16.10.180'),
      searchTerm: envValue('DASHBOARD_VCENTER_SEARCH', '172.16.10.180'),
      listingPath: envValue('DASHBOARD_VCENTER_LISTING', '/inventory/All'),
      identityTokens: ['vCenter', 'Virtualization'],
      expectedTabs: ['Overview', 'Cluster', 'ESXi Host', 'Virtual Machine', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'DataStore Utilization',
        'CPU Utilization',
        'Memory Utilization',
      ],
      expectedWidgets: [
        { title: 'Cluster', valueType: 'number' },
        { title: 'ESXi Host', valueType: 'number' },
        { title: 'Datastore', valueType: 'number' },
        { title: 'Virtual Machine', valueType: 'number' },
        { title: 'CPU', valueType: 'percent' },
        { title: 'Memory', valueType: 'percent' },
      ],
    },
    {
      id: 'esxi',
      deviceName: envValue('DASHBOARD_ESXI_NAME', 'esxi18.motadata.local'),
      searchTerm: envValue('DASHBOARD_ESXI_SEARCH', 'esxi18.motadata.local'),
      listingPath: envValue('DASHBOARD_ESXI_LISTING', '/inventory/All'),
      identityTokens: ['VMware ESXi', 'esxi'],
      expectedTabs: ['Overview', 'Datastore', 'Network', 'Storage Adapters', 'Hardware Sensor', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'Datastore Utilization',
        'CPU Utilization',
        'Memory Utilization',
        'Network Traffic Utilization',
      ],
      expectedWidgets: [
        { title: 'Virtual Machine', valueType: 'number' },
        { title: 'CPU', valueType: 'percent' },
        { title: 'Memory', valueType: 'percent' },
        { title: 'Swap Memory', valueType: 'bytes' },
        { title: 'Storage Details', valueType: 'bytes' },
        { title: 'Network', valueType: 'traffic' },
      ],
    },
    {
      id: 'proxmox',
      deviceName: envValue('DASHBOARD_PROXMOX_NAME', 'motadata'),
      searchTerm: envValue('DASHBOARD_PROXMOX_SEARCH', 'Proxmox VE'),
      listingPath: envValue('DASHBOARD_PROXMOX_LISTING', '/inventory/All'),
      rowTokens: [
        envValue('DASHBOARD_PROXMOX_NAME', 'motadata'),
        envValue('DASHBOARD_PROXMOX_IP', '172.16.12.117'),
        'Proxmox VE',
      ],
      identityTokens: ['Proxmox VE', 'proxmox'],
      expectedTabs: ['Overview', 'Storage Pool', 'Disk', 'Interface', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'CPU Utilization',
        'Memory Utilization',
        'Root FS Disk Utilization',
      ],
      expectedWidgets: [
        { title: 'State', valueType: 'state' },
        { title: 'CPU', valueType: 'percent' },
        { title: 'Memory', valueType: 'percent' },
        { title: 'Disk', valueType: 'percent' },
        { title: 'Swap Memory', valueType: 'percent' },
        { title: 'Network Traffic', valueType: 'traffic' },
      ],
    },
  ],
  database: [
    {
      id: 'elasticsearch',
      deviceName: envValue('DASHBOARD_DATABASE_NAME', 'motadata101'),
      searchTerm: envValue('DASHBOARD_DATABASE_SEARCH', 'motadata101'),
      listingPath: envValue('DASHBOARD_DATABASE_LISTING', '/inventory/All'),
      identityTokens: ['Elasticsearch', 'Database'],
      expectedTabs: ['Overview', 'Memory', 'I/O Details', 'Network', 'Thread Details', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'CPU Utilization',
        'Search Time',
        'Segment Time',
      ],
      expectedWidgets: [
        { title: 'CPU', valueType: 'percent' },
        { title: 'Heap Memory', valueType: 'percent' },
        { title: 'Non Heap Memory', valueType: 'percent' },
        { title: 'Disk I/O', valueType: 'bytes' },
        { title: 'Network I/O', valueType: 'bytes' },
        { title: 'Search Time', valueType: 'time' },
      ],
    },
  ],
  serviceCheck: [
    {
      id: 'service-check-url',
      deviceName: envValue('DASHBOARD_SERVICECHECK_URL_NAME', 'thronesdb.com/register/'),
      searchTerm: envValue('DASHBOARD_SERVICECHECK_URL_SEARCH', 'thronesdb.com/register/'),
      listingPath: envValue('DASHBOARD_SERVICECHECK_LISTING', '/inventory/All'),
      rowTokens: [
        envValue('DASHBOARD_SERVICECHECK_URL_NAME', 'thronesdb.com/register/'),
        'Service Check',
      ],
      identityTokens: ['URL', 'Service Check'],
      expectedTabs: ['Overview', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'URL Details',
        'Page Size',
        'Response Time',
        'Response Time Split Up',
      ],
      expectedWidgets: [],
    },
    {
      id: 'service-check-dns',
      deviceName: envValue('DASHBOARD_SERVICECHECK_DNS_NAME', '172.16.10.134'),
      searchTerm: envValue('DASHBOARD_SERVICECHECK_DNS_SEARCH', '172.16.10.134'),
      listingPath: envValue('DASHBOARD_SERVICECHECK_LISTING', '/inventory/All'),
      monitorPath: envValue(
        'DASHBOARD_SERVICECHECK_DNS_MONITOR_PATH',
        '/inventory/All/monitors/102316711015'
      ),
      rowTokens: [
        envValue('DASHBOARD_SERVICECHECK_DNS_NAME', '172.16.10.134'),
        'DNS',
        'Service Check',
      ],
      identityTokens: ['DNS', 'Service Check'],
      expectedTabs: ['Overview', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'DNS Latency and Lookup Time',
      ],
      expectedWidgets: [],
    },
    {
      id: 'service-check-email',
      deviceName: envValue('DASHBOARD_SERVICECHECK_EMAIL_NAME', 'smtp.gmail.com'),
      searchTerm: envValue('DASHBOARD_SERVICECHECK_EMAIL_SEARCH', 'smtp.gmail.com'),
      listingPath: envValue('DASHBOARD_SERVICECHECK_LISTING', '/inventory/All'),
      monitorPath: envValue(
        'DASHBOARD_SERVICECHECK_EMAIL_MONITOR_PATH',
        '/inventory/All/monitors/102316711023'
      ),
      rowTokens: [
        envValue('DASHBOARD_SERVICECHECK_EMAIL_NAME', 'smtp.gmail.com'),
        'Email',
        'Service Check',
      ],
      identityTokens: ['Email', 'Service Check'],
      expectedTabs: ['Overview', 'Metric Explorer', 'Active Policies'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'Email Response Time and Connection Time',
        'Email Details',
      ],
      expectedWidgets: [],
    },
  ],
};
