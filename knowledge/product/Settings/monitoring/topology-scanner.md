---
screen: Monitoring · topology-scanner
module: Settings
category: monitoring
route: "/settings/monitoring/topology-scanner"
build: 8.2.6
status: draft
sources: [catalog, kb]   # locators/catalog/settings_monitoring_topology_scanner.json · known_issues/customer-issue-kb.md §8
verified: 2026-07-09
---

# Monitoring — Topology Scanner

## 1. Purpose
**Topology Scanner** configures the **topology-scan schedulers** — recurring jobs that walk the network
(LLDP/CDP/SNMP neighbour data) from one or more **Entry Points** to build and refresh the **network
topology map**. It is the scheduling/settings screen; the resulting map is viewed in the **Topology
Explorer** (a separate map view with Network/SDN/Cloud/Virtualization/HCI layers, Layer-3 toggle, minimap,
and "Create Topology View" — used here only for context, not part of this settings screen).

- **Business objective:** keep the topology/dependency map accurate on a schedule — discover device
  interconnections automatically from seed **Entry Points**, and re-scan to reflect additions/changes.
- **Screen description:** a grid-based scheduler screen under `Settings → Monitor Settings → Topology
  Scanner`. Grid columns: **Entry Points · Scheduler Type · Start Date · Triggers · Total Runtime ·
  Actions**. Controls: **Create Scheduler**, a **run-now** control, an **ON** switch, and a Search.
- **Primary use cases:** create a topology-scan scheduler seeded at chosen entry-point devices; run a scan
  on demand; review **Triggers** (runs) and **Total Runtime**; enable/disable scheduled scanning.
- **Who uses it:** network/monitoring administrators. TODO(source: KG/docs) — exact role.
- **Dependencies:** the topology/dependency-mapper engine · SNMP/LLDP data from monitored devices ·
  **monitor name = hostname** mapping (topology maps by monitor name — see §9/§10) · the scheduler subsystem.

## 2. Navigation
```
Settings → Monitor Settings → Topology Scanner
```
- **Breadcrumb:** Settings › Monitor Settings › Topology Scanner (left-nav label "Topology Scanner").
- **URL:** `/settings/monitoring/topology-scanner`
- **Related view (not this screen):** the **Topology** Explorer/map (Network · SDN · Cloud · Virtualization
  · HCI tabs, Layer-3 toggle, minimap, "Create Topology View") — where scan results are visualized.

## 3. Actions
- **Search** schedulers — `search` (placeholder _"Search"_).
- **Create Scheduler** — `#create-scheduler-btn` (opens the scheduler form: entry points, schedule).
- **Run topology scan now** — `#start-topology-schedule` (run-now, outside the normal schedule).
- **ON/OFF** — the **ON** switch enables/disables scheduled topology scanning (scope global vs. per-row —
  TODO(source: KG/docs); the sweep found **3** switches on this screen).
- **Row actions** — `[data-cy='grid-action']` (Edit / Delete / Enable-Disable / Run). TODO(source: KG/docs).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Global Settings search (left) | `input` (placeholder _"Search"_, no id) — shared Settings shell |
| Scheduler search | `input[name='search']` (placeholder _"Search"_) |
| Grid | columns: **Entry Points · Scheduler Type · Start Date · Triggers · Total Runtime · Actions** |
| ON switch(es) | 3 ant-switches (one labelled **ON**; roles of the other two TODO(source: KG/docs) — likely per-row enable toggles) |
| Create Scheduler (primary) | `#create-scheduler-btn` |
| Run scan now | `#start-topology-schedule` |
| Row action (kebab) | `[data-cy='grid-action']` |

> **Grid semantics:** **Entry Points** = the seed device(s) the scan walks out from; **Triggers** = number
> of scan runs; **Total Runtime** = cumulative/last run duration (topology walks can be long on large
> networks — see the 24-min SNMP-walk note in the KB). TODO(source: KG/docs) — confirm exact meaning of
> Total Runtime (cumulative vs. last-run) and the Scheduler Type value set.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Topology Scanner)._

## 5. Permissions
- **Read:** users with Monitor Settings access.
- **Write (create/run/enable/disable):** monitoring/network-admin-level role. TODO(source: KG/docs) — exact role.
- **License/module gating:** part of monitoring/topology. TODO(source: docs).

## 6. Entry Conditions
- Logged in with Monitor Settings access.
- At least one monitored device to serve as an **Entry Point**; the seed device answers LLDP/CDP/SNMP
  neighbour OIDs.
- Monitored devices' **names equal their hostnames** (topology maps by monitor name — see §9/§10).

## 7. Exit Conditions
- **Create Scheduler (success):** a new row appears with its Entry Points, Scheduler Type and Start Date;
  success toast. (Assert row presence.)
- **Run now (success):** `#start-topology-schedule` starts a scan; **Triggers** increments and **Total
  Runtime** updates; the topology map in the Explorer reflects discovered links. TODO(source: KG/docs) — confirm.
