---
name: self-healing-locators-strategy
description: The ObserveOps discipline for resilient, self-healing locators — primary→fallback via framework/playwright/resolver.js with a mandatory count()===1 gate, cookbook-first sourcing, and evidence-backed heals that never mask a product regression. Use when a locator is flaky, matches multiple elements, or a spec failed on a wrong/ambiguous selector.
---

# Self-healing locators — the ObserveOps way

In this repo "self-healing" is not a magic retry. It is a concrete mechanism — `resolve()` in
`framework/playwright/resolver.js` tries a **primary** selector, and if it does not match exactly
one element, heals to a **fallback**. Both candidates come from a verified store, not from guesses.
A heal that could match the wrong Ant Design node is worse than a clean failure the triager can read.

## When to use / When NOT

Use when:
- A spec throws strict-mode ("matched N elements") or "not found" on an ObserveOps screen.
- The cookbook has no entry for a control, or an entry drifted after a build bump (8.2.4 → 8.2.6).
- You are adding a new control and want a primary + fallback pair, not a single brittle XPath.

Do NOT auto-heal (escalate to a human / the failure-triager) when:
- The accessible name/role a step depends on **disappeared** — that is a product regression, not a
  locator problem. Quarantine, do not mask (our "quarantine-not-mask" rule).
- The heal would only pass by weakening an assertion or matching a different element.
- The screen shows a real error state or a "No data found" empty state where the row should exist —
  the precondition (seed-data) failed, not the locator.

## How the mechanism works (cite the real code)

`framework/playwright/resolver.js` is the whole engine:
```js
export async function resolve(scope, spec) {
  const primary = build(scope, spec.primary);
  if ((await countSafe(primary)) === 1) return primary;   // primary wins only if UNIQUE
  if (spec.fallback != null) {
    const fb = build(scope, spec.fallback);
    if ((await countSafe(fb)) === 1) return fb;            // heal to fallback, also gated on ===1
  }
  return primary;   // neither unique → return primary so the action throws a CLEAR error
}
```
`unique(scope, spec, expect)` wraps it and asserts `count()===1`, failing loud with the control's
name if not. The selector data lives in `framework/playwright/selectors.js`; the catalog of what has
actually been verified lives in `knowledge/locators/selector-cookbook.md`.

## Procedure

1. **Cookbook-first.** Grep the ONE screen you need in `knowledge/locators/selector-cookbook.md`
   (e.g. `## 16.1 Discovery Profile`). Never re-derive a locator that is already `# verified`.
2. **Pick a primary by our priority order:** `getByRole(name)` → `getByLabel` → `getByPlaceholder`
   → `getByText` → unique `#id` / `data-cy` → scoped XPath. ObserveOps exposes many stable hooks —
   `data-cy='dropdown-trigger-input'`, `id='ip-address-id'`, `#save-run-btn-id`, `a#sync` — prefer
   them over class chains.
3. **Choose a fallback that is genuinely different**, so a real UI change breaks BOTH (a true
   failure) rather than one silently covering for the other. Example for the Discovery "Create"
   button:
   ```js
   const createBtn = await resolve(page, {
     name: 'Create Discovery Profile',
     primary: (s) => s.getByRole('button', { name: 'Create Discovery Profile' }),
     fallback: "//button[normalize-space()='Create Discovery Profile']",
   });
   ```
4. **Scope Ant Design duplicates before you emit** (see selector-filter skill): `.ant-drawer-open`
   for drawer fields, `.ant-popover:visible` / `.ant-dropdown:visible` (`.last()`) for floating
   menus, `tr.k-master-row` + `hasText:<unique>` for grid rows.
5. **Verify `count()===1`** on the live app — that is the gate the resolver and the cookbook both
   enforce. If a heal is genuinely needed, harvest the correct locator with the `motadata-explorer`
   skill (reads the a11y tree, auto-disambiguates) and write it back to the cookbook with a
   `# verified YYYY-MM-DD` tag. Next run is a free lookup.

## Evidence for a heal (provenance rule)

Every locator change carries: the old locator, the new locator, the screen + build it was verified
against, and the `count()===1` proof. This is the same provenance the cookbook demands ("verified
`count() === 1` on the live app"). A locator that has not passed the gate is never committed.

## Rules & anti-patterns

- **Heal selectors, never expectations.** The fallback must find the *same intended control*, not a
  lookalike. Discovery has header select-all + per-row + form checkboxes — never let a checkbox heal
  to `input[type=checkbox]`; use `getByRole('checkbox',{name})` or a row/`thead` scope.
- **No positional XPath / `nth-child`.** ObserveOps grids reorder on sort and data. Filter by role +
  text (`tr.k-master-row` `hasText:<IP>`) instead.
- **Repeated heals in one area are a smell** — flag the screen doc under
  `knowledge/product/<Module>/<Screen>.md` (Known Bugs section) rather than patching forever.
- **Do not raise global timeouts to "stabilise" a locator** — that masks a real slow screen. Use
  smart waits (avatar-visible login check; `waitFor({ state })`), never `networkidle`.

Adapted from qaskills/seed-skills/self-healing-locators-strategy
