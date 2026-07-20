---
screen: Apm · compare
module: APM
route: "/apm/compare"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/apm_compare.json · screenshots/APM.png (BUILD 8.2.5) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Apm · compare

## 1. Purpose
The **Compare** tab of APM — a **side-by-side comparison** view. The catalog shows two mirrored pairs of
inputs (each pair: a **"Select type"** dropdown and a dependent **"Select type first"** input), i.e. two
comparison "slots" where the second field only becomes usable after a **type** is chosen in the first.

- **Business objective:** let engineers compare two APM subjects (e.g. two services, two time windows,
  or two entity types) so regressions/differences in performance are visible next to each other.
- **Screen description:** the APM shell (tab bar + shared time-range picker) with two selection groups.
  Each group is a **type dropdown** (`data-cy='dropdown-trigger-input'`) that gates a second input
  reading **"Select type first"** until a type is picked.
- **Primary use cases:** pick a type + subject on the left, the same on the right, and read the
  comparison.
- **Who uses it:** SRE / app-performance engineers doing before/after or A/B analysis.
- **Dependencies:** APM data for both compared subjects in the selected range; APM license.

## 2. Navigation
```
APM → Compare
```
- **Tabs:** Services · Explorer · Error Tracker · Compare (active).
- **URL:** `/apm/compare`.

## 3. Actions
- **Select type (left / right)** — the two `[data-cy='dropdown-trigger-input']` dropdowns (placeholder
  "Select type").
- **Select subject** — the dependent input, disabled/placeholdered **"Select type first"** until its
  type is chosen.
- **Set time range** — shared quick-range scopes both sides.
- TODO(source: KG/docs) — whether comparison runs automatically once both sides are set or needs an
  explicit "Compare" action (no compare/submit button was captured).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Tab bar | Services · Explorer · Error Tracker · Compare (active) |
| Type dropdown ×2 | `[data-cy='dropdown-trigger-input']` — placeholder "Select type" |
| Dependent subject input ×2 | placeholder "Select type first" (enabled after a type is chosen) |
| Time-range picker | shared quick-range |

> The two `Select type` + `Select type first` pairs are the two comparison sides. No button ids,
> grid, or explicit "Compare" button were captured — confirm the trigger behaviour live/KG.

_Locators: see `knowledge/locators/catalog/apm_compare.json`. The two dropdowns share
`[data-cy='dropdown-trigger-input']` — scope by DOM order/side when automating; promote to
`selector-cookbook.md` (APM > Compare)._

## 5. Permissions
- Requires APM module/license + APM-capable role. TODO(source: KG/docs) — role specifics.

## 6. Entry Conditions
- Logged in; APM licensed; data exists for the subjects being compared in the selected range.

## 7. Exit Conditions
- With both sides selected, the comparison result renders. TODO(source: KG/docs) — confirm whether it is
  automatic or gated by an action, and what the result looks like.
- Changing time range / a selection re-queries the comparison.

## 8. Validations
- **Select type first** input stays disabled/unusable until its **type** dropdown has a value
  (placeholder text enforces the order).
- TODO(source: KG/docs) — whether both sides must be non-empty (and must differ) before a result shows.
- **Time range** — from ≤ to.

## 9. Business Rules
- **Ordering dependency:** each subject field requires its **type** to be chosen first ("Select type
  first").
- Both sides are **time-scoped** by the shared range picker.
- TODO(source: Motadata KG) — what "type" enumerates, whether left/right may be the same subject, and
  what metrics the comparison shows.

## 10. Known Bugs
- No Compare-specific defects recorded in the customer-issue KB for this screen.
- (Module-level) APM licensing count confusion — see `apm.md` / kb §12 (PQD-36926).

## 11. Edge Cases
- Choose a subject without first choosing its type (should be blocked by the "Select type first" gate).
- Left = right (comparing a subject with itself).
- One side with data, the other empty in the range.
- Change type after picking a subject (should the subject reset?).
- Both sides set but no data in range.
- Rapid time-range switching mid-comparison.
