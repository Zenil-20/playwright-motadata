---
screen: Policy Settings · network-config
module: Settings
category: policy-settings
route: "/settings/policy-settings/network-config"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_policy_settings_network_config.json (sweep 2026-07-02) + known_issues/customer-issue-kb.md §13
verified: 2026-07-09
---

# Policy Settings · Network Config

## 1. Purpose
The **Network Config policy** list — where administrators define **policies over network device
configuration (NCM)**. A Network Config policy evaluates a device's configuration on a defined
trigger (**Evaluate On**) — e.g. on a config change / on backup — and raises a severity-graded alert
(config-change detected, or a compliance/standard violation) for the targeted devices/tags.

- **Business objective:** detect and alert on network configuration changes and compliance drift
  (unauthorized change, non-standard config) as part of Network Configuration Management.
- **Screen description:** a searchable, filterable grid of existing network-config policies with a
  per-row enable/disable switch, row actions, and a **Create Policy** entry point — a sibling policy
  tab under **Settings → Policy Settings**. No matching screenshot was available in
  `knowledge/screenshots/`; controls below come from the catalog sweep.
- **Primary use cases:** create a config-change/compliance policy, set its **Evaluate On** trigger and
  Severity, target by device/tag, enable/disable, clone, delete, review **Used Count**.
- **Who uses it:** network configuration administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** the NCM module (config backup/collection for the targeted devices) · working
  per-vendor config-fetch templates · the notification/action layer.

## 2. Navigation
```
Settings → Policy Settings → Network Config
```
- **Breadcrumb:** Settings › Policy Settings › Network Config
- **Sibling policy tabs:** Availability · Metric · Log · Flow · Trap · NetRoute · APM ·
  **Network Config** · Real User Monitoring
- **URL:** `/settings/policy-settings/network-config`

## 3. Actions
- **Create Policy** (`#create-policy-btn`).
- **Filter** (`#filter-btn`) — by evaluate-on trigger, severity, tag, status.
- **Search** — free-text over the grid (`search` input).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Enable / Disable** — per-row **Status** toggle (**ON**; 1 switch ⇒ ~1 network-config policy swept).
- **Row actions** (`[data-cy='grid-action']`) — Edit / Clone / Delete (TODO confirm).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` (name `search`) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | **Policy Name · Used Count · Evaluate On · Tag · Severity · Status · Action** |
| Per-row Status toggle | ant-switch **ON** (~1 row) |
| Per-row action menu | `[data-cy='grid-action']` |

- **Evaluate On** = the trigger/event the policy is evaluated against (e.g. on config change / on
  backup). TODO(source: KG/docs) — enumerate exact values.
- No **Threshold Value** column (config policies evaluate change/compliance conditions, not numeric
  thresholds). Severity is present.

> The **Create Policy** form (name, evaluate-on trigger, config-match/compliance rule, severity,
> target devices/tags, notification) was **not captured** in the grid sweep — confirm live/KG.

_Locators: catalog `settings_policy_settings_network_config.json`; promote verified ones into the
cookbook (Policy Settings > Network Config)._

## 5. Permissions
- **Admin / network configuration administrator:** full CRUD + enable/disable.
- **Operator / Viewer:** TODO(source: KG/docs).
- License gating: requires the **NCM / configuration-management module**. TODO confirm exact gate.

## 6. Entry Conditions
- Logged in; Policy Settings → Network Config loads and the grid renders.
- For a meaningful policy: NCM is collecting/backing up configuration for the targeted devices
  (per-vendor fetch templates working — see Known Bugs), so there is config to evaluate.

## 7. Exit Conditions
- **On Create/Edit (success):** toast; new/updated row with Evaluate On + Severity; audit entry.
- **On Enable/Disable:** Status flips; evaluation starts/stops.
- **On Delete:** row removed after confirm.
- **At runtime:** a config change / compliance violation on a targeted device raises an alert of the
  configured severity and fires linked notifications — the end-to-end assertion.

## 8. Validations
- **Policy Name** — required; expected unique among network-config policies. TODO confirm scope.
- **Evaluate On** — required (grid column).
- **Severity** — required.
- Exact field validations (config-match rule syntax, compliance-rule fields) TODO(source: KG/docs —
  form not captured).

## 9. Business Rules
- **A config policy can only evaluate devices whose configuration is actually collected.** If NCM
  can't fetch a device's config (vendor CLI dialect / transport issue — see Known Bugs), the policy
  has nothing to evaluate.
- **Evaluate On** determines *when* the policy runs (change vs. scheduled/backup event) — TODO(source:
  KG/docs) confirm the exact trigger semantics.
- Uniqueness / defaults / limits — TODO(source: Motadata KG/docs).

## 10. Known Bugs
None recorded specifically for Network Config **policies** in `customer-issue-kb.md`.
> Related NCM context (§13 NCM / Configuration Management) — **not** policy-grid defects, but
> preconditions a policy depends on: per-vendor config-fetch/firmware failures where template commands
> don't match the vendor CLI (Cisco ISE ignoring `terminal length 0`, FortiGate needing an "a"
> confirmation, TP-Link needing `\r\n` — PQD-33382 / **MOTADATA-6866**, PQD-33405). If config fetch is
> broken, a config policy silently has no data. Do not invent network-config-policy-specific bugs.

## 11. Edge Cases
- Policy over a device whose config NCM cannot fetch (vendor dialect failure → no evaluation).
- Duplicate / empty / very long policy name; Unicode.
- Delete the (single) existing policy with **Used Count > 0**.
- Enable/disable the policy; toggle around a config-change event.
- Evaluate-On = change vs. backup: assert the policy fires on the right trigger only.
- Policy targeting a tag covering many devices (Used Count / performance).
