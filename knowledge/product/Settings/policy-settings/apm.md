---
screen: Policy Settings · apm
module: Settings
category: policy-settings
route: "/settings/policy-settings/apm"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_policy_settings_apm.json (sweep 2026-07-02) + screenshots/APM.png (module data view) + known_issues/customer-issue-kb.md §12
verified: 2026-07-09
---

# Policy Settings · APM

## 1. Purpose
The **APM policy** list — where administrators define **threshold policies on Application Performance
Monitoring metrics** (response time, throughput, error rate, apdex, and other service-level signals).
An APM policy thresholds an APM metric for a set of services/tags and raises a severity-graded alert
when a service's performance degrades.

- **Business objective:** alert on application-level degradation (slow responses, error spikes) so
  service owners are notified before users are broadly impacted.
- **Screen description:** a searchable, filterable grid of existing APM policies with per-row
  enable/disable switch, row actions, and a **Create Policy** entry point — a sibling policy tab under
  **Settings → Policy Settings**. The `APM.png` screenshot shows the **APM** module's data view — tabs
  **Services · Explorer · Error Tracker · Compare** over a time range (here "No data found") — i.e.
  the application telemetry these policies threshold. The policy-grid controls below come from the
  catalog.
- **Primary use cases:** create an APM threshold policy (e.g. "avg response time > 2 s → Major"), set
  its **Apm Policy Type**, Severity and **Threshold Value**, target by service/tag, enable/disable,
  clone, delete, review **Used Count**.
- **Who uses it:** application/service owners and monitoring administrators. TODO(source: KG/docs) —
  role gating.
- **Dependencies:** the APM data pipeline (instrumented services / agents reporting APM metrics) · the
  service inventory the policy targets · the notification/action layer.

## 2. Navigation
```
Settings → Policy Settings → APM
```
- **Breadcrumb:** Settings › Policy Settings › APM
- **Sibling policy tabs:** Availability · Metric · Log · Flow · Trap · NetRoute · **APM** ·
  Network Config · Real User Monitoring
- **URL:** `/settings/policy-settings/apm`

## 3. Actions
- **Create Policy** (`#create-policy-btn`).
- **Filter** (`#filter-btn`) — by APM policy type, severity, tag, status.
- **Search** — free-text over the grid (`search` input).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Enable / Disable** — per-row **Status** toggle (**ON**; 7 switches ⇒ ~7 APM policies swept).
- **Row actions** (`[data-cy='grid-action']`) — Edit / Clone / Delete (TODO confirm).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` (name `search`) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | **Policy Name · Used Count · Apm Policy Type · Tag · Severity · Threshold Value · Status · Action** |
| Per-row Status toggle | ant-switch **ON** (~7 rows) |
| Per-row action menu | `[data-cy='grid-action']` |

- **Apm Policy Type** = the APM metric family the policy evaluates (e.g. response time / error rate /
  apdex). TODO(source: KG/docs) — enumerate exact values.
- **Threshold Value** + **Severity** present ⇒ numeric-threshold, severity-graded policies.

> The **Create Policy** form (name, APM type/metric, operator, threshold per severity, window, target
> services/tags, notification) was **not captured** in the grid sweep — confirm live/KG.

_Locators: catalog `settings_policy_settings_apm.json`; promote verified ones into the cookbook
(Policy Settings > APM)._

## 5. Permissions
- **Admin / service owner:** full CRUD + enable/disable.
- **Operator / Viewer:** TODO(source: KG/docs).
- License gating: APM policies require the **APM module license**; note APM licensing counts
  registered agent applications (see Known Bugs). TODO confirm exact gate.

## 6. Entry Conditions
- Logged in; Policy Settings → APM loads and the grid renders.
- For a meaningful policy: at least one instrumented service is reporting APM data (the screenshot's
  "No data found" state shows a policy would have nothing to evaluate until services report).

## 7. Exit Conditions
- **On Create/Edit (success):** toast; new/updated row with Apm Policy Type + Severity + Threshold
  Value; audit entry.
- **On Enable/Disable:** Status flips; evaluation starts/stops.
- **On Delete:** row removed after confirm.
- **At runtime:** a service breaching its APM threshold raises an alert of the configured severity and
  fires linked notifications — the end-to-end assertion.

## 8. Validations
- **Policy Name** — required; expected unique among APM policies. TODO confirm scope.
- **Apm Policy Type** — required (grid column).
- **Threshold Value** — numeric; consistent across severities.
- **Severity** — required.
- Exact field validations TODO(source: KG/docs — form not captured).

## 9. Business Rules
- **A policy can only evaluate services that report APM data** — with no APM data ("No data found"),
  the policy is inert regardless of configuration.
- **Poller/reporting interval vs. occurrence window** — an X-occurrences-in-Y condition must be
  satisfiable by how often APM metrics are reported (KB §5 occurrence math).
- Uniqueness / defaults / limits — TODO(source: Motadata KG/docs).

## 10. Known Bugs
From `customer-issue-kb.md` (§12 Licensing — APM-adjacent):

- **APM license count confusion** — APM counting registers agent applications, causing "License
  Exceeded" / count-mismatch confusion; the licensing code was **refactored in 8.0.26**, with restart
  as an interim workaround (KB §12, PQD-36926 / PQD-32834). Relevant because APM policy creation/scope
  depends on licensed APM capacity.

_No defect recorded that is specific to the APM **policy grid/editor** itself. Do not invent
APM-policy-specific bugs._

## 11. Edge Cases
- Create/enable a policy while APM reports "No data found" (inert policy).
- Threshold unsatisfiable by reporting interval (never fires); trivially met (alert storm).
- APM capacity at/over license limit affecting policy scope (MOTADATA §12 class).
- Duplicate / empty / very long policy name; Unicode.
- Delete a policy with **Used Count > 0**.
- Enable/disable rapidly; toggle during an error spike.
- Policy targeting a tag covering many services (Used Count / performance).
