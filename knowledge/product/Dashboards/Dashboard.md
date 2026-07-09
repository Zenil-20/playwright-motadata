---
screen: Dashboard
module: Dashboards
url: "/ (landing after login)"
build: 8.2.5
status: draft
sources: [ui-image]                  # UI-ObserveOps/landing page.png
verified: 2026-07-09
---

# Dashboard (Performance Summary)

## Purpose
The default landing screen after login. A single-pane "Performance Summary" of monitored
infrastructure — top talkers by CPU, memory, disk, latency, and dropped packets across groups.

## Navigation
- Auto-loaded on successful login.
- Left nav → **Dashboards** (first item).
- Dashboard title ("Performance Summary") is switchable to other saved dashboards.

## Actions
- Switch the active dashboard (title dropdown).
- Set the time range (default **Today**) + clear it.
- Favorite the dashboard (★ next to the title).
- Enter fullscreen; snapshot/export; overflow menu (⋮).
- Drill into a monitor from any widget row.
- Global search (top bar); open Notifications (bell); open account/avatar menu.
- Navigate to any module from the left nav.

## Components
- **Left nav (16):** Dashboards, Monitors, Alerts, SLO `BETA`, Reports, Topology, NCCM,
  NetRoute, Metric Explorer, Log Explorer, APM Explorer, RUM Explorer, Flow Explorer,
  Trap Explorer, Audits, Settings.
- **Top bar:** product logo, global search, quick-launch icons, notifications bell,
  `BUILD : 8.2.5`, avatar/account.
- **Dashboard header:** title + ★ favorite, time-range selector (`Today`), from/to timestamps,
  fullscreen, snapshot, overflow (⋮), a time scrubber/timeline.
- **Widget grid:** "Percent by Group", "Top Monitor by CPU Utilization", "Top Monitor by Memory
  Percent", "Memory Used Bytes by Group", "Top Monitor Interface by Dropped Packets", "Top Monitor
  by Latency", "Disk Used Percent" (pie), "Top Monitor by Disk IOPS", "Top Monitor by Low Disk
  Space" (pie). Table widgets show Monitor / metric / **sparkline**; big-number cards show value +
  group; pie widgets show a legend.

_Locators: TODO(source: cookbook) — harvest via `motadata-explorer` and add under
`knowledge/locators` (Dashboards > Dashboard)._

## Permissions
Authenticated users. Which roles can edit/create/share dashboards: TODO(source: docs).

## Entry Conditions
User is logged in; at least one monitor with data exists for widgets to populate.

## Exit Conditions
Navigating a left-nav item leaves for that module; drilling a row opens that monitor.

## Validations
- Widgets render for the selected time range; empty state when no data.
- Time-range from/to consistency: TODO(source: docs).

## Business Rules
- Default landing = Performance Summary (unless a user default is set): TODO(source: docs).
- Widget "Top N" size, refresh interval, group aggregation rules: TODO(source: Motadata KG).

## Known Bugs
_None recorded._

## Edge Cases
- No monitors / no data in range → empty widgets.
- Very large time range → performance.
- Group with a single monitor; monitors with null metrics.
- Fullscreen + auto-refresh interaction.
