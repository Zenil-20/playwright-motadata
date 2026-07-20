---
name: axe-accessibility
description: Run automated axe-core WCAG scans against ObserveOps (Vue 3 + Ant Design) screens inside Playwright specs, scoped the way we already read the accessibility tree for locators. Use to add a11y assertions to a scenario or audit a screen (Dashboards, Alerts, Discovery, Policy forms).
---

# Axe-core accessibility scans for ObserveOps

ObserveOps is a Vue 3 + **Ant Design** SPA (build 8.2.6). We already read the **accessibility tree**
(never raw HTML) to harvest locators — see the `motadata-explorer` skill and
`knowledge/locators/selector-cookbook.md`. That means a11y coverage is a natural extension: the same
roles/labels that make an element findable are what axe audits. Wire `@axe-core/playwright` into our
existing spec skeleton (`framework/playwright/flow.js`) rather than a separate suite.

## When to use
- Adding a11y assertions to a data-driven scenario (`tests/scenarios/**`) or a regression spec (`tests/regression/**`).
- Auditing a specific screen documented under `knowledge/product/<Module>/<Screen>.md` — e.g. a Dashboard,
  the Alerts grid, the Create Discovery Profile wizard, or a Policy create form.
- After a locator harvest via `motadata-explorer` — if the a11y tree was thin (missing roles/labels),
  axe will confirm the underlying WCAG violation.

## When NOT
- Do not treat axe as full coverage — it catches ~30-40% of issues. Keyboard + focus checks (below) still needed.
- Do not scan a screen mid-transition; wait on our **smart-wait** (avatar-visible after login, target
  element `count()===1`) first — never `networkidle`, never blind `waitForTimeout`.

## Procedure (ObserveOps-specific)
1. **Log in and navigate** with our flow helpers (`framework/playwright/flow.js`), reusing the
   avatar-visible login check. Land on the screen from its `route:` in the screen doc.
2. **Scope the scan to the live surface.** AntDesign renders drawers/popovers into portals at
   `body` root, so a full-page scan mixes stale content. Scope like our locator convention:
   - Drawer flows (Create Discovery Profile, Policy create): `.include('.ant-drawer-open')`.
   - Popover/dropdown menus: `.include('.ant-popover:visible')`.
   - Data grids (Alerts, Monitors): `.include('.k-grid')` or the grid container.
3. **Run axe** with WCAG 2.1 A/AA tags:
   ```js
   const results = await new AxeBuilder({ page })
     .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
     .include('.ant-drawer-open')     // scope to the open drawer, not the whole SPA
     .analyze();
   ```
4. **Assert on impact, not zero-tolerance first.** Ant Design ships known minor issues; gate hard on
   `critical`/`serious` and quarantine the rest:
   ```js
   const blocking = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
   expect(blocking, formatViolations(blocking)).toEqual([]);
   ```
5. **Re-scan after interaction.** Open the drawer, expand a dropdown, submit a Policy form to trigger
   validation, then re-scan — dynamic AntDesign content is where labels/`aria-describedby` break.
6. **Record findings** as a Known Bug candidate in the screen doc's §10 (cite the axe rule id +
   `helpUrl`), and promote any confirmed a11y locator gap back into the selector-cookbook.

## AntDesign hot spots to target
- **Form fields** (`.ant-form-item`): label association — every `ant-input`/`ant-select` must resolve
  by `getByLabel`. Required fields on Create Discovery Profile / Policy forms should expose the
  required state to AT, not only the visual `*`.
- **Icon-only buttons** (grid row actions, `.ant-btn-icon-only`): need `aria-label` — common violation.
- **`ant-select` dropdowns** (`[data-cy='dropdown-trigger-input']`): combobox role + expanded state.
- **Modals/drawers**: `role="dialog"`, focus moved in on open, `aria-modal`.
- **Toasts/alerts** (`.ant-message`, `.ant-notification`): should be an `aria-live`/`role="alert"` region.

## Rules & anti-patterns
- Cookbook-first, `count()===1`, role/label/`data-cy` first — the same discipline the a11y scan verifies.
- Never `disableRules(['color-contrast'])` to make a Dashboard pass — dark/light contrast is a real
  concern (see the `dark-mode-testing` skill); document any exclusion with a reason.
- Provenance: every violation you report cites the axe rule id and the screen doc. Quarantine, don't mask.

Adapted from qaskills/seed-skills/axe-accessibility.
