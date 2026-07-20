---
screen: Apm · services
module: APM
route: "/apm/services"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/apm_services.json · screenshots/APM.png (BUILD 8.2.5) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Apm · services

## 1. Purpose
The **Services** tab of APM — the default landing view of the module. It lists the **instrumented
application services** Motadata is monitoring, so a user can see each service's health/performance at a
glance and drill in.

- **Business objective:** provide the service inventory / overview for APM — the entry point from which
  traces (Explorer), exceptions (Error Tracker), and comparisons (Compare) are reached.
- **Screen description:** the APM shell with the tab bar, a shared **time-range picker** (default
  observed _Last 1 Hour_), a **Search** box, a **Filter** button, and right-aligned view-toggle icons.
  The captured environment shows a **"No data found"** empty state (no services reporting in range).
- **Primary use cases:** find a service, filter/search the list, then click through to its traces or
  errors.
- **Who uses it:** application-performance / SRE engineers. TODO(source: KG/docs) — role gating.
- **Dependencies:** instrumented services reporting to APM; APM license enabled; a time range that
  contains data.

## 2. Navigation
```
APM → Services  (default tab)
```
- **Tabs:** Services (active) · Explorer · Error Tracker · Compare.
- **URL:** `/apm/services` (also reachable as `/apm/`).

## 3. Actions
- **Search** services — `input[placeholder="Search"]`.
- **Filter** — `Filter` button (attribute/advanced filter). TODO(source: KG/docs) — filter fields.
- **Set time range** — quick-range picker scopes the list.
- **Toggle view** — the two top-right icons (list/detail or card/grid). TODO(source: KG/docs).
- **Open a service** — click a row to drill into its detail/traces. TODO(source: KG/docs) — confirm the
  destination route.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Tab bar | Services (active) · Explorer · Error Tracker · Compare |
| Search | `input[placeholder="Search"]` (name `search`, text) |
| Filter | `Filter` button |
| Time-range picker | quick-range (_Last 1 Hour_) with from/to |
| View toggle icons | two right-aligned icon buttons |
| Services list / empty state | list body; "No data found" when nothing in range |

_Locators: see `knowledge/locators/catalog/apm_services.json`. No `id`s captured for search/Filter —
harvest + promote to `selector-cookbook.md` (APM > Services)._

## 5. Permissions
- Requires APM module/license + a role with APM access. TODO(source: KG/docs) — view vs configure split.

## 6. Entry Conditions
- Logged in; APM licensed/enabled; ideally ≥1 instrumented service reporting in the selected range.

## 7. Exit Conditions
- Selecting a service navigates to its detail/trace view (TODO: confirm route).
- Search/filter/time-range change re-queries and repaints the list.

## 8. Validations
- **Search** — free text; no observed constraint.
- **Time range** — from ≤ to. TODO(source: docs) — max look-back.

## 9. Business Rules
- Services is the **default** APM tab.
- The list is **time-scoped** by the shared range picker.
- TODO(source: Motadata KG) — what constitutes a "service" (per instrumented app/agent), health
  thresholds, and how each counts against the APM license.

## 10. Known Bugs
- **Licensing — APM count confusion** (kb §12, PQD-36926): APM licensing counts **registered agent
  applications**; consumed capacity can look inflated. License counting refactored in **8.0.26**;
  restart clears the cache variant. Verify on 8.2.6.
- No Services-list-specific UI defects recorded for this screen.

## 11. Edge Cases
- Empty inventory → "No data found".
- Large service count → search/scroll/pagination performance.
- Search: no match, special characters, partial names.
- Service reporting intermittently across the range boundary.
- Time range with no data vs beyond retention.
- Rapid tab switching before the list loads.
