---
screen: NetRoute · netroute
module: NetRoute
route: "/netroute/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/netroute.json · screenshots/netroute.png · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# NetRoute

## 1. Purpose
The **NetRoute monitoring dashboard** — tracks synthetic reachability from the AIOps collector to a set of
named destinations (public sites, internal hosts, IPs), reporting **latency**, **packet loss**, and
**availability** per target so operators can see WAN/internet path health at a glance.

- **Business objective:** continuously verify that critical external and internal endpoints are reachable
  and performant from the monitoring source, catching path degradation (loss/latency) before users complain.
- **Screen description:** a header title (**NetRoute**), a **Search** box, a list-view toggle icon
  (top-right), and a grid of **destination cards**. Each card shows the target **name** (e.g. LAMA,
  Youtube, chatgpt, windows vm, google.com, dns, gmail), a status dot, **Latency** (ms), **Packet Loss**
  (%), **Source** (e.g. AIOps) → **Destination** (e.g. www.youtube.com / 8.8.8.8), an **Availability %**
  with a strip of per-poll bars (green up / red down), and **Last Polled at** timestamp.
- **Primary use cases:** watch reachability/latency/loss across many targets, search for a destination,
  spot a target at 0 % availability (all-red bars), switch to list view.
- **Who uses it:** network/WAN operators and administrators.
- **Dependencies:** NetRoute probes configured (Settings → Monitoring → NetRoute Setting; policy under
  Settings → Policy Settings → NetRoute) · the collector/source that runs the probes · the poller cadence.

## 2. Navigation
```
Left icon rail → NetRoute (route/branch icon)
```
- **URL:** `/netroute/` — open the full URL; SPA routing must load the page.
- Title header: **NetRoute**.

## 3. Actions
- **Search** — filter destination cards by name (`input` _Search_).
- **Reload NetRoute data** — the `Reload netroute data (late…)` control refreshes the cards to the latest
  poll.
- **Toggle list view** — top-right list icon (card ↔ table).
- **Open a destination** — click a card to drill into its trend/detail. TODO(source: KG) confirm route.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Search | `input` _Search_ |
| Reload | `Reload netroute data (late…)` button |
| List-view toggle | top-right list icon |
| Destination card | name · status dot · Latency (ms) · Packet Loss (%) · Source → Destination · Availability % + per-poll bar strip · Last Polled at |

> The catalog captured only the Search input and the Reload button — the body is a **card dashboard**, no
> form/grid. Card internals come from the screenshot.

_Locators: see `knowledge/locators/catalog/netroute.json`; promote verified ones into the cookbook
(NetRoute)._

## 5. Permissions
- **View:** Admin / Operator / Viewer with NetRoute access (module is license-gated).
- Probe/policy configuration is elsewhere (Settings → Monitoring → NetRoute Setting / Policy Settings →
  NetRoute). TODO(source: KG/docs) confirm which roles can view vs configure.

## 6. Entry Conditions
- User is logged in; **NetRoute module licensed and enabled**.
- At least one NetRoute probe/destination is configured and has polled at least once (else empty / no cards).
- Collector/source running the probes is up.

## 7. Exit Conditions
- **Cards render** current latency/loss/availability with a recent **Last Polled at** timestamp.
- **On reload:** cards refetch to the latest poll.
- Viewing is read-only (no side effects).

## 8. Validations
- No editable fields on this dashboard.
- **Search** is free-text; empty/whitespace is a no-op.
- Probe definition validations (destination host/IP, interval) live in NetRoute Settings.
  TODO(source: KG/docs).

## 9. Business Rules
- **One card = one destination probe** from a Source (AIOps/collector) to a Destination (host/IP).
- **Availability %** is computed from the per-poll up/down history (bar strip); 0 % shows all-red bars
  (screenshot: Bhavin-PC, myntra at 0 %), 100 % all-green.
- **Latency 0 ms with 100 % packet loss** indicates the target is fully unreachable (screenshot: Bhavin-PC
  Latency 0, Loss 100 %) — latency is only meaningful when packets return.
- **Last Polled at** reflects the probe cadence; stale timestamps mean the probe/collector stopped.
- TODO(source: KG): thresholds that color a card red vs green, and the availability window length.

## 10. Known Bugs
_None recorded specifically for the NetRoute dashboard in `customer-issue-kb.md`._
Related (not a NetRoute-screen defect): the KB notes a **NetRoute report** category exists
(screenshots `report - Netroute.png`) and that reachability reporting supported only *result-by-monitor*
(§4 custom-report gap) — relevant only when building NetRoute reports, not for this live dashboard.

## 11. Edge Cases
- **No probes configured** — empty dashboard.
- Target at **0 % availability** (all-red) vs **100 %** (all-green) vs flapping (mixed bars).
- **Latency 0 / loss 100 %** (unreachable) vs low latency / low loss (healthy) — verify card status color.
- Destination that resolves but drops packets intermittently (partial loss, e.g. LAMA 39.859 %).
- **Stale Last Polled at** (collector down) — is the card marked stale or just old?
- Very many destinations — card grid pagination/scroll and search performance.
- Long destination URL/name — card truncation.
- Duplicate destination names pointing at different IPs.
- Reload while a poll is in flight — race/stale paint.
