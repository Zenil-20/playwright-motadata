---
screen: Monitoring · custom-monitoring-field
module: Settings
category: monitoring
route: "/settings/monitoring/custom-monitoring-field"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_monitoring_custom_monitoring_field.json
verified: 2026-07-09
---

# Monitoring · Custom Monitoring Field

## 1. Purpose
A small management list for **user-defined custom monitoring fields** — extra attribute fields an
admin defines to attach custom metadata to monitors beyond the built-in properties. The screen is a
simple two-column list (**Field Name** · **Actions**) with search and per-row create/edit/delete.

- **Business objective:** let an organization extend a monitor's data model with their own fields
  (e.g. asset tag, owner, location, cost-centre) so those attributes can be captured and used across
  monitoring. TODO(source: KG/docs) confirm where the fields surface (monitor details / reports).
- **Screen description:** a minimal grid with a **Search** box (`name="custom-monitoring-fields-search"`)
  and columns **Field Name** and **Actions** (`[data-cy='grid-action']`). The catalog captured no
  toolbar buttons, no bulk actions, no switches/selects — consistent with a lightweight CRUD list.
- **Primary use cases:** create a new custom field; rename/edit an existing field; delete a field;
  search the field list.
- **Who uses it:** monitoring administrators. TODO(source: KG/docs) confirm exact role gating.
- **Dependencies:** none beyond an authenticated session. TODO(source: KG/docs) confirm whether a field
  in use by monitors can be edited/deleted.

> No screenshot exists for this route, and the catalog is deliberately sparse (only Search + the
> Field Name/Actions columns and `[data-cy='grid-action']`). The create/edit dialog fields were not
> captured in the sweep — those specifics are marked TODO below.

## 2. Navigation
```
Settings → Monitoring → Custom Monitoring Field
```
- **URL:** `/settings/monitoring/custom-monitoring-field` (open the full URL; SPA routing must load it)
- Sibling screens: **Device Monitor Settings**, **Agent Monitor Settings**.

## 3. Actions
Derived from the catalog (columns + the grid-action hook):

- **Search** fields — free-text box (`name="custom-monitoring-fields-search"`, placeholder _"Search"_).
- **Create** a custom field — the create control was not captured as a `buttonId`; a create/"+" affordance
  is expected. TODO(source: KG/docs) confirm the exact control id.
- **Edit** a field — via the per-row **Actions** menu (`[data-cy='grid-action']`).
- **Delete** a field — via the per-row **Actions** menu (`[data-cy='grid-action']`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="custom-monitoring-fields-search"]` (placeholder _"Search"_) |
| Grid columns | **Field Name** · **Actions** |
| Per-row Actions menu | `[data-cy='grid-action']` (edit / delete) |
| Create control | not captured — TODO(source: KG/docs) confirm the add-field button id |
| Create/Edit dialog fields | not captured — TODO(source: KG/docs) (expected: a Field Name input, possibly a field type) |

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Monitoring > Custom Field)._

## 5. Permissions
- **View:** monitoring admins can view the list; Viewer-type roles likely read-only. TODO(source: KG/docs) confirm.
- **Create / edit / delete:** expected to require an admin/operator monitoring-management permission.
  TODO(source: KG/docs) confirm exact role names.

## 6. Entry Conditions
- User is logged in with a valid session; Settings is reachable (`/settings/`).
- No seeded data required — the list may legitimately be empty on a fresh system.

## 7. Exit Conditions
- **Create (success):** success toast; the new field appears as a row in the list.
- **Edit (success):** the row's Field Name updates to the new value.
- **Delete (success):** the row is removed from the list; TODO(source: KG/docs) confirm behavior/warning
  if the field is already in use by monitors.
- **Search:** the list narrows to matching field names; empty search restores the full list.

## 8. Validations
- **Field Name** — required, and expected to be **unique** among custom fields (a list-of-named-things
  pattern). TODO(source: docs) confirm uniqueness enforcement and the duplicate-name error.
- Field Name max length / allowed characters — TODO(source: docs).
- Delete-in-use guard — TODO(source: KG/docs) confirm whether deleting a field that monitors use is
  blocked or warned.

## 9. Business Rules
- The list holds **user-defined** fields only (not built-in monitor properties).
- Field Name is expected to be **unique** — TODO(source: KG/docs) confirm.
- TODO(source: KG/docs): whether a field has a data **type**; where the field is exposed (monitor detail,
  filters, reports); and whether an in-use field can be renamed/deleted.

## 10. Known Bugs
None recorded for this screen. (`knowledge/known_issues/customer-issue-kb.md` contains no issue specific
to custom monitoring fields.)

## 11. Edge Cases
- Create a field with a **duplicate name** (should be blocked if names are unique).
- Empty / whitespace-only Field Name.
- Very long Field Name; Unicode / special characters; leading/trailing spaces.
- **Delete a field that is in use** by monitors (blocked, warned, or cascaded?).
- Edit a field to collide with an existing name.
- Empty list state (no custom fields defined).
- Search with no matches.
