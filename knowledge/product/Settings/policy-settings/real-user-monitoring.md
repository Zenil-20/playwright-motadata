---
screen: Policy Settings · real-user-monitoring
module: Settings
category: policy-settings
route: "/settings/policy-settings/real-user-monitoring"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_policy_settings_real_user_monitoring.json (sweep 2026-07-02) + screenshots/RUM.png (module data view) + known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Policy Settings · Real User Monitoring

## 1. Purpose
The **Real User Monitoring (RUM) policy** list — where administrators define **threshold policies on
RUM metrics** (page load time, front-end/back-end timing, JS errors, and other real-user experience
signals). A RUM policy thresholds a RUM metric for a set of applications/tags and raises a
severity-graded alert when real-user experience degrades.

- **Business objective:** alert on degraded end-user experience (slow page loads, error spikes seen by
  actual browsers) rather than only server-side health.
- **Screen description:** a searchable, filterable grid of existing RUM policies with a per-row
  enable/disable switch, row actions, and a **Create Policy** entry point — a sibling policy tab under
  **Settings → Policy Settings**. The `RUM.png` screenshot shows the **RUM** module's data view (the
  real-user telemetry these policies threshold); the policy-grid controls below come from the catalog.
- **Primary use cases:** create a RUM threshold policy (e.g. "page load > 4 s → Major"), set its
  **Rum Policy Type**, Severity and **Threshold Value**, target by application/tag, enable/disable,
  clone, delete, review **Used Count**.
- **Who uses it:** application owners / monitoring administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** the RUM data pipeline (RUM JS beacon reporting from real browsers) · the
  application inventory the policy targets · the notification/action layer.

## 2. Navigation
```
Settings → Policy Settings → Real User Monitoring
```
- **Breadcrumb:** Settings › Policy Settings › Real User Monitoring
- **Sibling policy tabs:** Availability · Metric · Log · Flow · Trap · NetRoute · APM ·
  Network Config · **Real User Monitoring**
- **URL:** `/settings/policy-settings/real-user-monitoring`

## 3. Actions
- **Create Policy** (`#create-policy-btn`).
- **Filter** (`#filter-btn`) — by RUM policy type, severity, tag, status.
- **Search** — free-text over the grid (`search` input).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Enable / Disable** — per-row **Status** toggle (**ON**; 1 switch ⇒ ~1 RUM policy swept).
- **Row actions** (`[data-cy='grid-action']`) — Edit / Clone / Delete (TODO confirm).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` (name `search`) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | **Policy Name · Used Count · Rum Policy Type · Tag · Severity · Threshold Value · Status · Action** |
| Per-row Status toggle | ant-switch **ON** (~1 row) |
| Per-row action menu | `[data-cy='grid-action']` |

- **Rum Policy Type** = the RUM metric family the policy evaluates (e.g. page load / JS error / apdex).
  TODO(source: KG/docs) — enumerate exact values.
- **Threshold Value** + **Severity** present ⇒ numeric-threshold, severity-graded policies.

> The **Create Policy** form (name, RUM type/metric, operator, threshold per severity, window, target
> apps/tags, notification) was **not captured** in the grid sweep — confirm live/KG.

_Locators: catalog `settings_policy_settings_real_user_monitoring.json`; promote verified ones into the
cookbook (Policy Settings > Real User Monitoring)._

## 5. Permissions
- **Admin / application owner:** full CRUD + enable/disable.
- **Operator / Viewer:** TODO(source: KG/docs).
- License gating: requires the **RUM module license** and the RUM beacon deployed on the monitored
  application. TODO confirm exact gate.

## 6. Entry Conditions
- Logged in; Policy Settings → Real User Monitoring loads and the grid renders.
- For a meaningful policy: the RUM beacon is deployed and real browsers are reporting data for the
  targeted application.

## 7. Exit Conditions
- **On Create/Edit (success):** toast; new/updated row with Rum Policy Type + Severity + Threshold
  Value; audit entry.
- **On Enable/Disable:** Status flips; evaluation starts/stops.
- **On Delete:** row removed after confirm.
- **At runtime:** a RUM metric breaching its threshold raises an alert of the configured severity and
  fires linked notifications — the end-to-end assertion.

## 8. Validations
- **Policy Name** — required; expected unique among RUM policies. TODO confirm scope.
- **Rum Policy Type** — required (grid column).
- **Threshold Value** — numeric; consistent across severities.
- **Severity** — required.
- Exact field validations TODO(source: KG/docs — form not captured).

## 9. Business Rules
- **A policy can only evaluate applications with a reporting RUM beacon** — no beacon data ⇒ inert
  policy.
- **Reporting cadence vs. occurrence window** — an X-occurrences-in-Y condition must be satisfiable by
  how often RUM beacons report (KB §5 occurrence math, applied to RUM).
- Uniqueness / defaults / limits — TODO(source: Motadata KG/docs).

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`.
> The KB has no Real-User-Monitoring policy defects. General policy guidance (poller/reporting cadence
> vs. occurrence/flap window, KB §5) still applies. Do not invent RUM-policy-specific bugs.

## 11. Edge Cases
- Create/enable a policy while the application has no RUM beacon data (inert policy).
- Threshold unsatisfiable by beacon cadence (never fires); trivially met (alert storm).
- Duplicate / empty / very long policy name; Unicode.
- Delete the (single) existing policy with **Used Count > 0**.
- Enable/disable rapidly; toggle during a front-end error spike.
- Policy targeting a tag covering many applications (Used Count / performance).
