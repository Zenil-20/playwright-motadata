# APM_Explorer_Services_Playwright.spec.js

**Location:** `tests/APM_Explorer/Services/`
**Framework:** Playwright Test
**Suite type:** `test.describe.serial(...)` — tests run in order, sharing one browser page/session (login once, logout at the end).

---

## 1. Setup

- Loads env vars from `.env` via `dotenv` (`Motadata_Aiops`, `Motadata_Username`, `Motadata_Password`).
- `BASE` = origin of `Motadata_Aiops` + `/apm` → e.g. `https://host/apm`.
- `test.beforeAll` opens **one shared browser context/page** for the whole suite (default timeout bumped to 500s).
- `test.afterAll` closes that page.
- `gotoApm()` helper navigates to `${BASE}/services`, waits for network idle, and asserts the **Services** tab is visible.

## 2. `loc` — centralized locators

A single object holding all element locators used across tests, so selectors are defined once and reused. Notable design choices (each with an inline comment explaining *why*):

| Locator | Purpose | Note |
|---|---|---|
| `tab(p, name)` | Tab by accessible role | `Services`, `Explorer`, `Error Tracker`, `Compare` |
| `search(p)` | Search input | Scoped to `input[placeholder="Search"]` because the wrapping `<span>` shares the same placeholder attribute |
| `gridToggle` / `cardToggle` | Switch between card and table view | The same toolbar button relabels itself ("Grid" ↔ "Dashboard") depending on current view |
| `bsToggle` | Switch to "Business Services" mode | |
| `timeRange` | The "Last 1 Hour" control | |
| `card(p)` | Service/BS tiles | Works in both card and grid layout via `.vue-grid-item.cursor-pointer` |
| `gridRow(p)` | Table rows | |
| `sparklines(locator)` | Highcharts sparkline charts only | Excludes decorative icon SVGs |
| `pageFooter(p)` | "`x - y of z items`" pagination text | |
| `filterChip(p, field)` | Filter-builder pills (e.g. "Event Source") | Scoped by class since the same text appears in grid column headers |
| `pageSize(p)` | Kendo page-size dropdown | Explicitly noted as a listbox, not a combobox |

---

## 3. Test cases (all under one serial suite)

1. **Login to Motadata AIOps** — fills username/password, submits, waits for network idle. (Not a numbered TC, just the auth precondition.)

2. **TC-01 — Default landing state** *(covers manual test IDs 43319–43322, 43344)*
   Verifies: Services tab is active by default, all 4 tabs exist, card (tile) view is default, default time range is "Last 1 Hour". Also checks that navigating away and back preserves the Services tab as active (persistence check).

3. **TC-02 — Service card metrics** *(43323–43328)*
   On the first service tile, checks Response Time (`ms`), Throughput (`tpm`), Error Count text are present, exactly 3 sparkline charts render, and a severity indicator dot is visible on a specific known-erroring service (`hibernatewithmysql`).

4. **TC-03 — Grid view columns** *(43329–43337)*
   Switches to grid view, checks all expected column headers exist (Service, Event Source, Business Service, Type, Response Time, Throughput, Error Count). Validates a row shows ms/tpm values, a sparkline, an IP-formatted Event Source, a type icon, and specifically checks that service "E" has an empty Business Service cell (a known edge case, 43332).

5. **TC-04 — Card↔Grid toggle preserves data** *(43337)*
   Captures card names, toggles to grid then back to card, confirms the list isn't lost/emptied.

6. **TC-05 — Search filtering** *(43338–43340)*
   Tests search-and-clear behavior in both card view (`Hibernate_SQL` → 1 result) and grid view (`Qwitch` → 1 result), using `expect.poll` for the count check since `.count()` doesn't auto-retry.

7. **TC-06 — Grid filters** *(43341–43343)*
   - Filters by **Event Source = 172.16.15.126** → expects exactly 2 items in the footer, then clears.
   - Filters by **Type = java**, first verifying the dropdown offers java/cpp/ruby (not python/nodejs), applies it, clears.
   - Opens **+ Filter** menu and checks "Event Source" and "Type" appear as filterable field options.

8. **TC-07 — Time range changes refresh metrics** *(43345–43346)*
   Captures the first card's text, switches time range to "Last 6 Hours", and polls that the card content actually changed (proves live data refresh, not just a hardcoded UI).

9. **TC-08 — Pagination** *(43355–43356)*
   Reads the live total item count from the footer (not hardcoded, since data drifts), opens the page-size dropdown, verifies options 10/20/50/100 exist, selects "10", and confirms exactly `min(total, 10)` rows render.

10. **TC-09 — Business Service card view** *(43347–43351, 43354)*
    Toggles to Business Services mode; checks tile shows Instances count, Avg Response Time (`ms`), Throughput (`tpm`), Error Count, and 3 sparklines. Then searches "Digital" and expects exactly 1 match.

11. **TC-10 — Business Service grid view** *(43352–43353, 43357)*
    Toggles BS + grid view; checks columns (Business Service, Instances, Response Time, Throughput, Error Count), that instance count is numeric, and that the footer shows a well-formed "`x - y of z items`" string.

12. **Logout from AIOps** — clicks the user avatar (rendered as text initials, not an image), clicks Logout, clears cookies/permissions to fully tear down the session.

---

## 4. Design patterns worth noting

- **Traceability comments**: each `TC-xx` test cites which original manual test-case IDs it consolidates (e.g. `// Combines 43319, 43320...`), so multiple legacy manual cases are merged into fewer, richer automated tests.
- **Resilience over data**: several assertions read live values (total item counts, current metric text) rather than hardcoding them, because the underlying APM data changes over time — this avoids flaky failures tied to environment state.
- **Role-scoped locators**: heavy use of `getByRole('menuitem'/'option'/'grid')` with `exact: true` to disambiguate text that also appears elsewhere in the UI (e.g., "cpp" as a filter option vs. as a substring of a service name).
- **Serial execution + shared page**: intentional, since the suite logs in once and treats the APM Explorer session as a continuous flow across sub-features (card view, grid view, filters, time range, BS mode) rather than isolating each test with its own login.
