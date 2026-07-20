---
name: wcag-accessibility-testing
description: Manual + automated WCAG 2.1/2.2 AA testing for ObserveOps — keyboard navigation, focus management, screen-reader semantics, and contrast — leveraging the accessibility tree we already read for locators. Use to audit a screen's a11y beyond what axe catches.
---

# WCAG testing for ObserveOps

axe (see the `axe-accessibility` skill) automates ~30-40% of WCAG. This skill covers the rest —
keyboard, focus, semantics, contrast — the parts a human/agent must drive. ObserveOps is a Vue 3 +
**Ant Design** SPA; because we already snapshot the **accessibility tree** for locators
(`motadata-explorer`), we get WCAG "Name, Role, Value" evidence for free — a control that can't be
found by role/label in the tree is usually already a 4.1.2 violation.

## When to use
- Auditing a screen doc (`knowledge/product/<Module>/<Screen>.md`) for WCAG 2.1 AA — Dashboards, Alerts,
  Discovery/Policy wizards, Users/RBAC screens.
- Verifying keyboard-only operability of a drawer/modal flow (Create Discovery Profile, Policy create).
- Investigating a "can't find by role" locator gap surfaced by `motadata-explorer` — often a real a11y defect.

## When NOT
- Not a replacement for `axe-accessibility` — run axe first for the mechanical checks, then this for the rest.
- Don't hand-audit contrast on themed screens here — the `dark-mode-testing` skill owns Light/Dark contrast.

## WCAG focus areas (map to ObserveOps)
| Criterion | ObserveOps check |
|---|---|
| 1.3.1 Info & Relationships | AntDesign `.ant-form-item` label ↔ input; grid `columnheader`s present |
| 2.1.1 Keyboard | Tab reaches every control on Create Discovery Profile; addressing-mode tabs (IP/Host·Range·CSV·CIDR) operable |
| 2.1.2 No keyboard trap | `ant-select` dropdown / drawer closes on Esc, focus not stuck |
| 2.4.3 Focus order | Drawer opens → focus moves into drawer; closes → focus returns to the trigger |
| 2.4.7 Focus visible | Visible outline/box-shadow on focused `ant-btn`, grid rows, menu items |
| 4.1.2 Name, Role, Value | Every control resolves in the accessibility tree by role+name (our locator harvest proves this) |
| 4.1.3 Status messages | `.ant-message`/`.ant-notification` save toasts announced via `aria-live`/`role="alert"` |

## Procedure (ObserveOps-specific)
1. **Navigate** with `framework/playwright/flow.js` (avatar-visible login, smart wait — no `networkidle`).
2. **Snapshot the a11y tree** for the screen (the `motadata-explorer` engine). Every documented Action
   in the screen doc's §3 must appear with a sensible role + accessible name. Log any that don't — that's
   a 4.1.2 finding and a locator gap at once.
3. **Keyboard sweep.** Tab through the screen; assert focus reaches each control and the order is logical:
   ```js
   for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); /* record activeElement role+name */ }
   ```
   For a drawer flow, open the drawer, Tab through it, confirm focus stays within `.ant-drawer-open`, press
   `Escape`, and assert focus returns to the opening button.
4. **Status messages.** Trigger a Save (e.g. Create Discovery Profile → Save and Exit) and confirm the
   success/error toast is in an `aria-live` region, not a silent visual-only pill.
5. **Report** each finding against the screen doc's §10 (Known Bugs) with the WCAG criterion number, and
   promote any newly-verified role/name locator into `knowledge/locators/selector-cookbook.md`.

## Rules & anti-patterns
- Prefer native semantics; treat added ARIA as a smell to verify, not a fix to trust.
- No positional XPath to "prove" a control exists — if it isn't reachable by role/label/`data-cy` and
  keyboard, that's the finding, not a workaround.
- Cite every claim (screen doc + WCAG criterion). Quarantine failing screens; never mask with skips.

Adapted from qaskills/seed-skills/wcag-accessibility-testing.
