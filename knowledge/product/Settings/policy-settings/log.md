---
screen: Policy Settings · log
module: Settings
category: policy-settings
route: "/settings/policy-settings/log"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/settings_policy_settings_log.json (sweep 2026-07-02) + screenshots/log.png (module data view) + known_issues/customer-issue-kb.md §7/§5
verified: 2026-07-09
---

# Policy Settings · Log

## 1. Purpose
The **Log policy** list — where administrators define **alert policies over ingested log data**. A log
policy matches log events (by pattern, field, event ID, count, or threshold) for a set of sources/tags
and raises a severity-graded alert of a given **Alert Type** when the condition is met.

- **Business objective:** convert high-volume log streams into targeted alerts (e.g. "5 failed-login
  events in 1 minute → Major") so security/ops teams are notified without manually searching logs.
- **Screen description:** a searchable, filterable grid of existing log policies with per-row
  enable/disable switch, row actions, and a **Create Policy** entry point. Sibling of the Metric,
  Flow, Trap and other policy tabs under **Settings → Policy Settings**. The `log.png` screenshot
  shows the **Log Explorer** (the module's data/search view that these policies act on), not the
  policy grid itself — the grid controls below come from the catalog sweep.
- **Primary use cases:** create a log alert policy, tune its **Alert Type** and **Severity**, target
  it by tag/source, enable/disable, clone, delete, and review **Used Counts**.
- **Who uses it:** monitoring / security administrators. TODO(source: KG/docs) — exact role gating.
- **Dependencies:** the log ingestion + parser pipeline (a policy can only match logs that are being
  parsed/indexed) · source-to-parser assignment (by source IP) · the notification/action layer ·
  log licensing/quota.

## 2. Navigation
```
Settings → Policy Settings → Log
```
- **Breadcrumb:** Settings › Policy Settings › Log
- **Sibling policy tabs:** Availability · Metric · **Log** · Flow · Trap · NetRoute · APM ·
  Network Config · Real User Monitoring
- **URL:** `/settings/policy-settings/log`

## 3. Actions
- **Create Policy** (`#create-policy-btn`) — new log-alert policy form/drawer.
- **Filter** (`#filter-btn`) — narrow by severity, policy type, alert type, tag, or status.
- **Search** — free-text over the grid (`search` input, placeholder _"Search"_).
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Enable / Disable** a policy — per-row **Status** toggle (**ON/OFF**; 50 switches captured ⇒ ~50
  log policies on the swept instance — the largest policy set of any tab here).
- **Row actions** (`[data-cy='grid-action']`) — Edit / Clone / Delete (TODO confirm menu).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[placeholder="Search"]` (name `search`) |
| Filter | `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Create Policy (primary) | `#create-policy-btn` |
| Policies grid | **Policy Name · Used Counts · Severity · Policy Type · Alert Type · Tag · Status · Action** |
| Per-row Status toggle | ant-switch **ON/OFF** (~50 rows) |
| Per-row action menu | `[data-cy='grid-action']` |

- **Severity** and **Alert Type** are first-class grid columns here (unlike Metric) — a log policy
  carries an explicit severity and an alert type/classification.
- **Used Counts** = how many sources/instances the policy applies to.

> The **Create Policy** form (name, match condition/pattern, event-ID/field selector, count/window,
> severity, alert type, target sources/tags, notification) was **not captured** in the grid sweep —
> confirm the field set live/KG before form-level tests.

_Locators: catalog `settings_policy_settings_log.json`; promote verified ones into the cookbook
(Policy Settings > Log)._

## 5. Permissions
- **Admin / security administrator:** full CRUD + enable/disable.
- **Operator / Viewer:** TODO(source: KG/docs).
- License gating: log policies require the **Log module / log licensing** to be active — if the log
  license/verticles aren't started, policies won't evaluate (see Known Bugs). TODO confirm exact gate.

## 6. Entry Conditions
- Logged in; Policy Settings → Log loads and the grid renders.
- For a meaningful policy: logs are being ingested **and parsed** for the targeted source (logs that
  land in "Others"/unparsed won't match a field-based policy).
- Log license active and log verticles running (restart required after applying a log license).

## 7. Exit Conditions
- **On Create/Edit (success):** toast; new/updated row with Severity + Alert Type; audit entry.
- **On Enable/Disable:** Status flips; evaluation starts/stops.
- **On Delete:** row removed after confirm.
- **At runtime:** a matching log burst raises an alert of the configured severity/alert type in the
  Alerts screen and fires linked notifications — the end-to-end assertion.

## 8. Validations
- **Policy Name** — required; expected unique among log policies. TODO confirm scope.
- **Severity** — required (it's a grid column, so every policy has one).
- **Match condition / pattern** — required and non-empty; a numeric-only match is dangerous (see Bugs).
- **Count / window** — numeric; window satisfiable relative to log arrival rate.
- Exact field validations TODO(source: KG/docs — Create Policy form not captured).

## 9. Business Rules
- **Parser assignment is per source-IP.** A policy matching parsed fields only works if the source's
  logs are actually assigned to the right parser; dynamic/dual-WAN IPs break the assignment (KB §7,
  PQD-35659). A field-based log policy over an unparsed source silently never matches.
- **A log alert can fire while "no logs found"** if the match is too broad or the underlying data
  layer disagrees (KB §7, MOTADATA-7925 — see Known Bugs).
- **Occurrence/count window vs. arrival rate** — like all policies, a count-in-window condition must be
  satisfiable by the actual log volume (KB §5 occurrence math).
- Uniqueness / defaults / limits — TODO(source: Motadata KG/docs).

## 10. Known Bugs
From `customer-issue-kb.md` (§7 Log / Flow / Trap Explorers, §5 Policies):

- **Over-broad default numeric-event-ID alert** — a default log alert keyed on a numeric event ID
  matched *any* log containing that value, firing spuriously ("alert fires but no logs found"). The
  default alert was **removed in 8.2.0** (PQD-37669 / **MOTADATA-7925**).
- **Logs land in "Others" / not parsed → policy can't match** — `windows.event.provider` was
  non-indexable; hotfix + config parameter to index the field in an **8.1.3** patch (PQD-38164 /
  **MOTADATA-8029**). Only Event/Application/Security sources are enabled by default; add event sources
  with event IDs in agent settings.
- **Log verticles not started after applying a license** → policies don't evaluate until the service
  is restarted (KB §7, PQD-35039).

## 11. Edge Cases
- Numeric-only match value that coincidentally appears in unrelated logs (MOTADATA-7925 class).
- Policy over a source whose logs land in "Others"/unparsed (no match).
- Dual-WAN / changing source IP breaking parser assignment mid-policy.
- Count/window unsatisfiable by log arrival rate (never fires) or trivially satisfiable (alert storm).
- Duplicate / empty / very long policy name; Unicode in pattern.
- Delete a policy with **Used Counts > 0**.
- Apply log license without restarting verticles (policy inert).
- Enable/disable rapidly; toggle during an active log burst.
- Daily log quota not reset at midnight interacting with count-based policies (KB §7, PQD-34767).
