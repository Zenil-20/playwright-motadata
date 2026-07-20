---
screen: Monitoring · Cloud Monitor Settings
module: Settings
category: monitoring
route: "/settings/monitoring/cloud-monitor-settings"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_monitoring_cloud_monitor_settings.json (live sweep 2026-07-02 — captured ZERO controls, page lazy-renders); customer-issue-kb.md §1
verified: 2026-07-09
---

# Monitoring — Cloud Monitor Settings

## 1. Purpose
The **Cloud Monitor Settings** screen manages cloud (AWS / Azure / and other public-cloud) monitors
under `Settings → Monitor Settings`. It is the counterpart to **Device Monitor Settings** but for
cloud accounts/services — the place to review and configure the cloud monitors the platform polls
via cloud provider APIs.

- **Business objective:** onboard and manage cloud-service monitoring (compute, storage, managed
  services) alongside on-prem device monitoring, from one settings area.
- **Screen description:** expected to be a grid of cloud monitors with per-monitor management, in the
  same shell as the other Monitor Settings list screens. **The exact control set is not captured**
  (see below).
- **Primary use cases:** review configured cloud monitors, add/edit/remove cloud monitors, manage
  polling/credentials for cloud accounts. TODO(source: KG/docs) — confirm.
- **Who uses it:** cloud/monitoring administrators. TODO(source: KG/docs) — exact role names.
- **Dependencies:** cloud provider credentials/IAM roles · provider APIs and their rate limits ·
  the polling engine that derives utilization from provider metrics.

> **Grounding gap (be honest).** The live sweep for `/settings/monitoring/cloud-monitor-settings`
> captured **zero controls** — no inputs, buttons, grid headers, switches, or checkboxes — because
> the page **lazy-renders** its content on interaction (or requires a cloud account/data to render
> the grid). No screenshot is available for this screen. Everything below the Navigation section
> that describes specific controls is therefore marked `TODO(source: KG/docs)` rather than asserted.

## 2. Navigation
```
Settings → Monitor Settings → Cloud Monitor Settings
```
- **Breadcrumb:** Settings › Monitor Settings › Cloud Monitor Settings
- **Left-nav group:** Monitor Settings (the "Cloud Monitor Settings" item sits directly under
  "Device Monitor Settings" in the nav — confirmed in the Monitoring Hour screenshot's left rail).
- **URL:** `/settings/monitoring/cloud-monitor-settings`

## 3. Actions
- TODO(source: KG/docs) — the sweep captured no buttons. By analogy to sibling Monitor Settings
  screens (Device Monitor Settings, Monitor Templates), expect: create/add a cloud monitor, search,
  per-row edit/delete, and possibly enable/disable. Confirm the real action set and control ids
  from the live app / KG before automating.

## 4. Components
_No controls captured in the sweep — the page lazy-renders and no screenshot exists._

| Component | Control |
|---|---|
| (cloud monitor grid) | TODO(source: KG/docs) — grid columns not captured |
| (search box) | TODO(source: KG/docs) |
| (create/add cloud monitor button) | TODO(source: KG/docs) — id unknown |
| (per-row actions) | TODO(source: KG/docs) — likely `[data-cy='grid-action']` by analogy, unconfirmed |

> Do **not** assume this screen mirrors Device Monitor Settings control-for-control. To fill this
> section, re-harvest live with the `motadata-explorer` skill after the grid renders (e.g. after a
> cloud account exists), then promote verified locators into the cookbook.

_Locators: none verified yet — see `knowledge/locators/catalog/settings_monitoring_cloud_monitor_settings.json` (empty sweep)._

## 5. Permissions
- **View / manage:** a cloud-monitoring-admin-class role; cloud monitoring may be separately licensed.
- TODO(source: KG/docs) — exact RBAC role names and license/module gating.

## 6. Entry Conditions
- User is logged in; Settings and Monitor Settings are reachable.
- Cloud monitoring is licensed/enabled for the role.
- **The grid lazy-renders** — content may only appear after the page finishes loading or after a
  cloud account/monitor exists. Automation must wait for the grid to render, not for route
  navigation alone.

## 7. Exit Conditions
- TODO(source: KG/docs) — success signals (toast on add/edit, row added/removed, status change) are
  unconfirmed because no controls/flows were captured.

## 8. Validations
- TODO(source: KG/docs) — no inputs captured; field validations unknown.

## 9. Business Rules
- **Cloud monitor content is derived from provider APIs** — unlike SNMP/SSH device monitors, cloud
  metrics depend on the cloud account's permissions and on what the provider exposes (see Known Bugs).
- TODO(source: KG/docs) — uniqueness, per-account limits, polling cadence, defaults.

## 10. Known Bugs
Related patterns from `knowledge/known_issues/customer-issue-kb.md` (§1 Virtualization / cloud data gaps):

- **Virtualization / cloud utilization is derived and permissions-dependent → data gaps.**
  version: 8.2.0–8.2.3 · issue: platforms like vCenter (and cloud by extension) have no direct
  utilization API — values are derived from cluster/account data that depends on the configured
  credentials' permissions; symptoms include wrong/missing CPU/memory, `00` disk capacity, and
  lingering deleted VMs/instances (PQD-37246, PQD-38759 [MOTADATA-8141], PQD-39248 [MOTADATA-8327],
  PQD-39152 [MOTADATA-8483]). · workaround: grant the monitoring account the required read
  permissions; upgrade to the fix versions (host-level fallback for cluster data, datastore
  edge-case handling, appliance-API support). Directly relevant to cloud monitors: expect
  permission-scoped credentials to be the top cause of "cloud data missing/wrong".
- **Credential / permission problems block discovery or specific KPIs.** version: 8.x ·
  issue: read-only instead of admin credentials, or a changed credential profile, yields partial or
  no data (§1, e.g. PQD-30159, PQD-32697). · workaround: correct the credential profile scope for
  the cloud account. Applies whenever a cloud monitor is added with under-scoped IAM credentials.

## 11. Edge Cases
- Cloud account credentials with **insufficient IAM/read permissions** → partial/missing cloud
  metrics (the §1 pattern above) — assert this is diagnosable, not silent.
- Provider **API rate-limiting / throttling** during polling → assert graceful degradation.
- **Deleted cloud instances/VMs linger** in the monitor list (stale-record pattern) → assert cleanup.
- Grid **does not render** (lazy-load) on slow load → automation must wait for content, not route.
- No cloud account configured → assert an informative empty state.
- Derived-utilization edge cases (no-datastore VM → 0 bytes; cluster-vs-host fallback).
