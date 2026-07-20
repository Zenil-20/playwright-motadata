---
screen: Column Mappers · column-mappers
module: Dashboards
route: "/dashboard/column-mappers"
build: 8.2.6
status: draft
sources: [catalog]            # locators/catalog/dashboard_column_mappers.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Column Mappers

## 1. Purpose
An **internal/administrative reference grid** that lists the platform's **column (metric-plugin) mappers** —
the definitions that map a data-collection **plugin** to the keys/columns and data categories it produces.
It is a diagnostic/lookup surface, not an end-user monitoring screen.

- **Business objective:** let an administrator or support engineer inspect how plugin outputs are mapped to
  metric columns/instances, and which mapper is active for a given key — useful when a widget/report shows
  wrong or missing data traced to a mapper.
- **Screen description:** a **Search** box, a right-side toolbar (**show/hide columns**, **filter**), and a
  grid keyed by **Key** with columns exposing raw mapper internals: `mapper.plugin.ids`, `mapper.status`,
  `mapper.data.categories`, `mapper.instance`, `mapper.plugin.name`, a resolved **Plugin ID → Name**, and a
  per-row **Actions** menu (`[data-cy='grid-action']`). A single **radio** control appears (a view/scope
  toggle).
- **Primary use cases:** search a mapper by key/plugin, check its status and data categories, resolve a
  plugin id to a name, act on a row.
- **Who uses it:** administrators / support / QA engineers (not typical operators). The raw `mapper.*`
  column keys indicate a developer-facing view.
- **Dependencies:** the metric-plugin library and the mapper store that binds plugins to columns.

> **Grounding note:** this screen has **no screenshot** in `knowledge/screenshots/` and only a catalog
> sweep. Purpose/role below is inferred from the column keys and route; treat the intent as
> TODO(source: KG/docs) until confirmed.

## 2. Navigation
- **URL:** `/dashboard/column-mappers` — open the full URL; SPA routing must load the page.
- Under the **Dashboards** module namespace (`/dashboard/*`), alongside `socket-playground`. This is a
  **non-menu / direct-route** utility; TODO(source: KG) confirm whether any menu links to it.

## 3. Actions
- **Search** — free-text over the grid (`input` _Search_; name not captured).
- **Show / Hide columns** — `#btn-show-hide-columns`.
- **Filter mappers** — `#btn-filter-mappers` (advanced filter).
- **Row actions** — kebab `[data-cy='grid-action']` (view/edit/…). TODO(source: KG) confirm items.
- **Toggle radio** — one radio (a view/scope switch). TODO(source: KG) label.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input` _Search_ |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Filter Mappers | `#btn-filter-mappers` |
| View radio | 1 radio |
| Grid columns | Key · `mapper.plugin.ids` · `mapper.status` · `mapper.data.categories` · `mapper.instance` · `mapper.plugin.name` · Plugin ID → Name · Actions |
| Row actions | kebab `[data-cy='grid-action']` |

_Locators: see `knowledge/locators/catalog/dashboard_column_mappers.json`; promote verified ones into the
cookbook (Dashboards > Column Mappers)._

## 5. Permissions
- Almost certainly **Admin/support-only** given the raw internal columns. TODO(source: KG/docs) confirm the
  role gate and whether it is exposed to non-admins at all.

## 6. Entry Conditions
- User is logged in (likely as an administrator).
- Plugins/mappers exist in the store (else empty grid).
- TODO(source: KG): whether any license/module flag gates this route.

## 7. Exit Conditions
- **Grid loads** the mapper rows keyed by Key with resolved plugin names.
- **On filter/search:** grid narrows.
- Read/lookup screen — TODO(source: KG) whether row Actions mutate mappers (and thus write an audit entry).

## 8. Validations
- **Search / filter** — free-text; empty is a no-op.
- No user-entry form captured → no field validations. TODO(source: KG) if row Actions open an editable form.

## 9. Business Rules
- **One row = one column/metric mapper**, identified by **Key**, bound to one or more `mapper.plugin.ids`
  and exposing its `mapper.status`, `mapper.data.categories`, and `mapper.instance`.
- **Plugin ID → Name** resolves the numeric plugin id to a human name for readability.
- TODO(source: KG/docs): what `mapper.status` values mean (active/inactive), and whether a mapper can be
  edited/disabled here vs only in the plugin library.

## 10. Known Bugs
_None recorded for this screen in `customer-issue-kb.md`._
Contextually related (not a Column-Mappers-screen defect): the KB §10 (Dashboards/Widgets) notes an upgrade
that **renamed a metric → `state.metric`, breaking a widget query** (PQD-36959 / MOTADATA-7853) — the kind
of mapper/plugin-key drift this screen helps diagnose. Do not treat as a bug of this screen.

## 11. Edge Cases
- **Empty mapper store** — empty grid, not error.
- Mapper with **multiple plugin ids** — `mapper.plugin.ids` overflow/formatting.
- Unresolved **Plugin ID → Name** (id with no matching plugin) — blank vs id fallback.
- Very large mapper set — grid/search performance.
- Search by numeric plugin id vs by Key vs by plugin name.
- Row Actions on a mapper referenced by an active widget/report (if mutation is possible).
