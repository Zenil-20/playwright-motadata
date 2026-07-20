---
screen: Monitoring · Service Check Monitor Settings
module: Settings
category: monitoring
route: "/settings/monitoring/service-check-monitor-settings"
build: 8.2.6
status: draft
sources: [catalog, screenshot]   # locators/catalog/settings_monitoring_service_check_monitor_settings.json · screenshots/service check {URL,DNS,SSL Certificate,ping}.png · service monitor settings.png (grid layout)
verified: 2026-07-09
---

# Monitoring — Service Check Monitor Settings

## 1. Purpose
The **grid of active service-check monitors** — the synthetic/agentless probes that check a reachable
endpoint by protocol (DNS, Domain, Email, FTP, NTP, Ping, RADIUS, REST API, SSL Certificate, URL) and
report status. This screen manages the resulting monitors; the *creation* of a service check happens
through the **Create Discovery Profile → Service Check** flow (see Actions).

- **Business objective:** give operators one place to see every service-check probe, its protocol type,
  which agent/collector runs it, its target and status, and to act on them in bulk (tag, export, adjust
  collection type / interface speed).
- **Screen description:** a bulk-enabled data grid with columns **Monitor · Agent · Type · Host ·
  Groups · Target · Status · Actions**, a search box, a **Filter**, a bulk toolbar (interface speed,
  tag import, metric collection type, tag inventory, show/hide columns) and **PDF / CSV export**. The
  22 checkboxes captured are the grid's row-select boxes plus the header select-all that drive the bulk
  toolbar.
- **Check types (the "Type" column):** DNS · Domain · Email · FTP · NTP · Ping · RADIUS · REST API ·
  SSL Certificate · URL — i.e. the protocol the probe speaks. Each has its own parameter set in the
  create form (Ping → Retry Count; DNS → Port 53 + Lookup Address + DNS Type; SSL Certificate → Port
  443; URL → URL Type HTTP/HTTPS, URL Method GET/POST, JSON URL, Headers/Parameters, Credential Profile).
- **Primary use cases:** review probe inventory and health; filter by type/agent/status; bulk-retag or
  re-configure collection; export the list; drill into a monitor's row actions.
- **Who uses it:** monitoring operators and admins. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** an authenticated session · at least one Collector/Agent to run the check · the
  discovered targets (Monitor / IP / Host) the checks point at · Service Check discovery having created
  the probes.

## 2. Navigation
```
Settings → Monitor Settings → Service Check Monitor Settings
```
- **Breadcrumb:** Settings › Monitor Settings › Service Check Monitor Settings
- **Create path (not on this grid):** left-nav / Discovery → **Create Discovery Profile** → **Service
  Check** category → pick **Type** (URL, DNS, Ping, SSL Certificate, …) → set Target → **Save and Run**
  (Ping additionally offers **Save and Schedule**). Creation is a Discovery Profile, not a modal off
  this grid — the catalog for this screen exposes **no** Create button, only bulk/export/filter.
- **URL:** `/settings/monitoring/service-check-monitor-settings`

## 3. Actions
- **Search** — free-text over the grid (`input[name="search"]`, placeholder _Search_).
- **Filter** — open filter panel (`#filter-btn`); expected dimensions include Type / Agent / Status.
- **Row select / Select-all** — the grid checkboxes (22 captured) select rows and enable the bulk toolbar.
- **Bulk — Interface Speed** (`#bulk-interface-speed`) — set interface speed on selected monitors.
- **Bulk — Tag Import** (`#bulk-tag-import`) — import/apply tags to selected monitors.
- **Bulk — Metric Collection Type** (`#bulk-metric-collection-type`) — change how metrics are collected
  for selected monitors.
- **Tag Inventory** (`#btn-tag-inventory`) — tag-management action.
- **Show/Hide Columns** (`#btn-show-hide-columns`) — toggle grid columns.
- **Export PDF** (`#export-pdf-btn`) · **Export CSV** (`#export-csv-btn`).
- **Row Actions** — per-row `⋮` kebab (`[data-cy='grid-action']`): edit / enable-disable / delete a
  monitor. TODO(source: KG/docs) — confirm exact menu items.

## 4. Components
| Component | Control (from catalog / screenshots) |
|---|---|
| Grid search | `input[name="search"]` (text, placeholder _Search_) |
| Row select / select-all | grid checkboxes (22 captured) |
| Filter | `#filter-btn` |
| Bulk — Interface Speed | `#bulk-interface-speed` |
| Bulk — Tag Import | `#bulk-tag-import` |
| Bulk — Metric Collection Type | `#bulk-metric-collection-type` |
| Tag Inventory | `#btn-tag-inventory` |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Export PDF | `#export-pdf-btn` |
| Export CSV | `#export-csv-btn` |
| Row action kebab | `[data-cy='grid-action']` (per row) |
| Grid columns | Monitor · Agent · Type · Host · Groups · Target · Status · Actions |

