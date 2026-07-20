---
screen: Integration · atlassian-jira
module: Settings
category: integration
route: "/settings/integration/atlassian-jira"
build: 8.2.6
status: draft
sources: [catalog, kb]           # locators/catalog/settings_integration_atlassian_jira.json (live Vue-router sweep 2026-07-02); known_issues/customer-issue-kb.md §5,§11
verified: 2026-07-09
---

# Integration · Atlassian Jira

## 1. Purpose
The connector that forwards **ObserveOps (AIOps)** alerts into **Atlassian Jira** so a monitoring alert
automatically raises/updates a Jira issue.

- **Business objective:** turn AIOps alerts into Jira issues automatically so ops/dev teams that live in
  Jira get monitoring problems in their existing tracker.
- **Screen description:** a single connector-configuration form under `Settings → Integration →
  Atlassian Jira`. It captures the Jira Server URL, the authenticating **Credential Profile**, a
  fail-over email, an **If alert re-occurs** behaviour, and an auto-sync schedule, plus proxy egress.
  A **Test** button validates the connection; **Save** persists the connector.
- **Primary use cases:** initial Jira connector set-up, credential rotation, tuning re-occurrence
  behaviour, changing sync cadence, re-testing after a Jira URL/cert change.
- **Who uses it:** administrators configuring outbound integrations (see Permissions).
- **Dependencies:** a reachable Jira server (Server URL) · a **Credential Profile** · optional **Proxy
  Server** · the alert engine · an **Integration Profile**
  (`/settings/integration/integration-profile`) that maps which alerts/severities route here.

## 2. Navigation
```
Settings → Integration → Atlassian Jira
```
- **Breadcrumb:** Settings › Integration › Atlassian Jira
- **Sibling connectors:** Motadata ServiceOps · Service Now · Microsoft Teams · Slack · LAMA · Integration Profile
- **URL:** `/settings/integration/atlassian-jira` (open the full URL; SPA routing must load the page)

## 3. Actions
Derived from the catalog buttons/controls:
- **Create Credential Profile** (`#create-credential-btn-id`) — add the Jira auth credential inline.
- **Select a Credential Profile** — pick an existing credential (`[data-cy='dropdown-trigger-input']`).
- **Set Server URL, URL Time Out, Fail Over Email** (form fields).
- **Configure "If alert re-occurs"** — the re-occurrence handling (2 radios captured). TODO(source:
  KG/docs) exact options (e.g. reopen existing issue vs create new).
- **Toggle Auto Sync ON/OFF** (`#auto-sync-id`) → reveals **Sync Every**.
- **Toggle Use Proxy Server** (second switch).
- **Test** the connection (`#test-btn`).
- **Save / Configure** (`#configure-btn`).
- **Reset** to last-saved (`#reset-btn`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Server URL | text input (label "Server URL") — the Jira server URL |
| URL Time Out | text input (label "URL Time Out") |
| Credential Profiles | dropdown `[data-cy='dropdown-trigger-input']` + **Create Credential Profile** `#create-credential-btn-id` |
| Fail Over Email | text input (label "Fail Over Email") |
| If alert re-occurs | label "If alert re-occurs" with 2 radios — re-occurrence handling. TODO(source: KG/docs) exact options |
| Auto Sync | ant-switch `#auto-sync-id` (ON/OFF) |
| Sync Every | text input, placeholder _Schedule Every_ (visible when Auto Sync ON) |
| Use Proxy Server | second ant-switch (2 switches captured) |
| Test | `#test-btn` |
| Save | `#configure-btn` |
| Reset | `#reset-btn` |
| Settings left-nav + Search | shared Settings shell (placeholder _Search_) |

> Jira is distinguished from the other connectors by the **"If alert re-occurs"** field (the 2 radios).
> Catalog inputs are unnamed/unidded; match by label/placeholder. Promote verified locators into the
> selector-cookbook.

## 5. Permissions
- **Admin-only (expected):** configuring an outbound connector is a system-level change gated to
  administrators. TODO(source: KG/docs) confirm exact permission.
- License/module gating: TODO(source: KG/docs).

## 6. Entry Conditions
- Logged in with access to `/settings/integration/`.
- A reachable Jira server URL and a valid credential (or ability to create one).
- To route alerts, at least one **Integration Profile** must map alerts to this connector.
- TODO(source: docs) — any module/feature flag required for Jira.

## 7. Exit Conditions
- **On Test:** success/failure banner reflecting reachability + auth.
- **On Save (success):** success toast; connector persists; Auto Sync schedule registered; audit entry
  written. TODO(source: KG) confirm toast + audit.
- **On Reset:** form reverts to last-saved; no server call.

## 8. Validations
- **Server URL** — required, valid Jira URL; malformed → inline error. TODO(source: docs) exact rule.
- **URL Time Out** — numeric (seconds); TODO(source: docs) min/max/default.
- **Credential Profiles** — a credential must be selected before Test/Save succeeds.
- **Sync Every** — required when Auto Sync ON; numeric interval. TODO(source: docs) units/min.
- **Fail Over Email** — valid email format if provided.
- **If alert re-occurs** — TODO(source: KG/docs) whether a radio choice is mandatory.

## 9. Business Rules
- **Alert routing is decided by the Integration Profile, not this screen** — this form only defines the
  Jira *connector*; which alerts flow is set in `/settings/integration/integration-profile`.
- **"If alert re-occurs" governs de-duplication** — controls whether a re-firing alert reopens/updates
  the existing Jira issue or creates a new one. TODO(source: KG/docs) confirm exact semantics.
- **Auto Sync gates the schedule** — **Sync Every** applies only when Auto Sync is ON.
- **Fail Over Email** is the fallback path when a push to Jira fails.
- TODO(source: KG/docs): whether the connector is a singleton; the Jira project/issue-type mapping.

## 10. Known Bugs
No **Atlassian-Jira-specific** defect is recorded in `knowledge/known_issues/customer-issue-kb.md`.
Two adjacent classes are worth mirroring as Jira regression coverage (do not report as Jira bugs):
- **Re-notification / duplicate-alert engine bugs** (§5) — e.g. `PQD-38455 [MOTADATA-8110]`,
  `PQD-39314 [MOTADATA-8326]`, `PQD-41707 [MOTADATA-8716]`: duplicate re-notifications and a
  NullPointerException in `updateRenotificationTimer`. This directly concerns the **"If alert re-occurs"**
  behaviour on this screen — re-occurrence handling is exactly the area those bugs live in.
- **Integration Profile NPE with a single severity** (§2) — `PQD-35982 / PQD-35984 [MOTADATA-7641]`:
  relevant because this connector only fires when a profile routes alerts to it.
> None confirmed against the Jira connector specifically; no other Jira issues recorded for this screen.

## 11. Edge Cases
- Save with an unreachable/wrong Jira URL; expired/invalid credential.
- Test passes but Save fails (transient network) and vice-versa.
- Auto Sync ON with empty/zero **Sync Every**.
- Proxy ON but proxy unreachable/mis-scoped.
- **Re-occurrence:** same alert fires repeatedly — assert the "If alert re-occurs" choice is honoured
  (reopen vs new issue) with no duplicate Jira issues (the §5 re-notification class).
- Jira project/issue-type not mapped or invalid → creation fails.
- Fail Over Email invalid / mailbox unreachable when a push fails.
- Very short URL Time Out against a slow Jira server → false failures.
