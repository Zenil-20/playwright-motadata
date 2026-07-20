---
screen: Service Level Objective · slo-profile
module: Settings
category: service-level-objective
route: "/settings/service-level-objective/slo-profile"
build: 8.2.6
status: draft                       # catalog + SLO.png verified; create-form fields marked TODO
sources: [catalog, screenshot, kb]  # locators/catalog/settings_service_level_objective_slo_profile.json, screenshots/SLO.png, known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Service Level Objective · SLO Profile

## 1. Purpose
The **SLO Profile** tab lists every defined Service Level Objective and is where operators track SLA
health and administrators create/manage objectives. It is the default tab of the SLO module (the module
root and this route share the same catalog).

- **Business objective:** define per-service objectives — a **Type** (Availability / Performance), a
  **Target**, a **Warning** threshold and an evaluation **Frequency** — and continuously report whether
  the bound business service is meeting them.
- **Screen description:** searchable list of SLO cards/rows with the module status roll-up (Breached /
  Warning / Ok / Total) in the header. Each entry shows name, status badge, Type, Frequency and the
  Target / Achieved / Violation percentages (from `SLO.png`).
- **Primary use cases:** create a new SLO Profile, review breach/warning status, search to a specific
  objective, and edit/delete an existing one.
- **Who uses it:** service owners and administrators (create/manage); NOC/operators (monitor).
  TODO(source: KG/docs) — exact roles.
- **Dependencies:** an authenticated session · an existing **Business Service** to bind to · live
  availability/performance data for the target · optionally a **Correction Profile** (exclusion
  windows) and **Penalty Profile** (financial penalty) — the other two SLO tabs.

## 2. Navigation
```
Settings → Service Level Objective → SLO Profile
```
- **URL:** `/settings/service-level-objective/slo-profile`.
- **Sibling tabs:** SLO Profile · Correction Profile · Penalty Profile.
- Reached by default when opening the SLO module root (`/settings/service-level-objective/`).

## 3. Actions
- **Create SLO Profile** — `#create-slo-profile-btn-id` (opens the create form/dialog).
- **Search** — `input[name="search-slo-profile"]` (placeholder _Search_).
- **Show / hide columns** — `#btn-show-hide-columns` (grid view).
- **Toggle card ⇄ grid** view — top-right toggle (from `SLO.png`).
- **Row actions** (Action column) — TODO(source: KG/docs) — confirm View / Edit / Delete / Clone.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Status roll-up (Breached/Warning/Ok/Total) | header counters (from `SLO.png`) |
| Search | `input[name="search-slo-profile"]` (placeholder _Search_) |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create SLO Profile (primary) | `#create-slo-profile-btn-id` |
| Grid columns | SLO Name · SLO Type · Frequency · Warning · Target · Business Service Name · Start Date · Action |
| Card fields | Name · status badge · Type · Frequency · Target% · Achieved% · Violation% |

> Grid columns include **Start Date** (not surfaced on the cards in `SLO.png`) — the objective has a
> defined start/effective date. The **Create SLO Profile** form (name, business service, type, target,
> warning, frequency, start date, correction/penalty profile bindings) was **not captured** by the
> sweep — `selects/switches/radios/checkboxes` all report 0 on the list. Confirm the form live.

_Locators: catalog `knowledge/locators/catalog/settings_service_level_objective_slo_profile.json`;
promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > SLO Profile)._

## 5. Permissions
- Generic-but-reasoned: **Admin** creates/edits/deletes SLO profiles; operators view status.
- TODO(source: KG/docs) — exact RBAC and any license/module gating.

## 6. Entry Conditions
- Logged in; Settings reachable.
- To create: at least one **Business Service** exists. TODO(source: docs).
- For meaningful status: monitored data for the bound service.

## 7. Exit Conditions
- **List loads:** counters + rows/cards render.
- **On Create (success):** new SLO appears; Total increments; TODO(source: docs) — toast + audit entry.
- **On Edit/Delete:** row updates/disappears; TODO(source: docs) — confirmation prompt on delete.

## 8. Validations
- Search: free text, no validation.
- Create-form validations — **not captured**. Expected (TODO(source: KG/docs) to confirm):
  - **SLO Name** required and unique.
  - **Target** / **Warning** numeric percentages, `0–100`, with **Warning ≤ Target** (Warning is the
    intermediate band below Target).
  - **Business Service** required (binding).
  - **Frequency** required (Daily / Weekly / Monthly).
  - **Start Date** required / not-in-the-far-past. TODO(source: docs).

## 9. Business Rules
- **Status = Achieved vs Target/Warning:** Achieved ≥ Target → **Ok**; between Warning and Target →
  **Warning**; below → **Breached** (pattern inferred from `SLO.png` badges). TODO(source: KG/docs) —
  exact math.
- **Type ∈ {Availability, Performance}**; **Frequency ∈ {Daily, Weekly, Monthly}** (observed values).
- **One SLO binds to one Business Service** (`Business Service Name`). TODO(source: KG) — cardinality.
- **Correction Profile** windows (maintenance) are excluded from SLO calculation; **Penalty Profile**
  attaches a financial penalty on breach — both are optional bindings defined on sibling tabs.
  TODO(source: KG/docs) — confirm they are selectable on the SLO create form.
- TODO(source: KG/docs) — name uniqueness scope, max SLOs, default frequency.

## 10. Known Bugs
None recorded for this screen. (Searched `knowledge/known_issues/customer-issue-kb.md` for
SLO / service-level / SLA — no matching customer issue for build 8.2.6.)

## 11. Edge Cases
- Duplicate SLO name (collision) → save blocked.
- Warning > Target (inverted thresholds) → validation error expected.
- Target/Warning out of `0–100`, or non-numeric.
- Business Service deleted after an SLO binds to it → orphaned SLO behavior.
- Start Date in the future → status before first window closes (pending vs Ok).
- Frequency change (Daily→Monthly) on an existing SLO → recompute / history reset?
- Target service with no data → Achieved = 0 / N/A.
- Boundary: Achieved exactly == Target, or exactly == Warning threshold.
- Deleting an SLO that a Penalty Profile references.
