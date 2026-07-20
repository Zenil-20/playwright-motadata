---
screen: System Settings · Backup Profiles
module: Settings
category: system-settings
route: "/settings/system-settings/backup-profiles"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_backup_profiles.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · Backup Profiles

## 1. Purpose
Manages **Backup Profiles** — scheduled jobs that back up the platform's configuration/data to a chosen
destination on a defined schedule. Each row shows the profile type, destination, schedule, last result,
and an enable/disable status.

- **Business objective:** protect the deployment by scheduling regular backups to an internal/external
  destination so config and data can be restored after failure.
- **Screen description:** a list/grid under `Settings → System Settings → Backup Profiles` with a per-row
  enable **ON/OFF** switch, a show/hide-columns control, and per-row actions; a "start-rediscovery"-style
  action id is present (likely a run/trigger control).
- **Primary use cases:** create/edit a backup profile, enable/disable a profile, review the last backup
  Result, trigger a run, search the list.
- **Who uses it:** administrators.
- **Dependencies:** a valid backup **destination** (possibly an External Storage Profile); sufficient disk
  at the destination; the datastore/config services being in a backable state.

## 2. Navigation
```
Settings → System Settings → Backup Profiles
```
- **Breadcrumb:** Settings › System Settings › Backup Profiles
- **URL:** `/settings/system-settings/backup-profiles`

## 3. Actions
- Enable/disable a profile — per-row **ON/OFF** switch (2 switches captured)
- **Show/Hide Columns** — `#btn-show-hide-columns`
- Trigger a run / rediscovery-style action — `#start-rediscovery` (confirm exact semantics)
- **Search** the grid — `input[name="search-rpe"]` (placeholder "Search")
- Per-row **Actions** (edit / delete / run) — `[data-cy='grid-action']`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-rpe"]` (placeholder "Search") |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Run / trigger | `#start-rediscovery` (id reused from the rediscovery pattern — confirm meaning) |
| Enable toggle (per row) | ant-switch ON/OFF (2 captured) |
| Grid | columns below |
| Row actions | `[data-cy='grid-action']` |

**Grid columns:** Backup Profile Name · Profile Type · Backup Destination · Schedule Type · Result ·
Backup Profile Status · Actions

> The **create/edit form** (name, profile type, destination, schedule) was not captured by the list-state
> sweep. There is **no explicit "Create" button** in the catalog for this screen — confirm how a new
> profile is added (a create button may live in the grid toolbar not captured, or via row actions).
> TODO(source: KG/docs).

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Backup Profiles)._

## 5. Permissions
- **Administrators** manage backup profiles (global, high-impact).
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- A backup destination is available (internal path or an External Storage Profile) to create a usable
  profile.

## 7. Exit Conditions
- **On Create/Save (success):** success toast; profile appears/updates in the grid.
- **On enable toggle:** Backup Profile Status flips ON/OFF.
- **On run:** the **Result** column reflects success/failure of the last backup.

## 8. Validations
- **Backup Profile Name** — likely required/unique. TODO(source: docs).
- **Backup Destination** and **Schedule Type** — required to run. TODO(source: docs).
- TODO(source: docs) — destination reachability/credential checks.

## 9. Business Rules
- A disabled (OFF) profile does not run on schedule.
- **Backup Destination** may reference an **External Storage Profile** (System Settings) — implies that
  profile must exist first for remote destinations. TODO(source: KG/docs) — confirm the link.
- TODO(source: KG/docs) — retention of backup artifacts; whether restore is performed here or elsewhere
  (KB notes UI restore was delivered in 8.2.0).

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (HA/Upgrade/Backup, section 2):
- **Backup/restore mistakes destroy installs** (PQD-30741, PQD-40534, PQD-38990) — e.g. a ConfigDB backup
  unzipped straight into `/motadata/motadata/` overwrote VERSION/license/config; restoring an old VM
  snapshot left the datastore version-incompatible. Workaround: follow the documented restore procedure;
  **UI-based config restore was delivered in 8.2.0.**
Verify against build 8.2.6.

## 11. Edge Cases
- Unreachable/full backup destination → Result = failure.
- Enable a profile with an incomplete destination/schedule.
- Overlapping schedules / two profiles to the same destination.
- Very large backup vs. destination capacity (disk-full class, KB section 3).
- Restore path mistakes (unzip into install dir; old snapshot) — see Known Bugs.
- Deleting a profile mid-run.
