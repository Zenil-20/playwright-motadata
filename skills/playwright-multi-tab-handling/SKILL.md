---
name: playwright-multi-tab-handling
description: Handle the new tabs, popups, and windows ObserveOps opens — Reports/PDF exports, topology "open in new window", NCCM config downloads, docs links — race-free with waitForEvent('page')/waitForEvent('popup') subscribed BEFORE the click. Use when a click opens a second tab your locator can't find, or when a waitForTimeout is being used to "wait for the popup".
---

# Multi-tab & window handling in ObserveOps

Several ObserveOps flows spawn a second surface: **Reports** open a rendered/PDF view, **Topology**
and some Explorers offer "open in new window", **NCCM** config compare/download can pop a viewer,
and in-app docs/help links use `target="_blank"`. The one rule that makes all of these reliable: a
new page is an **event you subscribe to before the click**, never something you poll for after. This
sits alongside our smart-wait policy — no `waitForTimeout` to "let the tab open".

## When to use / When NOT

Use when a click opens a new tab/window and the test can't find the element (it's on the old page),
for Report/PDF export tabs, for downloads that render in a viewer tab, or when you see
`waitForTimeout` after a click that opens a popup. Do NOT spin up a fresh `browser.newContext()` for
these — an ObserveOps popup shares the authenticated session (avatar-verified login) in the same
context; a new context throws the session away.

## Patterns

### 1 — Report opens in a new tab (subscribe before click)
```js
const [reportTab] = await Promise.all([
  context.waitForEvent('page'),
  page.getByRole('button', { name: /Export|Open Report/i }).click(),
]);
await reportTab.waitForLoadState('domcontentloaded');   // page object exists before it's loaded
await expect(reportTab.getByRole('heading')).toBeVisible();
await reportTab.close();
// Original ObserveOps tab is still fully usable.
```

### 2 — `waitForEvent('popup')` for a window.open viewer (NCCM / Topology)
```js
const popupPromise = page.waitForEvent('popup');       // scopes to the exact opener element
await page.getByRole('button', { name: /Open in new window/i }).click();
const viewer = await popupPromise;
await viewer.waitForLoadState();
await expect(viewer).toHaveURL(/topology|config/i);
await viewer.close();
```

### 3 — Verify a downloaded config/report (download event, not a tab)
Some NCCM/Report actions download rather than open a tab — different event entirely.
```js
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: /Download/i }).click(),
]);
expect(download.suggestedFilename()).toMatch(/\.(cfg|pdf|csv)$/);
await download.saveAs(`${testInfo.outputDir}/${download.suggestedFilename()}`);
```

### 4 — Reusable helper (keep specs readable)
```js
/** Runs `action`, returns the newly opened, loaded ObserveOps tab. */
async function openInNewTab(context, action, loadState = 'domcontentloaded') {
  const [newPage] = await Promise.all([context.waitForEvent('page'), action()]);
  await newPage.waitForLoadState(loadState);
  return newPage;
}
// Usage:
const invoice = await openInNewTab(context, () =>
  page.getByRole('link', { name: 'View report' }).click());
```

### 5 — Force same-tab navigation when a popup makes assertions harder
```js
const link = page.getByRole('link', { name: 'Documentation' });
await link.evaluate((el) => el.removeAttribute('target'));   // strip target="_blank"
await link.click();
await expect(page).toHaveURL(/docs/);
```

## Rules & anti-patterns

- **`Promise.all([waitForEvent, click])`** is the default shape — it makes subscribe-before-click
  structurally impossible to get wrong. Clicking then calling `waitForEvent('page')` races and hangs.
- **`page.waitForEvent('popup')`** when one specific button opens the window (ties it to the opener);
  `context.waitForEvent('page')` for generic `target="_blank"`.
- **Always `waitForLoadState`** on the new tab before any locator/URL assertion — the `Page` object
  resolves the instant the tab exists, not when it has content.
- **Hold the returned `Page` reference; never `context.pages()[1]`** — order isn't portable.
- **No `waitForTimeout` to "let the tab open"** — same smart-wait rule as the rest of the suite.
- **Close popups you open** (or rely on context teardown) so a leaked Report/viewer tab doesn't
  steal focus in the next data-driven iteration.

Adapted from qaskills/seed-skills/playwright-multi-tab-handling
