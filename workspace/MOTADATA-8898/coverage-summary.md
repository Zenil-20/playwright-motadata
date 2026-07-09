# MOTADATA-8898 — Coverage Summary

Feature: Metric Description availability in Widget Creation for APM / RUM / Log / NetRoute / Flow.
Jira: http://172.16.10.6:8080/browse/MOTADATA-8898  (Improvement, Done, AIOPS)

## AC → case traceability (no orphan ACs)

| AC | Meaning | Covered by |
|----|---------|------------|
| A1 | Descriptions available for APM/RUM/Log/NetRoute/Flow | TC-DESC-APM, -RUM, -LOG, -NETROUTE, -FLOW, -METRIC-REGRESSION |
| A2 | Description conveys measure/interpretation/root-cause | TC-DESC-CONTENT |
| A3 | Description pop-up per metric in the new categories | TC-DESC-APM…FLOW, TC-DESC-TRIGGER |
| A4 | Visible upon selecting a metric in the Metric dropdown | TC-DESC-TRIGGER (+ every availability case) |
| A5 | Mapped from data source, displayed consistently | TC-DESC-CONTENT |
| A6 | Consistent format/structure across categories | TC-DESC-CONSISTENCY |
| A7 | Missing data → 'unavailable' message | TC-DESC-MISSING |

All 7 ACs covered. 10 cases total.

## Risk ordering (smoke → high-traffic → edge)
1. smoke: TC-DESC-TRIGGER, TC-DESC-APM, TC-DESC-RUM, TC-DESC-LOG, TC-DESC-METRIC-REGRESSION
2. high-traffic: TC-DESC-NETROUTE, TC-DESC-FLOW, TC-DESC-CONTENT, TC-DESC-CONSISTENCY
3. edge: TC-DESC-MISSING

## Automatability reality
- **All availability + consistency cases**: automatable AFTER a live harvest of the widget-creation screen (not yet in cookbook) — locators for the category selector, Metric dropdown, and the description affordance must be resolved via `motadata-explorer`.
- **TC-DESC-CONTENT**: partial — assert non-empty + text != metric-key; verbatim copy stays manual.
- **TC-DESC-MISSING (A7)**: conditional — only runnable if a description-less metric exists on the target build; otherwise recorded N/A, never faked.
- **TC-DESC-TRIGGER**: runs first; its outcome (hover vs select) decides the locator/gesture strategy for the rest.

## Known gaps / open questions (carried from ticket.json)
1. Exact metric names per category not given → resolve "first available metric" live.
2. No verbatim description strings → content asserted structurally, not word-for-word.
3. Trigger gesture contradictory in ticket (hover vs select) → live behavior is authoritative.
4. **Seed-data location**: description data referenced on 172.16.13.206 / /db-files; automation target is 172.16.15.86 — must confirm data is present there before content asserts are valid.
5. Widget-creation screen unharvested → 100% live locator resolution required.
