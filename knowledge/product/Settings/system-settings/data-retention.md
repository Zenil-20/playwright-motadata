---
screen: System Settings · Data Retention
module: Settings
category: system-settings
route: "/settings/system-settings/data-retention"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_data_retention.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · Data Retention

## 1. Purpose
Controls how long the platform keeps each class of collected data (raw metrics, aggregated metrics, logs,
flows, availability, etc.) before it is purged. Retention windows directly govern disk usage and the time
ranges over which reports and trends can be queried.

- **Business objective:** balance historical-data depth against datastore disk consumption by setting a
  retention period per data type.
- **Screen description:** a settings form under `Settings → System Settings → Data Retention` with
  **Reset** and **Save** actions. The retention fields per data type were not enumerated by the sweep.
- **Primary use cases:** extend/shorten retention for a data class, reclaim disk by lowering retention.
- **Who uses it:** administrators.
- **Dependencies:** the datastore/aggregation pipeline; changing retention affects what reporting and
  availability queries can return (raw vs. aggregated layers).

## 2. Navigation
```
Settings → System Settings → Data Retention
```
- **Breadcrumb:** Settings › System Settings › Data Retention
- **URL:** `/settings/system-settings/data-retention`

## 3. Actions
- Edit the per-data-type retention values (fields not captured by the sweep — TODO(source: KG/docs))
- **Save** — button "Save"
- **Reset** — button "Reset"

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` |
| Save | button "Save" |
| Reset | button "Reset" |

> The retention **input fields per data type** (raw metric, aggregated metric, logs, flow, availability,
> etc., typically with a value + unit) were **not captured** in the sweep (only Search/Save/Reset). Confirm
> the exact field set, units, and defaults live or via the KG before writing a retention test.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Data Retention)._

## 5. Permissions
- **Administrators** set data retention (global, high-impact setting).
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- Current retention values load into the form.

## 7. Exit Conditions
- **On Save (success):** success toast; new retention windows apply going forward; over-retention data
  becomes eligible for purge. TODO(source: KG/docs) — whether purge is immediate or on the next cycle.
- **On Reset:** form reverts to last-saved values.

## 8. Validations
- Retention values are numeric with a unit. TODO(source: docs) — min/max, allowed units (note the KB
  records that report time units were **capped at Days** in 8.2.1).
- TODO(source: docs) — whether raw retention must be ≤ aggregated retention (data-layer ordering).

## 9. Business Rules
- **Raw vs. aggregated layers:** the product keeps raw and aggregated metrics separately; retention
  windows determine which layer answers a report/availability query. Mismatched windows cause queries to
  land on the wrong layer (see Known Bugs). TODO(source: KG/docs) — confirm the exact per-layer fields.
- Lowering retention frees disk but shortens how far back reports/trends can go.
- TODO(source: KG/docs) — defaults per data class.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (Reports, section 4 — retention-driven):
- **Availability/trend data wrong or missing for longer ranges — raw vs. aggregation retention
  mismatch** (PQD-32430 [MOTADATA-6639], PQD-38241 [MOTADATA-8012]). Queries older than raw retention were
  auto-routed to aggregation (fix 8.0.24); further fix in 8.2.0.
- **Report time units capped at Days (8.2.1)** to avoid long-duration retention/query defects.
These are query/report-side effects of retention configuration; verify against build 8.2.6.

## 11. Edge Cases
- Setting raw retention longer than aggregated (or vice versa) — cross-layer query correctness.
- Very large retention on a small datastore (disk pressure → OOM/disk-full class, KB section 3).
- Retention lowered below existing data age (bulk purge on save).
- Zero/blank retention; non-numeric input.
- Query spanning the raw→aggregated boundary returns consistent numbers (KB QA idea #8).
