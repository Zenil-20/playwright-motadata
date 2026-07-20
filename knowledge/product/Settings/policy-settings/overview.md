---
screen: Policy Settings
module: Settings
category: policy-settings
route: "/settings/policy-settings/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_policy_settings.json (sweep 2026-07-02) + known_issues/customer-issue-kb.md §5
verified: 2026-07-09
---

# Policy Settings (landing · Availability)

## 1. Purpose
The **Policy Settings landing** — the hub for all alerting-policy categories in ObserveOps, and the
default **Availability** policy list. Policy Settings groups every kind of alerting policy (Availability,
Metric, Log, Flow, Trap, NetRoute, APM, Network Config, Real User Monitoring) into sibling tabs; the
root route opens the default category's policy grid.

- **Business objective:** a single place to define *when* the platform raises alerts — across
  availability (up/down), thresholded metrics, logs, flows, traps, routes, APM, config and RUM.
- **Screen description:** a searchable, filterable data grid of policies with a per-row enable/disable
  switch, row actions, and a **Create Policy** entry point, plus the tab bar that switches policy
  category. The swept root grid uses the generic **Policy Name · Policy Type · Threshold Value** shape.
  **Availability policies** specifically evaluate monitor/device **up-down availability** and alert
  when a monitor is unreachable/down for the configured occurrences.
  > TODO(source: KG/docs): confirm that the root route's default tab is **Availability** (the captured
  > grid shape is generic and matches the Metric list; the exact default landing tab needs a live
  > check). The remaining categories each have their own documented screen in this folder.
- **Primary use cases:** land on Policy Settings, pick a category tab, create/edit/enable/disable/clone/
  delete policies, and review each policy's **Used Count**.
- **Who uses it:** monitoring administrators / operators. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** the monitored-object inventory (monitors/tags) · the data pipeline for the chosen
  category · the notification/action layer · the poller interval (occurrence/flap math).

## 2. Navigation
```
Settings → Policy Settings
```
- **Breadcrumb:** Settings › Policy Settings
- **Category tabs:** Availability · Metric · Log · Flow · Trap · NetRoute · APM · Network Config ·
  Real User Monitoring
- **URL:** `/settings/policy-settings/` (opens the default category grid; each tab has its own
  sub-route, e.g. `/settings/policy-settings/metric`)

## 3. Actions
- **Create Policy** (`#create-policy-btn`) — new policy in the current category.
- **Switch category** — the tab bar routes to each policy sub-screen.
- **Filter** (`#filter-btn`) — narrow the grid (by policy type, tag, status).
- **Search** — free-text over the grid (`search` input, placeholder _"Search"_).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Enable / Disable** — per-row **Status** toggle (**ON/OFF**; 27 switches captured on the swept
  landing grid).
- **Row actions** (`[data-cy='grid-action']`) — Edit / Clone / Delete (TODO confirm).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Category tab bar | Availability / Metric / Log / Flow / Trap / NetRoute / APM / Network Config / RUM |
| Search box | `input[placeholder="Search"]` (name `search`) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | **Policy Name · Used Count · Policy Type · Tag · Threshold Value · Status · Action** |
| Per-row Status toggle | ant-switch **ON/OFF** (27 rows on the swept landing grid) |
| Per-row action menu | `[data-cy='grid-action']` |

> The **Create Policy** form fields were **not captured** in the grid sweep — confirm live/KG. The
> exact grid columns differ per category tab (see each category's own screen doc); the columns above
> are the default landing shape.

_Locators: catalog `settings_policy_settings.json`; promote verified ones into the cookbook
(Policy Settings)._

## 5. Permissions
- **Admin / monitoring administrator:** full CRUD + enable/disable across categories.
- **Operator / Viewer:** TODO(source: KG/docs).
- License/module gating: individual categories require their module (Log, Flow, APM, RUM, NCM) — a tab
  may be hidden/empty if its module isn't licensed. TODO confirm.

## 6. Entry Conditions
- Logged in with a valid session; `/settings/` reachable.
- Policy Settings loads and the default category grid renders (may be empty on a fresh install).

## 7. Exit Conditions
- **On Create/Edit (success):** toast; new/updated policy row; audit entry.
- **On Enable/Disable:** Status switch flips; evaluation starts/stops.
- **On Delete:** row removed after confirmation.
- **On category switch:** URL changes to the tab's sub-route and its grid loads.
- **When a policy fires at runtime:** an alert of the configured severity appears in Alerts and linked
  notifications/actions execute — the end-to-end assertion.

## 8. Validations
- **Policy Name** — required; expected unique within its category. TODO confirm scope.
- **Threshold Value** — numeric where the category is threshold-based.
- **Occurrence / flap window** — must be satisfiable by the poller interval (see Business Rules).
- Exact field validations TODO(source: KG/docs — Create Policy form not captured).

## 9. Business Rules
Grounded in the customer-issue KB (§5 Alerts / Policies / Notifications):

- **Poller interval must be able to satisfy the occurrence/flap window** — a window the poll cadence
  can't meet means the policy never fires (KB §5, PQD-28890 / PQD-35099).
- **Availability policies** evaluate monitor up-down state; note that **availability-correlation
  suspension can persist after a dependency is removed** — a deleted dependency child can stay
  suspended/unreachable (KB §5, "Policy configuration & semantics issues").
- **Default policies carry notifications/actions** that must survive upgrades (KB §5, MOTADATA-7641).
- Uniqueness / defaults / limits — TODO(source: Motadata KG/docs).

## 10. Known Bugs
From `customer-issue-kb.md` (§5 Alerts / Policies / Notifications) — cross-category, seen at this hub:

- **Filters cleared when adding a server to a policy** — dynamic filter revalidation wiped config;
  redesigned in **8.2.3** (PQD-39541 / **MOTADATA-8585**).
- **Default policy notifications/actions wiped after bundle upgrade** (8.0.26 → 8.1.0) —
  **MOTADATA-7641**. Regression-test: upgrade with policies carrying actions; assert none are wiped.
- **Deleted dependency child stays suspended/unreachable** — availability-correlation suspension
  persists after the dependency is removed (KB §5); a bulk metric-collection option can un-suspend.
- Category-specific defects are documented on each category's own screen (Metric, Log, Flow, Trap).

## 11. Edge Cases
- Land on the hub with a category whose module is unlicensed (tab hidden/empty?).
- Duplicate / empty / very long policy name; Unicode.
- Poller interval > occurrence/flap window (policy can never fire).
- Delete a policy with **Used Count > 0**.
- Add a server to a policy that has active filters (MOTADATA-8585 regression).
- Availability policy on a monitor whose dependency parent was deleted (stuck suspension).
- Enable/disable rapidly; switch category mid-edit (unsaved changes discarded?).
- Upgrade with default policies carrying actions (MOTADATA-7641).
