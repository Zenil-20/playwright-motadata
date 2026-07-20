---
screen: Monitoring · Monitor Templates
module: Settings
category: monitoring
route: "/settings/monitoring/monitor-templates"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/settings_monitoring_monitor_templates.json (live Vue-router sweep 2026-07-02); customer-issue-kb.md §1
verified: 2026-07-09
---

# Monitoring — Monitor Templates

## 1. Purpose
The **Monitor Templates** screen is the catalog of reusable monitoring templates under
`Settings → Monitor Settings`. A monitor template bundles a monitoring configuration — metric
groups, OIDs/commands, polling and threshold defaults for a class of device or monitor type — so
that the same configuration can be applied consistently to many monitors instead of being tuned
device-by-device.

- **Business objective:** standardize *what* is collected and *how* it is thresholded for a family
  of targets (e.g. a vendor/model of switch, a Linux server profile), and reuse it across the
  estate — fewer per-device mistakes, faster onboarding.
- **Screen description:** a searchable, paginated grid listing every template with **Template Name**,
  **Template Type**, **Description**, and **Used Count**, plus a per-row **Actions** menu; a
  **Create New Template** button opens the create flow.
- **Primary use cases:** review existing templates, see how many monitors each is applied to
  (Used Count), search for a template, create a new template, and edit/clone/delete via row actions.
- **Who uses it:** monitoring administrators / operators who own discovery and monitor
  configuration. TODO(source: KG/docs) — exact role names.
- **Dependencies:** the monitor/metric-group definitions the template references · discovered
  monitors that consume the template (drives Used Count) · the polling engine that applies template
  OIDs/commands at collection time.

## 2. Navigation
```
Settings → Monitor Settings → Monitor Templates
```
- **Breadcrumb:** Settings › Monitor Settings › Monitor Templates
- **Left-nav group:** Monitor Settings (siblings include Device Monitor Settings, Cloud Monitor
  Settings, Agent Monitor Settings, SNMP Device Catalog, NetRoute Settings, Monitoring Hour…).
- **URL:** `/settings/monitoring/monitor-templates`

## 3. Actions
- **Create New Template** — open the create-template flow (`#create-monitor-template-btn`).
- **Search** — filter the grid by template name/type (`input[name='search-monitor-template']`,
  placeholder _search_).
- **Row actions** — per-row `[data-cy='grid-action']` menu; typically Edit / Clone / Delete.
  TODO(source: KG/docs) — confirm the exact action set and their control ids.
- **Sort / paginate** — click column headers to sort; page through the grid.
  TODO(source: KG/docs) — confirm which columns are sortable.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Settings global search | `input` (text), placeholder _Search_ — shared Settings shell |
| Template search box | `input[name='search-monitor-template']` (text), placeholder _search_ |
| Create New Template (primary) | `#create-monitor-template-btn` (label "Create New Template") |
| Grid column — Template Name | grid header `Template Name` |
| Grid column — Template Type | grid header `Template Type` |
| Grid column — Description | grid header `Description` |
| Grid column — Used Count | grid header `Used Count` (count of monitors using the template) |
| Grid column — Actions | grid header `Actions` → per-row `[data-cy='grid-action']` |

> The sweep captured no `selects`, `switches`, `radios`, or `checkboxes` on this list page — those
> belong to the create/edit form, which was not part of this sweep. TODO(source: KG/docs) — the
> create-template form field set (Template Name, Template Type, Description, metric-group / OID /
> threshold configuration).

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Monitor Templates)._

## 5. Permissions
- **View:** roles with access to Monitor/Discovery settings can view the template catalog.
- **Create / Edit / Delete:** a monitoring-admin-class role. Editing a template changes collection
  for every monitor that uses it, so this is expected to be an elevated action.
- TODO(source: KG/docs) — exact RBAC role names (Admin / Operator / Viewer mapping) and whether
  license/module gating applies.

## 6. Entry Conditions
- User is logged in with a valid session and Settings is reachable (`/settings/`).
- The Monitor Settings module is available to the role.
- The template list loads (existing templates render, or an empty-state if none).

## 7. Exit Conditions
- **On Create (success):** success toast; the new template appears in the grid with Used Count 0.
- **On Edit (success):** success toast; changed fields persist; monitors using the template pick up
  the new configuration on the next poll cycle. TODO(source: KG/docs) — confirm apply timing.
- **On Delete:** row removed. TODO(source: KG/docs) — behavior when Used Count > 0 (blocked, or
  detaches monitors?).
- **On Search:** grid filters to matching rows; clearing restores the full list.

## 8. Validations
- **Template Name** — expected required and unique across templates. TODO(source: KG/docs) — confirm
  uniqueness and max length.
- **Template Type** — expected a controlled/selected value (SNMP, WMI, SSH, etc.).
  TODO(source: KG/docs).
- **Description** — free text, likely optional. TODO(source: KG/docs).
- Field-level formats/limits: TODO(source: KG/docs).

## 9. Business Rules
- **Used Count reflects live consumption** — the number of monitors currently applying the template;
  it is a dependency indicator (deleting/editing a high-count template has broad impact).
- **A template is the single source of collection config for its monitors** — editing OIDs / metric
  groups on the template is the sanctioned way to fix "missing KPI" problems for a device family
  (see Known Bugs).
- TODO(source: KG/docs) — whether templates can be **cloned**, whether a monitor can use more than
  one template, and defaults applied on create.

## 10. Known Bugs
Related patterns from `knowledge/known_issues/customer-issue-kb.md` (§1 Discovery & Monitoring Data):

- **Vendor device doesn't respond to default OIDs → missing/false KPIs.** version: 8.x ·
  issue: default template OIDs are not implemented on some device models (Cisco, D-Link, Juniper,
  Hitachi), producing blank/false CPU, memory, HW-sensor, STP/VLAN widgets (PQD-27244, PQD-31043,
  PQD-35401, PQD-41015). · workaround: update the OID per metric group via Monitor Settings →
  Metric Settings / the relevant template, add SNMP Device Catalogue entries, or ship a custom
  plugin. This is the primary reason to edit a template's OID set rather than accept defaults.
- **Cloned-object independence (class defect).** version: 8.0.25–8.1.3 · issue: for cloned objects
  (dashboards/policies), editing the clone changed the original due to shared state (MOTADATA-6574
  class, §10/§15). · workaround: verify clone independence after cloning. Applicability to
  *templates* is unconfirmed — TODO(source: KG/docs) confirm templates are cloneable and, if so,
  that a cloned template is independent of its source.

## 11. Edge Cases
- Create a template with a **duplicate name** → expect a uniqueness error.
- Edit/delete a template with **Used Count > 0** → assert defined behavior (block, warn, or cascade).
- Search with no matches → empty result state; search with special characters / leading-trailing
  spaces.
- Template referencing an OID/metric group the target device does not implement → missing KPIs
  (the §1 pattern above) — assert this is diagnosable, not silent.
- Clone a template, edit the clone → original must be unchanged (§15 cloned-object independence).
- Very long Template Name / Description; Unicode in names.
- Concurrent edit of the same template from two sessions (last-write-wins?).
- Pagination boundary (Used Count sort across pages).
