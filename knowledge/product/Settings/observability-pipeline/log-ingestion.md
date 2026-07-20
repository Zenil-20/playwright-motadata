---
screen: Observability Pipeline · log-ingestion
module: Settings
category: observability-pipeline
route: "/settings/observability-pipeline/log-ingestion"
build: 8.2.6
status: draft                # catalog verified; no dedicated screenshot; add-source form marked TODO
sources: [catalog, kb]       # locators/catalog/settings_observability_pipeline_log_ingestion.json, known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Observability Pipeline · Log Ingestion

## 1. Purpose
The **Log Ingestion** tab lists the **log sources** sending data into the platform and lets an admin add
new sources, enable/disable them, and monitor whether logs are actually arriving.

- **Business objective:** onboard and control log sources (devices/hosts sending logs) and verify
  liveness via **Last Log Received**, so gaps in log collection are visible.
- **Screen description:** an expandable grid with columns **(expand) · Source Name · IP · Log Types ·
  Last Log Received · Enable · Action**. Each row carries an **Enable** toggle (the sweep saw ~50
  `switches` — the per-row enable/disable controls). Toolbar has **Add Source**, a **Log Type** control,
  an expand-all toggle, and show/hide-columns.
- **Primary use cases:** add a log source, enable/disable a source, expand a source to see its log
  types, and confirm recent log arrival.
- **Who uses it:** administrators / log-onboarding engineers. TODO(source: KG/docs).
- **Dependencies:** an authenticated session · the logging module · **Log Collector Plugins** (the
  parsing profiles) · network reachability from the source to the collector. TODO(source: KG/docs).

## 2. Navigation
```
Settings → Observability Pipeline → Log Ingestion
```
- **URL:** `/settings/observability-pipeline/log-ingestion`.
- **Sibling tabs:** Log Ingestion · Log Collector Plugin · Log Pipeline.

## 3. Actions
- **Add Source** — button "Add Source" (opens the add-source form). TODO(source: KG/docs) — locator id.
- **Log Type** — button "Log Type". TODO(source: KG/docs) — confirm whether it filters by log type or
  manages the log-type set.
- **Enable / disable a source** — per-row **Enable** toggle (ant-switch; the "OFF" button label the
  catalog saw is a toggle state). TODO(source: KG/docs) — confirm per-row locator.
- **Expand / collapse all** — `#btn-toggle-expand-all` (works with the `expandableField` column).
- **Show / hide columns** — `#btn-show-hide-columns`.
- **Search** — unnamed + `input[name="search"]` (placeholder _Search_).
- **Row actions** — `[data-cy='grid-action']` (Action column) — TODO(source: KG/docs): Edit / Delete / View.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search"]` (placeholder _Search_) + one unnamed search input |
| Add Source (primary) | button "Add Source" |
| Log Type | button "Log Type" |
| Expand/collapse all | `#btn-toggle-expand-all` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Per-row Enable toggle | ant-switch (catalog `switches: 50`; "OFF"/"ON" state) |
| Row action | `[data-cy='grid-action']` |
| Grid columns | (expand) · Source Name · IP · Log Types · Last Log Received · Enable · Action |

> `switches: 50` is the count of per-row Enable toggles rendered on the sampled page (one per source
> row), **not** a single settings switch. The **Add Source** form (source name, IP/host, log type(s),
> collector plugin, enable) was **not captured** by the sweep — confirm it live or via the KG.

_Locators: catalog `knowledge/locators/catalog/settings_observability_pipeline_log_ingestion.json`;
promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Log Ingestion)._

## 5. Permissions
- Generic-but-reasoned: **Admin** adds/edits/enables sources; operators view.
- TODO(source: KG/docs) — exact RBAC and logging-license gating.

## 6. Entry Conditions
- Logged in; Settings reachable; logging module enabled.
- To see data flowing, at least one source must be forwarding logs to the collector.

## 7. Exit Conditions
- **List loads:** source rows render with Last Log Received timestamps.
- **On Add Source (success):** new row appears; TODO(source: docs) — toast + audit entry.
- **On Enable toggle:** source starts/stops ingesting; Last Log Received begins updating when enabled.
- **On Delete:** row disappears; TODO(source: docs) — confirmation prompt.

## 8. Validations
- Search: free text, no validation.
- Add-Source form validations — **not captured**. Expected (TODO(source: KG/docs)):
  - **Source Name** required (unique?).
  - **IP / host** required, valid IP/hostname format.
  - **Log Type(s)** required (at least one).
  - Collector plugin selection required. TODO(source: docs).

## 9. Business Rules
- **Last Log Received** reflects liveness — a stale/blank value signals a source that stopped sending.
  TODO(source: KG/docs) — the staleness threshold used for any warning.
- **Enable** gates whether a source is actively ingested; disabled sources stop counting/collecting.
- A source declares one or more **Log Types**; parsing is driven by the associated **Collector Plugin**.
  TODO(source: KG/docs) — exact source ⇄ plugin relationship.
- TODO(source: KG/docs) — source name/IP uniqueness, max sources, default enable state on create.

## 10. Known Bugs
None recorded for this screen. (Searched `knowledge/known_issues/customer-issue-kb.md` for
log-ingestion / log source / observability — no matching customer issue for build 8.2.6.)

## 11. Edge Cases
- Add a source with a duplicate IP or name.
- Invalid IP/hostname; IPv6 vs IPv4.
- Source enabled but never sends → blank/stale Last Log Received.
- Disable a source mid-stream → in-flight logs handling.
- Expand-all with a large number of sources → performance.
- Delete a source that a Log Pipeline still references.
- Toggling Enable rapidly (debounce/last-write-wins).
- Empty grid (no sources) → Add Source is the only meaningful action.
