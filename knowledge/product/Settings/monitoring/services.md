---
screen: Monitoring · Service Monitor Settings
module: Settings
category: monitoring
route: "/settings/monitoring/services"
build: 8.2.6
status: draft
sources: [catalog, screenshot]   # locators/catalog/settings_monitoring_services.json · screenshots/service monitor settings.png
verified: 2026-07-09
---

# Monitoring — Service Monitor Settings

## 1. Purpose
The **catalog of monitorable OS services** — the reference list Motadata ObserveOps uses to recognise
and monitor operating-system / application services (e.g. `ADWS`, `DNS`, `DHCPServer`, `MSExchangeIS`,
`MSSQL`, `IBMWAS`) on discovered servers.

- **Business objective:** curate which named services the product can watch, so that a discovered
  host's running services map to a known **Application Type** and can be provisioned as service
  monitors and correlated with an application (the page header states it lets you "monitor services …
  and discover corresponding applications seamlessly").
- **Screen description:** a single searchable/filterable grid under `Settings → Monitor Settings →
  Service Monitor Settings`, with columns **Service · Application Type · OS Type · Actions** and a
  primary **Create Service** action. Each row carries an application-type icon (Active Directory, IBM
  DB2, Microsoft IIS, McAfee, MSMQ, …) and an OS-type icon (predominantly Windows on this screen).
- **Primary use cases:** browse the seeded service catalog; add a custom service definition; edit or
  delete an existing one; filter by Application Type or OS Type.
- **Who uses it:** monitoring administrators configuring what the platform can monitor. TODO(source:
  KG/docs) — exact role gating.
- **Dependencies:** an authenticated session · the Monitor Settings module · the application-type and
  OS-type reference data that populate the icons and filters.

## 2. Navigation
```
Settings → Monitor Settings → Service Monitor Settings
```
- **Breadcrumb:** Settings › Monitor Settings › Service Monitor Settings
- **Left-nav siblings (Monitor Settings):** Device Monitor Settings · Cloud Monitor Settings · Monitor
  Templates · Agent Monitor Settings · Service Check Monitor Settings · Process Monitor Settings ·
  **Service Monitor Settings** · File/Directory Settings · SNMP Device Catalog · Rediscover Settings ·
  NetRoute Settings · Topology Scanner · Monitoring Hour · Custom Monitoring Field
- **URL:** `/settings/monitoring/services`

## 3. Actions
- **Create Service** — open the create form to define a new monitorable service (`#btn-create-service`).
- **Search** — free-text search over the catalog (`input[name="search-service-list"]`, placeholder _Search_).
- **Filter** — open the filter panel (`#filter-btn`); the inline chips **Application Type** and **OS Type**
  are the two filter dimensions shown above the grid.
- **Row Actions** — the per-row `⋮` kebab (`[data-cy='grid-action']`) exposes edit / delete. TODO(source:
  KG/docs) — confirm exact menu items and whether seeded (built-in) services are editable/deletable.
- **Export** — two export icon buttons sit left of Filter (PDF / CSV by convention on these grids).
  TODO(source: KG/docs) — confirm; the catalog sweep did not capture ids for them on this screen.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Page search (Settings shell) | `input` placeholder _Search_ (left-nav filter) |
| Grid search | `input[name="search-service-list"]` (text, placeholder _Search_) |
| Application Type filter chip | inline chip above grid (opens filter) |
| OS Type filter chip | inline chip above grid |
| Filter | `#filter-btn` |
| Create Service (primary) | `#btn-create-service` |
| Row action kebab | `[data-cy='grid-action']` (per row) |
| Grid column — Service | sortable (header shows sort arrow `SERVICE ↑`) |
| Grid column — Application Type | icon per row (app logo) |
| Grid column — OS Type | icon per row (OS logo) |
| Grid column — Actions | `⋮` kebab |

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Service Monitor Settings)._

> The **Create Service** form fields (Service name, Application Type picker, OS Type picker) were **not
> captured** in the grid sweep — confirm the exact field set and control ids live or via the KG.
> TODO(source: KG/docs).

## 5. Permissions
- **Expected:** an Admin / monitoring-admin role can create, edit and delete service definitions; an
  Operator/Viewer likely has read-only access to the catalog. This screen governs global monitoring
  configuration, so write access is expected to be admin-gated.
- TODO(source: KG/docs): exact RBAC matrix (which role may Create/Edit/Delete), and whether seeded
  system services are protected from edit/delete regardless of role.

## 6. Entry Conditions
- User is logged in with a valid session.
- Settings → Monitor Settings is reachable.
- The service catalog loads (seeded rows render with Application Type / OS Type icons).

## 7. Exit Conditions
- **On Create (success):** success toast; the new service appears in the grid under its Application
  Type / OS Type; an audit entry is written. TODO(source: KG/docs) — confirm toast wording + audit.
- **On Edit (success):** row reflects updated values.
- **On Delete (success):** row removed from the grid after confirmation.
- **On Filter/Search:** grid narrows to matching rows; clearing restores the full catalog.

## 8. Validations
- **Service name** — required; expected to be **unique** within the catalog (create should block a
  duplicate). TODO(source: KG/docs) — confirm uniqueness scope (global vs per-OS/per-Application-Type)
  and max length.
- **Application Type** — TODO(source: KG/docs) — required? chosen from a fixed reference list?
- **OS Type** — TODO(source: KG/docs) — required? single vs multi-select (rows here show one OS icon).
- Field-level inline errors and max-lengths: TODO(source: docs).

## 9. Business Rules
- A service definition ties a **Service name → Application Type → OS Type**; this mapping is what lets
  discovery recognise a running service on a host and associate it with the right application (per the
  header copy and the icon columns).
- The catalog ships **seeded** with common Windows/enterprise services (ADWS, DNS, DHCPServer, DB2,
  IBMWAS, IISADMIN, MSExchange*, MSMQ, MSSQL, …). TODO(source: KG/docs) — whether seeded entries are
  read-only.
- OS Type constrains where a service is applicable (a Windows service definition applies to Windows
  hosts). TODO(source: KG/docs) — confirm enforcement.
- TODO(source: KG/docs): defaults, per-tenant limits, and how a catalog entry becomes an actual live
  service monitor (provisioning path).

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`. The nearest catalog
entry — the SQL AlwaysOn failover alert never firing due to the wrong KPI (`mssql.replica.sync.health`
vs `mssql.alwayson.role`, PQD-39582 [MOTADATA-8359], KB §5) — is an **alert-policy / KPI** defect, not a
service-catalog defect, so it is **not** attributed here. Do not invent bugs; record real ones in the
format `version: 8.2.x · issue: … · workaround: …` when found.

## 11. Edge Cases
- Duplicate **Service** name (collision with a seeded or custom entry) → create should be blocked.
- Editing/deleting a **seeded** service (should it be protected?).
- Deleting a service that is **actively in use** by live monitors (orphaning / referential integrity).
- Very long / Unicode / special-character service names; leading/trailing spaces.
- Filter by an Application Type or OS Type that has **zero** rows (empty grid state).
- Search with no matches (empty result), then clear.
- Large catalog performance: sort/scroll/paginate with the full seeded list.
- Concurrent edit of the same service definition from two sessions (last-write-wins?).
