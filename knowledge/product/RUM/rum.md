---
screen: RUM · rum
module: RUM
route: "/rum/"
build: 8.2.6
status: draft
sources: [catalog, screenshot]   # locators/catalog/rum.json · screenshots/RUM.png (BUILD 8.2.5); no KB entry for this screen
verified: 2026-07-09
---

# RUM · rum

## 1. Purpose
The landing screen of the **Real User Monitoring (RUM)** module. RUM captures front-end / real-user
experience telemetry (page loads, sessions, browser-side performance) from instrumented web
applications, as opposed to server-side APM tracing.

- **Business objective:** let teams see how real end-users experience their web apps — a searchable list
  of monitored RUM applications/pages from which to drill into experience metrics.
- **Screen description:** a full-page module titled **"Real User Monitoring"**, with a **time-range
  picker** (screenshot shows _Today_ with an explicit from/to range), a single **Search** box, and a
  right-aligned list/view icon. The captured environment renders a **"No data found"** empty state (no
  RUM data reporting).
- **Primary use cases:** open RUM, pick a time range, search for an application/page, drill in.
- **Who uses it:** front-end / application-experience / SRE engineers. TODO(source: KG/docs) — role gating.
- **Dependencies:** a web app instrumented with the RUM SDK/beacon reporting to Motadata; a RUM
  license/module entitlement; a time range that contains data.

## 2. Navigation
```
Left icon rail → RUM (Real User Monitoring) → lands on the RUM list
```
- **Header:** `Real User Monitoring`.
- **URL:** `/rum/`.
- No tabs were captured (single-view module at this route).

## 3. Actions
- **Search** — the `Search` input (name `search`, placeholder "Search") filters the RUM list.
- **Set time range** — quick-range picker (default observed _Today_) scopes the data.
- **Toggle view** — the right-aligned list/view icon. TODO(source: KG/docs) — confirm behaviour.
- **Open an application** — click a row to drill into its RUM detail. TODO(source: KG/docs) — confirm the
  destination route (no sub-route was captured under `/rum/`).

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Module header | "Real User Monitoring" |
| Search | `input[placeholder="Search"]` (name `search`, text) |
| Time-range picker | quick-range (observed _Today_) with from/to |
| View icon | right-aligned list/view toggle |
| List / empty state | body list; "No data found" when nothing in range |

_Locators: see `knowledge/locators/catalog/rum.json`. Only the `search` input was captured (no `id`s,
buttons, tabs, or grid); harvest the list/row + view-toggle locators live and promote to
`selector-cookbook.md` (RUM)._

## 5. Permissions
- Requires the RUM module/license enabled and a role with RUM access. TODO(source: KG/docs) — specific
  Admin/Operator/Viewer capabilities.

## 6. Entry Conditions
- User is logged in and RUM is licensed/enabled.
- At least one RUM-instrumented application is reporting in the selected range (otherwise the "No data
  found" empty state renders — a valid, expected state).

## 7. Exit Conditions
- Selecting an application drills into its RUM detail (TODO: confirm route).
- Changing search or time range re-queries and repaints the list.

## 8. Validations
- **Search** — free text; no observed constraint.
- **Time range** — from ≤ to. TODO(source: docs) — max look-back tied to RUM retention.

## 9. Business Rules
- The list is **time-scoped** by the range picker (default _Today_).
- TODO(source: Motadata KG) — what a RUM "application" is (per instrumented site/beacon), which
  experience metrics are shown, retention, and how RUM counts against the license.

## 10. Known Bugs
None recorded for this screen. (The customer-issue KB groups Flow/Log/Trap explorers but has no RUM
entries; the "Log/Flow/Trap Explorers" section, kb §7, does not cover RUM.)

## 11. Edge Cases
- Empty range → "No data found" (assert the illustration, not a spinner/error).
- Large application list → search/scroll performance.
- Search: no match, special characters, partial names.
- Time range with no data vs beyond retention.
- RUM licensed but no site instrumented yet (fresh install).
- Application reporting intermittently across the range boundary.
