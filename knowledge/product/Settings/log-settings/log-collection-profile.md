---
screen: Log Settings · log-collection-profile
module: Settings
category: log-settings
route: "/settings/log-settings/log-collection-profile"
build: 8.2.6
status: draft
sources: [catalog]            # knowledge/locators/catalog/settings_log_settings_log_collection_profile.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Log Settings · Log Collection Profile

## 1. Purpose
Manages **log-collection profiles** — reusable configurations that govern *how* logs are collected
from sources (protocol/agent settings, schedule/interval, and which sources they apply to). A
profile is attached to sources so collection behavior is defined once and reused.

> **Grounding caveat:** the live sweep captured **only a single _Search_ input** on this screen —
> no grid columns, buttons, or form fields were recorded (`gridHeaders: []`, `buttons: []`). The
> Purpose above is inferred from the screen name/route and the surrounding Log Settings module;
> everything about the actual controls/columns is **TODO(source: KG/docs)** and must be verified
> live (motadata-explorer) before writing tests. Do not assume a grid or Create button exists until
> confirmed.

- **Business objective (inferred):** standardize log collection across many sources via named
  profiles instead of per-source ad-hoc settings.
- **Screen description:** at minimum a searchable list (a _Search_ input is present). TODO(source:
  KG/docs) — confirm grid vs form, and the Create/edit flow.
- **Who uses it:** log/platform administrators. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** log ingestion enabled/licensed · sources (Log Inventory) · collector/agent.

## 2. Navigation
```
Settings → Log Settings → Log Collection Profile
```
- **Breadcrumb:** Settings › Log Settings › Log Collection Profile
- **URL:** `/settings/log-settings/log-collection-profile` (SPA route; open the full URL).

## 3. Actions
- **Search** — free-text filter (placeholder _Search_) — the only control captured.
- TODO(source: KG/docs) — Create / edit / delete / assign-to-source actions (not captured in the
  sweep; harvest live).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | one unnamed _Search_ text input (no id/name) |

_Locators: raw sweep in `knowledge/locators/catalog/settings_log_settings_log_collection_profile.json`.
The sweep is sparse — the full control set must be harvested live before automation._

## 5. Permissions
- Expected **Admin / log-admin** to manage; others read-only. TODO(source: KG/docs) — exact RBAC +
  license gate.

## 6. Entry Conditions
- Logged in; Log Settings reachable; log ingestion licensed/enabled. TODO(source: docs).

## 7. Exit Conditions
TODO(source: docs) — depends on the (uncaptured) create/edit flow; expected success toast + list row
on save.

## 8. Validations
TODO(source: docs) — no form fields were captured; profile-name uniqueness, required interval/schedule
fields, etc. must be confirmed live.

## 9. Business Rules
- Inferred: a profile is reusable and attached to one or more sources; collection cadence lives here
  rather than per-source. TODO(source: KG) — confirm this model, defaults, and interval limits.

## 10. Known Bugs
None recorded for this screen in `customer-issue-kb.md`.
> Broader log-collection defects (quota-not-reset, verticles-not-started until service restart after
> license apply) are in KB §7 but are pipeline/licensing issues, not specific to this profile screen.
> Do not invent bugs.

## 11. Edge Cases
- Profile with no sources assigned.
- Extremely short/long collection interval.
- Duplicate profile name.
- Editing a profile in use by many sources (mass re-provision).
- Deleting a profile still attached to a source.
> Most edge cases depend on controls not yet captured — revisit after a live harvest.
