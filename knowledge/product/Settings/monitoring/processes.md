---
screen: Monitoring · Process Monitor Settings
module: Settings
category: monitoring
route: "/settings/monitoring/processes"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_monitoring_processes.json · screenshots/Process Monitoring Settings.png · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Monitoring — Process Monitor Settings

## 1. Purpose
The **catalog of monitorable OS processes** — the reference list Motadata ObserveOps uses to recognise
and monitor operating-system / application processes (e.g. `/usr/bin/clickhouse-server`, `amqsvc.exe`,
`apache`, `db2sysc`, `dhcpd`, `haproxy`, `httpd.exe`) running on discovered servers.

- **Business objective:** curate which named processes the product can watch, so that a discovered
  host's running processes map to a known **Application Type** and can be provisioned as process
  monitors and correlated with an application (header copy: "Easily monitor server processes with
  Motadata ObserveOps and discover corresponding applications seamlessly").
- **Screen description:** a single searchable/filterable grid under `Settings → Monitor Settings →
  Process Monitor Settings`, with columns **Process · Application Type · OS Type · Actions** and a
  primary **Create Process** action. Rows carry an application-type icon (ClickHouse, IBM DB2, MySQL,
  HAProxy, Sybase, …) and an OS-type icon (mix of Windows and Linux here).
- **Primary use cases:** browse the seeded process catalog; add a custom process definition; edit or
  delete an existing one; filter by Application Type or OS Type.
- **Who uses it:** monitoring administrators configuring what the platform can monitor. TODO(source:
  KG/docs) — exact role gating.
- **Dependencies:** an authenticated session · the Monitor Settings module · the application-type and
  OS-type reference data that populate the icons and filters.

## 2. Navigation
```
Settings → Monitor Settings → Process Monitor Settings
```
- **Breadcrumb:** Settings › Monitor Settings › Process Monitor Settings
- **Left-nav siblings (Monitor Settings):** Device Monitor Settings · Cloud Monitor Settings · Monitor
  Templates · Agent Monitor Settings · Service Check Monitor Settings · **Process Monitor Settings** ·
  Service Monitor Settings · File/Directory Settings · SNMP Device Catalog · Rediscover Settings ·
  NetRoute Settings · Topology Scanner · Monitoring Hour · Custom Monitoring Field
- **URL:** `/settings/monitoring/processes`

## 3. Actions
- **Create Process** — open the create form to define a new monitorable process (`#btn-create-process`).
- **Search** — free-text search over the catalog (`input[name="search-process-list"]`, placeholder _Search_).
- **Filter** — open the filter panel (`#filter-btn`); the inline chips **Application Type** and **OS Type**
  are the two filter dimensions shown above the grid.
- **Row Actions** — the per-row `⋮` kebab (`[data-cy='grid-action']`) exposes edit / delete. TODO(source:
  KG/docs) — confirm exact menu items and whether seeded (built-in) processes are editable/deletable.
- **Export** — two export icon buttons sit left of Filter (PDF / CSV by convention on these grids).
  TODO(source: KG/docs) — confirm; the catalog sweep did not capture ids for them on this screen.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Grid search | `input[name="search-process-list"]` (text, placeholder _Search_) |
| Application Type filter chip | inline chip above grid |
| OS Type filter chip | inline chip above grid |
| Filter | `#filter-btn` |
| Create Process (primary) | `#btn-create-process` |
| Row action kebab | `[data-cy='grid-action']` (per row) |
| Grid column — Process | sortable (`PROCESS ↑`); holds the process name / path |
| Grid column — Application Type | icon per row (app logo) |
| Grid column — OS Type | icon per row (Windows / Linux) |
| Grid column — Actions | `⋮` kebab |

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Process Monitor Settings)._

> The **Create Process** form fields (Process name/path, Application Type picker, OS Type picker) were
> **not captured** in the grid sweep — confirm the exact field set and control ids live or via the KG.
> TODO(source: KG/docs).

## 5. Permissions
- **Expected:** an Admin / monitoring-admin role can create, edit and delete process definitions; an
  Operator/Viewer likely has read-only access. Global monitoring configuration ⇒ write access expected
  to be admin-gated.
