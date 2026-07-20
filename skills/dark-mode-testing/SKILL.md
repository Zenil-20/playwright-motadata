---
name: dark-mode-testing
description: Test ObserveOps' real Light/Dark/Auto theme (Settings → My Account → UI Preference) — theme switch, per-user persistence across reload/login, Auto following OS scheme, and contrast across Dashboards/Alerts. Use to verify a theme change or audit themed contrast on a screen.
---

# Theme (Light/Dark/Auto) testing for ObserveOps

ObserveOps has a **real theme** — not a CSS toggle we simulate. Each user picks **Browser Default
(Auto) / Light / Dark** at **Settings → My Account → UI Preference**
(`knowledge/product/Settings/my-account/ui-preference.md`, route `/settings/my-account/ui-preference`).
The Select Theme control is a **3-radio group**, saved with `#save`, and the preference is **per-user**
(not global). Auto follows the OS/browser scheme. Test the switch, its persistence, and contrast in
both themes across data-heavy screens.

## When to use
- After any change touching theming, UI Preference, or a Dashboard/Alert widget's colors.
- Auditing a screen for readable contrast in **both** Light and Dark (Dashboards, Alerts grid, APM/RUM).
- Verifying the theme survives reload and re-login for the same user.

## When NOT
- Not for OS-level `prefers-color-scheme` UI that ObserveOps doesn't expose — Auto is the only OS-linked mode.
- Don't assert global theming — a second user's UI must be unaffected (per-user rule, §9 of the screen doc).

## Procedure (ObserveOps-specific)
1. **Navigate to UI Preference** via `framework/playwright/flow.js` (avatar-visible login, smart wait).
   Route: `/settings/my-account/ui-preference`. The theme radios are the 3-item **Select Theme** group;
   Save is `#save`, Reset is `#default`.
2. **Switch theme and assert immediate application.** Select **Dark**, `#save`, and assert the app root
   reflects dark (Ant Design applies a theme class/attribute on `<html>`/`.ant-*` root — read the actual
   attribute rather than guessing). The screen doc §7 notes theme change is immediately visible.
   ```js
   // pick Dark radio, click #save, then assert the root theme token flipped
   const theme = await page.evaluate(() => document.documentElement.className + document.body.className);
   expect(theme).toMatch(/dark/i);
   ```
3. **Persistence across reload.** Reload the page; assert the theme is still Dark (preference loaded from
   the user-preference store, §6).
4. **Persistence across login.** Log out, log back in as the **same** user; assert Dark persists.
5. **Auto mode.** Select **Browser Default (Auto)**, `#save`, then emulate OS scheme both ways
   (Playwright `colorScheme: 'dark'` / `'light'`) and assert the app follows each.
6. **Contrast in both themes.** Navigate to a data-dense screen (a Dashboard, the Alerts grid) in each
   theme and run the axe `color-contrast` rule (see `axe-accessibility` skill) — chart text, grid
   values, status pills, and disabled controls are the usual dark-mode contrast failures.
7. **Per-user isolation.** Confirm changing this user's theme does not change another user's UI (§9).

## Things that break (target these)
- **Charts/widgets** rendering with hard-coded light colors that vanish on Dark (Dashboards, APM/RUM).
- **Status/severity pills** on the Alerts grid losing contrast in one theme.
- **Empty states** ("No data found", see `empty-state-reviewer`) with illustrations tuned for one theme only.
- **Auto** not re-evaluating when the OS scheme changes mid-session.
- Reset to default (`#default`) — does it revert theme immediately or still need Save? (screen doc §7 TODO — verify).

## Rules & anti-patterns
- Test the **real** switch through UI Preference — do not fake dark mode by injecting CSS; that hides the
  persistence and per-user bugs that matter here.
- Smart waits only; assert the actual theme token on the root, not a screenshot guess (`preview_inspect`-style
  computed-style checks beat eyeballing).
- Cite `knowledge/product/Settings/my-account/ui-preference.md` for every behavior claim; log real contrast
  failures into that screen's / the target screen's §10.

Adapted from qaskills/seed-skills/dark-mode-testing.
