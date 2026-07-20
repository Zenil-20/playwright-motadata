---
screen: My Account · license
module: Settings
category: my-account
route: "/settings/my-account/license"
build: 8.2.6
status: draft
sources: [catalog, kb]   # settings_my_account_license.json · customer-issue-kb §12 (Licensing). No dedicated screenshot.
verified: 2026-07-10
---

# My Account · License

## 1. Purpose
The **license and consumption view** for the ObserveOps instance — shows what capacity the license
grants and how much is used, plus an EPS (events-per-second) trend. It is the place to check quota
headroom, spot a "License Exceeded" situation, and start an upgrade.

- **Business objective:** give admins visibility into license entitlement vs. actual consumption so
  they can plan capacity and renew/upgrade before limits bite (an expired/exceeded license silently
  halts polling — see Known Bugs).
- **Screen description:** two tabs — **License & Quota Usage** (entitlement vs. used) and **EPS Trend
  Breakdown** (events/sec over time with **7d / 15d / 30d** range buttons) — plus **Export** and
  **Upgrade Now** actions.
- **Primary use cases:** review quota usage, view EPS trend for the last 7/15/30 days, export the
  usage data, initiate an upgrade.
- **Who uses it:** admins / license owners. TODO(source: KG/docs) — whether non-admins can view.
- **Dependencies:** an applied license; the metering/EPS pipeline for trend data.

## 2. Navigation
```
Settings → My Account → License
```
- **Breadcrumb:** Settings › My Account › License
- **Sibling tabs (My Account):** My Profile · UI Preference · License
- **URL:** `/settings/my-account/license`

## 3. Actions
- **Switch tab** — **License & Quota Usage** ↔ **EPS Trend Breakdown**.
- **Select trend range** — **7d** / **15d** / **30d** buttons (on the EPS Trend tab).
- **Export** — export the license/usage data (format TODO — the KB notes historical scheduler/export
  format defects generally).
- **Upgrade Now** — start the license-upgrade flow. TODO(source: KG/docs) — where it leads (portal /
  contact / in-app key entry).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Tabs | **License & Quota Usage** · **EPS Trend Breakdown** |
| Export | button "Export" |
| Upgrade Now | button "Upgrade Now" |
| Trend range | buttons **7d** · **15d** · **30d** |

> The **quota tables / EPS chart internals** (which metrics, per-module counts, license key details)
> were not captured beyond tabs+buttons. TODO(source: KG/live) — document the quota rows (e.g. monitor
> count, EPS, APM/RUM counts), the license key/expiry display, and the Export format.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > License)._

## 5. Permissions
- License management (Export / Upgrade) — expected **admin-level**. TODO(source: KG/docs) — confirm
  whether operators/viewers can see usage. Note the KB records a case where a **read-only user lacked
  "Query" permission** to download reports (§4) — an analogous gate may apply to Export here.

## 6. Entry Conditions
- Logged in (admin role expected for actions).
- A license is applied; the EPS/metering pipeline is running for trend data.

## 7. Exit Conditions
- **Tab/range switch:** the view updates to the selected tab / 7-15-30-day window.
- **Export (success):** a usage file is produced. TODO(source: KG) confirm format + toast.
- **Upgrade Now:** launches the upgrade path. TODO(source: KG) confirm outcome.

## 8. Validations
- Mostly read-only. Range buttons are mutually exclusive (one active).
- TODO(source: docs) — behavior when no metering data exists (empty EPS chart) or license is
  missing/expired.

## 9. Business Rules
- License is **bound to the hardware key** — MAC/NIC/host changes can invalidate it and even corrupt
  `license.lic` + config (see Known Bugs).
- **Exceeding quota blocks adding monitors**; an **expired license silently stops polling** — usage
  visibility here is the early-warning surface.
- EPS trend supports **7 / 15 / 30-day** windows.
- TODO(source: KG/docs): exact quota dimensions (monitors, EPS, APM/RUM counts) and whether counts here
  match other screens (they historically diverged — see Known Bugs).

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` §12 (Licensing — bound to hardware key + counting
bugs):
- **"License Exceeded" despite unused capacity / consumption mismatch** (4x; PQD-32834, PQD-34489,
  PQD-36926): counts differ between screens; a random cache issue (restart clears); legacy counting
  code added extras post-consumption; **APM count confusion** (APM counts registered agent
  applications). **Fix/workaround:** license code **fully refactored in 8.0.26**; restart as interim.
- **License expiry / invalid key halting collection** (4x; PQD-31783, PQD-39926, PQD-29587, PQD-26509):
  expired license **silently stops polls** (noticed only via stale data); **invalid HW key** from
  MAC/NIC changes kills the app. **Fix:** renew/regenerate the license; treat license state as a
  first-class health alarm.
- **Invalid Hardware Key / license corruption after NIC/MAC/host changes** (§2, PQD-26509, PQD-29587,
  PQD-31170, PQD-39926): app won't start; **regenerate license for the new hardware key**, clean
  corrupted files.

## 11. Edge Cases
- Usage at/over 100% of quota (does the screen warn? does Add-Monitor get blocked elsewhere?).
- Expired license — assert this view flags it (rather than polling silently stopping).
- Counts on this screen vs. other screens diverging (the historical bug — cross-check).
- EPS chart with no metering data (empty state) for 7/15/30d.
- Export by a read-only user (permission gate).
- Upgrade Now with no connectivity to the licensing portal.
- Post hardware change (MAC/NIC) — invalid HW key handling.
