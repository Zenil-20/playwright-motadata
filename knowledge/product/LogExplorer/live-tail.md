---
screen: Log Explorer · Live Tail
module: LogExplorer
route: "/log/live-tail"
build: 8.2.6
status: draft
sources: [catalog, kb]   # locators/catalog/log_live_tail.json · known_issues §7  (no dedicated screenshot)
verified: 2026-07-09
---

# Log Explorer · Live Tail

## 1. Purpose
The **live streaming** view of the Log Explorer — a `tail -f` over the incoming log pipeline. It
shows logs as they arrive in near real time, with keyword highlighting and source/type filters, so
an operator can watch a device or service while reproducing an issue.

- **Business objective:** real-time observation of freshly-arriving logs (troubleshooting a live
  incident, confirming a fix, watching a noisy source) without repeatedly re-running a search.
- **Screen description:** opened via **Start Live Trail** from the Overview / Log Search screens. It
  streams matching log lines and lets the user filter by a **Select** source/type dropdown and
  **highlight keywords** so matches stand out in the stream. A **Create Log Parser Plugin** action is
  available for turning an unparsed source into a parsed one.
- **Primary use cases:** watch a specific source live; highlight terms of interest; pause/observe;
  kick off creating a parser for logs currently landing unparsed.
- **Who uses it:** analysts/admins actively troubleshooting. TODO(source: KG/docs) — role gating.
- **Dependencies:** an active log stream (sources forwarding now); collector/datastore online.

## 2. Navigation
```
Log Explorer → Overview or Log Search → Start Live Trail   →  /log/live-tail
```
- **URL:** `/log/live-tail`
- **Entry control:** the **Start Live Trail** button (top-right of Overview / Log Search).

## 3. Actions
- **Select** a source/type to tail (two `Select` dropdowns captured — likely source + type/parser;
  `data-cy='dropdown-trigger-input'`).
- Enter **Highlight Keywords** (two `Keywords` inputs) to highlight matches in the live stream.
- **Create Log Parser Plugin** (`#create-log-parser`) — start building a parser for the current
  source.
- Start / stop / pause the tail. TODO(source: docs) — confirm the exact stream controls (the sweep
  captured no explicit start/stop button here beyond the entry action).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Highlight Keywords (label) | section label |
| Source / type selectors | 2× `input[placeholder="Select"]` (`[data-cy='dropdown-trigger-input']`) |
| Keyword inputs | 2× `input[placeholder="Keywords"]` |
| Create Log Parser Plugin | `#create-log-parser` |

_`buttonIds: [create-log-parser]`. `selects:0, switches:0, radios:0, checkboxes:0` — the "Select"
controls are custom dropdowns (data-cy `dropdown-trigger-input`), not native `<select>`._

> No dedicated screenshot exists for this route; the live stream area (rows, pause control, ordering)
> is **not captured** in the sweep. Confirm the streaming pane and its controls live or via the KG.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Log Explorer > Live Tail)._

## 5. Permissions
- Requires the Log module enabled and a log-viewing role. **Create Log Parser Plugin** is an
  authoring action that likely needs elevated (admin/config) rights. TODO(source: KG/docs) — confirm
  who may create parsers vs. only tail.

## 6. Entry Conditions
- Logged in; Log module enabled.
- Sources actively forwarding (there must be a live stream to tail).
- Reached via **Start Live Trail**.

## 7. Exit Conditions
- The stream renders new log lines as they arrive; highlighted keywords are visually marked.
- Applying a **Select** filter narrows the live stream to that source/type.
- **Create Log Parser Plugin** opens the parser-creation flow. TODO(source: docs) — confirm target.
- Leaving the screen stops the tail (no lingering subscription). TODO(source: docs) — verify.

## 8. Validations
- **Highlight Keywords** — free text; empty = no highlighting. TODO(source: docs) — multiple-keyword
  separator and case sensitivity.
- **Select** filters — must resolve to an existing source/type. TODO(source: docs).
- **Create Log Parser Plugin** — its own form validations. TODO(source: docs).

## 9. Business Rules
- Live Tail shows only logs **arriving now** (forward-looking), unlike Log Search which queries
  historical/retained logs.
- Highlighting is a client-side visual aid; it does not filter the stream (that is the **Select**
  filter's job). TODO(source: KG) — confirm.
- A source landing unparsed ("Other") is the trigger for **Create Log Parser Plugin** — parsers are
  assigned per source (KB §7). TODO(source: KG) — confirm assignment model.

## 10. Known Bugs
From `customer-issue-kb.md` §7 — no defect is recorded specifically for the Live Tail pane; the
adjacent, relevant class is **parser assignment / logs unparsed** (PQD-38164 [MOTADATA-8029],
PQD-36867): logs from a source without an assigned parser land in "Other" and stream as raw — which
is exactly the situation **Create Log Parser Plugin** addresses. No live-tail-specific bug otherwise
recorded for this screen.

## 11. Edge Cases
- No live traffic → empty stream (must not error or spin forever).
- Very high event rate — stream must throttle/scroll without freezing the UI.
- Highlight keyword with regex/special characters; many keywords at once.
- Selecting a source that then stops forwarding mid-tail.
- Starting **Create Log Parser Plugin** and cancelling — the tail should resume unaffected.
- Leaving/returning to the screen (stream re-subscribes cleanly, no duplicate subscriptions).
- Tailing an unparsed source (all lines raw / "Other").
