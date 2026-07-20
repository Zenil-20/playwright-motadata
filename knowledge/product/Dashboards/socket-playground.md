---
screen: Socket Playground · socket-playground
module: Dashboards
route: "/dashboard/socket-playground"
build: 8.2.6
status: draft
sources: [catalog]            # locators/catalog/dashboard_socket_playground.json (live Vue-router sweep 2026-07-02)
verified: 2026-07-09
---

# Socket Playground

## 1. Purpose
An **internal developer/QA tool** for exercising the platform's real-time **socket (WebSocket) event**
channel — it lets an engineer emit a chosen event type (with an optional payload) onto the socket and watch
the live event stream, to debug the push/real-time layer that drives dashboards and alerts.

- **Business objective:** provide a controlled way to send and observe socket events so engineers can verify
  the real-time pipeline (event delivery, filtering, exclusion) without wiring up a real data source — a
  diagnostic aid, not a customer feature.
- **Screen description:** a small form — an **Event Type** field, an **Excluded Events** field (a
  **CodeMirror** editor for structured/JSON input), and two **radio** options — plus action buttons
  **Send**, **Reset**, and **Clear Events**. Sending pushes the event; Clear Events wipes the observed stream.
- **Primary use cases:** pick/enter an event type, optionally set excluded events, Send, and observe; Reset
  the form; Clear the event log.
- **Who uses it:** developers / QA engineers (not operators or customers).
- **Dependencies:** the WebSocket/event server that the app uses for live push (WS/WSS must be open — the KB
  notes WS/WSS blocked at a firewall breaks the UI, §3).

> **Grounding note:** no screenshot exists for this screen; the description is derived from the catalog
> labels/inputs/buttons and the route. Its exact behavior is TODO(source: KG/docs).

## 2. Navigation
- **URL:** `/dashboard/socket-playground` — open the full URL; SPA routing must load the page.
- Under the **Dashboards** module namespace (`/dashboard/*`), alongside `column-mappers`. A **non-menu /
  direct-route** developer utility; TODO(source: KG) confirm it is not linked from any production menu.

## 3. Actions
- **Set Event Type** — `input` (placeholder _Event Type_) choose/enter the event to emit.
- **Set Excluded Events** — `codemirror` editor for a structured list/JSON of events to exclude.
- **Toggle radios** — 2 radio options (a mode/scope pair). TODO(source: KG) labels.
- **Send** — emit the event onto the socket.
- **Reset** — clear the form back to defaults.
- **Clear Events** — wipe the observed event stream/log.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Event Type | `input` (placeholder _Event Type_); label **Event Type** |
| Excluded Events | `codemirror` editor; label **Excluded Events** |
| Mode radios | 2 radios |
| Send | `Send` button |
| Reset | `Reset` button |
| Clear Events | `Clear Events` button |

_Locators: see `knowledge/locators/catalog/dashboard_socket_playground.json`; promote verified ones into the
cookbook (Dashboards > Socket Playground). The CodeMirror field needs a live locator (it is not a plain input)._

## 5. Permissions
- Almost certainly **developer/admin-only**; not a customer-facing surface. TODO(source: KG/docs) confirm
  whether it is reachable in production builds or gated to non-prod.

## 6. Entry Conditions
- User is logged in.
- The **WebSocket channel is connected** (WS/WSS reachable — see KB §3).
- TODO(source: KG): any build/feature flag that hides this route in production.

## 7. Exit Conditions
- **On Send:** the event is emitted and (if not excluded) appears in the live event stream.
- **On Reset:** the form returns to defaults; no event sent.
- **On Clear Events:** the observed stream is emptied.
- No persistent data is written (a debug playground).

## 8. Validations
- **Event Type** — presumably required to Send; TODO(source: KG) valid event-type set.
- **Excluded Events** — CodeMirror content should be valid structured/JSON; malformed input should be
  rejected before Send. TODO(source: KG) exact format.

## 9. Business Rules
- **Excluded Events filters the stream** — events matching the exclusion list are not shown/emitted.
- **Send / Reset / Clear** operate only on the live socket session, not on stored data.
- TODO(source: KG/docs): the authoritative list of event types and what the two radios switch between.

## 10. Known Bugs
_None recorded for this screen in `customer-issue-kb.md`._
Contextually related (not a Socket-Playground defect): the KB §3 notes **WS/WSS blocked at a firewall makes
the whole UI fail to load** (PQD-38209) — this tool exercises that same socket layer and would be dead if
WS/WSS is blocked. Do not treat as a bug of this screen.

## 11. Edge Cases
- **Socket disconnected** (WS/WSS blocked) — Send should fail visibly, not hang.
- Empty **Event Type** → Send (should be blocked).
- **Malformed** Excluded Events JSON in CodeMirror.
- Send a high volume of events rapidly — stream rendering/back-pressure.
- Clear Events while events are still arriving — race.
- Event type that is excluded by the Excluded Events list — should not appear.
- Reset mid-stream — does it also clear observed events, or only the form?
