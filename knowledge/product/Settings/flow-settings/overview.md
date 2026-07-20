---
screen: Flow (Flow Settings landing)
module: Settings
category: flow-settings
route: "/settings/flow-settings/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # catalog/settings_flow_settings.json (identical to the Flow Settings config form); known_issues/customer-issue-kb.md (flow ingestion, §7). No screenshot depicts this screen — Flow.png is the analytics dashboard, not Flow Settings.
verified: 2026-07-09
---

# Flow — Flow Settings (Section Landing)

## 1. Purpose
The **landing screen for the Flow Settings section** (`/settings/flow-settings/`). It hosts the family of
flow-configuration screens and, in the captured sweep, renders the **Flow Settings collector config form**
by default (same controls as `flow-settings.md`: sFlow Port, Netflow Port, Aggregation Time, sFlow v5
Traffic Direction, BGP Port Enable, Update Flow Settings).

- **Business objective:** one entry point to configure everything about how NetFlow/sFlow is received and
  how flow endpoints are labelled for analytics.
- **Screen description:** the Flow Settings shell whose sibling screens are the collector config plus the
  mapping/sampling tables; the root route lands on the collector config form.
- **Primary use cases:** reach the collector config or any mapping screen; set listener ports / aggregation.
- **Who uses it:** admins configuring flow. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Flow module/license; exporters; the analytics that consume the config + mappings.

> This file documents the **section landing / root route**. The functional collector-config detail lives in
> **`flow-settings.md`** (route `/settings/flow-settings/flow-settings`), which the catalog shows is
> **identical** to this root. Treat the two as the same form reached by two routes; keep detail in sync.

## 2. Navigation
```
Settings → Flow  (a.k.a. "Flow Settings")
```
- **Breadcrumb:** Settings › Flow
- **Child screens:** Flow Settings · Sampling Rate · Application Mapping · Protocol Mapping · AS Mapping ·
  Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/` (root; lands on the collector config form).

## 3. Actions
Same as the collector config form:
- Edit **sFlow Port**, **Netflow Port**, **Aggregation Time (Min)**.
- Select **sFlow v5 Traffic Direction** (2 radios). Toggle **BGP Port Enable**.
- **Update Flow Settings** — save.
- Navigate to any child mapping / sampling screen.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| sFlow Port | `input[name="port"]` (numeric) — one of two `port` inputs |
| Netflow Port | `input[name="port"]` (numeric) — the second `port` input |
| Aggregation Time (Min) | numeric input (id not captured) TODO(source: catalog) |
| sFlow v5 Traffic Direction | 2 radios (labels not captured) TODO(source: catalog) |
| BGP Port Enable | ant-switch (1 switch) |
| Update Flow Settings (primary) | button labelled **Update Flow Settings** |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |

> **Automation caveats (same as `flow-settings.md`):** both port inputs share `name="port"` (disambiguate by
> label/order); captured `buttonIds` `#smtp-server-requires-authentication-btn-` and `#btn-save-my-profile`
> are **borrowed ids from other screens** — verify live and never cross into My Profile via
> `#btn-save-my-profile`.

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings.json`; promote verified ones into
the cookbook (Settings > Flow > Flow Settings)._

## 5. Permissions
- Global collector config → expected **Admin**-only write. Generic RBAC reasoning only.
  TODO(source: KG/docs). Requires the **Flow** module/license. TODO(source: docs).

## 6. Entry Conditions
- Logged in; Settings reachable; **Flow module enabled**. Existing config values load into the form.

## 7. Exit Conditions
- **On Update (success):** toast; values persist; collector applies new ports / aggregation.
  TODO(source: docs) — collector restart/re-bind behaviour.
- Navigating to a child screen loads that screen's grid/form.

## 8. Validations
Same as the collector config form:
- **sFlow Port / Netflow Port** — valid UDP port (1–65535), likely must differ. TODO(source: docs).
- **Aggregation Time (Min)** — positive integer with bounds. TODO(source: docs).
- **sFlow v5 Traffic Direction** — one radio required. TODO(source: docs).

## 9. Business Rules
- The root route is a shell that defaults to the collector config; child screens are the mapping/sampling
  tables (reasoned from the identical catalog + sibling routes).
- Exporters must target the configured sFlow/NetFlow ports or **no flow is received**.
- TODO(source: KG) — exact default child screen and whether the root ever differs from
  `/settings/flow-settings/flow-settings`.

## 10. Known Bugs
No defect recorded against the settings **form** itself. Adjacent flow-ingestion issues that make the port /
version config on this screen matter (KB §7): `PQD-30304 [MOTADATA-6334]` (bi-directional NetFlow unparsed,
`tmp_asa_bi_flow` productized 8.0.22); `PQD-36645` / `PQD-29136` (NetFlow v5-vs-v9 version mismatch and wrong
exporter flow config → align versions, reconfigure exporters to the configured ports). Cited as context, not
attributed to this UI.

## 11. Edge Cases
Same as the collector config form: same sFlow/NetFlow port; out-of-range/privileged/non-numeric port;
port change during live flow; aggregation time 0/negative/huge; BGP toggle and sFlow v5 direction changes;
the two-`name="port"` collision; no-op save; save with Flow module disabled. Plus: root route vs.
`/flow-settings/flow-settings` divergence; deep-link straight to a child mapping screen.
