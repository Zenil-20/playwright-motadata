---
screen: Integration · slack
module: Settings
category: integration
route: "/settings/integration/slack"
build: 8.2.6
status: draft
sources: [catalog, kb]           # locators/catalog/settings_integration_slack.json (live Vue-router sweep 2026-07-02); known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Integration · Slack

## 1. Purpose
The connector that forwards **ObserveOps (AIOps)** alerts into **Slack** so a monitoring alert is
delivered as a Slack message to a channel via a Slack app.

- **Business objective:** push AIOps alerts into Slack so teams that collaborate in Slack see monitoring
  problems in-line.
- **Screen description:** a single connector-configuration form under `Settings → Integration → Slack`.
  It is distinguished by a **Generate Manifest** step: the user names the **Application**, generates a
  Slack **app manifest** (default placeholder `observeops-app-manifest`) to create the Slack app, then
  supplies a **Credential Profile** for it. It also has Auto Sync and a **Use Proxy Server** switch, and
  **Save** persists the connector.
- **Primary use cases:** first-time Slack app creation via the generated manifest, credential set-up,
  changing sync cadence, enabling proxy egress.
- **Who uses it:** administrators configuring outbound integrations (see Permissions).
- **Dependencies:** a Slack workspace/app created from the generated manifest · a **Credential Profile**
  · optional **Proxy Server** · the alert engine · an **Integration Profile**
  (`/settings/integration/integration-profile`) that maps which alerts/severities route here.

## 2. Navigation
```
Settings → Integration → Slack
```
- **Breadcrumb:** Settings › Integration › Slack
- **Sibling connectors:** Motadata ServiceOps · Service Now · Atlassian Jira · Microsoft Teams · LAMA · Integration Profile
- **URL:** `/settings/integration/slack` (open the full URL; SPA routing must load the page)

## 3. Actions
Derived from the catalog buttons/controls:
- **Set Application Name** (text input, placeholder `observeops-app-manifest`).
- **Generate Manifest** (`#generate-manifest-btn`) — produce the Slack app manifest to create/configure
  the Slack app.
- **Create Credential Profile** (`#create-credential-btn-id`) — add the Slack app credential inline.
- **Select a Credential Profile** — pick an existing credential (`[data-cy='dropdown-trigger-input']`).
- **Toggle Auto Sync ON/OFF** (`#auto-sync-id`) → reveals **Sync Every**.
- **Toggle Use Proxy Server** (`#proxy-server-id`).
- **Save / Configure** (`#configure-btn`).
- **Reset** to last-saved (`#reset-btn`).

> Note: both an **ON** and an **OFF** button are captured — the two switches (Auto Sync, Proxy) render
> their state as ON/OFF controls. There is **no Test button** on this connector.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Application Name | text input, placeholder `observeops-app-manifest` (label "Application Name") |
| Generate Manifest | `#generate-manifest-btn` |
| Credential Profile | dropdown `[data-cy='dropdown-trigger-input']` (placeholder _Select_) + **Create Credential Profile** `#create-credential-btn-id` |
| Auto Sync | ant-switch `#auto-sync-id` (ON/OFF) |
| Sync Every | text input, placeholder _Schedule Every_ (visible when Auto Sync ON) |
| Use Proxy Server | ant-switch `#proxy-server-id` (2 switches captured) |
| Save | `#configure-btn` |
| Reset | `#reset-btn` |
| Settings left-nav + Search | shared Settings shell (placeholder _Search_) |

> Slack is unique in exposing a **Generate Manifest** action and a named **Application** — the manifest
> is the Slack-app bootstrap. Catalog inputs are unnamed/unidded (except by placeholder); the proxy
> switch has an explicit id `#proxy-server-id`. Promote verified locators into the selector-cookbook.

## 5. Permissions
- **Admin-only (expected):** configuring an outbound connector is a system-level change gated to
  administrators. TODO(source: KG/docs) confirm exact permission.
- License/module gating: TODO(source: KG/docs).

## 6. Entry Conditions
- Logged in with access to `/settings/integration/`.
- A Slack workspace where an app can be created from the generated manifest, plus a credential for it.
- To route alerts, at least one **Integration Profile** must map alerts to this connector.
- TODO(source: docs) — any module/feature flag required for Slack.

## 7. Exit Conditions
- **On Generate Manifest:** a Slack app manifest is produced (downloaded/shown) for the named Application.
  TODO(source: KG) confirm output form (JSON/URL) and where it appears.
- **On Save (success):** success toast; connector persists; Auto Sync schedule registered; audit entry
  written. TODO(source: KG) confirm toast + audit.
- **On Reset:** form reverts to last-saved; no server call.

## 8. Validations
- **Application Name** — required to generate a manifest; TODO(source: docs) uniqueness/format rules.
- **Credential Profile** — a credential must be selected before Save succeeds.
- **Sync Every** — required when Auto Sync ON; numeric interval. TODO(source: docs) units/min.

## 9. Business Rules
- **Manifest-first flow** — the Slack app is bootstrapped from the generated manifest, then its
  credential is supplied here; ordering matters (generate → create app in Slack → credential → save).
  TODO(source: KG/docs) confirm the exact sequence.
- **Alert routing is decided by the Integration Profile, not this screen.**
- **Auto Sync gates the schedule** — **Sync Every** applies only when Auto Sync is ON.
- TODO(source: KG/docs): whether the connector is a singleton; target channel selection.

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`. The
notification-channel-failure class (§5) concerns email/SMS, not Slack; do not attribute it here. No
Slack issues are recorded.

## 11. Edge Cases
- Generate Manifest with an empty/duplicate Application Name.
- Save with an invalid/expired Slack app credential or a revoked token.
- Auto Sync ON with empty/zero **Sync Every**.
- Proxy ON but proxy unreachable/mis-scoped.
- No Test button: a mis-configured connector surfaces only on the first real push — confirm the failure
  is visible (toast/audit/alert history).
- Slack channel deleted/renamed, or app uninstalled from the workspace, after configuration.
- Regenerating the manifest after the app already exists (does it create a duplicate app?).
