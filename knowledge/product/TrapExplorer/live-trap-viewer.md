---
screen: Trap Explorer · live-trap-viewer
module: TrapExplorer
route: "/trap-explorer/live-trap-viewer"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/trap_explorer_live_trap_viewer.json · screenshots/TRAP.png (BUILD 8.2.5, parent screen) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Trap Explorer · live-trap-viewer

## 1. Purpose
The **Live Trap Viewer** — a real-time stream of **incoming SNMP traps** as they are received, before
aggregation. Where the main Trap Explorer shows a time-scoped, rolled-up grid, this view is the "tail
-f" of the trap receiver: each raw trap appears as a row (with an expandable detail) so a user can
confirm, in real time, that a device's traps are actually arriving.

- **Business objective:** verify trap reception live — the primary tool for confirming a device is
  sending traps and that community/v3 credentials match (the KB explicitly points here to validate the
  "traps not visible" problem).
- **Screen description:** a live-updating grid with an **expandable field** (row expander), **Received
  Time**, **Trap OID**, **source**, and **message**. Reached from the **Live Trap Viewer** button on the
  parent Trap Explorer screen (see `TRAP.png`).
- **Primary use cases:** watch traps arrive in real time; expand a row to inspect the full trap payload;
  confirm a specific source/OID is being received.
- **Who uses it:** NOC / network engineers troubleshooting trap delivery. TODO(source: KG/docs) — role gating.
- **Dependencies:** the trap receiver running; a device actively sending traps with correct
  community/v3 credentials.

## 2. Navigation
```
Trap Explorer (/trap-explorer/) → "Live Trap Viewer" button (top-right) → /trap-explorer/live-trap-viewer
```
- **URL:** `/trap-explorer/live-trap-viewer`.
- **Back:** returns to the main Trap Explorer grid.

## 3. Actions
- **Watch the live stream** — new traps append as they are received (real-time; no time-range picker was
  captured here — the view is "now").
- **Expand a row** — the `expandableField` column expands a trap to show its full detail/payload.
- TODO(source: KG/docs) — whether the stream can be paused/cleared, and whether a per-row action
  (acknowledge / create trap) exists here as on the parent screen (none captured).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Row expander | `expandableField` (expand/collapse a trap row) |
| Received Time | grid column (arrival timestamp) |
| Trap OID | grid column |
| source | grid column (sending device/IP) |
| message | grid column (trap message/payload) |

> Only the five grid columns were captured — no search, buttons, filter, or time-range picker. This is
> consistent with a live tail view. Confirm any pause/clear controls live.

_Locators: see `knowledge/locators/catalog/trap_explorer_live_trap_viewer.json`. No `id`s captured;
harvest the row-expander and grid locators live and promote to `selector-cookbook.md`
(Trap Explorer > Live Trap Viewer)._

## 5. Permissions
- Requires trap-receiver/monitoring access (same module as Trap Explorer). TODO(source: KG/docs) — role
  specifics; likely read-only viewing.

## 6. Entry Conditions
- Logged in; the trap receiver is running; reached from the parent Trap Explorer.
- To see anything, a device must be **actively sending** traps with matching community/v3 credentials.

## 7. Exit Conditions
- Incoming traps append to the grid in real time (success signal = rows appear for a known sender).
- Expanding a row reveals the full trap detail.
- Navigating back returns to `/trap-explorer/`.

## 8. Validations
- No input fields were captured (view-only stream) — no field validations apply.

## 9. Business Rules
- This is a **raw, un-aggregated, real-time** view (no Count column, unlike the parent grid) — each
  received trap is its own row keyed by Received Time.
- No time-range scoping — it shows traps as they arrive ("live").
- It is the **recommended validation surface** for trap-reception problems (per the KB).
- TODO(source: Motadata KG) — buffer size / how many live rows are retained on screen, and refresh
  mechanism (websocket vs poll).

## 10. Known Bugs
- **Traps not visible** (kb §7, PQD-33528): when traps appear in `tcpdump` but not in Trap Explorer, the
  cause is a **wrong SNMPv2c community string** or an **SNMPv3 trap sent with a blank username**. The KB
  prescribes **validating in the Live Trap screen** (this view): correct the community / v3 credentials
  on device and receiver, then confirm the trap now appears here. No fix-version pinned —
  configuration-class defect.

## 11. Edge Cases
- No traps arriving (silent when the sender is misconfigured — the PQD-33528 case; nothing appears).
- High trap rate (does the live grid keep up / cap the visible rows?).
- Expanding a trap with an unusually large payload/message.
- Unknown / unresolved source (raw IP only).
- Malformed or truncated trap (partial fields).
- Leaving the view open a long time (memory/row growth).
- Credentials fixed mid-session — traps should start appearing without a reload.
