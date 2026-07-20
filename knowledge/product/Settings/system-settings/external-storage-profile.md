---
screen: System Settings · External Storage Profile
module: Settings
category: system-settings
route: "/settings/system-settings/external-storage-profile"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_external_storage_profile.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · External Storage Profile

## 1. Purpose
Manages **External Storage Profiles** — named definitions of an off-box storage destination (e.g. a
network share / remote target) that the platform can write to, most notably as a **backup destination**.
Each row tracks how many objects use it and where it points.

- **Business objective:** let admins register reusable external storage targets so backups (and any other
  export) can be sent off the appliance for durability.
- **Screen description:** a list/grid under `Settings → System Settings → External Storage Profile` with a
  **Create Storage Profile** action and per-row actions.
- **Primary use cases:** create/edit/delete a storage profile, review Used Count and Storage Destination,
  search the list.
- **Who uses it:** administrators.
- **Dependencies:** a reachable external storage target with valid credentials/path; consumed by Backup
  Profiles (and possibly other export features).

## 2. Navigation
```
Settings → System Settings → External Storage Profile
```
- **Breadcrumb:** Settings › System Settings › External Storage Profile
- **URL:** `/settings/system-settings/external-storage-profile`

## 3. Actions
- **Create Storage Profile** — `#create-storage-btn` (opens a create form/drawer)
- **Search** the grid — `input[name="storage-search"]` (placeholder "Search")
- Per-row **Actions** (edit / delete) — `[data-cy='grid-action']`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="storage-search"]` (placeholder "Search") |
| Create Storage Profile | `#create-storage-btn` |
| Grid | columns below |
| Row actions | `[data-cy='grid-action']` |

**Grid columns:** Storage Profile Name · Used Count · Storage Destination · Actions

> The **create/edit form fields** (name, storage type/protocol, host/path, credentials) were not captured
> by the list-state sweep. Confirm the exact inputs and supported protocols live or via the KG before
> writing a create test.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > External Storage Profile)._

## 5. Permissions
- **Administrators** manage storage profiles (global setting).
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- Grid loads existing profiles (empty on fresh install).

## 7. Exit Conditions
- **On Create (success):** success toast; new profile appears as a grid row.
- **On Delete:** row removed. TODO(source: docs) — blocked when **Used Count > 0**?
- **On Edit/Save:** row reflects updated destination.

## 8. Validations
- **Storage Profile Name** — likely required/unique. TODO(source: docs).
- **Storage Destination** (host/path/credentials) — required and reachable. TODO(source: docs) — which
  protocols (SMB/NFS/FTP/S3…) are supported and how they are validated.

## 9. Business Rules
- **Used Count** reflects references (e.g. by Backup Profiles) — deleting an in-use profile is likely
  restricted. TODO(source: KG/docs) — confirm delete-guard.
- Storage profiles are the off-box destination that **Backup Profiles** point at. TODO(source: KG/docs) —
  confirm the exact consumer relationship.

## 10. Known Bugs
None recorded specifically for this screen in `knowledge/known_issues/customer-issue-kb.md`. (Related:
backup/restore destination mistakes — section 2 — are documented against Backup Profiles, not the storage
profile definition itself.)

## 11. Edge Cases
- Duplicate profile name; invalid host/path/credentials.
- Deleting a profile with **Used Count > 0** (in use by a backup).
- Unreachable target / full destination at backup time.
- Wrong protocol/port; permission-denied on the share.
- Very long name/path; special characters in credentials.
