---
name: motadata-playwright
description: Write and fix Playwright tests for the Motadata AIOps web app (Vue + Ant Design + Kendo grid). Use whenever the user asks to add, modify, or debug a `.spec.js` under `tests/Settings/**`, `tests/Dashboard/**`, `tests/metricExplorer/**`, or any other Motadata AIOps test. Loads the project's conventions, smart locator strategies, and known UI quirks so Claude can write working tests without the user pasting HTML or selectors.
---

# Motadata AIOps Playwright Skill

Use this skill any time you are touching a Playwright `.spec.js` in this repo. It captures the conventions of the existing test suite and the gotchas already discovered, so tests stay consistent and pass first time.

## How to extract selectors yourself

The user will not paste HTML next session. To find selectors, do this in order:

1. **Re-use what already exists.** Grep `tests/` for the same control name first (`Grep -i "monitoring hour"`). The codebase has hundreds of working selectors for nearly every screen — copy the pattern.
2. **Read the running app.** If a test you wrote fails, ask the user to share the trace zip path (or the trace URL) and inspect `error-context.md` and the action log. The page snapshot inside is an accessibility tree with `ref=eXXX` — that's enough to derive a stable locator without raw HTML.
3. **Plan locators by role first.** Default order of preference: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → unique `#id` → scoped XPath. Avoid raw class names except for `tr.k-master-row` and `.ant-drawer-open` (both are project staples).
4. **If still ambiguous, ask the user once.** Don't loop — ask "is the button labeled X or Y" rather than guessing.

## Project conventions (follow these in every new test)

### File scaffolding

Every spec file mirrors this skeleton — copy from `tests/Settings/13-MonitorSettings/DeviceMonitoringSettings.spec.js`:

```js
/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 * ... (full header — preserve the existing template)
 * Author  : Zenil Kapadia
 * Created : <DD Month YYYY>
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env', quiet: true });

const SOME_CONSTANT = '...';

test.describe.serial('Motadata AIOps <Feature> flow', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000); // project default; overridden in long tests with test.setTimeout
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => { /* see Login below */ });

  // ... feature tests ...

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
```

**Rules:**
- Always `test.describe.serial` — tests share a single `page`.
- Always include Login as the first test and Logout as the last.
- New constants (URLs, IPs, names) go at the top of the file in `SCREAMING_SNAKE_CASE`.
- Author header preserved verbatim. Created date = today.

### Login flow (memorize this exact block)

```js
await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
await page.locator("//button[@type='submit']").click();
await expect(page.locator("//img[@alt='Avatar']")).toBeVisible();
```

**Never use `await page.waitForLoadState('networkidle')` after login** — Motadata streams in the background and `networkidle` rarely settles. Use the avatar visibility check above as the smart wait.

### Settings navigation (use this anywhere a Settings sub-page is needed)

```js
await page.locator("//a[@href='/settings/']").click();
await page.locator("//input[@id='phone-number']").click();          // focuses the settings search
await page.locator("//input[@placeholder='Search']").fill('<keyword>');
await page.getByRole('link', { name: '<Exact Link Name>' }).click();
```

The `#phone-number` click is a Motadata quirk — don't omit it.

### Common confirm/cancel buttons

| Action | Selector |
|---|---|
| Yes / Confirm | `#confirm-yes` |
| No / Cancel  | `#confirm-no` |
| Save (in drawer) | `#submit-btn` or `#apply-btn` (varies — read the drawer) |
| Cancel (drawer) | `#close-btn-id` or `button.ant-drawer-close` |

### Kebab-menu actions (Device Monitor Settings and similar grids)

```js
const row = page.locator('tr.k-master-row', { hasText: '<unique row text>' }).first();
await row.locator('svg[data-icon="ellipsis-v"]').click();   // open the action menu
await page.locator('a#<action-id>').click();                // e.g. a#edit, a#disable, a#enable, a#on-maintainance
```

