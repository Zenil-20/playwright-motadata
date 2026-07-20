---
screen: Monitoring · device-monitor-settings
module: Settings
category: monitoring
route: "/settings/monitoring/device-monitor-settings"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_monitoring_device_monitor_settings.json · screenshots/monitor screen.png · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Monitoring · Device Monitor Settings

## 1. Purpose
The **device (agentless) monitor inventory** — the grid of every device/monitor provisioned into
ObserveOps, with the bulk-configuration toolbar for managing the fleet. This is the settings-side
view where an admin selects monitors and applies interface speed, tags, and metric-collection type
in bulk, toggles columns, browses the tag inventory, and exports the list.

- **Business objective:** administer the device-monitoring fleet at scale — find a device, check its
  status, and correct configuration across many devices in one action rather than one-by-one.
- **Screen description:** the same full-width monitor grid as **Monitoring → Overview**: a category
  tab-bar (Inventory · Network · SDN · Server & Apps · Storage · Virtualization · HCI · Database ·
  Container Orchestration · Cloud · Interface · WAN Link · Process · Container · Service · Service
  Check · Other), a **Search** box, quick chips (Groups · Types · Severity), **Filter**, a right-aligned
  icon toolbar, per-row select checkboxes and a per-row **Actions** menu (`[data-cy='grid-action']`),
  and pagination with a status legend (Down · Critical · Major · Warning · Clear · Unreachable). The
  screenshot shows **1–50 of 475 items**.
- **Primary use cases:** locate a device monitor; read status/active alerts; bulk-set interface speed;
  bulk tag import; bulk metric-collection type; show/hide columns; browse tag inventory; export PDF/CSV;
  filter.
- **Who uses it:** monitoring administrators / operators. TODO(source: KG/docs) confirm exact role gating.
- **Dependencies:** provisioned device monitors (discovery has run) · pollers/collectors up (Status
  column) · the tag store · metric-collection settings.

> **Same grid as Overview.** The catalog for this route is byte-identical to `settings_monitoring.json`
> (same `buttonIds`, `gridHeaders`, checkbox count) — only the `route` differs
> (`/settings/monitoring/device-monitor-settings`). See `overview.md` for the inventory-landing framing;
> this file documents the same controls scoped as *device* monitor settings. The agent-based grid is a
> separate screen — see `agent-monitor-settings.md` (it adds Health/Duration/State/Version/Configuration).

## 2. Navigation
```
Settings → Monitoring → Device Monitor Settings
```
- **URL:** `/settings/monitoring/device-monitor-settings` (open the full URL; SPA routing must load it)
- **Category tabs (in-grid):** Inventory · Network · SDN · Server & Apps · Storage · Virtualization ·
  HCI · Database · Container Orchestration · Cloud · Interface · WAN Link · Process · Container ·
  Service · Service Check · Other (from screenshot).
- **Build shown in screenshot:** 8.2.5 (doc build target 8.2.6).

## 3. Actions
Derived from the catalog `buttonIds`/`buttons` and the screenshot toolbar:

- **Search** monitors — free-text search box (placeholder _"Search"_).
- **Filter** — `#filter-btn` / the **Filter** chip; quick chips **Groups**, **Types**, **Severity**.
- **Bulk: Configure Interface Speed** — `#bulk-interface-speed`.
- **Bulk: Tag Import** — `#bulk-tag-import`.
- **Bulk: Metric Collection Type** — `#bulk-metric-collection-type` (also used to un-suspend metric
  groups — see Business Rules).
- **Show / Hide Columns** — `#btn-show-hide-columns`.
- **Tag Inventory** — `#btn-tag-inventory`.
- **Export PDF** — `#export-pdf-btn`.
- **Export CSV** — `#export-csv-btn`.
- **Per-row Actions** — `[data-cy='grid-action']` menu (drill in / edit / suspend / delete —
  TODO(source: KG/docs) confirm exact items).
- **Select rows** — per-row checkboxes (102 captured); bulk actions operate on the selection.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Search | `input[placeholder="Search"]` (also captured as `name="search"`) |
| Category tab-bar | Inventory · Network · SDN · Server & Apps · Storage · Virtualization · HCI · Database · Container Orchestration · Cloud · Interface · WAN Link · Process · Container · Service · Service Check · Other |
| Quick filter chips | Groups · Types · Severity |
| Filter | `#filter-btn` (and the **Filter** button) |
| Bulk — Interface Speed | `#bulk-interface-speed` |
| Bulk — Tag Import | `#bulk-tag-import` |
| Bulk — Metric Collection Type | `#bulk-metric-collection-type` |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Tag Inventory | `#btn-tag-inventory` |
| Export PDF | `#export-pdf-btn` |
| Export CSV | `#export-csv-btn` |
| Row select / select-all | checkboxes (102 captured) |
| Per-row Actions menu | `[data-cy='grid-action']` |
| Grid columns (catalog) | Monitor · IP · Host · Instances Count · Groups · Type · Apps · Status · Actions |
| Grid columns (screenshot, user-configurable) | Monitor · IP · Type · Group · Collector IP · Host · Tags · Active Alerts · Status · Environment |
| Pagination | page numbers · items-per-page select (50 shown) · "1–50 of 475 items" |
| Status legend | Down · Critical · Major · Warning · Clear · Unreachable |