- TODO(source: KG/docs): exact RBAC matrix, and whether seeded system processes are protected from
  edit/delete.

## 6. Entry Conditions
- User is logged in with a valid session.
- Settings → Monitor Settings is reachable.
- The process catalog loads (seeded rows render with Application Type / OS Type icons).

## 7. Exit Conditions
- **On Create (success):** success toast; the new process appears in the grid under its Application
  Type / OS Type; an audit entry is written. TODO(source: KG/docs) — confirm toast wording + audit.
- **On Edit (success):** row reflects updated values.
- **On Delete (success):** row removed from the grid after confirmation.
- **On Filter/Search:** grid narrows to matching rows; clearing restores the full catalog.

## 8. Validations
- **Process name / path** — required; a process may be identified by name (`apache`) or full path
  (`/usr/bin/clickhouse-server`). Note the two `hibernatewithmysql` rows in the screenshot map to
  **different Application Types** — i.e. process name alone is not necessarily unique. TODO(source:
  KG/docs) — confirm the uniqueness key (name only, vs name + Application Type + OS Type) and max length.
- **Application Type** — TODO(source: KG/docs) — required? chosen from a fixed reference list?
- **OS Type** — TODO(source: KG/docs) — required? Windows/Linux distinction visible in the grid.
- Field-level inline errors and max-lengths: TODO(source: docs).

## 9. Business Rules
- A process definition ties a **Process (name/path) → Application Type → OS Type**; this mapping lets
  discovery recognise a running process on a host and associate it with the right application (per the
  header copy and the icon columns).
- The catalog ships **seeded** with common processes across OSes (`.exe` for Windows, plain names/paths
  for Linux). TODO(source: KG/docs) — whether seeded entries are read-only.
- OS Type constrains applicability (a `.exe` process definition applies to Windows hosts; a Linux path
  to Linux hosts). TODO(source: KG/docs) — confirm enforcement.
- TODO(source: KG/docs): defaults, per-tenant limits, and the provisioning path from catalog entry to a
  live process monitor.

## 10. Known Bugs
Two customer-KB patterns touch process monitoring; cite only, do not extrapolate beyond them:

- **Deleted processes still listed after re-provisioning / hardware swap** — stale/duplicate monitor
  records persisted in PostgreSQL after re-provisioning; "deleted processes still listed" is called out
  explicitly. Diagnosis: monitors not re-provisioned after a change, legacy multi-entry-point rows in
  the DB. Solution: delete + re-provision, purge legacy rows; general improvement in **8.0.26**.
  (`customer-issue-kb.md` §1 — "Stale/duplicate monitor records", e.g. PQD-40358 / PQD-37767.)
- **Process/port polling storm** — a SCADA endpoint produced a process/CPU storm because port monitoring
  reconnected every 60s and left thousands of stale TCP connections, contributing to high CPU / OOM.
  Fix path: remove the port from monitoring **and** from Application Mapping, since a nightly 2:15 AM
  rediscovery re-adds it; a GUI toggle (default-off) landed in **8.2.1**. (`customer-issue-kb.md` §6 —
  "Agent resource / traffic anomalies", PQD-40522 / PQD-39936 [MOTADATA-8460].) Relevant because process
  and port monitoring share the provisioning/rediscovery path.

> These are catalog/provisioning-adjacent issues, not defects proven against the Create-Process form
> itself. Record any new, screen-specific defect as `version: 8.2.x · issue: … · workaround: …`.

## 11. Edge Cases
- Re-provision a host after deleting a process → assert the deleted process does **not** linger in the
  catalog/monitor list (KB §1 regression).
- Duplicate **Process** name that differs only by Application Type (two `hibernatewithmysql` rows) →
  confirm create is allowed/blocked per the real uniqueness key.
- Editing/deleting a **seeded** process (protected?).
- Deleting a process actively used by live monitors (orphaning / referential integrity).
- Process defined by **path** vs **name** (`/usr/bin/clickhouse-server` vs `apache`) — matching on hosts.
- Very long paths, Windows vs POSIX path separators, Unicode, trailing spaces.
- Filter by an Application Type / OS Type with zero rows (empty grid state); search with no matches.
- Concurrent edit of the same process definition from two sessions (last-write-wins?).
