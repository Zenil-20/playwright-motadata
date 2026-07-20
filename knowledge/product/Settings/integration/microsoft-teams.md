---
screen: Integration · microsoft-teams
module: Settings
category: integration
route: "/settings/integration/microsoft-teams"
build: 8.2.6
status: draft
sources: [catalog, kb]           # locators/catalog/settings_integration_microsoft_teams.json (live Vue-router sweep 2026-07-02); known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Integration · Microsoft Teams

## 1. Purpose
The connector that forwards **ObserveOps (AIOps)** alerts into **Microsoft Teams** so a monitoring alert
is delivered as a Teams message/notification to a channel.

- **Business objective:** push AIOps alerts into a Teams channel so teams that collaborate in Teams see
  monitoring problems in-line, without email.
- **Screen description:** a single connector-configuration form under `Settings → Integration →
  Microsoft Teams`. It is the **simplest** of the connectors — it captures only a **Credential Profile**,
  a **Time Out**, and an auto-sync schedule (no Server URL, no proxy, no radios). **Save** persists the
  connector.
- **Primary use cases:** initial Teams connector set-up, credential rotation, changing sync cadence.
- **Who uses it:** administrators configuring outbound integrations (see Permissions).
- **Dependencies:** a **Credential Profile** carrying the Teams webhook/app auth · the alert engine · an
  **Integration Profile** (`/settings/integration/integration-profile`) that maps which alerts/severities
  route here.

## 2. Navigation
```
Settings → Integration → Microsoft Teams
```
- **Breadcrumb:** Settings › Integration › Microsoft Teams
- **Sibling connectors:** Motadata ServiceOps · Service Now · Atlassian Jira · Slack · LAMA · Integration Profile
- **URL:** `/settings/integration/microsoft-teams` (open the full URL; SPA routing must load the page)

## 3. Actions
Derived from the catalog buttons/controls:
- **Create Credential Profile** (`#create-credential-btn-id`) — add the Teams auth credential inline.
- **Select a Credential Profile** — pick an existing credential (`[data-cy='dropdown-trigger-input']`).
- **Set Time Out** (form field).
- **Toggle Auto Sync ON/OFF** (`#auto-sync-id`) → reveals **Sync Every**.
- **Save / Configure** (`#configure-btn`).
- **Reset** to last-saved (`#reset-btn`).

> Note: this connector has **no Test button** and **no proxy switch** (only 1 switch — Auto Sync)
> in the sweep, unlike the ITSM connectors.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Credential Profiles | dropdown `[data-cy='dropdown-trigger-input']` (placeholder _Select_) + **Create Credential Profile** `#create-credential-btn-id` |
| Time Out | text input (label "Time Out") |
| Auto Sync | ant-switch `#auto-sync-id` (ON/OFF) — the only switch captured |
| Sync Every | text input, placeholder _Schedule Every_ (visible when Auto Sync ON) |
| Save | `#configure-btn` |
| Reset | `#reset-btn` |
| Settings left-nav + Search | shared Settings shell (placeholder _Search_) |

> Only **1 switch, 0 radios, no Server URL, no Test** — the leanest connector form. Catalog inputs are
> unnamed/unidded; match by label/placeholder. Promote verified locators into the selector-cookbook.

## 5. Permissions
- **Admin-only (expected):** configuring an outbound connector is a system-level change gated to
  administrators. TODO(source: KG/docs) confirm exact permission.
- License/module gating: TODO(source: KG/docs).

## 6. Entry Conditions
- Logged in with access to `/settings/integration/`.
- A valid Teams credential (webhook/app registration) or the ability to create one.
- To route alerts, at least one **Integration Profile** must map alerts to this connector.
- TODO(source: docs) — any module/feature flag required for Teams.

## 7. Exit Conditions
- **On Save (success):** success toast; connector persists; Auto Sync schedule registered; audit entry
  written. TODO(source: KG) confirm toast + audit.
- **On Reset:** form reverts to last-saved; no server call.
- TODO(source: KG) — since there is no Test button, confirm how connectivity is validated (only on the
  first real push?).

## 8. Validations
- **Credential Profiles** — a credential must be selected before Save succeeds.
- **Time Out** — numeric (seconds); TODO(source: docs) min/max/default.
- **Sync Every** — required when Auto Sync ON; numeric interval. TODO(source: docs) units/min.

## 9. Business Rules
- **Alert routing is decided by the Integration Profile, not this screen** — this form only defines the
  Teams *connector*; which alerts flow is set in `/settings/integration/integration-profile`.
- **Auto Sync gates the schedule** — **Sync Every** applies only when Auto Sync is ON.
- TODO(source: KG/docs): whether the connector is a singleton; the target channel selection mechanism;
  message formatting.

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`. The
notification-channel-failure class (§5, e.g. email/SMS delivery — `PQD-29942`, `PQD-40517`) is about
other channels, not Teams; do not attribute it here. No Microsoft-Teams issues are recorded.

## 11. Edge Cases
- Save with an invalid/expired Teams credential or a revoked webhook.
- Auto Sync ON with empty/zero **Sync Every**.
- Very short **Time Out** against a slow Teams endpoint → delivery failures.
- No Test button: a mis-configured connector is only discovered on the first real alert push — confirm
  the failure surfaces somewhere (toast/audit/alert history).
- Teams channel deleted/renamed after configuration.
- Message flood if a high-frequency alert routes to Teams (rate limiting?).
