# NCCM Page Object Model

observeops-qa-style POM for the NCCM (Network Configuration & Compliance Management)
module of Motadata ObserveOps. Pure ESM JavaScript, `import { expect } from '@playwright/test'`.

## Files

| File | What it is |
|---|---|
| `locators.js` | `export const LOC` — every NCCM selector, grouped by area (`login, nav, discovery, credential, deviceInventory, explorer, backup, sync, restore, compare, baseline, runbook, firmware, deviceTemplate, storageProfile, tags, policy, approval, reports, widgets, alerts, rbac, sshTerminal`). **No logic** — data only. |
| `page.js` | `class NccmPage` — action functions wrapping the flows (`login`, `logout`, `openDiscoveryWizard`, `discoverDevice`, `createCredential`, `changeCredentialFromInventory`, `setBaseline`, `backupNow`, `syncConfig`, `restoreConfig`, `compareConfig`, `assignRunbook`, `runRunbook`, `firmwareUpgrade`, `createStorageProfile`, `createPolicy`, `openSshTerminal`, …). Imports `LOC`; **no literal selectors**. |
| `validations.js` | Assertion helpers (`assertProvisioned`, `assertConflictDetected`, `assertVersion`, `assertInSync`, `assertBackupSuccessful`, `assertSyncSuccessful`, `assertCompareZero`, `assertRunbookSuccessful`, `assertBaselineVersion`, `assertToast`, …). Mirror the expects already in the specs. |
| `data.js` | `NCM_DEVICES` + `STORAGE_PROFILES` matrices, keyed to **.env var NAMES** (never literal secrets), plus `resolveDevice` / `resolveStorageProfile` runtime resolvers. |

## Locator provenance

Locators are **verified-from-specs first**, cookbook second, Endtest last:

1. **[spec]** — copied verbatim from the three working specs
   `tests/regression/nccm/{DeviceNccmDiscovery,PerformNccmActions,nccmtest}.spec.js`.
   These are real, run-proven Playwright locators (login, discovery, SSH/TFTP credential,
   NCM toggle, provision, Explorer, Set-as-Baseline, backup/conflict/sync/compare,
   runbook assign+run, show/hide columns).
2. **[cookbook]** — `knowledge/locators/selector-cookbook.md` (§7 NCCM, §16 Settings).
3. **[doc]** — `knowledge/product/NCCM/*.md` catalog button ids.
4. **[endtest]** — `tests/_endtest/nccm-endtest-flows.json`. Only the **step structure**
   (phase order) and, where 1–3 had no locator, the `parameter2` selector value —
   **re-scoped** from positional XPath to role/label/id/name. Anything that could not be
   re-scoped is marked `// TODO(cookbook)` and must be harvested live via the
   `motadata-explorer` skill before it is trusted.

## Conventions (match the platform)

- Cookbook-first sourcing; `count()===1` gate enforced in `page.js` / `validations.js`.
- Smart waits only — `expect(...).toBeVisible/toHaveText/toHaveCount/toBeHidden`.
  No `networkidle`, no blind `waitForTimeout`.
- AntDesign duplicate scoping: `.ant-drawer-open`, `.ant-popover:visible`,
  `tr.k-master-row`, `.ant-modal:visible` — exposed via `NccmPage` helpers
  (`drawer()`, `modal()`, `row()`, `popover()`).

## Usage sketch

```js
import { test } from '@playwright/test';
import { NccmPage } from '../../framework/playwright/pages/nccm/page.js';
import { assertConflictDetected, assertBaselineVersion } from '../../framework/playwright/pages/nccm/validations.js';
import { NCM_DEVICES, resolveDevice } from '../../framework/playwright/pages/nccm/data.js';

test('backup drives conflict', async ({ page }) => {
  const nccm = new NccmPage(page);
  const dev = resolveDevice(NCM_DEVICES.find(d => d.key === 'ospf1_14_6'));
  await nccm.login();
  await nccm.setBaseline(dev.ip);
  await nccm.backupNow(dev.ip);
  await assertConflictDetected(nccm.row(dev.ip));
});
```

## Harvest gaps (no verified locator yet — best-effort + TODO(cookbook))

These areas are **not** covered by the three specs; their locators are Endtest-derived
best-effort or explicit stubs. Harvest live before relying on them:

- **runbook create** (`NccmPage.createRunbook`) — throws; drawer not harvested.
- **tags** (`tags.*`, `NccmPage.tagDevice`) — toolbar opener verified; tag-input fields positional.
- **policy** (`policy.actionSelect`, submit label, settings result link) — positional in Endtest.
- **approval** (`approval.approveActionText/rejectActionText`) — row actions never captured in the sweep.
- **rbac** (`rbac.roleSelect`) — role/group picker positional.
- **restore** (`restore.restoreConfirmBtn`) — modal footer button by class, not scoped.
- **deviceTemplate** editor (`deviceTemplate.codeMirror`) — CodeMirror interaction not modeled.
- **reports** (`reports.search` positional `[2]`) — re-scope to the reports search input.