> Catalog `gridHeaders` vs. the screenshot column set differ because columns are toggled via
> **Show/Hide Columns** (`#btn-show-hide-columns`). Keep the catalog set as the canonical default.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Monitoring > Device)._

## 5. Permissions
- **View:** monitoring admins/operators can view the grid; Viewer-type roles likely read-only.
  TODO(source: KG/docs) confirm.
- **Bulk actions (interface speed / tag import / metric-collection) and delete:** expected to require
  an admin/operator monitoring-management permission. TODO(source: KG/docs) confirm exact role names.
- **Export (PDF/CSV):** a "Query"/report permission has historically gated report downloads
  (kb §4, PQD-38798). Same class of gate may apply. TODO(source: KG/docs) confirm.

## 6. Entry Conditions
- User is logged in with a valid session; Settings is reachable (`/settings/`).
- At least one device monitor is provisioned (discovery has run).
- Pollers/collectors up so **Status** and **Active Alerts** are meaningful.

## 7. Exit Conditions
- **Search/Filter:** grid narrows; item count updates.
- **Bulk action applied:** success toast; the change reflects on affected monitors; TODO(source:
  KG/docs) confirm an audit entry is written.
- **Export:** a PDF/CSV of the current (filtered) grid downloads.
- **Show/Hide Columns:** grid re-renders with the chosen columns (preference persists).
- **Row Actions (drill-in):** navigation to the monitor's detail/settings.

## 8. Validations
- **Search** — free text; empty restores the full list. TODO(source: docs) match scope.
- **Bulk actions require a selection** — at least one checked row. TODO(source: KG/docs) confirm the UI
  blocks/greys the action with no selection.
- **Interface speed** — numeric, must be **> 0** (0 causes the 100%-utilization bug). TODO(source: docs)
  units and bounds.
- **Tag import** — tags are lower-cased; uppercase CSV tags historically inconsistent (see Known Bugs).
  TODO(source: docs) exact CSV schema.
- Bulk-dialog field validation was not captured in the sweep — TODO(source: KG/docs).

## 9. Business Rules
- **Status reflects live poll state** via the legend Down / Critical / Major / Warning / Clear /
  Unreachable; "Unreachable" is distinct from "Down".
- **Interface utilization = Δtraffic ÷ interface speed.** Speed 0 → divide-by-zero → 100%; fix via
  **`#bulk-interface-speed`** (kb §1, PQD-31144).
- **Tags are stored lower-case** (kb §1, PQD-34441); relevant to `#bulk-tag-import` / `#btn-tag-inventory`.
- **Bulk Metric Collection Type** (`#bulk-metric-collection-type`) sets metric-collection for the
  selection and is operationally used to **un-suspend metric groups** (kb §5).
- **Columns are user-configurable**; the persisted set drives export contents.
- TODO(source: KG/docs): monitor-name uniqueness/limits; per-page maximums; whether export honors the
  active filter vs. the whole inventory.

## 10. Known Bugs
Cited from `knowledge/known_issues/customer-issue-kb.md`:

- **Interface speed = 0 → division by zero → 100% utilization** (kb §1, **PQD-31144**).
  *Symptom:* loopback/VPN interfaces pinned at 100%. *Diagnosis:* utilization = Δtraffic ÷ speed, speed
  was 0 (not fetched at discovery, not set manually). *Workaround:* configure interface speed manually
  or via **bulk speed configuration** (`#bulk-interface-speed`).

- **Stale / duplicate monitor records after re-provisioning or hardware swap**
  (kb §1, **PQD-40358 / PQD-40196 / PQD-37767 / PQD-31977**).
  *Symptom:* device can't be deleted; same device under two clusters; wrong serial mapping after a
  vendor swap on the same IP; deleted processes still listed. *Diagnosis:* monitors not re-provisioned
  after the change; legacy multi-entry-point PostgreSQL rows; duplicate Object ID from a CSV-import
  mishap. *Workaround:* delete + re-provision, purge legacy DB rows, clean the SNMP Device Catalogue;
  improvement in **8.0.26**.

- **Tag handling defects** (kb §1, **PQD-32287 [MOTADATA-6551] / PQD-34441 / PQD-32063**).
  *Symptom:* "Tag Error" after upgrade (blank tags); uppercase CSV tags accepted inconsistently; no bulk
  hierarchical tagging. *Fix:* **8.0.25**; auto-lowercase in the next release; rule-based tagging as a
  workaround. Relevant to `#bulk-tag-import` / `#btn-tag-inventory`.

## 11. Edge Cases
- Device with `ifSpeed` = **0** → utilization must not read 100%/infinite; fix via `#bulk-interface-speed`.
- Bulk action with **no rows selected** (blocked/greyed?).
- Bulk selection across **pagination** (page-only vs. whole result set).
- **Duplicate/stale monitor** that refuses to delete (PQD-40358); same IP re-used after a vendor swap
  (PQD-37767).
- **Tag import** with uppercase tags, blank tags after upgrade (PQD-34441 / PQD-32287), CSV with a bad
  Object ID (duplicate → PQD-31977).
- Large inventory (475 items shown) — pagination, export size, search latency.
- Export honoring vs. ignoring the active filter and hidden columns.
- Metric-collection-type change used to un-suspend a suspended metric group (kb §5).
- **Unreachable** vs. **Down** treated distinctly.
