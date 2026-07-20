---
screen: Slo · slo
module: SLO
route: "/slo/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/slo.json · screenshots/SLO.png · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# SLO — Service Level Objectives

## 1. Purpose
The **SLO dashboard** — tracks each defined Service Level Objective against its target, showing whether the
service is meeting, at-risk, or breaching its agreed availability/performance level over a chosen frequency.

- **Business objective:** measure and prove service levels (availability/performance) against contractual
  or internal targets, and flag breaches early so teams can act before penalties apply.
- **Screen description:** a header **status summary strip** — **Breached**, **Warning**, **Ok**, **Total**
  counters (screenshot: Breached 3, Warning 0, Ok 1, Total 4); a **Search** box; a view-toggle icon
  (grid/list); and a grid of **SLO cards**. Each card shows the SLO **name** (e.g. *Firewall Availability
  SLO*, *slo-weekly-vm*, *slo-daily-monthly*, *test*), a status badge (**Breached** / **Ok**), **Type**
  (Availability or Performance), **Frequency** (Daily / Weekly / Monthly), and three numbers: **Target %**,
  **Achieved %** (green), **Violation %** (red).
- **Primary use cases:** see all SLOs and their breach status at a glance, search for one, create a new SLO,
  open a card to drill into the SLO's detail.
- **Who uses it:** service owners, SRE/operations, and managers reporting on SLAs.
- **Dependencies:** SLO definitions (Settings → Service Level Objective → SLO Profile) · availability/
  performance data from the poller · optional penalty/correction profiles.

## 2. Navigation
```
Left icon rail → SLO (target/gauge icon)
```
- **URL:** `/slo/` — open the full URL; SPA routing must load the page.
- Title header: **SLO**.

## 3. Actions
- **Create an SLO** — `Create an SLO` button opens the SLO creation flow. TODO(source: KG) confirm target
  (inline wizard vs Settings → Service Level Objective → SLO Profile).
- **Documentation** — `Documentation` button/link opens SLO help docs.
- **Search** — filter SLO cards by name (screenshot shows a Search box; not id-captured in catalog).
- **Filter by status** — the header counters (Breached / Warning / Ok / Total) act as status filters.
- **Toggle view** — grid/list view icon (top-right).
- **Open an SLO** — click a card to drill into its detail. TODO(source: KG) confirm route.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Status summary strip | Breached · Warning · Ok · Total counters |
| Search | search box (screenshot) — not in catalog sweep |
| View toggle | grid/list icon (top-right) |
| SLO card | name · status badge (Breached/Ok) · Type · Frequency · Target/Achieved/Violation % |
| Create an SLO | `Create an SLO` button |
| Documentation | `Documentation` button/link |

> The catalog captured only two buttons (`Create an SLO`, `Documentation`) — no inputs/grid — because the
> body is a **card dashboard**, not a form. The Search box and status filters are visible in the screenshot;
> resolve their locators live.

_Locators: see `knowledge/locators/catalog/slo.json`; promote verified ones into the cookbook (SLO)._

## 5. Permissions
- **View:** service owners / operators / managers with SLO access.
- **Create an SLO:** Admin/Operator (it persists a definition). TODO(source: KG/docs) confirm the role gate
  and whether SLO create is here or under Settings → Service Level Objective.

## 6. Entry Conditions
- User is logged in; SLO module licensed/enabled.
- At least one SLO is defined (else empty dashboard with Total 0).
- Availability/performance data exists for the SLO's monitors over the chosen frequency window.

## 7. Exit Conditions
- **Cards render** with live Target/Achieved/Violation and correct status badge; the header counters equal
  the card counts (Breached + Warning + Ok = Total).
- **On Create (success):** a new SLO card appears; audit entry written. TODO(source: KG) confirm toast.
- Viewing is read-only (no side effects).

## 8. Validations
- No editable fields on the dashboard itself.
- **Create an SLO** form validations (name, target %, type, frequency, monitor selection) live in the
  creation flow — TODO(source: KG/docs): required fields, target range (0–100 %), name uniqueness.
- Displayed math: **Achieved % + Violation %** should reconcile (screenshot: 9.380 + 90.630 = 100.010,
  15.770 + 84.230 = 100.000) — verify rounding. TODO(source: KG) confirm the exact relationship (Achieved
  vs Target vs Violation).

## 9. Business Rules
- **Status is derived from Achieved vs Target:** Achieved below Target → **Breached**; near/at-risk →
  **Warning**; meeting → **Ok**. (Screenshot: Firewall SLO Target 95 %, Achieved 9.380 % → Breached; test
  Target 50 %, Achieved 100 % → Ok.)
- **Type** ∈ {Availability, Performance}; **Frequency** ∈ {Daily, Weekly, Monthly} — the frequency defines
  the evaluation window.
- **Violation %** is the complement of Achieved within the window.
- TODO(source: KG/docs): how penalty/correction profiles adjust Achieved; the exact Warning threshold band
  between Ok and Breached.

## 10. Known Bugs
_None recorded specifically for the SLO screen in `customer-issue-kb.md`._
Related (feature-gap, not an SLO-screen defect): the KB notes **penalty calculation** was not available in
product reports and needed a custom script (§4, PQD-39579 / MOTADATA-8368) — relevant if an SLO penalty
report is expected. Do not treat as an SLO dashboard bug.

## 11. Edge Cases
- **No SLOs defined** — empty dashboard, Total 0.
- SLO whose monitors have **no data** in the window — Achieved/Violation undefined vs 0 %.
- Target boundary values (0 %, 100 %); Achieved exactly at Target (Ok vs Warning edge).
- Rounding: Achieved + Violation ≠ exactly 100 (screenshot shows 100.010) — display tolerance.
- Frequency window straddling a **month/DST boundary** (Monthly SLO).
- Very long SLO name — card truncation.
- Status filter with zero matches (e.g. Warning 0) — empty state.
- **Raw vs aggregated data divergence** for longer windows (KB §4) — a Monthly availability SLO may hit the
  raw/aggregation retention boundary and read differently than a raw report.
