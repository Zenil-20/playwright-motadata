# MOTADATA-8898 — Live Harvest Findings (explore + resolve)

Server: https://172.16.15.86 (build 8.2.5) · Date: 2026-06-02 · Read-only exploration (no widget saved).

## How the feature actually works (confirmed live)
- Widget creation: Dashboard → **"+"** → **Add New Widget** → pick a widget **type** (Chart/Grid/Top N/Gauge/Pie/…).
- Inside the config, data is organised into **counter groups**. The **Metric** group exists by default; other categories are added with a bottom **"Add Group" button** labelled `Metric | Log | Flow | APM | NetRoute | RUM`.
- Each group has a **"Select Counter"** dropdown (`data-cy="dropdown-trigger-input"`). Opening it lists that category's counters (`.scroll-dropdown-menu-item`).
- **The description is a floating popover to the RIGHT of the counter list.** It surfaces on **hover/highlight** of a counter option (and shows for the currently selected counter). Header = counter name.
- Two consistent shapes:
  - **Numeric metric** → `Description` + `Interpretation { High Values, Low Values }`
  - **Dimension/text field** → `Description` + `Possible Values { Type, Values }`

This satisfies the AC intent: A1/A3/A4 (per-metric description on selecting in the Metric dropdown), A2 (what it measures + how to read), A6 (consistent structure).

## Category coverage on this server
| Category | Counters | Description present? | Sample counter |
|---|---|---|---|
| Metric | 13 | ✅ rich | system.file.modified.duration.minutes / system.cpu.percent |
| APM | 13 | ✅ | service.language |
| RUM | 9 | ✅ | rum.service.largest.contentful.paint.us |
| NetRoute | 4 | ✅ | netroute.latency.ms |
| Flow | 13 | ✅ (Possible-Values shape) | tag, volume.bytes |
| **Log** | 4 | ❌ **EMPTY for all 4** | event.source/.category/.source.type/.severity |

## ⚠️ Findings to surface (cited evidence)
1. **Log descriptions are missing on 172.16.15.86.** All four Log counters render the popover **header** (counter name) but a **blank body** — no Description/Interpretation. Evidence: `_scratch/log-counters.json` (all `hasDesc:false`), `_scratch/final-log.png`.
   - Matches the ticket's own seed-data note: description data was seeded on **172.16.13.206** / `/db-files`. Log data appears **un-seeded here**.
2. **Possible A7 gap.** AC A7 requires that a missing description "informs the user that the description is unavailable for that specific metric." On Log, the body is simply **blank** — there is **no 'unavailable' message**. This is either an un-seeded-data artifact or an A7 implementation gap. **Do not assert A7 passes here; flag for product/QA confirmation.**

## Impact on automation plan
- TC-DESC-APM / RUM / NETROUTE / FLOW / METRIC-REGRESSION / CONTENT / CONSISTENCY / TRIGGER → **automatable now** on this server (data present). Trigger gesture = **hover the counter option**.
- TC-DESC-LOG → would **fail content-presence on this server** (data gap). Two honest options: (a) mark Log `quarantined: data-not-seeded` on 172.16.15.86, or (b) run Log against a server where `/db-files` Log descriptions are loaded.
- TC-DESC-MISSING (A7) → Log's empty body is the live candidate, but since it shows blank (not an "unavailable" message), the assertion text is undefined. Needs product decision before asserting.

## Verified locators
Written to `cookbook/selector-cookbook.md` → **# 1.1 Add Widget — Chart config**. Includes the add-group buttons, counter trigger/search/option, and the description-popover container hints + the warning that `li#apm`/`li#rum`/… are global-nav links, not category switches.
