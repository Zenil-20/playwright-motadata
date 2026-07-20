---
screen: Policy Settings · metric
module: Settings
category: policy-settings
route: "/settings/policy-settings/metric"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_policy_settings_metric.json (live sweep 2026-07-02) + known_issues/customer-issue-kb.md §5
verified: 2026-07-09
---

# Policy Settings · Metric

## 1. Purpose
The **Metric policy** list — the screen where administrators define and manage **threshold policies on
metric KPIs** (CPU, memory, disk, interface traffic, and any other polled numeric metric). A metric
policy evaluates a KPI against configured threshold(s) for a set of monitors/tags and raises a
severity-graded alert when the condition is met.

- **Business objective:** turn raw polled metrics into actionable alerts — catch a device breaching
  CPU/memory/disk thresholds before it becomes an outage, without watching dashboards.
- **Screen description:** a searchable, filterable data grid of existing metric policies with a per-row
  enable/disable switch, row actions, and a **Create Policy** entry point. One tab in the broader
  **Settings → Policy Settings** area (siblings: Availability, Log, Flow, Trap, NetRoute, APM,
  Network Config, Real User Monitoring).
- **Primary use cases:** create a threshold policy (e.g. "CPU > 90% for 3 occurrences → Critical"),
  edit thresholds, enable/disable a policy, clone an existing one, delete an unused policy, review how
  many monitors each policy is applied to (**Used Count**).
- **Who uses it:** monitoring administrators / operators responsible for alerting. Read-only viewers
  can typically see the list but not edit. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** the metric pipeline (polled KPI data) · the monitor/tag inventory the policy
  targets · the notification/action layer (a policy that fires needs a channel to notify) · the
  poller interval (see Business Rules — occurrence/flap windows depend on it).

## 2. Navigation
```
Settings → Policy Settings → Metric
```
- **Breadcrumb:** Settings › Policy Settings › Metric
- **Sibling policy tabs:** Availability · **Metric** · Log · Flow · Trap · NetRoute · APM ·
  Network Config · Real User Monitoring
- **URL:** `/settings/policy-settings/metric` (open the full URL; SPA routing must load the page)

## 3. Actions
Derived from the captured controls (catalog `buttons` / `buttonIds` / `dataCy`):

- **Create Policy** — open the new-metric-policy form/drawer (`#create-policy-btn`).
- **Filter** — open the filter panel to narrow the grid (`#filter-btn`) — e.g. by policy type, tag,
  severity, or status. Exact filter fields TODO(source: KG/docs — not captured in the sweep).
