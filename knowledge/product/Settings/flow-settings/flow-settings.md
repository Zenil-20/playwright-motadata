---
screen: Flow · flow-settings
module: Settings
category: flow-settings
route: "/settings/flow-settings/flow-settings"
build: 8.2.6
status: draft
sources: [catalog, kb]        # catalog/settings_flow_settings_flow_settings.json; known_issues/customer-issue-kb.md (flow ingestion, §7). No screenshot depicts this screen — Flow.png is the analytics dashboard, not this config form.
verified: 2026-07-09
---

# Flow · Flow Settings (Collector Configuration)

## 1. Purpose
The global configuration form for the **flow collector** — the listener ports and processing options that
govern how NetFlow / sFlow data is received and aggregated. It sets the UDP ports the product listens on,
how flow is aggregated over time, the sFlow v5 traffic direction, and whether the BGP port is enabled.

- **Business objective:** ensure exporters (routers/switches/firewalls) can deliver flow to the correct
  ports and that the received data is aggregated sensibly for analytics.
- **Screen description:** a single settings form with **sFlow Port**, **Netflow Port**, **Aggregation Time
  (Min)**, **sFlow v5 Traffic Direction** (radio), **BGP Port Enable** (toggle), and an **Update Flow
  Settings** primary button.
- **Primary use cases:** change the sFlow/NetFlow listener ports to match the exporter config; set the
  aggregation window; choose the sFlow v5 traffic direction; enable/disable BGP port handling.
- **Who uses it:** admins standing up or tuning flow collection. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Flow module/license; exporters configured to send to these ports; firewall/host
  allowing the UDP ports. The mapping screens (Application/Protocol/AS/Domain/Geolocation/IP) and Sampling
  Rate consume the flow this collector receives.

## 2. Navigation
```
Settings → Flow (Flow Settings) → Flow Settings
```
- **Breadcrumb:** Settings › Flow › Flow Settings
- **Sibling screens (Flow Settings):** Flow Settings · Sampling Rate · Application Mapping ·
  Protocol Mapping · AS Mapping · Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/flow-settings` (the Flow Settings landing `/settings/flow-settings/`
  renders the same form — see `overview.md`).

## 3. Actions
- Edit **sFlow Port**, **Netflow Port**, **Aggregation Time (Min)**.
- Select **sFlow v5 Traffic Direction** (2 radio options — labels not captured; TODO(source: catalog)).
- Toggle **BGP Port Enable** (ant-switch).
- **Update Flow Settings** — save (see automation caveat on the button id).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| sFlow Port | `input[name="port"]` (numeric port) — one of two `port` inputs |
| Netflow Port | `input[name="port"]` (numeric port) — the second `port` input |
| Aggregation Time (Min) | numeric input (label captured; input id not captured) TODO(source: catalog) |
| sFlow v5 Traffic Direction | 2 radios (labels not captured) TODO(source: catalog) |
| BGP Port Enable | ant-switch (1 switch; catalog also lists a button labelled `OFF`) |
| Update Flow Settings (primary) | button labelled **Update Flow Settings** |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |

> **Automation caveats (catalog-grounded, likely copy-pasted ids):**
> - Both **sFlow Port** and **Netflow Port** inputs share `name="port"` — you **cannot** distinguish them by
>   name alone; scope by label/order (nth) or capture their real ids live. TODO(source: catalog live sweep).
> - The captured `buttonIds` are `#smtp-server-requires-authentication-btn-` (for the switch) and
>   `#btn-save-my-profile` (for **Update Flow Settings**) — these are **borrowed ids from other screens**
>   (SMTP auth, My Profile). Do not trust them as stable/semantic; verify live before automating, and never
>   let a test cross into My Profile via `#btn-save-my-profile`.

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings_flow_settings.json`; promote
verified ones into the cookbook (Settings > Flow > Flow Settings)._

## 5. Permissions
- Global collector config → expected **Admin**-only write. Generic RBAC reasoning only.
  TODO(source: KG/docs). Requires the **Flow** module/license. TODO(source: docs).

## 6. Entry Conditions
- Logged in; Settings reachable; **Flow module enabled**.
- Existing values load into the form (ports, aggregation time, direction, BGP toggle).

## 7. Exit Conditions
- **On Update (success):** success toast; values persist; the collector begins listening on the new ports /
  applying the new aggregation window. TODO(source: docs) — whether a collector restart/re-bind is needed
  and whether changing a port drops in-flight flow.
- Good assertions: form reloads with saved values; exporters sending to the new port produce flow in analytics.

## 8. Validations
- **sFlow Port / Netflow Port** — expected valid UDP port (1–65535); the two ports likely must differ, and
  must not collide with other listeners. TODO(source: docs) — exact rules and conflict handling.
- **Aggregation Time (Min)** — expected positive integer minutes with a min/max bound. TODO(source: docs).
- **sFlow v5 Traffic Direction** — one of the two radios required. TODO(source: docs) — option meanings.
- Inline errors not captured. TODO(source: catalog live-form sweep).

## 9. Business Rules
- These ports are where exporters must send flow; a mismatch means **no flow received** (see Known Bugs —
  "switch flow config wrong").
- Aggregation Time governs the roll-up window used by analytics. TODO(source: KG) — exact effect on
  raw vs aggregated flow storage.
- sFlow v5 Traffic Direction and BGP Port Enable alter how v5 sFlow and BGP data are interpreted.
  TODO(source: KG) — precise semantics of each option.

## 10. Known Bugs
No defect is recorded specifically against this settings **form**, but adjacent flow-ingestion issues are
directly relevant to getting these values right (KB §7, Log/Flow/Trap Explorers):
- **version: 8.0.22 · issue: bi-directional NetFlow (ASA/PaloAlto Initiator/Responder octets) not parsed →
  0-byte / wrong volume** — `PQD-30304 [MOTADATA-6334]`; workaround/fix: enable `tmp_asa_bi_flow`
  (productized 8.0.22).
- **issue: flow volume differs from other NMS / "flow not supported"** — `PQD-36645`, `PQD-29136`; root
  cause was **NetFlow version mismatch (v5 vs v9)** and **wrong switch/exporter flow config**; solution:
  align flow versions and reconfigure exporters to send to the configured ports. Reinforces validating the
  sFlow/NetFlow **Port** and **sFlow v5 Traffic Direction** values on this screen against the exporter.
> These are ingestion/parser issues, not bugs in this form — cited as context, not attributed to the UI.

## 11. Edge Cases
- Set sFlow Port = Netflow Port (same port) — expect a conflict error.
- Port out of range (0, >65535), non-numeric, privileged (<1024) port.
- Change a listener port while flow is arriving — is in-flight flow dropped?
- Aggregation Time = 0, negative, huge.
- Toggle BGP Port Enable on/off; switch sFlow v5 direction and confirm analytics change.
- Two-`name="port"` collision — automation must not write both ports to the same field.
- No-op save (Update with zero changes).
- Save with the Flow module/license disabled.
