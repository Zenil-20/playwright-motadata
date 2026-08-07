---
screen: Policy Settings · trap
module: Settings
category: policy-settings
route: "/settings/policy-settings/trap"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb, docs]   # locators/catalog/settings_policy_settings_trap.json (sweep 2026-07-02) + screenshots/TRAP.png (module data view) + known_issues/customer-issue-kb.md §7/§5 + docs.motadata.com trap-management
verified: 2026-07-09                 # 8.2.6 baseline; docs additions merged 2026-08-07
---

> Module context — architecture, processing pipeline, prerequisite chain and test coverage:
> [`../../TrapExplorer/README.md`](../../TrapExplorer/README.md).

# Policy Settings · Trap

## 1. Purpose
The **Trap policy** list — where administrators define **alert policies over received SNMP traps**. A
trap policy matches incoming traps (by OID/varbind/source) and raises a severity-graded alert, so that
device-originated trap events become first-class alerts.

- **Business objective:** turn asynchronous SNMP traps (link-down, authentication-failure, vendor
  events) into severity-classified alerts routed through the standard notification/action layer.
- **Screen description:** a searchable, filterable grid of existing trap policies with per-row
  enable/disable switch, row actions, and a **Create Policy** entry point — a sibling policy tab under
  **Settings → Policy Settings**. The `TRAP.png` screenshot shows the **Trap** module's data view
  (received traps), not the policy grid; grid controls below come from the catalog.
- **Primary use cases:** create a trap-matching policy, set its Severity, target it by source/tag,
  enable/disable, clone, delete, review **Used Counts**.
- **Who uses it:** network monitoring administrators. TODO(source: KG/docs) — role gating.
- **Dependencies:** the trap receiver (SNMP trap listener) · correct community string (v2c) or v3
  credentials on both device and receiver · the notification/action layer.

## 2. Navigation
```
Settings → Policy Settings → Trap
```
- **Breadcrumb:** Settings › Policy Settings › Trap
- **Sibling policy tabs:** Availability · Metric · Log · Flow · **Trap** · NetRoute · APM ·
  Network Config · Real User Monitoring
- **URL:** `/settings/policy-settings/trap`

## 3. Actions
- **Create Policy** (`#create-policy-btn`).
- **Filter** (`#filter-btn`) — by severity, policy type, tag, status.
- **Search** — free-text over the grid (`search` input).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Enable / Disable** — per-row **Status** toggle (**ON**; 3 switches ⇒ ~3 trap policies swept).
- **Row actions** (`[data-cy='grid-action']`) — Edit / Clone / Delete (TODO confirm).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` (name `search`) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | **Policy Name · Used Counts · Severity · Policy Type · Tag · Status · Action** |
| Per-row Status toggle | ant-switch **ON** (~3 rows) |
| Per-row action menu | `[data-cy='grid-action']` |

- No **Threshold Value** column (trap policies match discrete events, not numeric thresholds) and no
  **Alert Type** column (unlike Log/Flow). Severity is present.

> The **Create Policy** form (name, trap OID/varbind match, source selection, severity, target/tag,
> notification) was **not captured** in the grid sweep — confirm live/KG. Note the known **"can't add
> source"** defect below when testing the source picker.

_Locators: catalog `settings_policy_settings_trap.json`; promote verified ones into the cookbook
(Policy Settings > Trap)._

## 5. Permissions
- **Admin / network administrator:** full CRUD + enable/disable.
- **Operator / Viewer:** TODO(source: KG/docs).
- License gating: requires the trap-receiving capability of the core monitoring module. TODO confirm.

## 6. Entry Conditions
- Logged in; Policy Settings → Trap loads and the grid renders.
- For a meaningful policy: traps actually reach the receiver — correct **community string (v2c)** or a
  **non-blank v3 username** must be configured on both device and receiver (see Known Bugs); validate
  arrival in the Live Trap screen first.

## 7. Exit Conditions
- **On Create/Edit (success):** toast; new/updated row with Severity; audit entry.
- **On Enable/Disable:** Status flips; matching starts/stops.
- **On Delete:** row removed after confirm.
- **At runtime:** a matching trap raises an alert of the configured severity and fires linked
  notifications — the end-to-end assertion.

## 8. Validations
- **Policy Name** — required; expected unique among trap policies. TODO confirm scope.
- **Severity** — required (grid column).
- **Trap match (OID/varbind)** — required; must correspond to a trap the receiver actually decodes.
- **Source** — the source picker must accept the intended device (historically defective — see Bugs).
- Exact field validations TODO(source: KG/docs — form not captured).

## 9. Business Rules
- **Traps only match if they are received and decoded.** A trap policy is inert unless the SNMP
  community/v3 credentials line up between device and receiver (KB §7, PQD-33528) — a precondition to
  verify before asserting a policy fires.
- **Match on OID/varbind, not on a numeric threshold** (no Threshold Value column) — trap policies are
  event-classification policies.
- **Trap alerting is a separate system** from Metric/Log/Flow policies (source: docs) — shared
  behavior must not be assumed from those policy types.
- A profile with **`Filter = Yes` drops the trap before the policy engine sees it** (see
  `../snmp-trap/snmp-trap-profiles.md` §9) — a second, non-obvious way a policy silently never fires.
- Uniqueness / defaults / limits — TODO(source: Motadata KG/docs).

### Authoring workflow (source: docs)
```
New → Source = "Traps" → filter criteria (Source Host, Value/Count, operators)
    → combine rules (AND / OR) → Clear Rules → Severity → Actions → email notification
```
- **Email placeholders:** `$alert-name$`, `$alert-severity-description$`, `$alert-triggered-time$`.
- Policies can be **Enabled, Disabled, Deleted**; severity is colour-coded; the listing shows a
  **24-hour trigger frequency** and an **hourly trend**.
- Alerts can also be created **directly from a received trap** via the Trap Explorer row **Action**
  column — a cross-module entry point into this screen with no test suite today
  (see `../../TrapExplorer/README.md` §7.2).

## 10. Known Bugs
From `customer-issue-kb.md` (§5 Policies, §7 Trap Explorer):

- **Trap policy can't add source** — the source picker in the trap-policy editor failed to add a
  source (KB §5 "Policy configuration & semantics issues"). Verify the Create/Edit source selector.
- **Traps in tcpdump but not in Trap Explorer** — wrong SNMPv2c community string, or SNMPv3 traps sent
  with a **blank username**, so traps never reach the policy engine (KB §7, PQD-33528). Correct the
  community/v3 credentials and validate on the Live Trap screen.

## 11. Edge Cases
- Trap arriving with the wrong community string / blank v3 username (never matches — MOTADATA class).
- Create/Edit policy and try to add a source (known defect regression).
- Match OID that no device actually sends (never fires).
- Duplicate / empty / very long policy name; Unicode.
- Delete a policy with **Used Counts > 0**.
- Enable/disable rapidly; toggle during a trap burst.
- High-rate trap storm (does matching keep up / alert-storm behavior).
