# Monitors Automation

Per-device **monitor** dashboards (reached from the Monitors menu). Organized to keep
coverage data-driven and easy to maintain. (Previously `tests/Dashboard`; the `tests/Dashboard`
name now hosts the default/system feature-dashboard suite.)

## Structure

- `tests/Monitors/_core`
  Shared authentication, constants, and dashboard assertion helpers
- `tests/Monitors/_data`
  Device catalog and expected dashboard metadata
- `tests/Monitors/01-ServerAndApps`
  Linux and Windows dashboard coverage
- `tests/Monitors/02-Network`
  Network dashboard coverage
- `tests/Monitors/03-Virtualization`
  vCenter, ESXi, and Proxmox dashboard coverage
- `tests/Monitors/04-Database`
  Database dashboard coverage
- `tests/Monitors/05-ServiceCheck`
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
npm run test:monitors:list
npm run test:monitors
```
