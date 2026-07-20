---
screen: Discovery · network-discovery-profiles
module: Settings
category: network-discovery
route: "/settings/network-discovery/network-discovery-profiles"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_network_discovery_network_discovery_profiles.json · "network discovery with/without ncm.png" (create wizard) · customer-issue-kb §1,§14
verified: 2026-07-10
---

# Discovery · Network Discovery Profiles

## 1. Purpose
The **list / management grid** for Network Discovery Profiles — the saved definitions that tell
ObserveOps *what* to scan (IP/Host, IP Range, CIDR or a CSV of targets), *how* (collector,
credentials, ports, protocol options) and *when* (via a scheduler). Running a profile discovers
devices and provisions them as monitors.

- **Business objective:** onboard infrastructure into monitoring at scale — a profile is the reusable
  unit that turns raw IP targets into monitored objects, re-runnable on a schedule to pick up new/
  changed devices.
- **Screen description:** a searchable data grid of existing profiles with per-row actions (rerun,
  edit, schedule…) and a primary **Create Discovery Profile** button that opens the create wizard.
- **Primary use cases:** review discovery inventory and last result, re-run a profile after adding
  devices, edit a profile's targets/credentials, jump to the create wizard.
- **Who uses it:** NOC / monitoring admins and operators responsible for onboarding devices.
  TODO(source: KG/docs) — exact role that can create vs. only view.
- **Dependencies:** at least one reachable **Collector**, one **Credential Profile** (created here or
  under `credential-profiles`), network reachability to targets, and the Discovery module/license.

## 2. Navigation
```
Settings → Discovery Settings → Network Discovery Profiles
```
- **Breadcrumb:** Settings › Discovery (Network Discovery) › Network Discovery Profiles
- **Sibling screen:** Credential Profiles (`/settings/network-discovery/credential-profiles`)
- **URL:** `/settings/network-discovery/network-discovery-profiles`
- **Create wizard:** `…/network-discovery-profiles/create` (via **Create Discovery Profile**)

## 3. Actions
- **Create Discovery Profile** — opens the create wizard (`#create-network-discovery-profile-btn`).
- **Search** — filter the grid by profile name (`discovery-search`).
- **Show / hide columns** — column chooser for the grid (`#btn-show-hide-columns`).
- **Rerun** a profile — per-row re-scan action (`[data-cy='rerun']`).
- **Row actions** — per-row action menu (`[data-cy='grid-action']`): TODO(source: KG/docs) confirm the
  exact set (expected: Edit, Delete, Schedule, View discovered objects, Clone).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name='discovery-search']` (placeholder _Search_) + a second header search input |
| Column chooser | `#btn-show-hide-columns` |
| Create Discovery Profile (primary) | `#create-network-discovery-profile-btn` |
| Rerun (per row) | `[data-cy='rerun']` |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns**
- Discovery Profile Name
- IP/Host/IP Range/CIDR/CSV (the target and its addressing mode)
- Type (device/category type)
- Discovered Objects (count found on last run)
- Status (last run state — e.g. Running / Completed; TODO confirm exact values)
- Scheduler (schedule state / next run)
- Actions

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Network Discovery Profiles)._

## 5. Permissions
- Reads and manages discovery profiles — an **admin/operator-level** capability in the Discovery area.
- TODO(source: KG/docs): exact RBAC split (who can create/edit/delete/rerun vs. view-only), and
  whether operators are scoped to specific groups.
- Discovery module must be licensed/enabled.

## 6. Entry Conditions
- Logged in with a Discovery-capable role.
- Settings → Discovery reachable.
- For a run to succeed later: a Collector is up and a Credential Profile exists.

## 7. Exit Conditions
- **Create:** wizard opens; on save, a new row appears in this grid.
- **Rerun:** run kicks off; **Status** transitions (e.g. → Running → Completed) and **Discovered
  Objects** updates; TODO(source: KG) confirm the exact status vocabulary and toast.
- **Delete (if present):** row removed; TODO — confirm whether monitors created by the profile are
  retained or removed.

## 8. Validations
- Grid-level screen — validations live in the create wizard (see `network-discovery-profiles-create`).
- Search is free-text; TODO(source: docs) whether it matches name only or also target/type.

## 9. Business Rules
- A profile's **Discovered Objects** and **Status** reflect the *last* run, not live state.
- Re-running an existing profile re-provisions/refreshes its monitors rather than duplicating them.
  TODO(source: KG) confirm dedupe behavior on rerun.
- TODO(source: KG/docs): profile-name uniqueness at the grid level (the create form marks the name
  _"Must be unique"_ — see §8 of the create doc), and any cap on number of active schedulers.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md`:
- **Discovery scheduler overload / stuck "Running"** (§1, PQD-34444 [MOTADATA-7320], PQD-37769):
  with thousands of schedulers configured (2,600–2,800), the auto scheduler could stick in *Running*;
  profiles left scheduled after all devices were added add load. **Workaround/fix:** 8.1.0 supports a
  group name in CSV (512 devices/CSV) to consolidate schedulers; **disable completed profiles**.
- **Stale/duplicate monitor records after re-provisioning or hardware swap** (§1, PQD-40358, PQD-40196,
  PQD-37767): re-running/re-provisioning after a hardware change can leave duplicate or undeletable
  monitor rows. **Workaround:** delete + re-provision, purge legacy DB rows. Improvement in 8.0.26.
- Related discovery-run failures (credentials, SNMP transport, timeouts) are documented on the create
  screen (`network-discovery-profiles-create` §10) since they surface at run time.

## 11. Edge Cases
- Empty state (no profiles yet) vs. large inventory (hundreds of profiles) — grid paging/perf.
- Rerun while a previous run of the same profile is still *Running*.
- Delete a profile whose devices are actively monitored (orphaned monitors?).
- Search with no matches; search by partial IP/CIDR vs. name.
- Profile whose Collector is now down → run fails; assert a distinguishable error, not silent 0 objects.
- Scheduler left enabled after all targets onboarded (load — see Known Bugs).
- Very large CSV target (approach the 512-devices/CSV consolidation limit).
