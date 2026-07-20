---
screen: Integration · service-now
module: Settings
category: integration
route: "/settings/integration/service-now"
build: 8.2.6
status: draft
sources: [catalog, kb]           # locators/catalog/settings_integration_service_now.json (live Vue-router sweep 2026-07-02); known_issues/customer-issue-kb.md §11
verified: 2026-07-09
---

# Integration · ServiceNow

## 1. Purpose
The connector that forwards **ObserveOps (AIOps)** alerts into **ServiceNow ITSM** so a monitoring
alert automatically raises/updates an incident in ServiceNow.

- **Business objective:** feed AIOps-detected problems into an existing ServiceNow service desk without
  manual ticket entry, keeping monitoring and ITSM in sync.
- **Screen description:** a single connector-configuration form under `Settings → Integration →
  Service Now`. It captures the ServiceNow instance URL, the authenticating **Credential Profile**, a
  fail-over email, and an auto-sync schedule, plus proxy egress. A **Test** button validates the
  connection; **Save** persists the connector.
- **Primary use cases:** initial ServiceNow connector set-up, credential rotation, changing sync cadence,
  re-testing after a ServiceNow instance/cert change.
- **Who uses it:** administrators configuring outbound integrations (see Permissions).
- **Dependencies:** a reachable ServiceNow instance (Server URL) · a **Credential Profile** · optional
  **Proxy Server** · the alert engine emitting alerts · an **Integration Profile**
  (`/settings/integration/integration-profile`) that maps which alerts/severities route here.

## 2. Navigation
```
Settings → Integration → Service Now
```
- **Breadcrumb:** Settings › Integration › Service Now
- **Sibling connectors:** Motadata ServiceOps · Atlassian Jira · Microsoft Teams · Slack · LAMA · Integration Profile
- **URL:** `/settings/integration/service-now` (open the full URL; SPA routing must load the page)

## 3. Actions
Derived from the catalog buttons/controls:
- **Create Credential Profile** (`#create-credential-btn-id`) — add the ServiceNow auth credential inline.
- **Select a Credential Profile** — pick an existing credential (`[data-cy='dropdown-trigger-input']`).
- **Set Server URL, URL Time Out, Fail Over Email** (form fields).
- **Choose the incident trigger/action** — 4 radios captured (more than ServiceOps' 2). TODO(source:
  KG/docs) exact options; likely severity/trigger or create-vs-create+close choices.
- **Toggle Auto Sync ON/OFF** (`#auto-sync-id`) → reveals **Sync Every**.
- **Toggle Use Proxy Server** (second switch).
- **Test** the connection (`#test-btn`).
- **Save / Configure** (`#configure-btn`).
- **Reset** to last-saved (`#reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Server URL | text input (label "Server URL") — the ServiceNow instance URL |
| URL Time Out | text input (label "URL Time Out") |
| Credential Profiles | dropdown `[data-cy='dropdown-trigger-input']` + **Create Credential Profile** `#create-credential-btn-id` |
| Fail Over Email | text input (label "Fail Over Email") |
| Radios (4) | TODO(source: KG/docs) — 4 radios captured; likely the incident trigger/severity/action mode. Confirm live |
| Auto Sync | ant-switch `#auto-sync-id` (ON/OFF) |
| Sync Every | text input, placeholder _Schedule Every_ (visible when Auto Sync ON) |
| Use Proxy Server | second ant-switch (2 switches captured) |
| Test | `#test-btn` |
| Save | `#configure-btn` |
| Reset | `#reset-btn` |
| Settings left-nav + Search | shared Settings shell (placeholder _Search_) |

> Note: ServiceNow has **no "Source" field** (unlike Motadata ServiceOps) but has **4 radios** vs
> ServiceOps' 2 — the extra radios are the main differentiator. Catalog inputs are unnamed/unidded;
> match by label/placeholder. Promote verified locators into the selector-cookbook.

## 5. Permissions
- **Admin-only (expected):** configuring an outbound ITSM connector is a system-level change gated to
  administrators; Operators/Viewers should not edit it. TODO(source: KG/docs) confirm exact permission.
- License/module gating: TODO(source: KG/docs).

## 6. Entry Conditions
- Logged in with access to `/settings/integration/`.
- A reachable ServiceNow instance URL and a valid credential (or ability to create one).
- To route alerts, at least one **Integration Profile** must map alerts to this connector.
- TODO(source: docs) — any module/feature flag required for ServiceNow.

## 7. Exit Conditions
- **On Test:** success/failure banner reflecting reachability + auth.
- **On Save (success):** success toast; connector persists; Auto Sync schedule registered; audit entry
  written. TODO(source: KG) confirm toast + audit.
- **On Reset:** form reverts to last-saved; no server call.

## 8. Validations
- **Server URL** — required, valid ServiceNow instance URL; malformed → inline error. TODO(source: docs) exact rule.
- **URL Time Out** — numeric (seconds); TODO(source: docs) min/max/default.
- **Credential Profiles** — a credential must be selected before Test/Save succeeds.
- **Sync Every** — required when Auto Sync ON; numeric interval. TODO(source: docs) units/min.
- **Fail Over Email** — valid email format if provided.
- **Radio selection** — TODO(source: KG/docs) whether one of the 4 radios is mandatory.

## 9. Business Rules
- **Alert routing is decided by the Integration Profile, not this screen** — this form only defines the
  ServiceNow *connector*; which alerts flow is set in `/settings/integration/integration-profile`.
- **Auto Sync gates the schedule** — **Sync Every** applies only when Auto Sync is ON.
- **Fail Over Email** is the fallback path when a push to ServiceNow fails.
- TODO(source: KG/docs): meaning of the 4 radios; whether the connector is a singleton; field-mapping
  between AIOps alert attributes and ServiceNow incident fields.

## 10. Known Bugs
No **ServiceNow-specific** defect is recorded in `knowledge/known_issues/customer-issue-kb.md` for this
screen. The architecturally analogous **ITSM ticket-lifecycle** class in §11 (recorded against Motadata
ServiceOps) is worth mirroring as ServiceNow regression coverage — it is a field-mapping / close-rule
pattern that applies to any ITSM connector:
- Mandatory external field unpopulated on close blocks auto-close (`PQD-30723 [MOTADATA-6190]`, ServiceOps).
- Attempting to close an already-closed ticket trips the integration circuit-breaker (`PQD-40376
  [MOTADATA-8563]`, ServiceOps).
- §11 also notes the general "field-mapping and identifier-format mistakes on the external system side"
  hotspot for integrations.
> None of these are confirmed against ServiceNow; do not report them as ServiceNow bugs — treat as
> related-pattern coverage. No other ServiceNow issues recorded for this screen.

## 11. Edge Cases
- Save with an unreachable/wrong ServiceNow instance URL; expired/invalid credential.
- Test passes but Save fails (transient network) and vice-versa.
- Auto Sync ON with empty/zero **Sync Every**.
- Proxy ON but proxy unreachable/mis-scoped.
- Each of the 4 radio options exercised (once their meaning is confirmed).
- Mandatory ServiceNow incident field not mapped by AIOps → creation/close fails (ITSM-pattern class).
- Duplicate incidents if the same alert re-routes; incident not updated on alert clear.
- Fail Over Email invalid / mailbox unreachable when a push fails.
- Very short URL Time Out against a slow instance → false failures.
