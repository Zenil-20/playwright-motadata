# MOTADATA-8503 — Live grounding findings (build 8.2.4)

Grounded by driving the live app (172.16.15.247) + rendering the Figma frame (node 30368:222640) and diffing design vs shipped.

## Confirmed implemented as designed
- Unified Create Policy with left module nav: Availability, Metric, Log, Flow, APM, Trap, Network Config, NetRoute, Real User Monitoring (A1).
- Set Conditions = 4 cards in order: Threshold Alert | Baseline Alert | Anomaly | Forecast (A2).
- APM "Policy Type" toggle (Trace Metrics | Trace Analytics) above Set Conditions (D1).
- Severity rows critical / major / warning, each operator dropdown (Equals…) + Value (B4).
- Notify-if-breach / Abnormality Occurrence / Auto Clear present (B5).

## Discrepancies to flag to the team (NOT auto-passed)
1. **B1 mechanism differs from AC wording.** AC says "Create Policy is *disabled* until Policy Name provided." Live: the button stays **enabled**; clicking with empty required fields **validates on submit** and red-highlights the empty field (observed: Counter outlined red). Gating intent is met, mechanism differs. Test updated to assert intent (no create/navigate on empty submit). Recommend the team confirm whether disable-vs-validate is the intended UX.
2. **Accordion label inconsistency across modules.** Metric module shows a **"Set Alert Message"** accordion; APM shows a **"Modify Default Alert"** button + "Notification/Take Action/Declare Incident" accordions. Ticket wording ("Set Alert Message / Notify Team / Take Action / Declare Incident") matches neither exactly. Assertions must use the per-module shipped labels.

## Behavioral gotchas (baked into cookbook)
- Deep-link `/policies/<mod>/create` does NOT hydrate — navigate via Create Policy + module click.
- In-panel module links are **hrefless**; `getByRole('link',{name:'NetRoute'})` hits the GLOBAL sidebar (→ /netroute/). Scope to the hrefless in-panel link.
- Form inputs render lazily — wait for the Counter input before interacting.
- RUM module label/slug = "Real User Monitoring".

## Verified selectors → cookbook §16.4 "Policy Settings — Create Policy (unified)".

## Test data (confirmed by user): Checkout Service (APM), Customer Portal (RUM), WAN Interface (NetRoute) exist in this sandbox.
