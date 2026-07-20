---
screen: Monitoring · rediscover-setting
module: Settings
category: monitoring
route: "/settings/monitoring/rediscover-setting"
build: 8.2.6
status: draft
sources: [catalog, kb]   # locators/catalog/settings_monitoring_rediscover_setting.json · known_issues/customer-issue-kb.md §1, §6
verified: 2026-07-09
---

# Monitoring — Rediscover Settings

## 1. Purpose
**Rediscover Settings** configures the **rediscovery schedulers** — recurring jobs that re-scan already
monitored entities to pick up newly added/removed sub-components (applications, cloud resources, VMs,
interfaces, processes, services, containers, etc.) without a full fresh discovery. Rediscovery is scoped
**per entity type** via a set of tabs; each tab holds its own grid of schedulers.

- **Business objective:** keep the monitored inventory current — automatically detect new interfaces on a
  switch, new VMs on a host, new processes/services on a server, new cloud resources — on a schedule,
  rather than requiring a manual re-discovery each time.
- **Screen description:** a tabbed screen under `Settings → Monitor Settings → Rediscover Settings`. Tabs:
  **Application · Cloud · Virtualization · HCI · Interface · Access Point · Process · Service ·
  Network Service · File/Directory · Container**. Each tab shows a grid of schedulers
  (**Scheduler Type · Start Date · Triggers · Apps · Result · Actions**) plus a global **ON** switch,
  a **Filter**, a **Create Scheduler** button, and a **run-now** control.
- **Primary use cases:** create/enable a rediscovery scheduler for an entity type; run rediscovery on
  demand; review last **Result** and **Triggers**; disable schedulers that have finished their job.
- **Who uses it:** monitoring administrators. TODO(source: KG/docs) — exact role.
- **Dependencies:** the discovery engine · existing monitors of the given type · credential profiles used
  by the original discovery · the scheduler/cron subsystem.

## 2. Navigation
```
Settings → Monitor Settings → Rediscover Settings
```
- **Breadcrumb:** Settings › Monitor Settings › Rediscover Settings (labelled "Rediscover Settings" in the
  left nav per the SNMP screenshot).
- **URL:** `/settings/monitoring/rediscover-setting`
- **Tabs:** Application · Cloud · Virtualization · HCI · Interface · Access Point · Process · Service ·
  Network Service · File/Directory · Container.

## 3. Actions
- **Switch tab** to the target entity type (Application … Container).
- **Search** schedulers — `search` (placeholder _"Search"_).
- **Filter** — `#filter-btn`.
- **Global ON/OFF** — the **ON** switch (one of the 2 switches) enables/disables rediscovery scheduling
  (scope — global vs current tab — TODO(source: KG/docs)).
- **Create Scheduler** — `#create-role-btn` (button labelled **Create Scheduler**; the id is a generic
  reused id, not role-specific).
- **Run rediscovery now** — `#start-rediscovery` (run-now, outside the normal schedule).
- **Row actions** — `[data-cy='grid-action']` (Edit / Delete / Enable-Disable / Run). TODO(source: KG/docs).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Global Settings search (left) | `input` (placeholder _"Search"_, no id) — shared Settings shell |
| Scheduler search | `input[name='search']` (placeholder _"Search"_) |
| Type tabs | Application · Cloud · Virtualization · HCI · Interface · Access Point · Process · Service · Network Service · File/Directory · Container |
| Grid | columns: **Scheduler Type · Start Date · Triggers · Apps · Result · Actions** |
| Global ON switch | ant-switch labelled **ON** (1 of 2 switches) |
| (second switch) | TODO(source: KG/docs) — role of the 2nd switch (per-row enable vs. a second global toggle) |
| Filter | `#filter-btn` |
| Create Scheduler (primary) | `#create-role-btn` |
| Run rediscovery now | `#start-rediscovery` |
| Row action (kebab) | `[data-cy='grid-action']` |

> **Grid semantics:** **Triggers** = how many times the scheduler has fired; **Apps** = affected
> applications/entities count; **Result** = last-run outcome (Success/Running/Failed). A scheduler stuck on
> **Running** is a known symptom at scale (see §10). TODO(source: KG/docs) — confirm exact Result values.
>
> **Id caveat:** `#create-role-btn` is a shared component id reused from the roles screen — it is the
> **Create Scheduler** button here; scope carefully so automation doesn't cross screens.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Rediscover Settings)._

## 5. Permissions
- **Read:** users with Monitor Settings access.
- **Write (create/run/enable/disable):** monitoring-admin-level role. TODO(source: KG/docs) — exact role;
  Operator/Viewer read-only?
