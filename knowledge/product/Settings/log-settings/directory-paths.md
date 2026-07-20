---
screen: Log Settings · directory-paths
module: Settings
category: log-settings
route: "/settings/log-settings/directory-paths"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_log_settings_directory_paths.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Log Settings · Directory Paths

## 1. Purpose
Defines **which file/directory paths on monitored hosts the log collector reads logs from**, mapped
per application. Each row ties an **Application** to a **Log Path Directory** so the agent/collector
knows where an application's log files live (e.g. an app → `/var/log/<app>`), which in turn drives
what gets ingested, parsed and made searchable.

- **Business objective:** point Motadata at the right on-disk log locations so file-based log
  collection captures the intended application logs — no manual per-host configuration.
- **Screen description:** a searchable grid (**Application · Log Path Directory · Actions**) with a
  single primary action **Create Log Directory Path**.
- **Primary use cases:** register a new application→path mapping, edit/delete an existing one,
  search the list.
- **Who uses it:** log/platform administrators. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** agent/collector installed on the host · the application defined in the platform ·
  read access to the target path on the host OS.

> **Screenshot note:** `knowledge/screenshots/File-Directory settings.png` looks similar but is a
> **different** screen — Monitor Settings → File/Directory Settings (columns PATH/TYPE/OS TYPE,
> button "Create File/Directory List"). It was **not** used to author this doc.

## 2. Navigation
```
Settings → Log Settings → Directory Paths
```
- **Breadcrumb:** Settings › Log Settings › Directory Paths
- **URL:** `/settings/log-settings/directory-paths` (SPA route; open the full URL).

## 3. Actions
- **Create Log Directory Path** — open the create form for an Application→Log Path Directory mapping.
- **Search** — free-text filter over the grid (placeholder _Search_).
- **Per-row Actions** — edit / delete a mapping (Actions column). TODO(source: KG/docs) — exact menu.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | two unnamed _Search_ text inputs (no id/name captured) |
| Grid | columns **Application · Log Path Directory · Actions** |
| Create Log Directory Path | button (no id captured — resolve live before automating) |

_Locators: raw sweep in `knowledge/locators/catalog/settings_log_settings_directory_paths.json`;
promote verified ones into the cookbook. No `buttonIds`/`dataCy` were captured — the Create button
and row actions need a live harvest (motadata-explorer) before use in a spec._

## 5. Permissions
- Configuration screen — expected **Admin / log-admin** to create/edit; others read-only.
  TODO(source: KG/docs) — exact RBAC + log-module license gate.

## 6. Entry Conditions
- Logged in; Log Settings reachable; log ingestion licensed/enabled.
- To be useful, at least one host with an agent/collector and a defined application. TODO(source:
  docs) — confirm whether paths are OS-typed (Linux/Windows) as the sibling File/Directory screen is.

## 7. Exit Conditions
- **On create (success):** a new Application→Log Path Directory row appears in the grid; expected
  success toast. TODO(source: docs) — confirm toast + whether collection re-provisions immediately.
- **On delete:** row removed; TODO(source: docs) — effect on already-collected logs.

## 8. Validations
- **Application** — required; likely a picker of existing applications. TODO(source: docs).
- **Log Path Directory** — required; a filesystem path. TODO(source: docs) — path-format validation
  (absolute path, OS-specific separators, existence check on the host, wildcards allowed?).
- Uniqueness of Application+Path — TODO(source: KG).

## 9. Business Rules
- A directory-path mapping tells the collector **where** to read; it complements Log Inventory
  (which source) and Log Parsers (how to parse). TODO(source: KG) — confirm whether a path can map
  to multiple applications, and how Directory vs File type is chosen (the sibling Monitor
  File/Directory screen distinguishes Directory vs File + OS Type).
- TODO(source: KG/docs) — defaults, per-OS handling, path limits, recursion into sub-directories.

## 10. Known Bugs
None recorded for this screen in `customer-issue-kb.md`.
> Related log-pipeline defects (parser assignment, logs to "Others") are tracked on Log Inventory /
> Log Parsers (KB §7), not on directory-path configuration specifically. Do not invent bugs.

## 11. Edge Cases
- Non-existent / unreadable path on the host.
- Windows vs Linux path separators; UNC paths; trailing slash.
- Wildcard / glob patterns in the path (if supported).
- Duplicate Application→Path mapping.
- Very long path; path with spaces/Unicode.
- Path pointing at a rotated/rolling log file vs a directory of files.
- Deleting a mapping that is actively collecting.
