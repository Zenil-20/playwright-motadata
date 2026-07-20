---
screen: Alert Dashboard · alerts
module: Alerts
route: "/alerts/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/alerts.json · screenshots/alerts.png · known_issues/customer-issue-kb.md §5
verified: 2026-07-09
---

# Alert Dashboard · alerts

## 1. Purpose
The **operational alert console** — the single place an operator lands to see everything the platform is
currently alerting on, sliced by data domain (Metric, Log, Flow, Trap, NetRoute, APM, Network Config,
Real User Monitoring).

- **Business objective:** give NOC/operations a live, at-a-glance picture of alert volume and severity so
  the team can triage the highest-impact problems first.
- **Screen description:** a header **severity summary strip** (Down / Unreachable / Critical / Major /
  Warning counters), a row of **domain tabs**, and a dashboard body of widgets — a **Metric Alert
  Overview** donut (Total with a breakdown by alert source: Metric Baseline, Availability, Metric
  Threshold, Forecast), a **Metric Alert By Policy Type** stacked bar (Availability / Metric Threshold /
  Forecast / Metric Baseline, stacked by severity), a **Today Alert Trend** hourly stacked-bar timeline,
  and per-category gauge groups (**Custom**, **Sdn**, **Correlated policies**).
- **Primary use cases:** watch the current alert backlog, spot severity spikes on the trend, switch
  domains (e.g. Metric → Log → Trap) to see where noise is coming from, drill into a policy type.
- **Who uses it:** NOC operators and administrators monitoring health in real time.
- **Dependencies:** the alert/policy engine · configured monitoring policies (Metric Threshold,
  Availability, Baseline, Forecast) · poller producing fresh data · severity model.

## 2. Navigation
```
Left icon rail → Alert (bell icon)
```
- **Breadcrumb / title:** Alert (bell icon in the page header)
- **Domain tabs:** Metric · Log · Flow · Trap · NetRoute · APM · Network Config · Real User Monitoring
- **URL:** `/alerts/` — open the full URL; SPA routing must load the page.
- The top-right list icon (`btn` in header) switches to a list/table view of alerts. TODO(source: KG) confirm target.

## 3. Actions
- **Switch domain tab** — Metric / Log / Flow / Trap / NetRoute / APM / Network Config / Real User Monitoring;
  each re-scopes every widget to that data source.
- **Read the severity summary** — Down, Unreachable, Critical, Major, Warning counters at the top.
- **Reload widgets** — the catalog exposes per-widget reload controls and an **ALL parallel** refresh:
  - `Reload everything (counts …)` — refresh the whole dashboard
  - `Reload pie · alert overview …` — refresh the Metric Alert Overview donut
  - `Reload column · by policy …` — refresh the Metric Alert By Policy Type bar
  - `Reload historic · today tr…` — refresh the Today Alert Trend timeline
  - `ALL parallel` — trigger all reloads at once
- **Switch to list view** — header list icon (top-right).
- Drill from a widget/gauge into the underlying alert set. TODO(source: KG/docs) confirm exact drill target.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Severity summary strip | Down · Unreachable · Critical · Major · Warning counters (header) |
| Domain tabs | Metric · Log · Flow · Trap · NetRoute · APM · Network Config · Real User Monitoring |
| Metric Alert Overview | donut widget — **Total** center; legend Metric Baseline / Availability / Metric Threshold / Forecast |
| Metric Alert By Policy Type | stacked bar — Availability / Metric Threshold / Forecast / Metric Baseline, colored by severity |
| Today Alert Trend | hourly stacked-bar timeline (23:00→22:00), stacked by severity |
| Gauge groups | **Custom**, **Sdn**, **Correlated policies** — ring gauges with counts |
| Reload controls | `Reload everything` · `Reload pie` · `Reload column` · `Reload historic` · `ALL parallel` |
| List view toggle | header list icon |

> No form inputs, selects, switches, or grid on this dashboard in the sweep (`inputs: []`,
> `switches: 0`, `gridHeaders: []`) — it is a **read/monitor** screen, not a CRUD screen. Alert *policy*
> creation lives under Settings → Policy Settings, not here.

