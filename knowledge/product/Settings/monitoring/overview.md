---
screen: Monitoring
module: Settings
category: monitoring
route: "/settings/monitoring/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_monitoring.json · screenshots/monitor screen.png · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Monitoring — Overview (Monitor Inventory)

## 1. Purpose
The **Monitor Inventory** — the master grid of every monitor (device/instance) provisioned into
ObserveOps. It is the operational landing page for monitoring administration: from here an admin
finds a monitor, checks its status, drills into it, applies bulk configuration (interface speed,
tags, metric-collection type), and exports the inventory.

- **Business objective:** give a single, filterable, exportable source of truth for "what are we
  monitoring, and is it up?" — and a place to fix the fleet in bulk instead of one monitor at a time.
- **Screen description:** a full-width data grid with a category tab-bar across the top (Inventory ·
  Network · SDN · Server & Apps · Storage · Virtualization · HCI · Database · Container Orchestration ·
  Cloud · Interface · WAN Link · Process · Container · Service · Service Check · Other), a **Search**
  box, quick chips (Groups · Types · Severity) plus **Filter**, a right-aligned toolbar of icon
  actions, per-row select checkboxes, a per-row **Actions** (`[data-cy='grid-action']`) menu, and
  pagination with an items-per-page selector and a status legend (Down · Critical · Major · Warning ·
  Clear · Unreachable). The screenshot shows **1–50 of 475 items**.
- **Primary use cases:** locate a monitor; read status/active-alert counts; select monitors and run a
  bulk action; show/hide columns; browse the tag inventory; export the list to PDF/CSV; filter by
  group/type/severity.
- **Who uses it:** monitoring administrators / operators. TODO(source: KG/docs) confirm exact role gating.
- **Dependencies:** provisioned monitors (discovery must have run) · pollers/collectors up (drives the
  Status column) · the tag store (tag chips, tag-import, tag-inventory) · metric-collection settings.

> **Overview vs. device-monitor-settings:** `/settings/monitoring/` and
> `/settings/monitoring/device-monitor-settings` expose the **same** device/monitor inventory grid and
> the same bulk toolbar (identical catalog: same `buttonIds`, same `gridHeaders`). Treat this page as
> the inventory landing view; see `device-monitor-settings.md` for the device-scoped settings variant.

## 2. Navigation
```
Settings → Monitoring   (Monitor inventory grid)
```
- **URL:** `/settings/monitoring/` (open the full URL; SPA routing must load the page)
- **Category tabs (in-grid):** Inventory · Network · SDN · Server & Apps · Storage · Virtualization ·
  HCI · Database · Container Orchestration · Cloud · Interface · WAN Link · Process · Container ·
  Service · Service Check · Other (from screenshot). The catalog captured no `tabs` array — these are
  the in-grid category filter bar, not router tabs.
- **Build shown in screenshot:** 8.2.5 (doc build target 8.2.6).

## 3. Actions
Derived from the catalog `buttonIds`/`buttons` and the screenshot toolbar:

- **Search** monitors — free-text search box (placeholder _"Search"_).
- **Filter** — `#filter-btn` / the **Filter** chip; plus quick chips **Groups**, **Types**, **Severity**.
- **Bulk: Configure Interface Speed** — `#bulk-interface-speed` (select rows → set interface speed).
- **Bulk: Tag Import** — `#bulk-tag-import` (import/apply tags to selected monitors).
- **Bulk: Metric Collection Type** — `#bulk-metric-collection-type` (set how metrics are collected for
  the selection; also used operationally to un-suspend metric groups — see Business Rules).
- **Show / Hide Columns** — `#btn-show-hide-columns` (toggle grid columns).
- **Tag Inventory** — `#btn-tag-inventory` (browse/manage the tag catalogue).
- **Export PDF** — `#export-pdf-btn`.
- **Export CSV** — `#export-csv-btn`.
- **Per-row Actions** — `[data-cy='grid-action']` menu (drill in / edit / suspend / delete —
  TODO(source: KG/docs) confirm exact menu items).
- **Select rows** — per-row checkboxes (catalog counted 102 checkboxes ≈ the header select-all plus
  per-row selectors on a full page). Bulk actions operate on the selection.

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
| Grid columns (screenshot, columns are user-configurable) | Monitor · IP · Type · Group · Collector IP · Host · Tags · Active Alerts · Status · Environment |
| Pagination | page numbers · items-per-page select (50 shown) · "1–50 of 475 items" |
| Status legend | Down · Critical · Major · Warning · Clear · Unreachable |

> The catalog `gridHeaders` and the screenshot column set differ because columns are toggled via
> **Show/Hide Columns** (`#btn-show-hide-columns`) — both are real, the visible set depends on saved
> column preferences. Keep the catalog set as the canonical default.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Monitoring)._

## 5. Permissions
- **View:** monitoring admins/operators can view the inventory. Viewer-type roles likely read-only
  (no bulk actions/export gating) — TODO(source: KG/docs) confirm.
- **Bulk actions (interface speed / tag import / metric collection) and delete:** expected to require
  an admin/operator monitoring-management permission. TODO(source: KG/docs) confirm exact role names.
