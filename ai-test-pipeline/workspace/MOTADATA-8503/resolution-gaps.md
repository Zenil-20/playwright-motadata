# Locator Resolution Gaps — MOTADATA-8503

Verified locators (mined from `tests/Settings/04-PolicySettings/Metric_Policy_test.spec.js`) cover the **current** Metric Threshold form. The ticket's NEW unified UI is not in any spec/cookbook and MUST be harvested live before its automation is written — no fabrication (per POLICY.md).

## ✅ Verified (reused for UC1)
| control | locator |
|---|---|
| Policy Settings link | `a[href="/settings/policy-settings/"]` |
| Create Policy button | `getByRole('button',{name:'Create Policy'})` |
| Policy Name | `input#policy-name` |
| Tags | `[role="combobox"]` + keyboard |
| Counter select | `//input[@placeholder='Select Metric']` → `//span[@title='<counter>']` |
| Source Filter | `//input[@placeholder='Everywhere']` → `//span[@title='Monitor']` |
| Assign monitor | `input[readonly].nth(2)` → `//input[@id='assign-monitor-search']` |
| Severity | `//input[@name='critical']`, `//input[@name='warning']` |

## ⬜ NEEDS LIVE HARVEST (do not fabricate)
| control | used by | why unknown |
|---|---|---|
| Module selector (Metric/APM/RUM/NetRoute) | UC1–UC4, TC-05 | new unified entry; existing spec skipped it |
| Set Conditions tabs: Threshold \| Baseline \| Anomaly \| Forecast | UC1–UC4, TC-05 | brand-new tab control (A2) |
| APM "Policy Type" switch (Trace Metrics/Trace Analytics) | UC2 (D1) | APM-only, never automated |
| Baseline params (deviation/window) | UC2 (B5) | new for APM/RUM/NetRoute |
| Anomaly occurrence threshold | UC3 (B5) | moved into unified flow |
| Forecast horizon/threshold | UC4 | new |
| Major severity input | UC1 (B4) | suite only sets critical/warning; "Major" per ticket |
| Success toast exact text | all expected | not stated in ticket |
| Edit-policy entry (row action) | UC6 | not in mined spec |

## Next action to close the gaps
Run the `motadata-explorer` skill against the live Create Policy screen for each module:
1. Login → Settings → Policy Settings → Create Policy.
2. Snapshot a11y tree; harvest module selector + the four Set Conditions tabs (verify count()===1).
3. Per module (APM/RUM/NetRoute): harvest Policy Type switch, eligible counters, source filters, and tab-specific param fields.
4. Append all under a new cookbook section **"16.x Policy Settings — Create Policy (unified)"** and flip its coverage-map row.
5. Then generate UC2/UC3/UC4/UC6 specs from the verified locators.

## Backend-dependent (out of UI automation scope)
- UC1 "simulate breach → alert generated", UC2 baseline-window evaluation, UC4 forecast alert logic. Assert policy creation + persistence via UI; validate alert generation separately (API/backend), not in this Playwright spec.
