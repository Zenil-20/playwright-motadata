---
screen: System Settings · DNS Server Profiles
module: Settings
category: system-settings
route: "/settings/system-settings/dns-server-profiles"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_dns_server_profiles.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · DNS Server Profiles

## 1. Purpose
Manages reusable **DNS Server Profiles** — named pointers to specific DNS servers (IP + port + type) that
the appliance can query. Profiles are referenced elsewhere (e.g. discovery/name-resolution) and track how
many objects use them and when they last synced.

- **Business objective:** let admins define which DNS server(s) the platform resolves names against and
  reuse those definitions across the product instead of hard-coding a resolver.
- **Screen description:** a list/grid under `Settings → System Settings → DNS Server Profiles` with a
  **Create DNS Server Profile** action and per-row actions.
- **Primary use cases:** create/edit/delete a DNS profile, review Used Count and Last Sync At, search
  the list.
- **Who uses it:** administrators.
- **Dependencies:** reachable DNS server(s); the profile's IP/port/type must be correct for lookups.

## 2. Navigation
```
Settings → System Settings → DNS Server Profiles
```
- **Breadcrumb:** Settings › System Settings › DNS Server Profiles
- **URL:** `/settings/system-settings/dns-server-profiles`

## 3. Actions
- **Create DNS Server Profile** — `#btn-create-dns-server` (opens a create form/drawer)
- **Search** the grid — `input[name="dns-server-search"]` (placeholder "Search")
- Per-row **Actions** (edit / delete / etc.) — `[data-cy='grid-action']`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="dns-server-search"]` (placeholder "Search") |
| Create DNS Server Profile | `#btn-create-dns-server` |
| Grid | columns below |
| Row actions | `[data-cy='grid-action']` |

**Grid columns:** DNS Server Profile Name · Description · DNS Server IP · Port · Type · Used Count ·
Last Sync At · Actions

> The **create/edit form fields** (name, description, IP, port, type) were not captured by the
> list-state sweep — confirm the exact inputs live or via the KG before writing a create test.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > DNS Server Profiles)._

## 5. Permissions
- **Administrators** manage DNS profiles (global setting).
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- The grid loads existing profiles (empty state on a fresh install).

## 7. Exit Conditions
- **On Create (success):** success toast; the new profile appears as a grid row.
- **On Delete:** row removed. TODO(source: docs) — blocked when **Used Count > 0**?
- **On Edit/Save:** row reflects updated values; Last Sync At may update on next sync.

## 8. Validations
- **DNS Server Profile Name** — likely required and unique. TODO(source: docs) — confirm uniqueness.
- **DNS Server IP** — valid IP. **Port** — numeric (DNS default 53). TODO(source: docs).
- **Type** — enumerated (e.g. Primary/Secondary or record type). TODO(source: docs).

## 9. Business Rules
- **Used Count** reflects how many objects reference the profile — deleting an in-use profile is likely
  restricted. TODO(source: KG/docs) — confirm delete-guard behaviour.
- **Last Sync At** implies the appliance periodically syncs/validates against the DNS server.
  TODO(source: KG/docs) — sync cadence and what "sync" does.
- TODO(source: KG/docs) — where DNS profiles are consumed (discovery name resolution, service checks?).

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`.

## 11. Edge Cases
- Duplicate profile name; invalid IP or port.
- Deleting a profile with **Used Count > 0**.
- Unreachable DNS server → Last Sync At stale / failure indication.
- Very long name/description; special characters.
- Search returning no rows; large number of profiles (paging).
