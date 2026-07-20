---
screen: Service Level Objective · penalty-profile
module: Settings
category: service-level-objective
route: "/settings/service-level-objective/penalty-profile"
build: 8.2.6
status: draft                # catalog verified; no dedicated screenshot; business rules marked TODO
sources: [catalog, kb]       # locators/catalog/settings_service_level_objective_penalty_profile.json, known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Service Level Objective · Penalty Profile

## 1. Purpose
The **Penalty Profile** tab manages the **financial penalties** applied when an SLO/SLA is breached —
mapping a contract's monetary terms to the objectives tracked in the SLO module.

- **Business objective:** quantify the business cost of a breach — a penalty profile carries a
  **Contract Amount** and **Currency** and (via the SLO Profile) attaches a penalty when the objective
  is not met, so reports can show the financial exposure of missed SLAs. (Inferred from the
  `Contract Amount` / `Currency` columns; TODO(source: KG/docs) to confirm the calculation.)
- **Screen description:** a searchable list grid with columns **Penalty Profile Name · Description ·
  Contract Amount · Currency · Action**, plus a **Create Penalty Profile** button; rows expose a
  `[data-cy='grid-action']` action control.
- **Primary use cases:** define a penalty tied to a contract value/currency, describe it, and bind it to
  an SLO so breaches carry a costed penalty.
- **Who uses it:** administrators / contract or service owners. TODO(source: KG/docs).
- **Dependencies:** an authenticated session · the SLO module · consumed by **SLO Profiles** on breach.
  TODO(source: KG) — confirm binding direction and penalty formula.

## 2. Navigation
```
Settings → Service Level Objective → Penalty Profile
```
- **URL:** `/settings/service-level-objective/penalty-profile`.
- **Sibling tabs:** SLO Profile · Correction Profile · Penalty Profile.

## 3. Actions
- **Create Penalty Profile** — `#create-penalty-profile-btn-id`.
- **Search** — `input[name="search-penalty-profile"]` (placeholder _Search_).
- **Row actions** — `[data-cy='grid-action']` (Action column) — TODO(source: KG/docs): View / Edit / Delete.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-penalty-profile"]` (placeholder _Search_) |
| Create Penalty Profile (primary) | `#create-penalty-profile-btn-id` |
| Row action | `[data-cy='grid-action']` |
| Grid columns | Penalty Profile Name · Description · Contract Amount · Currency · Action |

> No screenshot exists for this tab and the sweep captured `selects/switches/radios/checkboxes = 0`, so
> the **Create Penalty Profile** form (name, description, contract amount, currency, and the penalty
> rule/slab tied to breach severity) was **not captured**. Note a **Currency** field implies a currency
> **select** on the create form even though the list itself reports 0 selects. Confirm live or via KG.

_Locators: catalog `knowledge/locators/catalog/settings_service_level_objective_penalty_profile.json`;
promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Penalty Profile)._

## 5. Permissions
- Generic-but-reasoned: **Admin** / contract owner creates and manages penalty profiles.
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
  - **Penalty Profile Name** required and unique.
  - **Contract Amount** required, numeric ≥ 0.
  - **Currency** required (from a fixed currency list). TODO(source: docs) — allowed set.
  - **Description** optional / max length. TODO(source: docs).

## 9. Business Rules
- A penalty profile attaches a **costed penalty on SLO breach**; the **Contract Amount + Currency**
  quantify it. TODO(source: KG/docs) — exact penalty formula (flat vs. per-violation-% vs. slab).
- Likely **name-unique** within the module; consumed by SLO Profiles. TODO(source: KG).
- **Currency** is a fixed enumeration; TODO(source: docs) — whether a system default currency applies.
- TODO(source: KG/docs) — max profiles, amount precision/limits.

## 10. Known Bugs
None recorded for this screen. (Searched `knowledge/known_issues/customer-issue-kb.md` for
penalty / service-level / SLA — no matching customer issue for build 8.2.6. A report on "penalty calc"
KPIs being absent from custom reports exists but concerns the Reports module, not this screen.)

## 11. Edge Cases
- Duplicate Penalty Profile name.
- Contract Amount of 0, negative, or non-numeric; very large amount / precision overflow.
- Currency mismatch across profiles bound to the same business service.
- Deleting a penalty profile referenced by an active SLO.
- Empty grid (no profiles) → Create is the only action.
- Very long Description / Unicode in name.
- Changing Currency on an existing profile after breaches were already penalised.
