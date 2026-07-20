---
screen: System Settings · Motadata Collector
module: Settings
category: system-settings
route: "/settings/system-settings/motadata-collector"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_motadata_collector.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · Motadata Collector

## 1. Purpose
Provides an **inventory of the Motadata collectors** (remote poller/collector processes) registered with
the platform, showing each collector's hostname, type, deployment, IP, running state, how many monitors
it serves (Used Count), and its uptime/duration. In distributed/HA deployments, collectors are the remote
engines that poll devices and forward data back to the app/datastore.

- **Business objective:** give admins a single view of every collector's identity, state, and load so they
  can verify the collection tier is healthy and correctly distributed.
- **Screen description:** a read-oriented list/grid under `Settings → System Settings → Motadata
  Collector` with a show/hide-columns control and per-row actions; no explicit create button (collectors
  register themselves when deployed).
- **Primary use cases:** confirm collectors are up (State), see which collector serves how many monitors
  (Used Count), search the list, act on a row.
- **Who uses it:** administrators / deployment engineers.
- **Dependencies:** deployed collector instances that register with the app; network connectivity between
  collector and app/datastore.

## 2. Navigation
```
Settings → System Settings → Motadata Collector
```
- **Breadcrumb:** Settings › System Settings › Motadata Collector
- **URL:** `/settings/system-settings/motadata-collector`

## 3. Actions
- **Search** the grid — `input[name="search-rpe"]` (placeholder "Search")
- **Show/Hide Columns** — `#btn-show-hide-columns`
- Per-row **Actions** (e.g. view/edit/remove) — `[data-cy='grid-action']`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-rpe"]` (placeholder "Search") |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Grid | columns below |
| Row actions | `[data-cy='grid-action']` |

**Grid columns:** Hostname · Type · Deployment · IP · State · Used Count · Duration · Actions

> No **Create** control is present (collectors self-register on deployment). The per-row action set (what
> can be done to a collector — view details, remove, etc.) was not enumerated — confirm live or via the
> KG. `search-rpe` ("rpe" = remote poller engine) is the same search-input name used by Backup Profiles.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Motadata Collector)._

## 5. Permissions
- **Administrators / deployment engineers** view/manage collectors.
- TODO(source: KG/docs) — non-admin visibility; which row actions require which role.

## 6. Entry Conditions
- Logged in as an administrator.
- At least one collector has registered (in a standalone install this may be the local collector only).

## 7. Exit Conditions
- The grid reflects the **State** (up/down) and **Used Count** of each collector; changes appear after
  the next registration/heartbeat. TODO(source: KG/docs) — what row actions produce (e.g. removing a
  collector reassigns its monitors?).

## 8. Validations
- Read-oriented inventory; no create-form validations captured. TODO(source: docs) — any edit fields.

## 9. Business Rules
- Collectors **self-register**; this screen inventories rather than provisions them.
- **Used Count** indicates monitor load per collector — useful for balancing.
- TODO(source: KG/docs) — HA/DR restart ordering (KB notes the documented order **APP → DB → Collector**);
  what happens to monitors when a collector goes down or is removed.

## 10. Known Bugs
No defect is recorded specifically against this screen in `knowledge/known_issues/customer-issue-kb.md`.
Related operational context (not screen defects):
- **HA/DR bring-up must follow the SOP** and restart order APP→DB→Collector; manual `motadata.json`/config
  edits cause dual-primary / wrong roles (section 2).
- **Sizing** matrices (App/DB/**Collector**/Observer core-RAM-disk per monitor count) inform how many
  monitors a collector should carry (section 14) — an over-loaded collector maps to the Used Count here.
Verify against build 8.2.6.

## 11. Edge Cases
- A collector showing **State = down** or a stale Duration (heartbeat lost).
- A collector with a very high **Used Count** (over-subscribed vs. its sizing).
- Duplicate/stale collector entries after re-deployment or IP change (KB "stale deployment entries" class).
- Removing a collector that still owns monitors (reassignment behaviour).
- Search returning no rows; many collectors (paging).
