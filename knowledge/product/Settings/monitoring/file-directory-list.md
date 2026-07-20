---
screen: Monitoring · File/Directory Settings
module: Settings
category: monitoring
route: "/settings/monitoring/file-directory-list"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_monitoring_file_directory_list.json · screenshots/File-Directory settings.png · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Monitoring — File/Directory Settings

## 1. Purpose
The **catalog of file/directory paths to monitor** — the reference list of filesystem paths (files and
directories) that Motadata ObserveOps watches on discovered hosts (e.g. `/var/log` as a **Directory**,
`/var/log/syslog` as a **File**).

- **Business objective:** declare which filesystem paths matter (log directories, specific files) so the
  platform can monitor them (existence, size/growth, count, or change — the exact metric set is a
  monitor-side concern) per OS.
- **Screen description:** a simple searchable/filterable grid under `Settings → Monitor Settings →
  File/Directory Settings`, with columns **Path · Type · OS Type · Actions**, a **Create File/Directory
  List** primary action, PDF/CSV export icons, and a **Filter** with inline **Type** and **OS Type**
  chips. The sample environment shows 2 Linux rows (`/var/log` Directory, `/var/log/syslog` File) with a
  "1 – 2 of 2 items" pager and a 50-items-per-page selector.
- **Primary use cases:** browse configured paths; add a new file or directory path to monitor; edit or
  delete an entry; filter by Type (File/Directory) or OS Type.
- **Who uses it:** monitoring administrators. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** an authenticated session · the Monitor Settings module · OS-type reference data.

## 2. Navigation
```
Settings → Monitor Settings → File/Directory Settings
```
- **Breadcrumb:** Settings › Monitor Settings › File/Directory Settings
- **Left-nav siblings (Monitor Settings):** Device Monitor Settings · Cloud Monitor Settings · Monitor
  Templates · Agent Monitor Settings · Service Check Monitor Settings · Process Monitor Settings ·
  Service Monitor Settings · **File/Directory Settings** · SNMP Device Catalog · Rediscover Settings ·
  NetRoute Settings · Topology Scanner · Monitoring Hour · Custom Monitoring Field
- **URL:** `/settings/monitoring/file-directory-list`

## 3. Actions
- **Create File/Directory List** — open the create form to add a path (`#btn-create-file-directory`).
- **Search** — free-text over the grid (`input[name="search-file-directory-list"]`, placeholder _Search_).
- **Filter** — open the filter panel (`#filter-btn`); inline chips **Type** and **OS Type**.
- **Row Actions** — per-row `⋮` kebab (`[data-cy='grid-action']`): edit / delete. TODO(source: KG/docs) —
  confirm exact menu items.
- **Export** — PDF / CSV icon buttons left of Filter. TODO(source: KG/docs) — confirm; ids not captured
  on this screen.
- **Pagination** — pager + items-per-page (default 50) at the grid foot.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Grid search | `input[name="search-file-directory-list"]` (text, placeholder _Search_) |
| Type filter chip | inline chip above grid (File / Directory) |
| OS Type filter chip | inline chip above grid |
| Filter | `#filter-btn` |
| Create File/Directory List (primary) | `#btn-create-file-directory` |
| Row action kebab | `[data-cy='grid-action']` (per row) |
| Grid column — Path | sortable (`PATH ↑`); the filesystem path |
| Grid column — Type | File / Directory |
| Grid column — OS Type | icon per row (Linux in sample) |
| Grid column — Actions | `⋮` kebab |
| Pager | page controls + items-per-page (default 50) |

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > File/Directory Settings)._

> The **Create File/Directory List** form fields (Path, Type = File/Directory, OS Type) were **not
> captured** in the grid sweep — confirm the exact field set and control ids live or via the KG.
> TODO(source: KG/docs).

## 5. Permissions
- **Expected:** an Admin / monitoring-admin role can create, edit and delete path entries; Operator/Viewer
  likely read-only. Global monitoring configuration ⇒ write access expected to be admin-gated.
- TODO(source: KG/docs): exact RBAC matrix.

## 6. Entry Conditions
- User is logged in with a valid session.
- Settings → Monitor Settings is reachable.
- The file/directory catalog loads (may be empty; the grid then shows an empty state).

## 7. Exit Conditions
- **On Create (success):** success toast; the new path appears in the grid with its Type / OS Type; an
  audit entry is written. TODO(source: KG/docs) — confirm toast wording + audit.
- **On Edit (success):** row reflects updated values.
- **On Delete (success):** row removed after confirmation.
- **On Filter/Search:** grid narrows to matching rows; clearing restores the full list.

## 8. Validations
- **Path** — required; must be a valid absolute filesystem path for the chosen OS (POSIX `/var/log` vs a
  Windows path). TODO(source: KG/docs) — confirm per-OS path validation and whether trailing-slash /
  wildcard is allowed.
- **Type** — required; **File** or **Directory** (the `Type` column value). TODO(source: KG/docs) — confirm
  it is a two-value picker.
- **OS Type** — required; determines path syntax expectations. TODO(source: KG/docs).
- **Uniqueness** — a given Path is expected to be unique per OS Type. TODO(source: KG/docs) — confirm scope.
- Max length / inline errors: TODO(source: docs).

## 9. Business Rules
- An entry ties a **Path → Type (File/Directory) → OS Type**; the Type distinguishes a single file
  (`/var/log/syslog`) from a directory (`/var/log`), which changes what can be monitored on it.
- OS Type constrains path syntax and applicability (a Linux path applies to Linux hosts). TODO(source:
  KG/docs) — confirm enforcement and whether a Windows-style path is rejected under OS Type = Linux.
- TODO(source: KG/docs): how a catalog path becomes a live monitor, per-tenant limits, defaults, and
  which file/directory metrics (size, count, existence, growth) are collected.

## 10. Known Bugs
One customer-KB pattern is relevant to filesystem-path monitoring and per-OS command-output parsing:

- **Long filesystem / volume names break rows (wrapped-row parsing)** — per-OS command output for
  filesystem/disk-volume data mis-parsed when a name was long enough to line-wrap, breaking disk-volume
  rows. Handled in **8.2.3** ("handle wrapped rows"). (`customer-issue-kb.md` §1 — "Per-OS
  command-output parsing quirks", PQD-38371 [MOTADATA-8063].) Relevant here because long file/directory
  paths and volume names flow through the same per-OS output parsing; treat very long paths as a
  regression-sensitive case.

> This is a parsing/collection-layer defect adjacent to file/directory monitoring, not a proven defect
> of the Create form on this screen. Record any new, screen-specific defect as `version: 8.2.x · issue:
> … · workaround: …`.

## 11. Edge Cases
- **Very long path / volume name** that would line-wrap on the host command output → assert the row and
  its data parse correctly (KB §1 / 8.2.3 regression).
- Path with spaces, Unicode, or shell-special characters; trailing slash on a Directory entry.
- **Type mismatch** — register `/var/log/syslog` as **Directory** or `/var/log` as **File** (wrong Type
  for the real path).
- Windows-style path under OS Type = Linux (and vice-versa) → validation.
- Duplicate Path within the same OS Type → create blocked (if unique rule holds).
- Non-existent path on the target host → what status does the resulting monitor show?
- Deleting a path that a live monitor depends on (referential integrity).
- Filter by a Type / OS Type with zero rows; search with no matches; empty catalog state.
- Pagination with items-per-page changed vs a small (2-row) dataset.
