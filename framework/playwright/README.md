---
name: discovery-service
type: service
description: One data-driven discovery flow (login → wizard → device+subtype → protocol-aware credential → save/run → provision → verify) driven by a device matrix CSV.
tools: ["Playwright", "selectors.js", "resolver.js"]
source: extracted from tests/Settings/02-Discovery/*.spec.js; format follows rohitg00/awesome-claude-code-toolkit
---

# Discovery Service

The reusable engine behind the consolidated discovery suite. It collapses the ~30
per-device specs into ONE flow driven by rows in `tests/data/discovery-devices.csv`.

## Files

| File | Role |
|---|---|
| `selectors.js` | The **only** place discovery locators live (runtime mirror of the cookbook §16.1/16.2). |
| `resolver.js` | Self-heal mechanism: `resolve()` tries primary→fallback; `unique()` asserts `count()===1`. |
| `flow.js` | Pure step logic (login, wizard, credential, provision). Imports every locator from `selectors.js`. |

## Public API (`flow.js`)

- `login(page)` / `logout(page)` — session, avatar-verified (no networkidle).
- `openDiscoveryWizard(page)` — Settings → search → Create Discovery Profile.
- `selectDeviceType(page, row)` — category + subtype (dropdown for DB, link otherwise).
- `fillProfile(page, row)` — name, IP, optional DB port/instance.
- `createCredential(page, row)` — protocol-aware (`snmp_v2c` | `ssh` | `userpass`).
- `saveRunAndProvision(page, row)` — save, provision the row (row-scoped checkbox).
- `discoverDevice(page, row)` — the full chain.

## Rules & Regulations

1. **No inline locators.** `flow.js` must not contain any XPath/CSS string. Every locator
   is imported from `selectors.js`. If a locator is missing, add it to the cookbook first,
   then to `selectors.js` — never hardcode it in the flow.
2. **No positional selectors.** Banned: `nth(index)`, `//div[13]//span[1]`. Use row/label/role
   scope (see `discoveredRowCheckbox`, which replaced the old `.nth(1)` checkbox).
3. **Smart waits only.** Avatar-visible login check, `toBeVisible`, `expect.poll`. No
   `waitForLoadState('networkidle')`, no blind `waitForTimeout`.
4. **Honest skips.** A device row with missing env vars SKIPS with a reason — never a false fail.
5. **Add a device = add a CSV row**, not a new spec or a new flow branch.

## Before Completing a Task

- [ ] `flow.js` contains zero literal selectors (grep for `//` and `[@`).
- [ ] Any new locator is in the cookbook AND `selectors.js`, with a fallback where known.
- [ ] `npx playwright test --project discovery_data_driven --list` still lists all rows.
