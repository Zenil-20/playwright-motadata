# Feature: Metric Description in Widget Creation (multi-category)
Jira: MOTADATA-8898   Figma: DPReGBjeIv7nogzeNs9Uel (node 24784-199311)

## Goal
Extend the metric-description pop-up on the widget-creation screen from the "Metric" category only to also cover **APM, RUM, Log, NetRoute, Flow**. When a user picks a metric in the Metric dropdown, a description (what it measures, how to read values, likely root cause of anomalies) must surface for every one of these categories, in a consistent format. Missing description data must produce a clear "unavailable" message rather than a blank.

## In-scope screens
- Widget creation (Dashboard > Create / Add Widget)   # canonical screen key — NOT yet in cookbook
- Metric dropdown / Metric picker (within widget create)
- Category selector (Metric | APM | RUM | Log | NetRoute | Flow)

## User journeys
1. Dashboard → Add Widget → choose data category (APM/RUM/Log/NetRoute/Flow) → open Metric dropdown → select a metric → description pop-up/panel renders with non-empty, category-relevant text.
2. Repeat journey 1 across all five new categories; format/structure stays consistent (A6).
3. Pick a metric known to lack description data → UI shows "description unavailable" message (A7).

## Edge cases
- Trigger ambiguity: Jira test steps say "hover", AC A4 says "visible upon selecting" — live UI decides which gesture surfaces the description (resolve stage must confirm).
- Consistency (A6): same container/role/format across categories — assert structurally, not just per-category.
- Missing data (A7): requires a metric with no mapped description; message text not specified by Jira.

## Data dependencies
- Metric-description data seeded under /db-files/metric-description (NetRoute, APM, RUM, Flow) and /db-files/event-description (RUM, Flow, APM, Log). Verification server referenced in ticket: 172.16.13.206.
- Automation target is https://172.16.15.86 — **state stage must verify the seeded description data is present here**; if absent, content asserts (A2/A5) are not valid on this server and the case is gated, not faked.
- At least one selectable monitor/source per category so the Metric dropdown is populated.

## Out of scope (this pipeline pass)
- Correctness of description *wording* vs source-of-truth copy (A2 semantic accuracy) — we assert presence + non-empty + category-consistent + structural format, not editorial text, unless live copy is captured as the baseline first.
- Backend mapping of description data (A5 server-side) beyond what the UI renders.

## Coverage reality
- Nothing for the widget-creation Metric-description UI exists in any current spec or cookbook (Dashboards screen unharvested) → 100% live harvest required before automation.
- Manual cases (TC1–TC6) cover all five categories + the missing-description path fully and are runnable by a human immediately; automation depends on the resolve/state stages succeeding on 172.16.15.86.
