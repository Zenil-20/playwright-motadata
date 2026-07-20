---
name: playwright-locator-filter
description: Narrow ObserveOps (Ant Design + Kendo) locators with .filter({ hasText, has, hasNot }) and scope duplicates to the right container — .ant-drawer-open, .ant-popover:visible, tr.k-master-row — so every control resolves to count()===1. Use on strict-mode "matched N elements", picking a grid row, or when tempted to add waitForTimeout.
---

# Locator filter & visibility on Ant Design + Kendo screens

ObserveOps is a Vue 3 + **Ant Design** SPA with **Kendo** data grids. The same placeholder,
`id`, or role renders many times — a hidden picker plus a visible drawer, a settings-sidebar
search plus a grid search, header select-all plus every row checkbox. The fix is never a longer CSS
chain; it is **start semantic, then `.filter(...)` / scope to the open container** until
`count()===1` (the gate `framework/playwright/resolver.js` enforces). Locators are lazy and
re-resolve on every action, so define once and reuse across Ant re-renders.

## When to use / When NOT

Use when a locator matches multiple elements, when you must act on one Kendo row out of many, when
a control lives inside a drawer/popover/modal, or when you see `page.waitForTimeout` waiting for an
Ant animation. Do NOT use raw `.nth(4)` on a Kendo grid (order is data-dependent) or
`isVisible()`-then-assert (it does not wait).

## The ObserveOps scope map (from selector-cookbook.md)

| Situation | Scope | Cookbook example |
|---|---|---|
| Field inside an open drawer (Create Credential) | `.ant-drawer-open` (use `.last()`) | `container_scope: ".ant-drawer-open (use .last())"` |
| Floating dropdown search / options | `.ant-popover:visible` / `.ant-dropdown:visible` (`.last()`) | `dropdown-search-input` "always `.last()`" |
| One grid row | `tr.k-master-row` + `hasText:<unique>` | `master_row: "tr.k-master-row hasText:<unique>"` |
| Modal (NCCM Compare) | `.ant-modal:visible` | — |
| Form field by its label | label ancestor `div.ant-form-item` | `network_config_toggle`, `config_transfer_protocol` |

## Patterns

### 1 — Pick one Kendo row with `filter({ hasText })`
The core discovery/alerts case: rows share `tr.k-master-row`, differ by text.
```js
// After Save & Run in Discovery, act on the row for the device you provisioned.
const row = page.locator('tr.k-master-row').filter({ hasText: process.env.DEVICE_IP });
await expect(row).toBeVisible();
await row.getByRole('checkbox').check();          // per-row, not header select-all
await page.locator('#add-selected-btn-id').click();
```

### 2 — Scope a duplicated field to the open drawer
Ant renders SSH `username`/`password` in both a hidden picker and the visible drawer.
```js
const drawer = page.locator('.ant-drawer-open').last();
await drawer.locator("input[name='username']").first().fill(process.env.SSH_USER); // DUP → .first()
await drawer.locator("input[type='password']").first().fill(process.env.SSH_PASS);
```

### 3 — `filter({ has })` / `filter({ hasNot })` when text alone is ambiguous
```js
// Only the policy row that already has an "Enabled" switch on; skip disabled ones.
const enabledPolicy = page.locator('tr.k-master-row')
  .filter({ has: page.getByRole('switch', { name: /enabled/i }) })
  .filter({ hasText: 'CPU Utilization' });
await enabledPolicy.getByRole('button', { name: 'Edit' }).click();
```

### 4 — Floating popover: filter then `.last()`
```js
// The grid column-eye popover and the SNMP-credential popover both float; take the visible one.
const popover = page.locator('.ant-popover:visible').last();
await popover.locator("input[data-cy='dropdown-search-input']").fill('default snmp');
await popover.getByText(/default\s*snmp/i).click();
```

### 5 — Visibility: assertion (auto-waits) vs `isVisible()` (instant)
```js
// CORRECT: auto-wait for the provision toast (smart wait, never networkidle).
await page.locator('#save-run-btn-id').click();
await expect(page.getByText('provisioned successfully')).toBeVisible({ timeout: 60_000 });

// CORRECT isVisible(): branch on an OPTIONAL "No data found" empty state.
if (await page.getByText('No data found').isVisible()) {
  test.skip(true, 'Grid empty — seed-data precondition missing');
}
```

### 6 — Count assertions that retry
```js
await expect(page.locator('tr.k-master-row')).toHaveCount(3);   // retries; NOT (await ...count())===3
```

## Rules & anti-patterns

- **Start from `getByRole`/`getByLabel`/`getByText`, then `.filter(...)`** — reserve XPath for what
  the a11y tree can't express (label-ancestor form-item scoping is the common exception).
- **Never `input[placeholder='Search']` bare** — the Settings sidebar and the Kendo grid both have
  one. Grid search is `//input[@name='search']`; discovery-results search is `//input[@name='discovery-search']`.
- **Never bare `input[type=checkbox]`** — header + rows + form all match; use `getByRole('checkbox',{name})`, `thead input`, or a row scope.
- **No `.nth(n)` on Kendo grids**, no `nth-child`, no mega-CSS chain — filter to the meaningful row.
- **Replace `waitForTimeout`** with `expect(...).toBeVisible()` / `locator.waitFor({ state })`; Ant
  drawers/popovers animate but locators auto-wait.

Adapted from qaskills/seed-skills/playwright-locator-filter