- **ON/OFF:** toggling the **ON** switch enables/disables scheduled scanning; persists.
- **Existing topology impact:** a new scan can **overwrite** the existing topology (documented behavior —
  see §10); success should be judged against expected replace-vs-merge semantics.

## 8. Validations
- **Create Scheduler form** — Entry Points selection, schedule (type/start/recurrence), and (from 8.2.1)
  **Include/Exclude filters with groups/tags** to scope which devices the scan affects. TODO(source: KG/docs)
  — exact fields/required markers (form not captured in this sweep).
- **Search** — free text. TODO(source: KG/docs).
- TODO(source: KG/docs) — whether an Entry Point is mandatory and whether duplicate schedulers on the same
  entry point are allowed.

## 9. Business Rules
- A topology scan **walks the network from its Entry Points** using neighbour data; the map is built from
  device + interface relationships. (Grounded: Entry Points column + topology KB.)
- **Topology maps by monitor name = hostname** — renaming a monitor breaks its topology placement; names
  must match hostnames for links to resolve (see §10). (Grounded: KB §8 PQD-36818/PQD-36965.)
- A **new scan can replace the existing topology** and the layout can re-flow when devices are added; from
  **8.2.1** Include/Exclude filters (groups/tags) and a static-layout improvement mitigate this (§10).
- Interface/neighbour **uniqueness** was historically validated on **interface index only**, which wrongly
  flagged legitimate same-index interfaces on different devices as duplicate connections (fixed 8.2.0–8.2.2;
  §10).
- TODO(source: KG/docs) — default recurrence; how Entry Points are chosen (single seed vs. multiple);
  interaction with the Layer-2/Layer-3 views in the Explorer.

## 10. Known Bugs
Grounded in `knowledge/known_issues/customer-issue-kb.md` §8 (Topology & Dependency Mapper).

- **New scan overwrites existing topology / layout scrambles on device add** (**PQD-30386, PQD-36665**;
  cluster incl. PQD-31827, PQD-38710 [MOTADATA-8179], PQD-40859 [MOTADATA-8544]).
  - Symptom: a new scan replaces the existing topology; the layout re-flows when a device is added; stale
    vMotion links; wrong port connectivity vs. the dependency mapper.
  - Diagnosis: scheduler **replace-by-design**; auto-relayout.
  - Remediation: **Include/Exclude filters with groups/tags**; **static-layout improvement in 8.2.1**;
    fixes 8.2.0–8.2.2 (+8.2.1 hotfix exe).
- **Monitor name must equal hostname — renaming monitors breaks topology** (**PQD-36818, PQD-36965**).
  - Symptom: topology missing for scanned switches after monitors were renamed.
  - Diagnosis: topology maps by **monitor name = hostname**.
  - Remediation: **restore the names and rerun** discovery/scan; an improvement to map by hostname was requested.
- **Name/IP parsing misclassification breaks topology** (**PQD-29906, PQD-36424 [MOTADATA-7745]**, PQD-41316).
  - Symptom: devices missing from topology / topology not built per the neighbour list.
  - Diagnosis: **16-character device names parsed as IPv6**; a later fix regressed **ASCII A.B.C.D octet
    parsing** (worked 8.0.15, broke 8.1.0).
  - Remediation: **combined parser fix in 8.1.2** — the canonical "fix-introduced-regression" case.
- **Duplicate-connection error on legitimate same-index interfaces** (part of the §8 maintenance cluster).
  - Diagnosis: uniqueness validated on **interface index only**, not device+interface.
  - Remediation: fixed across **8.2.0–8.2.2**.

> Do not invent additional bugs; the above are the cited, topology-scanner-relevant issues.

## 11. Edge Cases
- **Rename a monitored device** then run a scan — assert topology placement breaks (documented) and that
  restoring the name + rerun fixes it.
- **16-character device names** and **A.B.C.D alpha-looking octets** in names/IPs — assert correct
  classification (8.1.2 combined fix must not regress).
- **Same interface index on two different devices** — assert no false duplicate-connection error (8.2.0–8.2.2).
- **Run a new scan over an existing topology** — assert replace-vs-merge behavior matches expectation, and
  that Include/Exclude filters (8.2.1) scope it as intended.
- **Add a device and rescan** — assert the static-layout improvement (8.2.1) keeps the existing layout stable.
- **Very large / high-latency network** (e.g. 4,000-interface device, 24-min SNMP walk) — assert Total
  Runtime and timeouts are handled, not a stuck scan.
- **Run-now while a scheduled scan is in progress** (`#start-topology-schedule`) — assert no double-run.
- **Entry Point that doesn't answer LLDP/neighbour OIDs** — assert graceful handling (interface-description
  OID fallback per §8) rather than an empty topology with no error.
- **Global ON off, then run-now** — assert whether run-now is blocked or overrides.
- **stale vMotion links** after VM moves — assert the scan clears them.
