---
screen: Observability Pipeline
module: Settings
category: observability-pipeline
route: "/settings/observability-pipeline/"
build: 8.2.6
status: draft                # catalog verified (sparse); module landing; most behavior marked TODO
sources: [catalog, kb]       # locators/catalog/settings_observability_pipeline.json, known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Observability Pipeline

## 1. Purpose
The **Observability Pipeline** landing screen — the module home under `Settings` for configuring how
logs are **collected, ingested and processed** before they reach Log Explorer / storage.

- **Business objective:** give one place to manage the log data path — the **sources** that send logs,
  the **collector plugins** that parse them, and the **pipeline** that transforms/routes them.
- **Screen description:** the sweep captured only a single **Search** input at the module root — the
  root defers to its sub-tabs. TODO(source: KG/docs) — confirm which sub-tab loads by default.
- **Sub-screens (module tabs):** Log Ingestion · Log Collector Plugin · Log Pipeline.
  TODO(source: KG/docs) — confirm the full tab set and order.
- **Primary use cases:** add a log source, manage collection plugins, and build/inspect the log
  pipeline.
- **Who uses it:** administrators responsible for log onboarding and the logging module.
  TODO(source: KG/docs).
- **Dependencies:** an authenticated session · the **Log Management / logging** module/license ·
  reachable collectors/agents that forward logs. TODO(source: KG/docs) — confirm gating.

## 2. Navigation
```
Settings → Observability Pipeline
```
- **URL:** `/settings/observability-pipeline/` (SPA route; open the full URL so Vue routing loads it).
- **Module tabs:** Log Ingestion · Log Collector Plugin · Log Pipeline.
- TODO(source: KG/docs) — confirm the left-nav label/icon, breadcrumb, and default sub-tab.

## 3. Actions
- **Search** — a single `Search` input (`placeholder="Search"`, unnamed in the catalog).
- All create/manage actions live on the sub-tabs (Log Ingestion / Log Collector Plugin / Log Pipeline).
- TODO(source: KG/docs) — any root-level action beyond navigation.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | unnamed `input[type=text]` (placeholder _Search_) |

> The root catalog is intentionally sparse (`buttons: [], gridHeaders: [], selects/switches: 0`) — this
> route is a shell that routes into the sub-tabs. The real controls are documented in
> `log-ingestion.md`, `log-collector-plugin.md`, and `log-pipeline.md`.

_Locators: catalog `knowledge/locators/catalog/settings_observability_pipeline.json`; promote verified
ones into `knowledge/locators/selector-cookbook.md` (Settings > Observability Pipeline)._

## 5. Permissions
- Generic-but-reasoned: **Admin** manages the observability/log pipeline; operators/viewers likely
  read-only. TODO(source: KG/docs) — exact RBAC and log-module license gating.

## 6. Entry Conditions
- Logged in; Settings reachable; the logging module is enabled. TODO(source: docs).

## 7. Exit Conditions
- **Module loads:** the default sub-tab renders. TODO(source: docs) — which one.

## 8. Validations
- Search is free text; no validation. Field validations live on the sub-tabs.

## 9. Business Rules
- The module composes **ingestion (sources) → collection (plugins) → pipeline (processing)**. Exact
  ordering/dependencies TODO(source: KG/docs).

## 10. Known Bugs
None recorded for this screen. (Searched `knowledge/known_issues/customer-issue-kb.md` for
observability / log-pipeline / log-ingestion / log-collector — no matching customer issue for
build 8.2.6.)

## 11. Edge Cases
- Direct-navigating to the root URL vs. a specific sub-tab (deep-link/refresh behavior).
- Logging module/license disabled → module hidden or empty.
- Search at the root when no sub-tab data exists.
