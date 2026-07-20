---
screen: Monitoring · agent-monitor-settings
module: Settings
category: monitoring
route: "/settings/monitoring/agent-monitor-settings"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_monitoring_agent_monitor_settings.json · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Monitoring · Agent Monitor Settings

## 1. Purpose
The **agent-based monitor inventory** — the grid of monitors collected by an installed ObserveOps
**agent** (as opposed to agentless device polling). It adds agent-lifecycle columns the device grid
does not have — **Health**, **Duration**, **State**, **Version**, **Configuration** — so an admin can
see each agent's health, how long it has been in its current state, its running state, its agent build
**version**, and its configuration, alongside the usual Monitor/IP/Status columns.

- **Business objective:** manage the agent fleet — confirm agents are healthy, on the right version,
  reporting, and correctly configured; find and act on agents that are down, stale, or mismatched.
- **Screen description:** a monitor grid similar to the device inventory but agent-scoped, with a
  **Search** box (`name="search-agent"`), a **Filter** (`#btn-filter-agent`), and a reduced toolbar
  (show/hide columns, tag import, tag inventory). The catalog captured **16 checkboxes** (a smaller
  agent fleet than the 102 on the device grid), per-row select plus a per-row **Actions** menu
  (`[data-cy='grid-action']`).
- **Primary use cases:** find an agent monitor; check Health/State/Version/Duration; bulk tag import;
  browse tag inventory; show/hide columns; filter the agent list.
- **Who uses it:** monitoring administrators managing agents. TODO(source: KG/docs) confirm exact role gating.
- **Dependencies:** an installed, registered agent on the endpoint · open agent ports · the tag store ·
  a version row correctly migrated in PostgreSQL (drives the Version column — see Known Bugs).

> No screenshot exists for this route; Purpose/Actions/Validations are grounded in the catalog and the
> Agents section (§6) of the customer-issue KB, with unverifiable specifics marked TODO.

## 2. Navigation
```
Settings → Monitoring → Agent Monitor Settings
```
- **URL:** `/settings/monitoring/agent-monitor-settings` (open the full URL; SPA routing must load it)
- Sibling screens: **Device Monitor Settings** (agentless grid), **Custom Monitoring Field**.

## 3. Actions
Derived from the catalog `buttonIds`/`buttons`:

- **Search** agent monitors — free-text box (`name="search-agent"`, placeholder _"Search"_).
- **Filter** — `#btn-filter-agent` (agent-specific filter button) / the **Filter** button.
- **Bulk: Tag Import** — `#bulk-tag-import`.
- **Show / Hide Columns** — `#btn-show-hide-columns`.
- **Tag Inventory** — `#btn-tag-inventory`.
- **Per-row Actions** — `[data-cy='grid-action']` menu (drill in / edit / configuration / delete —
  TODO(source: KG/docs) confirm exact items).
- **Select rows** — per-row checkboxes (16 captured); tag import operates on the selection.

> Unlike the device grid, this screen's catalog has **no** `#bulk-interface-speed`,
> `#bulk-metric-collection-type`, `#export-pdf-btn`, or `#export-csv-btn` — interface-speed/metric-type
> bulk config and PDF/CSV export were not captured here. TODO(source: KG/docs) confirm whether export
> is genuinely absent for agent monitors or simply outside the sweep.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-agent"]` (placeholder _"Search"_) |
| Filter | `#btn-filter-agent` (and the **Filter** button) |
| Bulk — Tag Import | `#bulk-tag-import` |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Tag Inventory | `#btn-tag-inventory` |
| Row select / select-all | checkboxes (16 captured) |
| Per-row Actions menu | `[data-cy='grid-action']` |
| Grid columns | Monitor · IP · Instances Count · Groups · Type · **Health** · Status · **Duration** · **State** · **Version** · **Configuration** · Actions |

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Monitoring > Agent)._

## 5. Permissions
- **View:** monitoring admins/operators can view the agent grid; Viewer-type roles likely read-only.
  TODO(source: KG/docs) confirm.
- **Tag import / configuration / delete:** expected to require an admin/operator monitoring-management
  permission. TODO(source: KG/docs) confirm exact role names.

## 6. Entry Conditions
- User is logged in with a valid session; Settings is reachable (`/settings/`).
- At least one agent is installed and **registered** (visible in the GUI) — an agent with closed ports,
  hostname problems, or missing config never appears (kb §6, PQD-29673 / PQD-27359 / PQD-39434 class).
