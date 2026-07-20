---
screen: Service Level Objective · correction-profile
module: Settings
category: service-level-objective
route: "/settings/service-level-objective/correction-profile"
build: 8.2.6
status: draft                # catalog verified; no dedicated screenshot; business rules marked TODO
sources: [catalog, kb]       # locators/catalog/settings_service_level_objective_correction_profile.json, known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Service Level Objective · Correction Profile

## 1. Purpose
The **Correction Profile** tab manages **exclusion / correction windows** that are subtracted from SLO
evaluation — typically planned maintenance or agreed downtime that should not count against a service's
SLA.

- **Business objective:** stop planned/agreed outages from unfairly breaching an SLO — a correction
  profile carves out time windows (often **recurring**) that are excluded from the Achieved/Violation
  calculation. (Inferred from the `Recurring Type` and `Category` columns; TODO(source: KG/docs) to
  confirm the exact semantics.)
- **Screen description:** a searchable list grid with columns **Correction Profile Name · Category ·
  Recurring Type · Remarks · Action**, plus a **Create Correction Profile** button.
- **Primary use cases:** define a maintenance/correction window, categorise it, set its recurrence, and
  attach it (from the SLO Profile) so it is honoured during SLO computation.
- **Who uses it:** administrators / service owners who own SLA definitions. TODO(source: KG/docs).
- **Dependencies:** an authenticated session · the SLO module · consumed by **SLO Profiles** during
  evaluation. TODO(source: KG) — confirm binding direction (SLO → correction).

## 2. Navigation
```
Settings → Service Level Objective → Correction Profile
```
- **URL:** `/settings/service-level-objective/correction-profile`.
- **Sibling tabs:** SLO Profile · Correction Profile · Penalty Profile.

## 3. Actions
- **Create Correction Profile** — `#create-correction-profile-btn-id`.
- **Search** — `input[name="search-correction-profile"]` (placeholder _Search_).
- **Row actions** (Action column) — TODO(source: KG/docs) — View / Edit / Delete.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-correction-profile"]` (placeholder _Search_) |
| Create Correction Profile (primary) | `#create-correction-profile-btn-id` |
| Grid columns | Correction Profile Name · Category · Recurring Type · Remarks · Action |

> No screenshot exists for this tab and the sweep captured `selects/switches/radios/checkboxes = 0`, so
> the **Create Correction Profile** form (fields for Category, Recurring Type, the actual time window /
> start-end, Remarks) was **not captured**. Confirm the form live or via the KG.

_Locators: catalog `knowledge/locators/catalog/settings_service_level_objective_correction_profile.json`;
promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Correction Profile)._

## 5. Permissions
- Generic-but-reasoned: **Admin** / SLA owner creates and manages correction profiles.
- TODO(source: KG/docs) — exact RBAC and license/module gating.

## 6. Entry Conditions
- Logged in; Settings reachable; SLO module available.

## 7. Exit Conditions
- **List loads:** grid renders (may be empty).
- **On Create (success):** new row appears; TODO(source: docs) — toast + audit entry.
- **On Edit/Delete:** row updates/disappears; TODO(source: docs) — delete confirmation; behavior when
  the profile is referenced by an SLO.

## 8. Validations
- Search: free text, no validation.
- Create-form validations — **not captured**. Expected (TODO(source: KG/docs)):
  - **Correction Profile Name** required and unique.
  - **Category** required (allowed values TODO).
  - **Recurring Type** required (e.g. None / Daily / Weekly / Monthly — TODO).
  - Time window start/end consistency (end after start). TODO(source: docs).

## 9. Business Rules
- A correction window is **excluded from SLO evaluation** for the period it covers (planned-downtime
  correction). TODO(source: KG/docs) — confirm this is the exact effect.
- **Recurring Type** drives whether the window repeats and on what cadence. TODO(source: KG/docs).
- Likely **name-unique** within the module; consumed by SLO Profiles. TODO(source: KG).
- TODO(source: KG/docs) — allowed Category values, max windows, overlap handling.

## 10. Known Bugs
None recorded for this screen. (Searched `knowledge/known_issues/customer-issue-kb.md` for
correction / service-level / SLA — no matching customer issue for build 8.2.6.)

## 11. Edge Cases
- Duplicate Correction Profile name.
- Overlapping correction windows on the same service.
- Recurring window that spans a frequency boundary (e.g. crosses midnight / month end).
- Time window with end before start; zero-length window.
- Deleting a correction profile referenced by an active SLO.
- Empty grid (no profiles) → Create is the only action.
- Very long Remarks / Unicode in name.
