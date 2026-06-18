---
name: motadata-explorer
description: Harvest VERIFIED Playwright locators from the live Motadata AIOps app by reading the accessibility tree, auto-disambiguating multi-matches, and probing count()===1 before emitting. Use whenever a locator is unknown or a test failed on a wrong/ambiguous locator. Logs in, navigates to a named screen, snapshots the a11y tree (never raw HTML), ranks candidates by role, scopes duplicates to drawer/popover/row, verifies, and writes results to the selector-cookbook. This is the engine that removes the "wrong locator / multiple matches" painpoint.
---

# Motadata Live Locator Explorer

This skill harvests locators that are **guaranteed to match exactly one element**. It never hands back a guess. Use it from the `mt-locator-resolver` agent (or directly) when the cookbook has no entry for a control.

## Why a11y tree, not HTML

`page.accessibility.snapshot()` returns roles + accessible names + structure — ~10x smaller than HTML and aligned with the preferred locator order (`getByRole`/`getByLabel`). Raw HTML wastes tokens and tempts class-name locators. **Always snapshot the a11y tree.**

## Procedure

### 1. Login (canonical block — do not vary)
```js
await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
await page.locator("input[data-testid='login-input-username']").fill(process.env.Motadata_Username);
await page.locator("input[data-testid='login-input-password']").fill(process.env.Motadata_Password);
await page.locator("#login-btn-submit").click();   // Sign in — NEVER #login-btn-sso (SSO)
await expect(page.locator("#user-avatar")).toBeVisible();   // smart wait, never networkidle
// In specs, prefer the shared helper: import { login, logout } from '<rel>/fixtures/auth.js'
```

### 2. Navigate to the target screen
Settings sub-pages use the quirk block (the `#phone-number` focus is required):
```js
await page.locator("//a[@href='/settings/']").click();
await page.locator("//input[@id='phone-number']").click();
await page.locator("//input[@placeholder='Search']").fill('<keyword>');
await page.getByRole('link', { name: '<Exact Link Name>' }).click();
```
Top-level modules (NCCM, Inventory, etc.): `page.getByRole('link', { name: /NCCM/i }).click()` then the relevant tab.

### 3. Snapshot the accessibility tree
```js
const tree = await page.accessibility.snapshot({ interestingOnly: true });
// inspect tree for the requested control's role + accessible name
```
For Kendo grids and Ant popovers that the a11y tree flattens oddly, also capture the open container's role subtree only (not the whole page).

### 4. Rank candidates (priority order)
`getByRole(name)` → `getByLabel` → `getByPlaceholder` → `getByText` → unique `#id` / `data-cy` → scoped XPath.
Motadata exposes many `data-cy` and `id` hooks — prefer them over class chains: `data-cy='grid-action'`, `data-cy='run'`, `data-cy='dropdown-search-input'`, `#submit-btn`, `a#sync`.

### 5. Auto-disambiguate (the core)
If `count() > 1`, scope — do not emit a bare locator:
1. **Container:** `page.locator('.ant-drawer-open').last().locator(...)` · `.ant-popover:visible` · `.ant-modal:visible` · `.ant-dropdown:visible` (always `.last()` for floating popovers).
2. **Row:** `page.locator('tr.k-master-row', { hasText: <unique> }).first()`.
3. **Sibling tie-break:** `button#x:has(svg[data-icon="..."])`.
4. **`.first()` + reason comment** only for genuinely identical duplicates (Ant wraps `<input id>` in a `<span id>`; same id on hidden+visible drawer).

### 6. Verify (mandatory)
```js
const n = await page.locator(<candidate>).count();
// MUST be 1. If not, re-scope and repeat from step 5.
```
A locator that hasn't passed `count()===1` is never emitted.

### 7. Write back to the cookbook
Append the verified locator under its screen in `ai-test-pipeline/cookbook/selector-cookbook.md` with a `# verified YYYY-MM-DD` tag. Next run is a free lookup.

## Known Motadata duplicate traps (assume until disproven)

| Control | Trap | Correct scope |
|---|---|---|
| `input[name="username"]`, `input[type="password"]` | hidden picker + visible drawer both render one | `.ant-drawer-open` scope, or `.first()` |
| `input[placeholder='Search']` | Settings sidebar AND grid both have it | grid = `//input[@name='search']` |
| `input[type="checkbox"]` | header select-all + each row + form checkboxes | `thead input`, row scope, or `getByRole('checkbox',{name})` |
| `dropdown-search-input` | rendered in floating popover | always `.last()` |
| Protocol/Select dropdowns | many `input[placeholder='Select']` per form | scope by label's ancestor form-item |
| Same `id` across panels | e.g. two `create-credential` buttons | tie-break by visible container |

## Output contract

Return to the caller ONLY: `{ screen, control, locator, verified: true }` lines. **Never** return the a11y snapshot or HTML — that defeats the token budget. The snapshot stays inside this skill's working context and is discarded.

## Reference

Mirror the conventions in the user's existing `.claude/skills/motadata-playwright/SKILL.md` (login, Settings nav, confirm/cancel ids, kebab actions, smart waits, idempotency). This explorer is the *dynamic* complement: that skill documents known patterns; this one discovers new ones and feeds them back.
