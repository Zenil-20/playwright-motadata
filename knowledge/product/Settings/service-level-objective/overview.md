---
screen: Service Level Objective
module: Settings
category: service-level-objective
route: "/settings/service-level-objective/"
build: 8.2.6
status: draft                       # catalog + SLO.png verified; several business rules marked TODO
sources: [catalog, screenshot, kb]  # locators/catalog/settings_service_level_objective.json, screenshots/SLO.png, known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Service Level Objective

## 1. Purpose
The **Service Level Objective (SLO)** landing screen — the module home under `Settings`, which opens
on the **SLO Profile** list. It tracks, for each configured objective, whether a business service is
meeting its agreed availability/performance target over a chosen period.

- **Business objective:** measure and report service commitments (SLAs) — e.g. "the Firewall must be
  ≥ 95% available (Daily)" — and surface breaches so operators and service owners can act.
- **Screen description:** a header with roll-up counters — **Breached**, **Warning**, **Ok**, **Total**
  — over a searchable list of SLO cards. Each card shows the SLO name, a status badge
  (Breached / Warning / Ok), **Type** (Availability / Performance), **Frequency** (Daily / Weekly /
  Monthly), and the **Target %**, **Achieved %** and **Violation %**. (Observed in `SLO.png`.)
- **Sibling screens (module tabs):** SLO Profile · Correction Profile · Penalty Profile.
- **Primary use cases:** review current SLO health at a glance, filter/search to a specific objective,
  drill into a card, and create a new SLO Profile.
- **Who uses it:** service owners, NOC/operations, and administrators who own the SLA commitments.
  TODO(source: KG/docs) — exact roles.
- **Dependencies:** an authenticated session · at least one **Business Service** (SLO cards bind to a
  business service — see the `Business Service Name` grid column) · monitored data (availability /
  performance metrics) for the target service.

## 2. Navigation
```
Settings (left-nav gear) → Service Level Objective
```
- **URL:** `/settings/service-level-objective/` (SPA route; open the full URL so Vue routing loads it).
- **Lands on:** the **SLO Profile** list — the base route and `.../slo-profile` share the same catalog
  (grid + `create-slo-profile-btn-id`), so the module root defaults to SLO Profile.
- **Module tabs:** SLO Profile · Correction Profile · Penalty Profile.
- TODO(source: KG/docs) — confirm the exact left-nav label / icon and breadcrumb text.

## 3. Actions
- **Search** SLO profiles — `input[name="search-slo-profile"]` (placeholder _Search_).
- **Filter by status** via the header counters — **Breached / Warning / Ok / Total** (from `SLO.png`).
  TODO(source: KG/docs) — confirm the counters are clickable filters vs. display-only.
- **Toggle view** — a card/grid layout toggle sits top-right of the list (icon in `SLO.png`).
- **Show / hide columns** (grid view) — `#btn-show-hide-columns`.
- **Create SLO Profile** — `#create-slo-profile-btn-id` (button label "Create SLO Profile").
- **Row / card actions** — the grid has an `Action` column; TODO(source: KG/docs) — confirm the exact
  actions (View / Edit / Delete / Clone).

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Status roll-up: Breached / Warning / Ok / Total | header counters (from `SLO.png`) |
| Search | `input[name="search-slo-profile"]` (placeholder _Search_) + an unnamed search input |
| View toggle (card ⇄ grid) | top-right toggle icon (from `SLO.png`) |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create SLO Profile (primary) | `#create-slo-profile-btn-id` |
| List grid columns | SLO Name · SLO Type · Frequency · Warning · Target · Business Service Name · Start Date · Action |
| Card fields (card view) | Name · status badge · Type · Frequency · Target% · Achieved% · Violation% |

> The catalog reports `selects: 0, switches: 0, radios: 0, checkboxes: 0` for this list — inputs beyond
> the two search boxes live on the **Create SLO Profile** dialog/page, which the sweep did not open.
> Confirm that form live or via the KG before asserting on its fields.

_Locators: catalog `knowledge/locators/catalog/settings_service_level_objective.json`; promote verified
ones into `knowledge/locators/selector-cookbook.md` (Settings > Service Level Objective)._

## 5. Permissions
- Generic-but-reasoned: **Admin** manages SLO profiles (create/edit/delete); operators/service owners
  view SLO health and drill in.
- TODO(source: KG/docs) — exact RBAC matrix (which role can create vs. view-only) and whether SLO is
  license/module-gated.

## 6. Entry Conditions
- User is logged in; Settings is reachable.
- At least one **Business Service** exists to bind an SLO to (empty otherwise). TODO(source: docs).
- Monitoring data flows for the target service so Achieved/Violation can compute.

## 7. Exit Conditions
- **List loads:** counters populate (Breached/Warning/Ok/Total) and cards/rows render.
- **On Create (success):** a new SLO row/card appears; Total increments; TODO(source: docs) — success
  toast text + audit entry.
- **On search:** the list narrows to matching SLO names.

## 8. Validations
- Search is free text; no validation.
- Create-form field validations (name uniqueness, Target/Warning numeric ranges, date rules) live on
  the Create SLO Profile dialog — **not captured**. TODO(source: KG/docs).

## 9. Business Rules
- **Status derives from Achieved vs. Target/Warning:** `SLO.png` shows Achieved below Target rendering
  a **Breached** badge (e.g. Achieved 9.38% vs Target 95%). Warning is the intermediate band between
  Warning threshold and Target. TODO(source: KG/docs) — exact threshold math.
- **Type** is one of **Availability** or **Performance**; **Frequency** is **Daily / Weekly / Monthly**
  (values observed in `SLO.png`).
- **An SLO binds to a Business Service** (`Business Service Name` column). TODO(source: KG) — one SLO per
  service, or many?
- **Violation % = 100 − Achieved %** appears to hold in the samples (e.g. 84.23% Achieved → but shown as
  15.77%/84.23% pair) — TODO(source: KG/docs) confirm the exact Achieved/Violation definition; the
  sample values are not internally consistent under a naive `100 − Achieved`.
- TODO(source: KG/docs) — SLO name uniqueness, defaults, and limits.

## 10. Known Bugs
None recorded for this screen. (Searched `knowledge/known_issues/customer-issue-kb.md` for
SLO / service-level / SLA — no matching customer issue for build 8.2.6.)

## 11. Edge Cases
- No Business Services configured → cannot create an SLO (empty binding list).
- SLO whose target service has no recent data → Achieved/Violation undefined (0% / N/A?).
- All statuses at once (Breached + Warning + Ok) → counters must sum to Total.
- Search with no matches → empty list; special characters in SLO name.
- Newly created SLO before its first evaluation window closes → status "pending" vs. Ok?
- Very large number of SLO profiles → card view performance / pagination.
- Boundary: Achieved exactly == Target (Ok vs Warning); Achieved exactly == Warning threshold.
