# Dashboard Automation

This suite is organized to keep dashboard coverage data-driven and easy to maintain.

## Structure

- `tests/Dashboard/_core`
  Shared authentication, constants, and dashboard assertion helpers
- `tests/Dashboard/_data`
  Device catalog and expected dashboard metadata
- `tests/Dashboard/01-ServerAndApps`
  Linux and Windows dashboard coverage
- `tests/Dashboard/02-Network`
  Network dashboard coverage
- `tests/Dashboard/03-Virtualization`
  vCenter, ESXi, and Proxmox dashboard coverage
- `tests/Dashboard/04-Database`
  Database dashboard coverage
- `tests/Dashboard/05-ServiceCheck`
  URL, DNS, and Email service-check dashboard coverage

## Design Notes

- Tests do not depend on dynamic monitor IDs.
- Navigation starts from stable inventory listing paths and searches by device name.
- Assertions are soft where possible so one missing widget does not stop the rest of the dashboard validation.
- Empty states such as `No data found` and `No record found` are checked across the page context.
- The suite logs in once per spec file to keep runs efficient.

## Environment Overrides

If a device name differs across environments, override the defaults in `.env`:

```env
DASHBOARD_LINUX_NAME=motadata8.61
DASHBOARD_WINDOWS_NAME=WIN-4PJMESL4SHA
DASHBOARD_NETWORK_NAME=ArubaMC-VA_BB_8A_50
DASHBOARD_VCENTER_NAME=172.16.10.180
DASHBOARD_ESXI_NAME=esxi18.motadata.local
DASHBOARD_PROXMOX_NAME=motadata
DASHBOARD_DATABASE_NAME=motadata101
DASHBOARD_SERVICECHECK_URL_NAME=thronesdb.com/register/
DASHBOARD_SERVICECHECK_DNS_NAME=172.16.10.134
DASHBOARD_SERVICECHECK_EMAIL_NAME=smtp.gmail.com
```

Run with:

```bash
npm run test:dashboard:list
npm run test:dashboard
```
