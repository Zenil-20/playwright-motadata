---
screen: Observability Pipeline · log-pipeline
module: Settings
category: observability-pipeline
route: "/settings/observability-pipeline/log-pipeline"
build: 8.2.6
status: draft                # catalog verified (very sparse); no screenshot; most behavior marked TODO
sources: [catalog, kb]       # locators/catalog/settings_observability_pipeline_log_pipeline.json, known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Observability Pipeline · Log Pipeline

## 1. Purpose
The **Log Pipeline** tab is where the **processing/transformation stages** applied to ingested logs are
configured — the "pipeline" between raw ingestion and stored/searchable logs (filtering, parsing,
enrichment, routing).

- **Business objective:** shape log data in flight — drop noise, extract fields, enrich and route — so
  what lands in Log Explorer / storage is clean and useful.
- **Screen description:** the sweep captured **only a single Search input** — no grid, buttons, selects
  or switches. This strongly suggests a **canvas/builder or a config surface** the generic Vue sweep
  could not enumerate, rather than a plain table. TODO(source: KG/docs) — confirm the actual layout
  (pipeline builder vs. list of pipelines).
- **Primary use cases:** view and edit the log-processing pipeline stages. TODO(source: KG/docs).
- **Who uses it:** administrators / logging engineers. TODO(source: KG/docs).
- **Dependencies:** an authenticated session · the logging module · **Log Ingestion** sources feed the
  pipeline; **Log Collector Plugins** define parsing. TODO(source: KG/docs) — confirm the data path.

## 2. Navigation
```
Settings → Observability Pipeline → Log Pipeline
```
- **URL:** `/settings/observability-pipeline/log-pipeline`.
- **Sibling tabs:** Log Ingestion · Log Collector Plugin · Log Pipeline.

## 3. Actions
- **Search** — a single `Search` input (`placeholder="Search"`, unnamed in the catalog).
- All other actions (add/edit a pipeline stage, save, activate) were **not captured**.
  TODO(source: KG/docs).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | unnamed `input[type=text]` (placeholder _Search_) |

> This is the **sparsest** catalog in the module (`buttons: [], gridHeaders: [], selects/switches: 0`).
> Do not assume the screen is empty — the generic router sweep likely could not read a builder/canvas
> UI. Treat all pipeline-editing controls as **unverified** until captured live or documented in the KG.

_Locators: catalog `knowledge/locators/catalog/settings_observability_pipeline_log_pipeline.json`;
promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Log Pipeline)._

## 5. Permissions
- Generic-but-reasoned: **Admin** edits the pipeline; operators/viewers likely read-only.
- TODO(source: KG/docs) — exact RBAC and logging-license gating.

## 6. Entry Conditions
- Logged in; Settings reachable; logging module enabled.
- Meaningful only once **Log Ingestion** sources exist to feed the pipeline. TODO(source: docs).

## 7. Exit Conditions
- **Tab loads:** the pipeline surface renders. TODO(source: docs) — exact success signal.
- **On save/activate:** TODO(source: KG/docs) — toast + audit entry + take-effect timing.

## 8. Validations
- Search: free text, no validation.
- Pipeline-stage validations — **not captured**. TODO(source: KG/docs).

## 9. Business Rules
- The pipeline sits **between ingestion and storage** and applies ordered processing stages.
  TODO(source: KG/docs) — stage types, ordering rules, and how changes take effect (live vs. restart).
- TODO(source: KG/docs) — one global pipeline vs. per-source pipelines; default/no-op behavior.

## 10. Known Bugs
None recorded for this screen. (Searched `knowledge/known_issues/customer-issue-kb.md` for
log-pipeline / pipeline / observability — no matching customer issue for build 8.2.6.)

## 11. Edge Cases
- Empty pipeline (no stages) → logs pass through unmodified?
- A stage that drops all logs → nothing reaches storage.
- Reordering stages; conflicting/overlapping rules.
- Large/complex pipeline → save/apply performance.
- Editing the pipeline while logs are actively ingesting (hot-reload vs. gap).
- Deep-link/refresh directly onto this tab (builder state restore).
