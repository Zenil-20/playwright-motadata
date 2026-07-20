---
screen: Policy Settings · netroute
module: Settings
category: policy-settings
route: "/settings/policy-settings/netroute"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_policy_settings_netroute.json (sweep 2026-07-02) + screenshots/netroute.png (module data view) + known_issues/customer-issue-kb.md §5
verified: 2026-07-09
---

# Policy Settings · NetRoute

## 1. Purpose
The **NetRoute policy** list — where administrators define **threshold policies on synthetic network
route monitoring**. NetRoute measures the path from a source (AIOps/agent) to a destination
(URL/host), tracking **latency, packet loss, and availability**; a NetRoute policy thresholds those
metrics and raises a severity-graded alert when a route degrades.

- **Business objective:** alert on end-to-end path degradation (a destination becoming slow, lossy, or
  unreachable) even when the endpoint devices themselves report healthy.
- **Screen description:** a searchable, filterable grid of existing NetRoute policies with per-row
  enable/disable switch, row actions, and a **Create Policy** entry point — a sibling policy tab under
  **Settings → Policy Settings**. The `netroute.png` screenshot shows the **NetRoute** module's data
  view — cards per route (LAMA, Youtube, chatgpt, google.com, …) with **Latency / Packet Loss /
  Availability** and green/red availability bars — i.e. exactly the metrics these policies threshold.
  The policy-grid controls below come from the catalog.
- **Primary use cases:** create a route-degradation policy (e.g. "packet loss > 20% → Major"), set its
  **Route Evaluation Type**, Severity and **Threshold Value**, target by tag, enable/disable, clone,
  delete, review **Used Count**.
- **Who uses it:** network monitoring administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** the NetRoute probe (a source running the route checks) · configured routes
  (source→destination) · the notification/action layer.

## 2. Navigation
```
Settings → Policy Settings → NetRoute
```
- **Breadcrumb:** Settings › Policy Settings › NetRoute
- **Sibling policy tabs:** Availability · Metric · Log · Flow · Trap · **NetRoute** · APM ·
  Network Config · Real User Monitoring
- **URL:** `/settings/policy-settings/netroute`

## 3. Actions
- **Create Policy** (`#create-policy-btn`).
- **Filter** (`#filter-btn`) — by route evaluation type, severity, tag, status.
- **Search** — free-text over the grid (`search` input).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Enable / Disable** — per-row **Status** toggle (**ON**; 3 switches ⇒ ~3 NetRoute policies swept).
- **Row actions** (`[data-cy='grid-action']`) — Edit / Clone / Delete (TODO confirm).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` (name `search`) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | **Policy Name · Used Count · Route Evaluation Type · Tag · Create/Modify Time · Severity · Threshold Value · Status · Action** |
| Per-row Status toggle | ant-switch **ON** (~3 rows) |
| Per-row action menu | `[data-cy='grid-action']` |

- **Route Evaluation Type** = which route metric the policy evaluates (latency / packet loss /
  availability). TODO(source: KG/docs) — enumerate exact values.
- **Create/Modify Time** column is unique to this tab (audit-style timestamp shown in the grid).
- **Threshold Value** + **Severity** present ⇒ numeric-threshold, severity-graded policies.

> The **Create Policy** form (name, route/destination selection, evaluation type, operator, threshold
> per severity, window, target/tag, notification) was **not captured** in the grid sweep — confirm
> live/KG.

_Locators: catalog `settings_policy_settings_netroute.json`; promote verified ones into the cookbook
(Policy Settings > NetRoute)._

## 5. Permissions
- **Admin / network administrator:** full CRUD + enable/disable.
- **Operator / Viewer:** TODO(source: KG/docs).
- License gating: requires the NetRoute / synthetic-path monitoring capability. TODO confirm.

## 6. Entry Conditions
- Logged in; Policy Settings → NetRoute loads and the grid renders.
- For a meaningful policy: at least one route (source→destination) is configured and returning
  latency/loss/availability data (the netroute.png cards confirm live routes exist on the instance).

## 7. Exit Conditions
- **On Create/Edit (success):** toast; new/updated row with Route Evaluation Type + Severity +
  Threshold Value + updated Create/Modify Time; audit entry.
- **On Enable/Disable:** Status flips; evaluation starts/stops.
- **On Delete:** row removed after confirm.
- **At runtime:** a route breaching its threshold (e.g. Bhavin-PC / myntra showing 100% packet loss,
  0% availability in the screenshot) raises an alert of the configured severity and fires linked
  notifications — the end-to-end assertion.

## 8. Validations
- **Policy Name** — required; expected unique among NetRoute policies. TODO confirm scope.
- **Route Evaluation Type** — required (grid column).
- **Threshold Value** — numeric; consistent across severities.
- **Severity** — required.
- Exact field validations TODO(source: KG/docs — form not captured).

## 9. Business Rules
- **Availability = f(reachability of the route)**; latency/packet-loss are the degradation signals.
  A route at 0% availability / 100% packet loss (screenshot: Bhavin-PC, myntra) is the fire condition
  an availability/loss policy targets.
- **Poller/probe interval vs. occurrence window** — as with all policies, an X-occurrences-in-Y
  condition must be satisfiable by how often the route is probed (KB §5 occurrence math).
- Uniqueness / defaults / limits — TODO(source: Motadata KG/docs).

## 10. Known Bugs
None recorded specifically for NetRoute **policies** in `customer-issue-kb.md`.
> Related context (not a policy-grid defect): general **poller-interval vs. occurrence/flap window**
> mismatches (KB §5, PQD-28890 / PQD-35099) apply to any thresholded route policy — ensure the probe
> cadence can satisfy the configured window. Do not invent NetRoute-specific bugs.

## 11. Edge Cases
- Route at 100% packet loss / 0% availability (fire) vs. flapping around the threshold.
- Threshold unsatisfiable by probe interval (never fires); trivially met (alert storm).
- Duplicate / empty / very long policy name; Unicode.
- Delete a policy with **Used Count > 0**.
- Enable/disable rapidly; toggle while a route is degraded.
- Policy targeting a destination that stops resolving (DNS failure) — loss vs. availability semantics.
- Create/Modify Time correctness after an edit (timestamp updates).
