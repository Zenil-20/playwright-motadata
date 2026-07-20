---
screen: Log Explorer · Pattern-Matched Log (route resolves to Page Not Found)
module: LogExplorer
route: "/log/pattern-matched-log"
build: 8.2.6
status: draft
sources: [catalog, kb]   # locators/catalog/log_pattern_matched_log.json · known_issues §7  (no screenshot)
verified: 2026-07-09
---

# Log Explorer · Pattern-Matched Log

> **Honesty note:** In the swept build (8.2.6, 2026-07-02) this route **does not resolve to a real
> screen** — the catalog title is `Motadata ObserveOps | Page Not Found` and the only control found
> is a single **Go Back** button. Everything below is documented on that basis. Do **not** author
> deep functional behavior for a screen that renders a 404; the intended feature is inferred from the
> route/name only and is flagged TODO.

## 1. Purpose
- **As observed:** the route `/log/pattern-matched-log` renders the app's **Page Not Found** screen —
  a direct-URL navigation to it fails and only offers a way back.
- **Intended (inferred from the name, unverified):** a view of logs matched against a **log pattern**
  (cf. the **Log Pattern** results sub-tab present on Log Search, `/log/search`). It likely was meant
  to show events grouped/counted by a detected pattern. TODO(source: KG/docs) — confirm whether this
  is a deprecated route, an internal/deep-link-only route, or an unimplemented feature.
- **Who uses it:** N/A while it 404s.
- **Dependencies:** N/A (no data loads).

## 2. Navigation
```
Direct URL only:  /log/pattern-matched-log   →  renders "Page Not Found"
```
- There is **no menu path or tab** that leads here in the captured UI. The genuine
  pattern-matching surface lives under **Log Search → Log Pattern** sub-tab (`/log/search`).
- **URL:** `/log/pattern-matched-log`

## 3. Actions
- **Go Back** — the only control; returns the user to the previous page. TODO(source: docs) — exact
  destination.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Go Back | button (the only element captured) |

_`inputs:[]`, `buttonIds:[]`, `gridHeaders:[]`, `tabs:[]`, `selects:0, switches:0, radios:0,
checkboxes:0`. No screenshot exists for this route._

_Locators: nothing verified to promote — the screen is a 404 shell._

## 5. Permissions
- N/A while the route 404s. TODO(source: KG/docs) — if/when the pattern-matched-log view ships,
  document its RBAC alongside Log Search.

## 6. Entry Conditions
- None satisfy it as a functional screen. Any direct navigation currently lands on Page Not Found.

## 7. Exit Conditions
- **Go Back** returns to the prior screen. No data-bearing success state exists.

## 8. Validations
- None (no form / inputs).

## 9. Business Rules
- None observable. TODO(source: KG/docs) — the pattern-matching business logic, if any, is
  documented under **Log Search → Log Pattern**, not here.

## 10. Known Bugs
None recorded for this screen. (KB §7 covers log parsing/search defects but nothing specific to a
`pattern-matched-log` route; the 404 itself is a routing/coverage gap, not a customer-reported
defect.)

## 11. Edge Cases
- Direct-URL / bookmarked navigation to `/log/pattern-matched-log` → must land on Page Not Found with
  a working **Go Back**, not a blank page or JS error.
- **Regression guard for automation:** a test that expects a functional Pattern-Matched Log screen at
  this route will (correctly) fail — assert Page Not Found here, and drive real pattern-matching via
  **Log Search → Log Pattern** (`/log/search`) instead.
- If a future build wires this route up, re-sweep and re-author all 11 sections at Log-Search depth.