- **Search** — free-text filter over the grid (the `search` input, placeholder _"Search"_).
- **Show / hide columns** — column chooser (`#btn-show-hide-columns`).
- **Enable / Disable a policy** — per-row **Status** toggle (the **ON**/**OFF** switch; 27 switches
  captured = ~27 policies present on the swept instance).
- **Row actions** — per-row action menu (`[data-cy='grid-action']`): typically Edit / Clone / Delete.
  Exact menu items TODO(source: KG/docs).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` (name `search`, text) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | columns: **Policy Name · Used Count · Policy Type · Tag · Threshold Value · Status · Action** |
| Per-row Status toggle | ant-switch **ON/OFF** (27 rows on the swept instance) |
| Per-row action menu | `[data-cy='grid-action']` (Edit / Clone / Delete — TODO confirm) |

- **Used Count** = number of monitors/instances the policy is currently applied to (0 ⇒ safe to
  delete; non-zero ⇒ deletion may be blocked or impact live alerting).
- **Policy Type** = the metric-policy sub-type (e.g. static threshold vs. dynamic/anomaly).
  TODO(source: KG/docs) — enumerate the exact set.
- **Threshold Value** = the configured trigger value shown as a summary column.

> The **Create Policy** form fields (name, KPI/metric selector, condition/operator, threshold per
> severity, occurrence/flap window, target monitors/tags, notification/action) were **not captured**
> in the grid sweep — confirm the exact field set live or via the KG before writing form-level tests.

_Locators: catalog `knowledge/locators/catalog/settings_policy_settings_metric.json`; promote verified
ones into `knowledge/locators/selector-cookbook.md` (Policy Settings > Metric)._

## 5. Permissions
- **Admin / monitoring administrator:** full CRUD on metric policies + enable/disable.
- **Operator:** TODO(source: KG/docs) — whether operators can create/edit or only toggle.
- **Viewer / read-only:** expected view-only (list visible, Create/Edit disabled). TODO confirm.
- License/module gating: metric policies require the core metric-monitoring module (present in all
  ObserveOps deployments). No separate add-on expected. TODO(source: KG/docs).

## 6. Entry Conditions
- User is logged in with a valid session and can reach `/settings/`.
- The Policy Settings area and the Metric tab load; the policies grid renders (may be empty on a
  fresh install).
- To create a *meaningful* policy: at least one monitor/tag exists to target, and the KPI being
  thresholded is actually being polled.

## 7. Exit Conditions
- **On Create/Edit (success):** success toast; the new/updated policy row appears in the grid with its
  Status; **Used Count** reflects the targeted monitors; an audit entry is written.
- **On Enable/Disable:** the Status switch flips; alert evaluation for that policy starts/stops.
- **On Delete:** row removed after confirmation; if **Used Count** > 0 the delete may be blocked or
  warn (TODO confirm the exact guard).
- **When a policy fires at runtime:** an alert of the configured severity is raised (visible in the
  Alerts screen) and any linked notification/action executes — this is the ultimate assertion for an
  end-to-end policy test.

## 8. Validations
- **Policy Name** — required; expected **unique** within metric policies (duplicate → inline error).
  TODO(source: KG/docs) confirm uniqueness scope.
- **Threshold Value(s)** — numeric; per-severity thresholds should be internally consistent
  (e.g. Critical ≥ Major ≥ Warning, or the reverse for "less-than" conditions). TODO confirm exact
  rule.
- **Target monitors/tags** — at least one required for the policy to have effect.
- **Occurrence / flap window** — must be satisfiable by the poller interval (see Business Rules).
- Exact field-level validations (max length, allowed operators, required severity) TODO(source:
  KG/docs — Create Policy form not captured).

## 9. Business Rules
Grounded in the customer-issue KB (§5 Alerts / Policies / Notifications):

- **Poller interval must be able to satisfy the occurrence/flap window.** A policy of "5-min window /
  3 flaps" can *never* trigger if the poller runs every 600 s — the window can't be met (KB §5,
  PQD-28890 / PQD-35099). Align poller cadence with the policy window when authoring policies.
- **Re-notification is per-severity on multi-threshold policies.** Configuring re-notification for one
  severity of a multi-threshold metric policy has historically produced duplicate or missing
  re-notification mails (KB §5, MOTADATA-8110 / MOTADATA-8326).
- **Use the correct KPI in the condition.** Alerts silently never fire when the policy thresholds a
  wrong/derived KPI (KB §5 example: `mssql.replica.sync.health` vs `mssql.alwayson.role` for SQL
  failover).
- **Uniqueness / defaults / limits** (name uniqueness, default severity, max policies) — TODO(source:
  Motadata KG/docs).

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (§5 Alerts / Policies / Notifications):

- **Filters cleared when adding a server to a policy** — dynamic filter revalidation wiped policy
  config; redesigned in **8.2.3** (PQD-39541 / **MOTADATA-8585**).
- **Disk policy ignores exclude / starts-with prefilters** — prefilter operator bug; fixed **8.2.1**
  (PQD-39582 / **MOTADATA-8359**).
- **Default policy notifications/actions wiped after bundle upgrade** (8.0.26 → 8.1.0) — post-upgrade
  policies stopped notifying (KB §2 / §5, **MOTADATA-7641**). Regression-test: upgrade with policies
  carrying actions and assert none are wiped.
- **Re-notification NullPointerException** in `updateRenotificationTimer` when a policy-config copy
  lost data mid-cycle — hotfix + null-checks in **8.2.1 / 8.2.2** (PQD-41707 / **MOTADATA-8716**).

## 11. Edge Cases
- Duplicate policy name; empty name; very long name; Unicode in name.
- Threshold with non-numeric input; inverted severity thresholds; equal thresholds across severities.
- Poller interval > occurrence/flap window (policy can never fire) — assert a validation nudge or
  documented behavior.
- Delete a policy with **Used Count > 0** (in-use guard) vs. Used Count 0.
- Multi-threshold policy with re-notification on a subset of severities (duplicate/missing mail).
- Disk policy with exclude / starts-with prefilters (MOTADATA-8359 regression).
- Enable/disable a policy rapidly; toggle while it is actively evaluating.
- Create a policy targeting a tag covering a very large instance set (performance / Used Count).
- Policy referencing a KPI that is no longer polled (silent no-fire).
- Save a policy, then upgrade — assert notifications/actions survive (MOTADATA-7641).
