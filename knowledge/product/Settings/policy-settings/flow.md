---
screen: Policy Settings · flow
module: Settings
category: policy-settings
route: "/settings/policy-settings/flow"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_policy_settings_flow.json (sweep 2026-07-02) + screenshots/Flow.png (module data view) + known_issues/customer-issue-kb.md §7
verified: 2026-07-09
---

# Policy Settings · Flow

## 1. Purpose
The **Flow policy** list — where administrators define **alert policies over network flow data**
(NetFlow / sFlow / IPFIX). A flow policy evaluates flow metrics (traffic volume, conversation/talker
patterns) for a set of exporters/tags and raises a severity-graded alert of a given **Alert Type**
when the condition is met.

- **Business objective:** detect abnormal traffic (spikes, top-talkers, unexpected conversations)
  from flow telemetry and alert on it, complementing raw-metric monitoring.
- **Screen description:** a searchable, filterable grid of existing flow policies with per-row
  enable/disable switch, row actions, and a **Create Policy** entry point — a sibling policy tab under
  **Settings → Policy Settings**. The `Flow.png` screenshot shows the **Flow** module's data view (the
  telemetry these policies act on), not the policy grid; grid controls below are from the catalog.
- **Primary use cases:** create a flow-traffic threshold policy, set its Severity/Alert Type, target
  by exporter/tag, enable/disable, clone, delete, review **Used Counts**.
- **Who uses it:** network monitoring administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** flow ingestion + parsing (pmacct) · correctly configured exporters (flow version,
  templates) · the notification/action layer.

## 2. Navigation
```
Settings → Policy Settings → Flow
```
- **Breadcrumb:** Settings › Policy Settings › Flow
- **Sibling policy tabs:** Availability · Metric · Log · **Flow** · Trap · NetRoute · APM ·
  Network Config · Real User Monitoring
- **URL:** `/settings/policy-settings/flow`

## 3. Actions
- **Create Policy** (`#create-policy-btn`).
- **Filter** (`#filter-btn`) — by severity, policy type, alert type, tag, status.
- **Search** — free-text over the grid (`search` input).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Enable / Disable** — per-row **Status** toggle (**ON/OFF**; 16 switches ⇒ ~16 flow policies swept).
- **Row actions** (`[data-cy='grid-action']`) — Edit / Clone / Delete (TODO confirm).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` (name `search`) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | **Policy Name · Used Counts · Severity · Policy Type · Alert Type · Tag · Status · Action** |
| Per-row Status toggle | ant-switch **ON/OFF** (~16 rows) |
| Per-row action menu | `[data-cy='grid-action']` |

- Same column shape as **Log** (Severity + Alert Type present) — a flow policy carries explicit
  severity and an alert-type classification.

> The **Create Policy** form (name, flow metric/condition, threshold, window, severity, alert type,
> target exporters/tags, notification) was **not captured** in the grid sweep — confirm live/KG.

_Locators: catalog `settings_policy_settings_flow.json`; promote verified ones into the cookbook
(Policy Settings > Flow)._

## 5. Permissions
- **Admin / network administrator:** full CRUD + enable/disable.
- **Operator / Viewer:** TODO(source: KG/docs).
- License gating: flow policies require the **Flow module / NetFlow analytics** to be licensed and
  receiving flow. TODO confirm exact gate.

## 6. Entry Conditions
- Logged in; Policy Settings → Flow loads and the grid renders.
- For a meaningful policy: exporters are sending flow that the collector can **parse** (correct flow
  version/templates — see Known Bugs), and the targeted metric has data.

## 7. Exit Conditions
- **On Create/Edit (success):** toast; new/updated row with Severity + Alert Type; audit entry.
- **On Enable/Disable:** Status flips; evaluation starts/stops.
- **On Delete:** row removed after confirm.
- **At runtime:** a flow condition breach raises an alert of the configured severity/alert type and
  fires linked notifications — the end-to-end assertion.

## 8. Validations
- **Policy Name** — required; expected unique among flow policies. TODO confirm scope.
- **Severity** — required (grid column).
- **Threshold / window** — numeric and satisfiable relative to flow aggregation interval.
- Exact field validations TODO(source: KG/docs — form not captured).

## 9. Business Rules
- **Flow must be parseable for the policy to see data.** Bi-directional exporter templates
  (ASA / Palo Alto Initiator/Responder octets) were unparsed by pmacct, showing 0 bytes — so a
  volume-threshold policy would never fire on them until parsing was enabled (KB §7, PQD-30304 /
  **MOTADATA-6334**).
- **Flow version must match the collector's expectation** (NetFlow v5 vs v9 vs sFlow); mismatched
  feeds produce sizes that differ from other NMS and can starve a policy of data (KB §7).
- Occurrence/window vs. flow aggregation interval — the condition must be satisfiable by how often
  flow is aggregated (KB §5 occurrence math, applied to flow).
- Uniqueness / defaults / limits — TODO(source: Motadata KG/docs).

## 10. Known Bugs
From `customer-issue-kb.md` (§7 Log / Flow / Trap Explorers):

- **Bi-directional flow (ASA / Palo Alto) shows 0 bytes → volume policies never fire** — templates
  unparsed by pmacct; the `tmp_asa_bi_flow` handling was **productized in 8.0.22** (PQD-30304 /
  **MOTADATA-6334**).
- **Flow-version / exporter mismatch** — comparing NetFlow v5 vs v9 feeds, or sending sFlow to a
  NetFlow-only path (e.g. CloudGenix supports NetFlow v9 not sFlow), yields wrong/absent flow that
  breaks policy evaluation (KB §7, PQD-36645 / PQD-39746 / PQD-29136). Reconfigure exporters per
  vendor standard.

_No defect recorded that is specific to the flow **policy grid/editor** itself — the above are flow
**data** issues that make flow policies appear to "not fire." Treat them as preconditions to verify._

## 11. Edge Cases
- Policy over an exporter whose bi-directional flow is unparsed (0 bytes, no fire).
- Exporter sending a flow version the collector doesn't expect (silent no-data).
- Threshold unsatisfiable by aggregation interval (never fires) or trivially met (alert storm).
- Duplicate / empty / very long policy name; Unicode.
- Delete a policy with **Used Counts > 0**.
- Enable/disable rapidly; toggle during a traffic spike.
- Policy targeting a tag covering many exporters (Used Counts / performance).
