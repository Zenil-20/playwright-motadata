---
screen: Integration · motadata-serviceops
module: Settings
category: integration
route: "/settings/integration/motadata-serviceops"
build: 8.2.6
status: draft
sources: [catalog, kb]           # locators/catalog/settings_integration_motadata_serviceops.json (live Vue-router sweep 2026-07-02); known_issues/customer-issue-kb.md §11
verified: 2026-07-09
---

# Integration · Motadata ServiceOps

## 1. Purpose
The connector that lets **ObserveOps (AIOps)** push alerts into **Motadata ServiceOps** (Motadata's own
ITSM/service-desk product) so that a monitoring alert automatically raises/updates an incident or ticket
there.

- **Business objective:** close the monitor→ticket loop — when AIOps detects a problem, ServiceOps gets
  an incident without a human re-keying it, and (where supported) status flows back.
- **Screen description:** a single connector-configuration form under `Settings → Integration →
  Motadata ServiceOps`. It captures the ServiceOps endpoint, the credential to authenticate with, an
  alert **Source**, a fail-over email, and an auto-sync schedule. A **Test** button validates the
  connection; **Save** persists the connector.
- **Primary use cases:** first-time set-up of the ServiceOps connector, rotating its credential,
  changing the sync cadence, or testing connectivity after a ServiceOps URL/cert change.
- **Who uses it:** administrators configuring outbound integrations (see Permissions).
- **Dependencies:** a reachable ServiceOps server (Server URL) · a **Credential Profile** (created here
  or in the shared credential store) · optional **Proxy Server** for egress · the alert engine that
  emits the alerts being forwarded · an **Integration Profile** (`/settings/integration/integration-profile`)
  that decides *which* alerts/severities are routed to this connector.

## 2. Navigation
```
Settings → Integration → Motadata ServiceOps
```
- **Breadcrumb:** Settings › Integration › Motadata ServiceOps
- **Sibling connectors:** Service Now · Atlassian Jira · Microsoft Teams · Slack · LAMA · Integration Profile
- **URL:** `/settings/integration/motadata-serviceops` (open the full URL; SPA routing must load the page)

## 3. Actions
Derived from the catalog buttons/controls:
- **Create Credential Profile** — open the credential dialog to add the ServiceOps auth credential
  inline (`#create-credential-btn-id`).
