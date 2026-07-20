---
screen: Integration
module: Settings
category: integration
route: "/settings/integration/"
build: 8.2.6
status: draft
sources: [catalog, kb]           # locators/catalog/settings_integration.json (live Vue-router sweep 2026-07-02); known_issues/customer-issue-kb.md §11
verified: 2026-07-09
---

# Integration (Overview)

## 1. Purpose
The **Integration** section of Settings — the hub for wiring ObserveOps (AIOps) alerts and data to
external systems. It groups the outbound **connectors** (Motadata ServiceOps, ServiceNow, Atlassian Jira,
Microsoft Teams, Slack), the **Integration Profile** routing layer, and the **LAMA** data-exchange
profiles.

- **Business objective:** one place to connect AIOps to the customer's ITSM/collaboration/data stack so
  monitoring alerts become tickets/messages and external data flows in.
- **Screen description:** landing route `/settings/integration/`. The sweep of this route captured the
  **same connector form as Motadata ServiceOps** (labels Server URL, URL Time Out, Credential Profiles,
  **Source**, Fail Over Email, Auto Sync, Sync Every, Use Proxy Server; 2 switches, 2 radios; Create
  Credential / Reset / Test / Save) — i.e. the section **defaults to the first connector** rather than a
  distinct dashboard. Treat the connector detail here as documented in `motadata-serviceops.md`.
- **Primary use cases:** navigate to a specific connector; land here and configure the default connector.
- **Who uses it:** administrators configuring integrations (see Permissions).
- **Dependencies:** same as the individual connectors — reachable external systems, credential profiles,
  optional proxy, the alert engine, and integration profiles for routing.

## 2. Navigation
```
Settings → Integration
```
- **Breadcrumb:** Settings › Integration
- **Children:** Motadata ServiceOps · Service Now · Atlassian Jira · Microsoft Teams · Slack · LAMA · Integration Profile
- **URL:** `/settings/integration/` (open the full URL; SPA routing must load the page). Landing here
  renders the default connector form.

## 3. Actions
Because the landing renders the default (ServiceOps-style) connector, the captured actions are the
connector actions:
- **Create Credential Profile** (`#create-credential-btn-id`)
- **Select a Credential Profile** (`[data-cy='dropdown-trigger-input']`)
- **Toggle Auto Sync** (`#auto-sync-id`) → reveals **Sync Every**; **Toggle Use Proxy Server**
- **Test** (`#test-btn`) · **Save/Configure** (`#configure-btn`) · **Reset** (`#reset-btn`)
- **Navigate** to a sibling connector / Integration Profile / LAMA via the section sub-nav.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Server URL / URL Time Out / Source / Fail Over Email | text inputs (default connector form) |
| Credential Profiles | dropdown `[data-cy='dropdown-trigger-input']` + `#create-credential-btn-id` |
| Auto Sync | `#auto-sync-id` (ON/OFF) → **Sync Every** (placeholder _Schedule Every_) |
| Use Proxy Server | second switch (2 switches captured) |
| Radios (2) | TODO(source: KG/docs) — as on ServiceOps |
| Test / Save / Reset | `#test-btn` / `#configure-btn` / `#reset-btn` |
| Section sub-nav | links to the connectors, Integration Profile, LAMA |
| Settings left-nav + Search | shared Settings shell (placeholder _Search_) |

> The overview and `motadata-serviceops` catalogs are **identical** — the section landing = the default
> connector. For the connector's full field-by-field detail see `motadata-serviceops.md`. If a future
> sweep shows a distinct overview/dashboard, re-capture. Promote verified locators into the cookbook.

## 5. Permissions
- **Admin-only (expected):** the Integration section configures system-level connectors, so it is gated
  to administrators; Operators/Viewers should not edit. TODO(source: KG/docs) confirm exact permission.
- License/module gating: TODO(source: KG/docs) — some connectors (e.g. LAMA) may be licensed add-ons.

## 6. Entry Conditions
- Logged in with access to `/settings/`.
- TODO(source: docs) — any module/feature flag for the Integration section.

## 7. Exit Conditions
- Navigating to a child renders that connector/list.
- Saving the default connector behaves as documented in `motadata-serviceops.md` (toast + persist +
  audit).

## 8. Validations
- Inherit the default connector's validations (see `motadata-serviceops.md` §8): Server URL required,
  numeric URL Time Out, credential required, Sync Every required when Auto Sync ON, valid Fail Over Email.

## 9. Business Rules
- **The Integration section separates "how to reach" (connectors) from "what to send" (Integration
  Profile).** Connectors do nothing until an Integration Profile routes alerts to them.
- The landing defaults to a connector rather than a summary dashboard.
- TODO(source: KG/docs): whether the default connector is fixed (ServiceOps) or the last-visited one.

## 10. Known Bugs
Because the landing defaults to the ServiceOps connector, the ServiceOps ticket-lifecycle bugs apply here
too — see `motadata-serviceops.md` §10 and `knowledge/known_issues/customer-issue-kb.md` §11:
- Auto-close blocked by an unpopulated mandatory ServiceOps field — `PQD-30723 [MOTADATA-6190]`.
- Circuit-breaker trips closing an already-closed ticket — `PQD-40376 [MOTADATA-8563]`.
- Integration-Profile single-severity NPE (§2) — `PQD-35982 / PQD-35984 [MOTADATA-7641]`.
> No overview-specific issues recorded beyond the child screens' bugs.

## 11. Edge Cases
- Land on `/settings/integration/` and confirm which connector renders by default (fixed vs last-visited).
- All the default connector edge cases (see `motadata-serviceops.md` §11).
- Navigate between children with unsaved edits — confirm a discard/confirm prompt or data loss.
- Deep-link directly to `/settings/integration/` vs a child route.