- **Export (PDF/CSV):** a "Query"/report permission has historically gated report downloads
  (kb §4, PQD-38798 — read-only user couldn't download); the same class of gate may apply here.
  TODO(source: KG/docs) confirm.

## 6. Entry Conditions
- User is logged in with a valid session and Settings is reachable (`/settings/`).
- At least one monitor is provisioned (discovery has run) for the grid to be non-empty.
- Pollers/collectors are up so the **Status** and **Active Alerts** columns are meaningful.

## 7. Exit Conditions
- **Search/Filter:** grid narrows to matching rows; the item count updates ("N of M items").
- **Bulk action applied:** success toast; the change (interface speed / tags / metric-collection type)
  reflects on the affected monitors; TODO(source: KG/docs) confirm an audit entry is written.
- **Export:** a PDF/CSV file downloads containing the current (filtered) grid.
- **Show/Hide Columns:** the grid re-renders with the chosen columns (preference persists).
- **Row Actions (drill-in):** navigation to the monitor's detail/settings.

## 8. Validations
- **Search** — free text; empty search restores the full list. TODO(source: docs) match scope
  (name/IP/host/tag).
- **Bulk actions require a selection** — at least one row checkbox must be checked before a bulk
  action is meaningful. TODO(source: KG/docs) confirm the UI blocks/greys the action with no selection.
- **Interface speed** — numeric, must be **> 0** (a 0 value causes the 100%-utilization bug — see
  Known Bugs / Business Rules). TODO(source: docs) exact units (bps/Mbps) and bounds.
- **Tag import** — tag format rules apply (tags are lower-cased; uppercase CSV tags historically
  inconsistent — see Known Bugs). TODO(source: docs) exact CSV schema.
- Field-level validation on the bulk dialogs was not captured in the sweep — TODO(source: KG/docs).

## 9. Business Rules
- **Status reflects live poll state**, using the legend Down / Critical / Major / Warning / Clear /
  Unreachable (from screenshot). "Unreachable" is distinct from "Down".
- **Interface utilization = Δtraffic ÷ interface speed.** If interface speed is **0**, utilization
  divides by zero and pins at 100% — configure speed manually or via **`#bulk-interface-speed`**
  (kb §1, PQD-31144).
- **Tags are stored lower-case.** Uppercase CSV tags were accepted inconsistently; auto-lowercasing
  was the fix direction (kb §1, PQD-34441). Relevant to `#bulk-tag-import` / `#btn-tag-inventory`.
- **Bulk Metric Collection Type** (`#bulk-metric-collection-type`) sets how metrics are collected for
  the selection; operationally the bulk metric-collection option is also used to **un-suspend metric
  groups** (kb §5, policy/semantics note).
- **Columns are user-configurable** via Show/Hide Columns; the persisted set drives what exports contain.
- TODO(source: KG/docs): uniqueness/limits on monitor names; per-page maximums; whether export honors
  the current filter vs. the whole inventory.

## 10. Known Bugs
Cited from `knowledge/known_issues/customer-issue-kb.md`:

- **Interface speed = 0 → division by zero → 100% utilization** (kb §1, **PQD-31144**).
  *Symptom:* loopback/VPN interfaces pinned at 100% utilization. *Diagnosis:* utilization = Δtraffic ÷
  speed, and speed was 0 (not fetched at discovery, not set manually). *Workaround:* configure the
  interface speed manually or via **bulk speed configuration** (`#bulk-interface-speed`).

- **Stale / duplicate monitor records after re-provisioning or hardware swap**
  (kb §1, **PQD-40358 / PQD-40196 / PQD-37767 / PQD-31977**).
  *Symptom:* device can't be deleted; the same device appears under two clusters; serial/data mapped
  wrong after a firewall vendor swap on the same IP; deleted processes still listed. *Diagnosis:*
  monitors not re-provisioned after the hardware change; legacy multi-entry-point rows in PostgreSQL;
  duplicate Object ID from a CSV-import mishap. *Workaround:* delete + re-provision, purge legacy DB
  rows, clean the SNMP Device Catalogue; improvement in **8.0.26**.

- **Tag handling defects** (kb §1, **PQD-32287 [MOTADATA-6551] / PQD-34441 / PQD-32063**).
  *Symptom:* "Tag Error" after upgrade (blank tags introduced); uppercase CSV tags accepted
  inconsistently; no bulk hierarchical tagging. *Workaround/fix:* fixed in **8.0.25**; auto-lowercase
  in the next release; rule-based tagging as a workaround. Relevant to the tag-import
  (`#bulk-tag-import`) and tag-inventory (`#btn-tag-inventory`) actions.

## 11. Edge Cases
- Provision a device whose `ifSpeed` is **0** → assert utilization is not 100%/infinite; fix via
  `#bulk-interface-speed`; re-check utilization.
- Bulk action with **no rows selected** (should be blocked/greyed).
- Bulk action across **paginated** selection (does select-all cover the page or the whole result set?).
- **Duplicate/stale monitor** that refuses to delete (PQD-40358 class); same IP re-used after a vendor
  swap (PQD-37767 class).
- **Tag import** with uppercase tags, blank tags after upgrade (PQD-34441 / PQD-32287), CSV with a bad
  Object ID (duplicate → PQD-31977).
- Very large inventory (screenshot shows 475 items) — pagination, export size, search latency.
- Export honoring vs. ignoring the active filter and hidden columns.
- Metric-collection-type change used to un-suspend a suspended metric group (kb §5).
- Monitor showing **Unreachable** vs. **Down** — verify they are treated distinctly.
