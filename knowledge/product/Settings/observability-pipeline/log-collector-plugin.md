---
screen: Observability Pipeline · log-collector-plugin
module: Settings
category: observability-pipeline
route: "/settings/observability-pipeline/log-collector-plugin"
build: 8.2.6
status: draft                # catalog verified; no dedicated screenshot; create form marked TODO
sources: [catalog, kb]       # locators/catalog/settings_observability_pipeline_log_collector_plugin.json, known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Observability Pipeline · Log Collector Plugin

## 1. Purpose
The **Log Collector Plugin** tab manages the **collection / parsing profiles** ("Log Collection Plugins")
that tell the platform how to collect and interpret logs from a category of source.

- **Business objective:** reuse parsing/collection logic across sources — a plugin bundles the
  collection method and parsing for a **Category** of logs so many ingestion sources can share it.
- **Screen description:** a searchable grid with columns **Profile Name · Description · Category · Tags ·
  Action**, plus a **Create Log Collection Plug[in]** button; rows expose a `[data-cy='grid-action']`
  control.
- **Primary use cases:** create a collection plugin, categorise and tag it, then reference it from Log
  Ingestion sources.
- **Who uses it:** administrators / logging engineers. TODO(source: KG/docs).
- **Dependencies:** an authenticated session · the logging module · consumed by **Log Ingestion**
  sources. TODO(source: KG/docs) — confirm the source ⇄ plugin binding.

## 2. Navigation
```
Settings → Observability Pipeline → Log Collector Plugin
```
- **URL:** `/settings/observability-pipeline/log-collector-plugin`.
- **Sibling tabs:** Log Ingestion · Log Collector Plugin · Log Pipeline.

## 3. Actions
- **Create Log Collection Plugin** — button "Create Log Collection Plug" (label truncated in catalog).
  TODO(source: KG/docs) — locator id.
- **Search** — unnamed + `input[name="search"]` (placeholder _Search_).
- **Row actions** — `[data-cy='grid-action']` (Action column) — TODO(source: KG/docs): Edit / Delete / Clone.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search"]` (placeholder _Search_) + one unnamed search input |
| Create Log Collection Plugin (primary) | button "Create Log Collection Plug" |
| Row action | `[data-cy='grid-action']` |
| Grid columns | Profile Name · Description · Category · Tags · Action |

> The sweep captured `selects/switches/radios/checkboxes = 0`, so the **Create Log Collection Plugin**
> form (name, description, category, tags, and the actual collection/parse configuration) was **not
> captured**. A **Category** field implies a category select on the create form. Confirm live or via KG.

_Locators: catalog `knowledge/locators/catalog/settings_observability_pipeline_log_collector_plugin.json`;
promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Log Collector Plugin)._

## 5. Permissions
- Generic-but-reasoned: **Admin** creates/manages plugins; operators view.
- TODO(source: KG/docs) — exact RBAC and logging-license gating.

## 6. Entry Conditions
- Logged in; Settings reachable; logging module enabled.

## 7. Exit Conditions
- **List loads:** plugin rows render (may be empty).
- **On Create (success):** new row appears; TODO(source: docs) — toast + audit entry.
- **On Edit/Delete:** row updates/disappears; TODO(source: docs) — delete confirmation; behavior when a
  plugin is in use by a source.

## 8. Validations
- Search: free text, no validation.
- Create-form validations — **not captured**. Expected (TODO(source: KG/docs)):
  - **Profile Name** required and unique.
  - **Category** required.
  - **Tags** optional (free-form / from a list?). TODO.
  - **Description** optional / max length. TODO.

## 9. Business Rules
- A plugin is **reusable** across ingestion sources (parse/collect once, apply to many). TODO(source:
  KG/docs) — confirm.
- **Category** groups plugins by log type/source family; **Tags** aid search/organisation.
- Likely **name-unique** within the module. TODO(source: KG).
- TODO(source: KG/docs) — whether built-in/system plugins ship read-only vs. user-created.

## 10. Known Bugs
None recorded for this screen. (Searched `knowledge/known_issues/customer-issue-kb.md` for
log collector / plugin / observability — no matching customer issue for build 8.2.6.)

## 11. Edge Cases
- Duplicate Profile Name.
- Deleting a plugin referenced by an active Log Ingestion source.
- Category with no matching sources.
- Many tags / very long tag values; special characters.
- Empty grid (no plugins) → Create is the only action.
- Editing a system/built-in plugin (if any are read-only).