- **Select a Credential Profile** — pick an existing credential (dropdown, `[data-cy='dropdown-trigger-input']`).
- **Set Server URL, URL Time Out, Source, Fail Over Email** (form fields).
- **Toggle Auto Sync ON/OFF** (`#auto-sync-id`) — when ON, reveals the **Sync Every** schedule.
- **Toggle Use Proxy Server** (second switch) — route the outbound call through a proxy.
- **Test** the connection (`#test-btn`) — validate reachability/auth without saving.
- **Save / Configure** the connector (`#configure-btn`).
- **Reset** the form to last-saved values (`#reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Server URL | text input (label "Server URL") |
| URL Time Out | text input (label "URL Time Out") |
| Credential Profiles | dropdown `[data-cy='dropdown-trigger-input']` (placeholder _Select_) + **Create Credential Profile** `#create-credential-btn-id` |
| Source | field/selector (label "Source") — the alert source ObserveOps stamps on the ServiceOps ticket. TODO(source: KG/docs) exact values |
| Fail Over Email | text input (label "Fail Over Email") — where a notification goes if the push fails |
| Auto Sync | ant-switch `#auto-sync-id` (**ON**/OFF) |
| Sync Every | text input, placeholder _Schedule Every_ (visible when Auto Sync ON) |
| Use Proxy Server | second ant-switch (2 switches captured) |
| Radios (2) | TODO(source: KG/docs) — 2 radios captured; likely the ticket trigger/action mode (e.g. create-on-alert vs create-and-close). Confirm live |
| Test | `#test-btn` |
| Save | `#configure-btn` |
| Reset | `#reset-btn` |
| Settings left-nav + Search | shared Settings shell (placeholder _Search_) |

> Catalog inputs are unnamed/unidded (`name`/`id` empty) — the fields are matched by label/placeholder.
> Promote verified locators into `knowledge/locators/selector-cookbook.md` (Settings > Integration).

## 5. Permissions
- **Admin-only (expected):** configuring an outbound integration writes a system-level connector, so it
  is gated to administrators; Operators/Viewers should not see or edit it. TODO(source: KG/docs) confirm
  the exact role/permission (e.g. an "Integration" or "Settings" write permission).
- License/module gating: TODO(source: KG/docs) — whether the ServiceOps connector requires a specific
  license/module flag.

## 6. Entry Conditions
- Logged in with a session that can reach `/settings/integration/`.
- A reachable ServiceOps server URL and a valid credential (or the ability to create one).
- To actually route alerts, at least one **Integration Profile** must map alerts to this connector.
- TODO(source: docs) — any module/feature flag that must be enabled for ServiceOps.

## 7. Exit Conditions
- **On Test:** success/failure banner reflecting reachability + auth (good assertion target).
- **On Save (success):** success toast; connector persists; Auto Sync schedule is registered; an audit
  entry is written (Audit Trail). TODO(source: KG) confirm toast text + audit record.
- **On Reset:** form reverts to last-saved values; no server call.

## 8. Validations
- **Server URL** — required, must be a valid URL/host; malformed URL → inline error. TODO(source: docs) exact rule.
- **URL Time Out** — numeric (seconds); TODO(source: docs) min/max/default.
- **Credential Profiles** — a credential must be selected before Test/Save can succeed.
- **Sync Every** — required when Auto Sync is ON; numeric interval. TODO(source: docs) units/min.
- **Fail Over Email** — valid email format if provided.
- **Test must pass** before Save is meaningful — TODO(source: KG) confirm whether Save is blocked until a
  successful Test.

## 9. Business Rules
- **Alert routing is decided by the Integration Profile, not this screen** — this form only defines the
  *connector* (where/how to reach ServiceOps); which severities/alerts flow is set in
  `/settings/integration/integration-profile`.
- **Auto Sync gates the schedule** — the **Sync Every** interval only applies when Auto Sync is ON.
- **Fail Over Email** is the fallback notification path when the push to ServiceOps fails.
- TODO(source: KG/docs): whether the connector is a singleton (one ServiceOps connector) or multiple;
  meaning of the two radios; exact **Source** semantics.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` §11 (Integrations — ServiceOps ticket lifecycle):
- **Auto-close of ServiceOps tickets fails when a mandatory custom field is unpopulated.**
  `PQD-30723 [MOTADATA-6190]` · Symptom: AIOps creates the ticket but cannot auto-close it. Diagnosis:
  ServiceOps close-rules require a mandatory custom field that AIOps does not populate. Workaround:
  relax/populate the mandatory close field on the ServiceOps side.
- **Integration circuit-breaker trips when AIOps tries to close an already-manually-closed ticket.**
  `PQD-40376 [MOTADATA-8563]` · Fix/behaviour: ServiceOps workflow now sends an ACK back to AIOps on
  manual close (bi-directional sync) so AIOps stops attempting the redundant close.
- **Related (Integration Profile side):** NullPointerException when **only one severity** is configured
  in an integration profile — `PQD-35982 / PQD-35984 [MOTADATA-7641]` (fixed 8.2.x). See
  `integration-profile.md`. Relevant because this connector only fires when a profile routes alerts to it.

## 11. Edge Cases
- Save with an unreachable/wrong Server URL; expired/invalid credential; wrong ServiceOps API path.
- Test passes but Save fails (transient network) and vice-versa.
- Auto Sync ON with an empty/zero **Sync Every**.
- Proxy ON but proxy unreachable or mis-scoped.
- Close-loop: alert clears in AIOps while the ServiceOps ticket was already closed manually (the
  `MOTADATA-8563` circuit-breaker class).
- ServiceOps mandatory custom field required on close but not mapped (the `MOTADATA-6190` class).
- Fail Over Email invalid / mailbox unreachable when a push fails.
- Very short URL Time Out against a slow ServiceOps server → false failures.
- Concurrent edits to the connector from two admin sessions (last-write-wins?).