**Create-form controls (Discovery Profile → Service Check), from screenshots — for reference:**
| Field | Control | Notes |
|---|---|---|
| Discovery Profile Name * | text | hint _Must be unique_ |
| Type * | dropdown | the check protocol (URL, DNS, Ping, SSL Certificate, Domain, Email, FTP, NTP, RADIUS, REST API) |
| Collector Type / Collectors | dropdowns | which collector runs the probe |
| Source — Agent | toggle (default OFF) | run via agent vs collector |
| Groups * | dropdown | defaults to **Service Check** |
| Target Type * | segmented | varies by Type: URL→(URL/Monitor); DNS/SSL→(Monitor/IP-Host); Ping→(Monitor/IP-Host/IP Range/CSV/CIDR) |
| Target * | dropdown | the monitor/host/URL to probe |
| Tags | tag picker | _Add Tags_ |
| Discovery Parameters (per Type) | — | Ping→Retry Count(1); DNS→Port(53)+Lookup Address+DNS Type; SSL Certificate→Port(443); URL→URL Type(HTTP/HTTPS)+URL Method(GET/POST)+JSON URL(YES/NO)+URL Content+Credential Profiles+Parameters+Headers+URL Endpoint |
| Notifications — Notify | text | `@User / Email / /Handle / #User Profile / Mobile Number` |
| Save and Exit · Save and Run · (Ping: Save and Schedule) · Reset | buttons | |

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Service Check Monitor Settings)._

> The exact per-Type create-form control **ids** (and the Domain / Email / FTP / NTP / RADIUS / REST API
> parameter sets, which were not read in detail) are TODO(source: KG/docs). The four types read here —
> URL, DNS, SSL Certificate, Ping — are grounded in screenshots.

## 5. Permissions
- **Expected:** operators can view/filter/export; creating (via Discovery), editing, bulk-reconfiguring
  and deleting monitors is expected to be admin/monitoring-admin gated.
- TODO(source: KG/docs): exact RBAC matrix for bulk actions, delete, and Discovery-Profile creation.

## 6. Entry Conditions
- User is logged in with a valid session.
- Settings → Monitor Settings is reachable.
- At least one Collector/Agent exists to run checks; targets have been discovered.
- Service-check monitors exist (created via Discovery); an empty grid is valid before any are created.

## 7. Exit Conditions
- **On Filter/Search:** grid narrows to matching monitors; clearing restores the full list.
- **On Bulk action (success):** success toast; selected monitors reflect the change (new tags,
  collection type, interface speed). TODO(source: KG/docs) — confirm toasts.
- **On Export:** a PDF / CSV file downloads.
- **On monitor Save and Run (from Discovery):** the probe runs and a new row appears here with a
  **Status** value; **Save and Schedule** (Ping) queues it per schedule.
- **On row delete:** the monitor is removed from the grid after confirmation.

## 8. Validations
Grid itself has no field entry; validations belong to the create form:
- **Discovery Profile Name** — required + **unique** (hint _Must be unique_).
- **Type / Target Type / Target / Groups** — required (`*`).
- **Per-Type parameters** — required where marked `*`: DNS → Port (default 53), Lookup Address, DNS Type;
  SSL Certificate → Port (default 443); Ping → Retry Count (default 1); URL → URL Type, URL Method,
  JSON URL. TODO(source: KG/docs) — exact field-level rules (numeric port range, URL format, retry
  bounds) and which parameters are mandatory per remaining type (Domain/Email/FTP/NTP/RADIUS/REST API).

## 9. Business Rules
- **Type = protocol.** The "Type" column is the check protocol; each protocol drives a distinct
  parameter set and a distinct set of allowed Target Types (e.g. Ping accepts IP Range / CSV / CIDR for
  bulk targeting; DNS/SSL accept Monitor or IP/Host; URL accepts a raw URL or a Monitor).
- **Default group is "Service Check."** New service-check discovery profiles default their Groups to
  *Service Check*.
- **Sensible protocol defaults:** DNS Port 53, SSL Certificate Port 443, Ping Retry Count 1 — pre-filled
  in the create form.
- **Creation is via Discovery, management is here.** Probes are born as Discovery Profiles (Service Check
  category) and then live in this grid; this screen offers no direct "Create".
- TODO(source: KG/docs): status semantics (Up/Down/Unknown values and thresholds), collection-type
  options, and how interface-speed applies to non-interface checks.

## 10. Known Bugs
None recorded specifically for this screen in `knowledge/known_issues/customer-issue-kb.md`. The KB's
Log/Flow/Trap and alerts sections (§7, §5) contain no URL/SSL/DNS service-check-specific defect that can
be attributed here. Do not invent bugs; record any real one as `version: 8.2.x · issue: … ·
workaround: …` when found.

## 11. Edge Cases
- Create a **URL** check with HTTPS + POST + JSON URL = YES and custom Headers/Parameters → verify the
  probe posts correctly and status reflects the endpoint.
- **SSL Certificate** check against a soon-to-expire / expired / self-signed cert on port 443 → status.
- **DNS** check with an invalid Lookup Address or an unsupported DNS Type → validation / failed status.
- **Ping** with Target Type = IP Range / CIDR / CSV producing many monitors at once (bulk creation, grid
  scale) and Retry Count boundary values (0, very large).
- Duplicate **Discovery Profile Name** → create blocked (unique rule).
- Bulk-select **all** rows across pages then apply Tag Import / Metric Collection Type / Interface Speed
  → verify the change hits exactly the intended set.
- **Interface Speed** bulk action applied to non-interface service checks (does it no-op or error?).
- Export PDF/CSV with an active Filter (does the export honour the filter?) and with an empty grid.
- Delete a monitor that is referenced by an alert policy or dependency (referential integrity).
- Agent-run (`Source: Agent ON`) vs collector-run checks — status when the agent is offline.