_Locators: see `knowledge/locators/catalog/alerts.json`; promote verified ones into the cookbook
(Alerts > Alert Dashboard). Reload buttons were captured by tooltip prefix — resolve exact ids live._

## 5. Permissions
- **View:** any authenticated user who can see the Alerts module (Admin / Operator / Viewer). This is a
  monitoring surface, so read access is broad.
- Acting on policies/notifications happens elsewhere (Settings → Policy Settings). TODO(source: KG/docs):
  whether Viewer sees all domains or only licensed/permitted ones (Flow, APM, RUM, NetRoute are
  license-gated modules — a tab may be empty/hidden without the module).

## 6. Entry Conditions
- User is logged in with a valid session.
- The alert engine and poller are running (else counts read 0 / stale).
- For a given tab to show data, that **module must be licensed and collecting** (e.g. Flow, APM, RUM,
  Network Config, NetRoute) and at least one **policy** of that type must exist.

## 7. Exit Conditions
- **Widgets populate** with current counts; the donut Total equals the sum of its source breakdown; the
  severity strip reflects live counts.
- **On tab switch:** every widget re-queries and repaints for the selected domain.
- **On reload:** widgets refetch; a spinner resolves to updated numbers.
- This screen **does not persist anything** — no save/exit side effects (no audit entry from viewing).

## 8. Validations
- No user-editable fields on this screen → no field validations.
- Counts are display-only; correctness is a function of the alert engine, not input validation.
- TODO(source: docs): the exact time window of "Today Alert Trend" (calendar day vs rolling 24h) and the
  timezone it uses.

## 9. Business Rules
- **Every widget is scoped to the active domain tab** — Metric widgets show metric alerts only, etc.
- **Alert sources are categorized** as Metric Baseline, Availability, Metric Threshold, and Forecast
  (donut legend) — these correspond to the policy types that can raise a metric alert.
- **Severity taxonomy:** Down, Unreachable, Critical, Major, Warning (header + bar legend). Down/Unreachable
  are availability states; Critical/Major/Warning are threshold severities.
- TODO(source: KG): whether an alert clears automatically when the condition recovers, and how
  "Correlated policies" are computed.

## 10. Known Bugs
From `customer-issue-kb.md` §5 (Alerts / Policies / Notifications) — these are policy-engine defects that
manifest as wrong counts/trends on this dashboard; cite when writing negative regression scenarios:
- **Poller interval vs occurrence/flap window mismatch → false or missing alerts** (PQD-28890, PQD-35099,
  PQD-35984 / MOTADATA-7641). A 600s poller with a 5-min / 3-flap policy can never satisfy the window →
  alerts appear/miss inconsistently. *Workaround:* align poller interval with the policy window (flap
  count reduced 3→1 in the fix). Fix line 8.2.0.
- **Re-notification / duplicate-alert engine bugs** (PQD-38455 / MOTADATA-8110, PQD-39314 / MOTADATA-8326,
  PQD-41707 / MOTADATA-8716). Duplicate re-notification emails on severity change; policy triggers but no
  email/incident (NullPointerException in `updateRenotificationTimer`). *Fix:* 8.2.0–8.2.2.
- **Default numeric-event-ID log alert matched any log containing the value** (PQD-37669 / MOTADATA-7925) —
  surfaces as noise on the **Log** tab. *Fix:* default alert removed in 8.2.0.

_No defect recorded against the alert-dashboard rendering itself; the above are engine defects visible here._

## 11. Edge Cases
- Domain tab for an **unlicensed/uncollected module** (Flow, APM, RUM, NetRoute, Network Config) — expect
  empty widgets, not an error.
- **Zero alerts** — donut Total = 0, all gauges 0 (verify no divide-by-zero in the donut).
- **Very high alert volume** (screenshot shows 1.58 K total, Critical 933) — widget/label overflow, trend
  bar scaling.
- Reload a single widget while another reload is in flight (`ALL parallel`) — race/stale paint.
- Alert raised then cleared between two poller cycles — does the trend double-count?
- Trend at **day boundary / DST change** — 23:00→22:00 axis wrap.
- Timezone mismatch between browser and server on the trend timeline.
- Severity re-classified mid-window (Major→Critical) — counted once or twice on the trend?