- **License/module gating:** core monitoring. TODO(source: docs).

## 6. Entry Conditions
- Logged in with Monitor Settings access.
- Existing monitors of the selected type exist (rediscovery re-scans existing entities).
- The credential profiles used at original discovery are still valid (rediscovery re-polls the device).

## 7. Exit Conditions
- **Create Scheduler (success):** a new row appears on the active tab with its Start Date and Scheduler Type;
  success toast. (Assert row presence.)
- **Run now (success):** `#start-rediscovery` kicks a run; **Result** transitions (e.g. → Running → Success)
  and **Triggers** increments. Newly found sub-entities become monitored. TODO(source: KG/docs) — confirm.
- **Global ON/OFF:** toggling the **ON** switch enables/disables scheduled rediscovery; persists.
- **Disable/Delete scheduler:** row disabled/removed. Disabling completed profiles is the documented
  scale-remediation (see §10).

## 8. Validations
- **Create Scheduler form** (opens on `#create-role-btn`) — schedule fields (type, start date, recurrence),
  target scope. TODO(source: KG/docs) — exact fields and required markers (not captured in this sweep).
- **Search/Filter** — free text. TODO(source: KG/docs).
- TODO(source: KG/docs) — any guardrail on the total number of schedulers (see the 2,600–2,800 overload
  case in §10).

## 9. Business Rules
- Rediscovery is **scoped per entity type** (the 11 tabs) — a scheduler on the Interface tab re-scans
  interfaces, on Virtualization re-scans hosts/VMs, etc. (Grounded: the tab set + Scheduler Type column.)
- A **global ON switch** gates whether scheduled rediscovery runs at all.
- Rediscovery **re-adds entities that still exist on the device** — including ones an admin removed from
  monitoring. This is the root of the "port re-appears" behavior in §10: to keep a port off, it must also be
  removed from **Application Mapping**, not just from monitoring.
- Completed discovery/rediscovery profiles should be **disabled once their devices are fully added** to
  avoid scheduler overload (§10).
- TODO(source: KG/docs) — default schedule/recurrence; whether rediscovery reuses discovery credentials or
  a separately configured profile.

## 10. Known Bugs
Grounded in `knowledge/known_issues/customer-issue-kb.md` (§1 "Discovery scheduler overload / stuck",
§6 "Agent resource / traffic anomalies").

- **Discovery/rediscovery scheduler overload → stuck "Running"** (~3x; **PQD-34444 [MOTADATA-7320]**,
  **PQD-37769**).
  - Symptom: auto scheduler stuck on **Running**; a secondary app slow to show Running.
  - Diagnosis: **2,600–2,800 discovery schedulers** configured; profiles still scheduled after all devices
    were already added.
  - Remediation: **8.1.0** supports **group name in CSV** (512 devices/CSV) to consolidate schedulers;
    **disable completed profiles**. (Directly relevant to how many schedulers this screen accumulates.)
- **Nightly 2:15 AM rediscovery re-adds a port that was removed from monitoring** (**PQD-39936
  [MOTADATA-8460]**).
  - Symptom: a port removed from monitoring keeps coming back (and, in the cited case, drove a SCADA process
    storm / high CPU from 60s port polling).
  - Diagnosis: scheduled rediscovery re-adds the still-present entity; removing it from monitoring alone is
    insufficient.
  - Remediation: also remove the port from **Application Mapping**; a **GUI toggle (default-off) from 8.2.1**
    controls this re-add behavior.

> Do not invent additional bugs; the above are the cited, rediscovery-relevant issues.

## 11. Edge Cases
- **Large scheduler counts** (2,500+): assert the grid/scheduler engine defines behavior (warnings/timeouts)
  instead of a permanently stuck **Running** state.
- **Run-now while a scheduled run is in progress** (`#start-rediscovery`): assert no double-run / no stuck Running.
- Remove a port from monitoring **without** removing it from Application Mapping, then let the 2:15 AM job
  run: assert the port re-appears (documented) — and that the 8.2.1 default-off toggle prevents it when set.
- Create schedulers across all 11 tabs: assert each is scoped to its own entity type and doesn't cross-scan.
- Toggle the **global ON** off, then run-now: assert whether run-now is blocked or overrides the global gate.
- Rediscovery when the original credential profile has changed/expired: assert a distinguishable error, not a
  silent partial result.
- Empty tab (no schedulers of that type): assert empty-state and that Create still works.
- Very frequent recurrence on a large environment: watch for poller/CPU load (ties to the SCADA-storm case).