- The agent's version row is present so the **Version** column resolves.

## 7. Exit Conditions
- **Search/Filter:** grid narrows to matching agent monitors; count updates.
- **Tag import applied:** success toast; tags reflect on selected agent monitors.
- **Show/Hide Columns:** grid re-renders with the chosen columns (preference persists).
- **Row Actions (drill-in / configuration):** navigation to the agent's detail/configuration.
- **Health/State reflect the live agent:** a healthy reporting agent shows an "up"/healthy Health and
  State; a down agent shows down after its heartbeat drops (see Known Bugs for the reboot case).

## 8. Validations
- **Search** — free text; empty restores the full list. TODO(source: docs) match scope.
- **Tag import** — tags are lower-cased; uppercase CSV tags historically inconsistent (see Known Bugs).
  TODO(source: docs) exact CSV schema.
- Tag import requires a selection — TODO(source: KG/docs) confirm the UI blocks with no rows checked.
- **Version** column is data-driven from the agent's registered build; a mismatch between what Health
  reports and what Settings shows is a known defect (see Known Bugs), not a user-input validation.

## 9. Business Rules
- **Agent grid is agent-scoped**: it carries agent-lifecycle columns (Health, Duration, State, Version,
  Configuration) that the agentless device grid does not.
- **Tags are stored lower-case** (kb §1, PQD-34441); relevant to `#bulk-tag-import` / `#btn-tag-inventory`.
- **Availability method matters for agent up/down:** after a reboot an agent can show down when the
  Heartbeat method drops; switching availability from **Heartbeat → Ping** restores it (kb §6, PQD-41189).
- **Poller intervals live in the agent's own config** and can reset to aggressive defaults on
  reinstall/upgrade (kb §6, PQD-36066) — the grid reflects the agent, so a regressed interval is an
  agent-side, not grid-side, fix.
- TODO(source: KG/docs): whether interface-speed / metric-collection bulk actions and PDF/CSV export
  exist for agent monitors (absent from this catalog).

## 10. Known Bugs
Cited from `knowledge/known_issues/customer-issue-kb.md` §6 (Agents):

- **Agent version mismatch — Health shows one build, Settings shows another** (kb §6, **PQD-39053**).
  *Symptom:* Health screen shows agent **8.1.3** while settings show **8.0.24**. *Diagnosis:* the
  PostgreSQL version row was not migrated. *Workaround:* correct the version row in PostgreSQL.
  Directly affects the **Version** column on this grid.

- **Agent poller intervals reset to aggressive defaults after reinstall/upgrade** (kb §6, **PQD-36066
  [MOTADATA-7668]**). *Symptom:* polling reset to aggressive ~10s defaults after reinstall/upgrade
  (endpoint slowness). *Workaround:* restore poller values in `agent.json` (e.g. 600s); back up agent
  config before upgrades. (Install 8.1.2+ agent, which also removed the PowerShell dependency.)

- **Registration / identity conflicts — "Already provisioned" / phantom slave on re-register**
  (kb §6, **PQD-34966 / PQD-32591**). *Symptom:* "Already provisioned" on register; a phantom second
  slave entry appears. *Diagnosis:* the agent is still registered to another HA server; stale
  deployment entries. *Workaround:* deregister first; purge stale entries.

- **Agent down after reboot** (kb §6, **PQD-41189**). *Symptom:* agent shows down after a reboot.
  *Diagnosis:* heartbeat drop after restart. *Workaround:* switch the availability method
  **Heartbeat → Ping**.

## 11. Edge Cases
- Agent whose **Version** (Settings) disagrees with the Health screen (PQD-39053) — assert the grid's
  Version reflects the migrated PG row.
- Agent that **reboots** and drops heartbeat → shows down until availability is switched to Ping (PQD-41189).
- Agent **reinstalled/upgraded** → poller interval regressed to ~10s default (PQD-36066); assert config
  survives.
- **Re-registering** an agent already bound to another HA node → "Already provisioned" / phantom slave
  (PQD-34966 / PQD-32591).
- Installed agent that **never appears** in the grid (closed ports / hostname / missing config —
  PQD-29673 class).
- **Tag import** with uppercase or blank tags (PQD-34441 / PQD-32287).
- Empty agent fleet (no agents installed) — grid shows no rows.
- **State vs. Health vs. Status** columns disagreeing — verify each conveys a distinct, correct signal.