**Known action IDs** (yes, "maintainance" is misspelled in the build — don't "fix" it):
- `a#edit`, `a#delete`, `a#clone`, `a#flip`
- `a#disable`, `a#enable`
- `a#on-maintainance`, `Off Maintenance` menu item via `//span[normalize-space()='Off Maintenance']`

### Ant Design dropdown with search

```js
await page.locator('#<picker-id> input[placeholder="Select"]').click();
await page.locator("//input[@data-cy='dropdown-search-input']").last().fill('<search text>');
await page.locator(`//span[@title='<exact option title>']`).click();
```

The `dropdown-search-input` is rendered in a floating popover — always use `.last()` to scope to the topmost one.

### Status pills (Enable / Disable / Maintenance)

```js
// Row-level
await expect(row.locator('td', { hasText: /^\s*Disable\s*$/ })).toBeVisible();
// Detail-page pill
await expect(page.locator('.ant-tag.tag-red', { hasText: /Disable/i }).first()).toBeVisible();
```

### Success/error toasts

```js
// Success notification
await expect(
  page.locator('.ant-notification-notice-description', { hasText: /<expected text>/i })
).toBeVisible();
// Error
await expect(
  page.locator('.ant-notification-notice, .ant-message-error', { hasText: /<expected>/i }).first()
).toBeVisible();
```

## Smart waits — never use hard waits

Replace `waitForTimeout`/`networkidle` with these:

| Situation | Use |
|---|---|
| Page navigation finished | `await page.waitForURL(/<regex>/)` |
| Element becomes ready | `await expect(locator).toBeVisible()` |
| Click target ready | rely on `.click()` auto-wait — don't pre-`expect(visible)` |
| Two possible outcomes (e.g. created OR duplicate toast) | `Promise.race([...])` returning `'a' \| 'b' \| null` |
| State eventually settles (status flip, async polling) | `expect.poll(async () => ..., { timeout, intervals: [2000, 3000, 5000] }).toMatch(...)` |
| Long-running job completes | `expect.poll` with timeout 1.5× the known max duration |

## Known gotchas (already burned by these)

1. **Duplicate IDs in DOM.** Ant Design wraps `<input>` inside a `<span>` that re-uses the input's `id`. Always prefix with the tag: `input#assign-monitor-search` not `#assign-monitor-search`.
2. **Same `id` on multiple buttons across panels.** Tie-break with an icon child, e.g. `button#filter-btn:has(svg[data-icon="tag"])`.
3. **Header select-all checkbox.** `page.locator("//input[@type='checkbox']").first()` is usually the table's master select-all, not the first row. Use `thead input[type="checkbox"]` if you only want the header, or scope to a row.
4. **Grid cells holding inputs.** Don't `td, { hasText: '99' }` — read the input value: `tr.locator('input[placeholder="Poll Time"]').toHaveValue('99')`.
5. **Source-picker popovers.** When a dropdown shows another grid (e.g. monitor picker), scope rows to the visible popover: `page.locator('.ant-popover:visible, .ant-dropdown:visible').last().locator('tr.k-master-row', { hasText })`. Otherwise the background grid wins.
6. **Inventory URLs.** Direct nav is more reliable than tab clicks. Use `/inventory/All/groups` (works for any category) over `/inventory/Network/...` unless the test specifically asserts the Network tab.
7. **`page.waitForLoadState('networkidle')`.** Banned in this codebase. Always replace with a smart wait on the element you actually need.
8. **`test.only` markers.** Strip these before reporting a task complete unless the user explicitly wants the focused run preserved.

## Idempotent / "skip if exists" pattern

Create-flow tests must handle the resource already existing. Two acceptable patterns:

```js
// Pattern A: pre-check (works when the list page renders fast)
const existing = page.locator('tr.k-master-row', { hasText: NAME }).first();
if (await existing.isVisible().catch(() => false)) return;

// Pattern B: race after submit (works when the list is slow but the API errors fast)
await submitBtn.click();
const dup = page.locator('.ant-notification-notice, .ant-message-error', { hasText: /not unique|already exists/i });
const outcome = await Promise.race([
  page.waitForURL(/<list-url>/).then(() => 'created').catch(() => null),
  dup.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'duplicate').catch(() => null),
]);
if (outcome === 'duplicate') { await page.locator('//i[@id="back-btn-id"]').first().click(); return; }
```

## Memory hooks already saved (do not violate)

- **Never modify `.env`** without explicit permission — credentials/URLs are sensitive.
- **Show live terminal output** for long-running commands (run in background and Read the output file).

## Reference files (read these before writing a new spec)

- `tests/Settings/13-MonitorSettings/DeviceMonitoringSettings.spec.js` — canonical example of every pattern above (login, search, kebab, drawer, toast, smart waits, idempotency).
- `tests/Settings/13-MonitorSettings/CustomMonitoringField.spec.js` — eye-button column toggle (`#btn-show-hide-columns`), drawer scoping (`div.ant-drawer-open`).
- `tests/Settings/13-MonitorSettings/MonitoringHour.spec.js` — Create-flow with race-based duplicate detection.
- `tests/Settings/09-SystemSettings/StorageBackupProfile.spec.js` — Multi-step flow with shared helpers inside one test.

## When the user asks for "fix this failing test"

1. Read the trace (`playwright-report/data/<hash>.zip` or the URL) — locate the failing action and the page snapshot.
2. Identify the failure mode: strict-mode violation, locator not found, timeout, or wrong assertion target.
3. Map to the gotchas table above before writing new code.
4. Make the minimum change. Don't rewrite passing parts of the test.
5. Preserve the user's existing comments, locator choices, and `test.only` markers unless they ask otherwise.
