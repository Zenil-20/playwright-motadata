---
screen: Plugin Library · Metrics
module: Settings
category: plugin-library
route: "/settings/plugin-library/metrics"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_plugin_library_metrics.json (live sweep 2026-07-02) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Plugin Library · Metrics

## 1. Purpose
The **Metric Plugins** list — reusable, custom KPI-collection plugins that gather metrics the default
monitor templates don't cover. When a vendor device doesn't answer the stock OIDs/commands (blank CPU,
memory, HW-sensor widgets), an engineer authors a metric plugin here and binds it to the affected
monitors.

- **Business objective:** extend metric collection per-vendor/per-OS without a product release. The KB's
  #1 hotspot (Section 1, ~72 issues) is exactly this class — "Default template OIDs not implemented on
  that model → ship a custom plugin".
- **Screen description:** a searchable grid of metric plugins with a **Create Metric Plugin** action.
- **Primary use cases:** review existing metric plugins, see reference count (Used Count), search by name,
  filter, open a plugin to edit, or create a new one.
- **Who uses it:** monitoring engineers / admins. TODO(source: KG/docs) — exact RBAC gate.
- **Dependencies:** the metric/monitor store, credential profiles (script auth), and the plugin
  execution engine (Go/Python).

## 2. Navigation
```
Settings → Plugin Library → Metrics
```
- **Breadcrumb:** Settings › Plugin Library › Metrics
- **URL:** `/settings/plugin-library/metrics`
- **Create:** `/settings/plugin-library/metrics/create` (see `metrics-create.md`).

## 3. Actions
- **Search** metric plugins — `input[placeholder="Search"]` / `input[name="search"]`.
- **Filter** — `#filter-btn`.
- **Create Metric Plugin** — `#create-metric-plugin-btn` → opens the create form.
- **Row actions** (edit / delete / clone) — `[data-cy='grid-action']`.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]`, `input[name="search"]` |
| Filter | `#filter-btn` |
| Create Metric Plugin (primary) | `#create-metric-plugin-btn` |
| Grid | columns: Metric Name · Description · Protocol · Type · Used Count · Actions |
| Per-row actions | `[data-cy='grid-action']` |

_Locators: see `knowledge/locators/catalog/settings_plugin_library_metrics.json`; promote verified ones
into the selector-cookbook._

## 5. Permissions
- Expected **admin/operator** (metric plugins execute scripts on devices). TODO(source: KG/docs) —
  confirm exact role and any license gate.

## 6. Entry Conditions
- Logged in; Settings reachable; Metrics family selected.
- The metric-plugin store loads (existing rows; **Used Count** derives from monitor bindings).

## 7. Exit Conditions
- **Create Metric Plugin** navigates to the create form.
- Deleting a row removes the plugin (subject to Used Count rule — see Business Rules).
- TODO(source: docs) — audit entry on create/edit/delete.

## 8. Validations
- Search filters by name. TODO(source: docs) — match semantics.
- Row/field validations live on the create screen.

## 9. Business Rules
- **Protocol** and **Type** columns classify each plugin (e.g. SNMP vs SSH/script). TODO(source: KG) —
  full enumerations.
- **Used Count > 0** means monitors reference the plugin; deleting likely impacts collection.
  TODO(source: KG) — confirm delete is blocked/warned while in use.
- Metric plugin **name is unique** (the create form marks the name field "Must be unique").

## 10. Known Bugs
- **Custom Go metric-plugin scripts spawning processes / cron jobs → OOM kills** of app/datastore
  (Section 3, PQD-38278 / MOTADATA-8024). Workaround/fix: **migrate custom Go plugin scripts to Python**;
  hotfixes 8.1.3–8.2.0.
- **Script-engine selection for secure WinRM:** HTTPS/5986 WinRM collection required
  `"plugin.engine": "python"` (the Go PluginEngine lacked WinRM-HTTPS) — productized 8.1.3
  (Section 1, PQD-36217 / MOTADATA-7707). Relevant when a metric plugin targets Windows over HTTPS.

None recorded for the Metrics list UI itself beyond the above plugin-execution issues. Do not invent bugs.

## 11. Edge Cases
- Empty list (no custom metric plugins).
- Search / filter with no matches; special characters.
- Delete a plugin with Used Count > 0.
- Two plugins with clashing intended names (uniqueness enforced on create).
- Large library performance (Used Count computed per row).
