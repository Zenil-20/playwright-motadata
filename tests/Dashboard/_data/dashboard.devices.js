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

function firstDefinedValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function createOverviewScreen(expectedSections) {
  return {
    tab: 'Overview',
    expectedSections,
  };
}

function createMetricExplorerScreen(extraTexts = []) {
  return {
    tab: 'Metric Explorer',
    allowEmptyState: true,
    expectedTexts: [
      'Save View',
      'Metric',
      'Saved View',
      ...extraTexts,
    ],
  };
}

function createActivePoliciesScreen() {
  return {
    tab: 'Configured Policy',
    allowEmptyState: true,
  };
}

export const dashboardCatalog = {
  serverAndApps: [
    {
      id: 'linux-ubuntu8165',
      deviceName: envValue('DASHBOARD_LINUX_NAME', 'rhel-7.5'),
      searchTerm: firstDefinedValue(
        process.env.DASHBOARD_LINUX_SEARCH,
        envValue('DASHBOARD_LINUX_NAME', 'rhel-7.5')
      ),
      ipAddress: firstDefinedValue(
        process.env.DASHBOARD_LINUX_IP,
        process.env.DASHBOARD_LINUX_SEARCH,
        envValue('DASHBOARD_LINUX_NAME', 'rhel-7.5')
      ),
      listingPath: envValue('DASHBOARD_LINUX_LISTING', '/inventory/Server/groups'),
      monitorPath: process.env.DASHBOARD_LINUX_MONITOR_PATH,
      rowTokens: [
        envValue('DASHBOARD_LINUX_NAME', 'rhel-7.5'),
        'Linux',
      ],
      identityTokens: ['Linux', 'Server'],
      expectedTabs: ['Overview', 'Active Process', 'Services', 'Installed Software', 'Metric Explorer', 'Active Alerts', 'Configured Policy'],
      expectedSections: [],
      expectedWidgets: [],
      screenAssertions: [
        { tab: 'Overview', allowEmptyState: true },
        {
          tab: 'Active Process',
          expectedTexts: ['PROCESS ID', 'PROCESS NAME', 'USER NAME'],
        },
        {
          tab: 'Services',
          expectedTexts: ['SERVICE NAME', 'START TYPE', 'STATUS'],
        },
        createMetricExplorerScreen(['Drop metric here to view trend']),
        createActivePoliciesScreen(),
      ],
    },
    {
      id: 'windows-server',
      deviceName: envValue('DASHBOARD_WINDOWS_NAME', 'WIN-4PJMESL4SHA'),
      searchTerm: envValue('DASHBOARD_WINDOWS_SEARCH', 'WIN-4PJMESL4SHA'),
      listingPath: envValue('DASHBOARD_WINDOWS_LISTING', '/inventory/Server/groups'),
      identityTokens: ['Windows', 'Server'],
      allowDashboardEmptyState: true,
      expectedTabs: ['Overview', 'Active Process', 'Services', 'Metric Explorer', 'Configured Policy'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
        'System Disk Utilization',
        'CPU Details',
        'Memory Details',
      ],
      expectedWidgets: [
        { title: 'CPU', valueType: 'percent', allowPlaceholder: true },
        { title: 'Memory', valueType: 'percent', allowPlaceholder: true },
        { title: 'Disk', valueType: 'percent', allowPlaceholder: true },
        { title: 'Network', valueType: 'traffic', allowPlaceholder: true },
        { title: 'Response Time', valueType: 'time', allowPlaceholder: true },
      ],
      screenAssertions: [
        {
          tab: 'Overview',
          allowEmptyState: true,
          expectedSections: [
            "Today's Availability",
            'Availability Statistics',
            'System Disk Utilization',
            'CPU Details',
            'Memory Details',
          ],
        },
        {
          tab: 'Active Process',
          allowEmptyState: true,
        },
        {
          tab: 'Services',
          allowEmptyState: true,
        },
        createMetricExplorerScreen(['Drop metric here to view trend']),
        createActivePoliciesScreen(),
      ],
    },
  ],
  network: [
    {
      id: 'network-wireless',
      deviceName: envValue('DASHBOARD_NETWORK_NAME', 'CISCO-WLC'),
      searchTerm: envValue('DASHBOARD_NETWORK_SEARCH', 'CISCO-WLC'),
      listingPath: envValue('DASHBOARD_NETWORK_LISTING', '/inventory/Network/groups'),
      monitorPath: process.env.DASHBOARD_NETWORK_MONITOR_PATH,
      identityTokens: ['Wireless'],
      allowDashboardEmptyState: true,
      expectedTabs: ['Overview', 'Metric Explorer', 'Configured Policy'],
      expectedSections: [
        "Today's Availability",
        'Availability Statistics',
      ],
      expectedWidgets: [],
      screenAssertions: [
        { tab: 'Overview', allowEmptyState: true },
        createMetricExplorerScreen(['Drop metric here to view trend']),
        createActivePoliciesScreen(),
      ],
    },
  ],
  virtualization: [
    {
      id: 'vcenter',
      deviceName: firstDefinedValue(
        process.env.DASHBOARD_VCENTER_NAME,
        process.env.vCenter_Server_172_16_10_180
      ),
      searchTerm: firstDefinedValue(
        process.env.DASHBOARD_VCENTER_SEARCH,
        process.env.DASHBOARD_VCENTER_NAME,
        process.env.vCenter_Server_172_16_10_180
      ),
      listingPath: envValue('DASHBOARD_VCENTER_LISTING', '/inventory/Virtualization/groups'),
      monitorPath: process.env.DASHBOARD_VCENTER_MONITOR_PATH,
      identityTokens: ['vCenter', 'Virtualization'],
      expectedTabs: ['Overview', 'Cluster', 'ESXi Host', 'Virtual Machine', 'Metric Explorer', 'Configured Policy'],
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
      screenAssertions: [
        createOverviewScreen([
          "Today's Availability",
          'Availability Statistics',
          'DataStore Utilization',
          'CPU Utilization',
          'Memory Utilization',
        ]),
        {
          tab: 'Cluster',
          allowEmptyState: true,
          expectedTexts: ['Cluster'],
        },
        {
          tab: 'ESXi Host',
          allowEmptyState: true,
          expectedTexts: ['ESXi'],
        },
        {
          tab: 'Virtual Machine',
          allowEmptyState: true,
          expectedTexts: ['Virtual Machine'],
        },
        createMetricExplorerScreen(['Drop metric here to view trend']),
        createActivePoliciesScreen(),
      ],
    },
    {
      id: 'esxi',
      deviceName: envValue('DASHBOARD_ESXI_NAME', 'esxi18.motadata.local'),
      searchTerm: envValue('DASHBOARD_ESXI_SEARCH', 'esxi18.motadata.local'),
      listingPath: envValue('DASHBOARD_ESXI_LISTING', '/inventory/Virtualization/groups'),
      identityTokens: ['VMware ESXi', 'esxi'],
      expectedTabs: ['Overview', 'Datastore', 'Network'],
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
      screenAssertions: [
        createOverviewScreen([
          "Today's Availability",
          'Availability Statistics',
          'Datastore Utilization',
          'CPU Utilization',
          'Memory Utilization',
          'Network Traffic Utilization',
        ]),
        {
          tab: 'Datastore',
          allowEmptyState: true,
          expectedTexts: ['Datastore'],
        },
        {
          tab: 'Network',
          allowEmptyState: true,
          expectedTexts: ['Network'],
        },
        {
          tab: 'Storage Adapters',
          allowEmptyState: true,
          expectedTexts: ['Storage'],
        },
        {
          tab: 'Hardware Sensor',
          allowEmptyState: true,
          expectedTexts: ['Sensor'],
        },
        createMetricExplorerScreen(['Drop metric here to view trend']),
        createActivePoliciesScreen(),
      ],
    },
    ...(process.env.DASHBOARD_PROXMOX_NAME
      ? [{
          id: 'proxmox',
          deviceName: process.env.DASHBOARD_PROXMOX_NAME,
          searchTerm: envValue('DASHBOARD_PROXMOX_SEARCH', 'Proxmox VE'),
          listingPath: envValue('DASHBOARD_PROXMOX_LISTING', '/inventory/All'),
          rowTokens: [
            process.env.DASHBOARD_PROXMOX_NAME,
            firstDefinedValue(
              process.env.DASHBOARD_PROXMOX_IP,
              process.env.Proxmox_ip,
              process.env.DASHBOARD_PROXMOX_NAME
            ),
            'Proxmox VE',
          ],
          identityTokens: ['Proxmox VE', 'proxmox'],
          expectedTabs: ['Overview', 'Storage Pool', 'Disk', 'Interface', 'Metric Explorer', 'Configured Policy'],
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
          screenAssertions: [
            createOverviewScreen([
              "Today's Availability",
              'Availability Statistics',
              'CPU Utilization',
              'Memory Utilization',
              'Root FS Disk Utilization',
            ]),
            {
              tab: 'Storage Pool',
              allowEmptyState: true,
              expectedTexts: ['Storage'],
            },
            {
              tab: 'Disk',
              allowEmptyState: true,
              expectedTexts: ['Disk'],
            },
            {
              tab: 'Interface',
              allowEmptyState: true,
              expectedTexts: ['Interface'],
            },
            createMetricExplorerScreen(['Drop metric here to view trend']),
            createActivePoliciesScreen(),
          ],
        }]
      : []),
  ],
  database: [
    {
      id: 'elasticsearch',
      deviceName: envValue('DASHBOARD_DATABASE_NAME', 'motadata101'),
      searchTerm: envValue('DASHBOARD_DATABASE_SEARCH', 'motadata101'),
      listingPath: envValue('DASHBOARD_DATABASE_LISTING', '/inventory/Database/groups'),
      monitorPath: process.env.DASHBOARD_DATABASE_MONITOR_PATH,
      identityTokens: ['Elasticsearch', 'Database'],
      expectedTabs: ['Overview', 'Memory', 'I/O Details', 'Network'],
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
      screenAssertions: [
        createOverviewScreen([
          "Today's Availability",
          'Availability Statistics',
          'CPU Utilization',
          'Search Time',
          'Segment Time',
        ]),
        {
          tab: 'Memory',
          allowEmptyState: true,
          expectedTexts: ['Heap', 'Memory'],
        },
        {
          tab: 'I/O Details',
          allowEmptyState: true,
          expectedTexts: ['I/O'],
        },
        {
          tab: 'Network',
          allowEmptyState: true,
          expectedTexts: ['Network'],
        },
        {
          tab: 'Thread Details',
          allowEmptyState: true,
          expectedTexts: ['Thread'],
        },
        createMetricExplorerScreen(['Drop metric here to view trend']),
        createActivePoliciesScreen(),
      ],
    },
  ],
  serviceCheck: [
    ...(firstDefinedValue(
      process.env.DASHBOARD_SERVICECHECK_URL_NAME,
      process.env.DASHBOARD_SERVICECHECK_URL_SEARCH
    )
      ? [{
          id: 'service-check-url',
          deviceName: firstDefinedValue(
            process.env.DASHBOARD_SERVICECHECK_URL_NAME,
            process.env.DASHBOARD_SERVICECHECK_URL_SEARCH
          ),
          searchTerm: firstDefinedValue(
            process.env.DASHBOARD_SERVICECHECK_URL_SEARCH,
            process.env.DASHBOARD_SERVICECHECK_URL_NAME
          ),
          listingPath: envValue('DASHBOARD_SERVICECHECK_LISTING', '/inventory/All'),
          monitorPath: process.env.DASHBOARD_SERVICECHECK_URL_MONITOR_PATH,
          rowTokens: [
            firstDefinedValue(
              process.env.DASHBOARD_SERVICECHECK_URL_NAME,
              process.env.DASHBOARD_SERVICECHECK_URL_SEARCH
            ),
            'FTP',
            'Service Check',
          ],
          identityTokens: ['FTP', 'Service Check'],
          expectedTabs: ['Overview', 'Metric Explorer', 'Configured Policy'],
          expectedSections: [],
          expectedWidgets: [],
          screenAssertions: [
            {
              tab: 'Overview',
              allowEmptyState: true,
            },
            createMetricExplorerScreen(['Drop metric here to view trend']),
            createActivePoliciesScreen(),
          ],
        }]
      : []),
    ...(process.env.DASHBOARD_SERVICECHECK_DNS_MONITOR_PATH
      ? [{
          id: 'service-check-dns',
          deviceName: firstDefinedValue(
            process.env.DASHBOARD_SERVICECHECK_DNS_NAME,
            process.env.DASHBOARD_SERVICECHECK_DNS_SEARCH
          ),
          searchTerm: firstDefinedValue(
            process.env.DASHBOARD_SERVICECHECK_DNS_SEARCH,
            process.env.DASHBOARD_SERVICECHECK_DNS_NAME
          ),
          listingPath: envValue('DASHBOARD_SERVICECHECK_LISTING', '/inventory/All'),
          monitorPath: process.env.DASHBOARD_SERVICECHECK_DNS_MONITOR_PATH,
          rowTokens: [
            firstDefinedValue(
              process.env.DASHBOARD_SERVICECHECK_DNS_NAME,
              process.env.DASHBOARD_SERVICECHECK_DNS_SEARCH
            ),
            'DNS',
            'Service Check',
          ],
          identityTokens: ['DNS', 'Service Check'],
          expectedTabs: ['Overview', 'Metric Explorer', 'Configured Policy'],
          expectedSections: [
            "Today's Availability",
            'Availability Statistics',
            'DNS Latency and Lookup Time',
          ],
          expectedWidgets: [],
          screenAssertions: [
            createOverviewScreen([
              "Today's Availability",
              'Availability Statistics',
              'DNS Latency and Lookup Time',
            ]),
            createMetricExplorerScreen(['Drop metric here to view trend']),
            createActivePoliciesScreen(),
          ],
        }]
      : []),
    ...(process.env.DASHBOARD_SERVICECHECK_EMAIL_MONITOR_PATH
      ? [{
          id: 'service-check-email',
          deviceName: envValue('DASHBOARD_SERVICECHECK_EMAIL_NAME', 'smtp.gmail.com'),
          searchTerm: envValue('DASHBOARD_SERVICECHECK_EMAIL_SEARCH', 'smtp.gmail.com'),
          listingPath: envValue('DASHBOARD_SERVICECHECK_LISTING', '/inventory/All'),
          monitorPath: process.env.DASHBOARD_SERVICECHECK_EMAIL_MONITOR_PATH,
          rowTokens: [
            envValue('DASHBOARD_SERVICECHECK_EMAIL_NAME', 'smtp.gmail.com'),
            'Email',
            'Service Check',
          ],
          identityTokens: ['Email', 'Service Check'],
          expectedTabs: ['Overview', 'Metric Explorer', 'Configured Policy'],
          expectedSections: [
            "Today's Availability",
            'Availability Statistics',
            'Email Response Time and Connection Time',
            'Email Details',
          ],
          expectedWidgets: [],
          screenAssertions: [
            createOverviewScreen([
              "Today's Availability",
              'Availability Statistics',
              'Email Response Time and Connection Time',
              'Email Details',
            ]),
            createMetricExplorerScreen(['Drop metric here to view trend']),
            createActivePoliciesScreen(),
          ],
        }]
      : []),
  ],
};
