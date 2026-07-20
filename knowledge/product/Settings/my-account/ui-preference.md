---
screen: UI Preferences · ui-preference
module: Settings
category: my-account
route: "/settings/my-account/ui-preference"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_my_account_ui_preference.json · "My Account - UI Preference.png" · customer-issue-kb (none specific)
verified: 2026-07-10
---

# My Account · UI Preference

## 1. Purpose
The **per-user UI personalization** screen. A user sets how the app *displays* to them — date format,
time zone, default grid page size, an alert overlay toggle, and the visual theme — without affecting
other users.

- **Business objective:** let each user tailor presentation (timezone-correct timestamps, comfortable
  grid size, preferred theme) for their own session; a self-service preference, not an admin/global setting.
- **Screen description (from `My Account - UI Preference.png`):** a compact form with three dropdowns
  (Default Date Format, Time Zone, Default number of items to show in Grid), an **Alert Overlay** toggle
  (OFF), and a **Select Theme** radio group — **Browser Default (Auto) / Light / Dark** — each with a
  dashboard preview thumbnail. **Reset to default** and **Save** at the bottom.
- **Primary use cases:** change theme, set time zone, pick a date format, set default grid rows, toggle
  the alert overlay.
- **Who uses it:** every authenticated user (Admin / Operator / Viewer), each for their **own** UI only.
- **Dependencies:** an authenticated session; the user-preference store.

## 2. Navigation
```
Settings → My Account → UI Preference
```
- **Breadcrumb:** Settings › My Account › UI Preference
- **Sibling tabs (My Account):** My Profile · UI Preference · License
- **URL:** `/settings/my-account/ui-preference`

## 3. Actions
- **Default Date Format** — dropdown (e.g. _"ddd, MMM DD, yyyy hh:mm:ss A"_).
- **Time Zone** — dropdown (e.g. _"(GMT +05:30) Asia/Calcutta"_).
- **Default number of items to show in Grid** — dropdown (e.g. **50**).
- **Alert Overlay** — toggle (default **OFF**).
- **Select Theme** — radio: **Browser Default (Auto)** / **Light** / **Dark** (3 radios).
- **Save** (`#save`) — persist preferences.
- **Reset to default** (`#default`) — restore default preferences.

## 4. Components
| Component | Control (from catalog + `My Account - UI Preference.png`) |
|---|---|
| Default Date Format | dropdown (`[data-cy='dropdown-trigger-input']`, placeholder _Select_) |
| Time Zone | dropdown (`[data-cy='dropdown-trigger-input']`, placeholder _Select_) |
| Default items per Grid | dropdown (`[data-cy='dropdown-trigger-input']`, placeholder _Select_) |
| Alert Overlay | toggle (1 switch, default **OFF**) |
| Select Theme | radio group of 3 — Browser Default (Auto) / Light / Dark |
| Reset to default | `#default` |
| Save | `#save` |

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > UI Preference).
The three dropdowns share `[data-cy='dropdown-trigger-input']` — scope by their label._

## 5. Permissions
- **Self-service:** any authenticated user sets their **own** UI preferences. No extra role or license
  gates this screen. It does **not** change other users' UI.

## 6. Entry Conditions
- User is logged in with a valid session.
- The user's saved preferences load into the controls.

## 7. Exit Conditions
- **Save (success):** preferences persist; theme/timezone/date-format/grid-size apply to the user's
  session (theme change is immediately visible). TODO(source: KG) confirm success toast + whether a
  reload is needed for some settings.
- **Reset to default:** controls revert to product defaults; TODO — whether Reset persists immediately
  or still requires Save.

## 8. Validations
- Dropdowns are constrained selects (no free text). One theme radio active at a time. Alert Overlay is
  a binary toggle. Minimal free-form input → few validation errors expected.
- TODO(source: docs) — default grid-size options and any max.

## 9. Business Rules
- Preferences are **per-user**, not global.
- **Theme** offers **Auto (browser default) / Light / Dark**; Auto follows the OS/browser scheme.
- **Time Zone** here governs how timestamps render for this user (independent of server time).
- **Default grid page size** sets the initial row count on data grids across the app.
- TODO(source: KG/docs): whether date-format/timezone here also apply to this user's report/email
  rendering or only on-screen.

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`. (The KB's dashboard/UI
issues in §10 concern widgets/dashboards, not per-user UI preferences.) Do not invent bugs.

## 11. Edge Cases
- Change theme Auto↔Light↔Dark — assert immediate application and persistence across reload/login.
- Time-zone change — assert grid/timestamp values shift correctly (esp. across DST / half-hour zones
  like GMT+05:30).
- Unusual date-format string — assert consistent rendering everywhere it's used.
- Large default grid size on a huge dataset (perf).
- Alert Overlay ON/OFF behavior.
- Reset to default then navigate away without Save (does Reset stick?).
- Concurrent preference change from two sessions of the same user (last-write-wins?).
