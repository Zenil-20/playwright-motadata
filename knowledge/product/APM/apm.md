---
screen: Apm · apm
module: APM
route: "/apm/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/apm.json · screenshots/APM.png (BUILD 8.2.5) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Apm · apm

## 1. Purpose
The landing route of the **Application Performance Monitoring (APM)** module. `/apm/` opens the module
shell and lands on its first tab, **Services** (the sweep of `/apm/` and `/apm/services` returned an
identical catalog — search input + `Filter` + the four tabs — confirming `/apm/` is an alias that
defaults to Services).

- **Business objective:** give app/SRE teams a single place to observe the health and performance of
  **instrumented application services** — service inventory, distributed traces, exceptions, and
  side-by-side comparison — separate from infrastructure/device monitoring.
- **Screen description:** a full-page module with a top **tab bar** (`Services · Explorer · Error
  Tracker · Compare`), a global **time-range picker** (screenshot shows _Last 1 Hour_ with an explicit
  from/to range), a **Search** box, and view/utility icons on the right. On an environment with no
  APM data the body renders a **"No data found"** empty state (as captured in `APM.png`).
- **Primary use cases:** open APM, pick a time range, then drill into Services / Explorer / Error
  Tracker / Compare.
- **Who uses it:** application-performance / DevOps / SRE engineers. TODO(source: KG/docs) — exact role
  gating.
- **Dependencies:** at least one instrumented service reporting to Motadata APM (agent/SDK
  instrumentation); a valid APM license/module entitlement; the selected time range must contain data.

## 2. Navigation
```
Left icon rail → APM (code `</>` icon) → lands on Services
```
- **Breadcrumb / header:** `APM` (module title with a `</>` glyph, per screenshot).
- **Tabs:** Services · Explorer · Error Tracker · Compare.
- **URL:** `/apm/` (SPA route; resolves to the Services tab).

## 3. Actions
- **Switch tab** — Services / Explorer / Error Tracker / Compare.
- **Set time range** — the range picker (default observed _Last 1 Hour_); all APM panels are
  time-scoped by this selection.
- **Search** — the `Search` input (placeholder "Search") to filter the current list.
- **Filter** — the `Filter` button (advanced/attribute filtering). TODO(source: KG/docs) — exact filter
  fields.
- **Toggle view** — the two icons at the top-right of the panel appear to switch list/detail
  presentation. TODO(source: KG/docs) — confirm what each icon does.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Tab bar | `Services` · `Explorer` · `Error Tracker` · `Compare` |
| Time-range picker | quick-range control (observed value _Last 1 Hour_) with explicit from/to |
| Search | `input[placeholder="Search"]` (name `search`, text) |
| Filter | `Filter` button |
| View toggle icons | two right-aligned icon buttons (presentation toggle) — TODO(source: KG) |
| Empty state | "No data found" illustration when no service data in range |

_Locators: see `knowledge/locators/catalog/apm.json` (raw sweep). No stable `id`s were captured for the
search box or Filter button — promote verified locators into `selector-cookbook.md` (APM) once harvested._

## 5. Permissions
- Viewing APM requires the **APM module/license** to be enabled and the user's role to include APM
  access. TODO(source: KG/docs) — specific Admin/Operator/Viewer capabilities (view vs configure).
- Note (from kb): APM licensing counts **registered agent applications** — see Known Bugs.

## 6. Entry Conditions
- User is logged in and the APM module is licensed/enabled.
- At least one instrumented service is reporting for the selected range (otherwise the "No data found"
  empty state renders — a valid, expected state, not an error).

## 7. Exit Conditions
- Navigating a tab changes the URL to `/apm/services|explorer|error-tracker|compare` and loads that view.
- Changing the time range or search re-queries and repaints the current list.

## 8. Validations
- **Search** — free text; no format constraint observed.
- **Time range** — from ≤ to; TODO(source: docs) confirm max look-back tied to APM data retention.

## 9. Business Rules
- `/apm/` defaults to the **Services** tab (route alias — evidenced by identical catalogs for `/apm/`
  and `/apm/services`).
- All four tabs are **time-scoped** by the shared range picker.
- TODO(source: Motadata KG) — data retention window for traces/errors, and how APM instances count
  against the license.

## 10. Known Bugs
- **Licensing — APM count confusion** (kb §12, PQD-36926): "APM count confusion" — APM licensing
  **counts registered agent applications**, which can make consumed capacity look higher than expected.
  Workaround/diagnosis: counts differing between screens were traced to legacy counting; license code
  was **refactored in 8.0.26** (a restart clears the random-cache variant). Verify against build 8.2.6.
- No APM-UI-specific defects (empty state, tab, search) recorded for this screen.

## 11. Edge Cases
- Time range with zero data → "No data found" empty state (assert the illustration, not a spinner/error).
- Very large service inventory → search/scroll performance.
- Search with special characters / no matches.
- Rapid tab switching before data loads (race).
- APM licensed but no instrumented service reporting yet (fresh install).
- Time range beyond APM retention → empty vs truncated data.
