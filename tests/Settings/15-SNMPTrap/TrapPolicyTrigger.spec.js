/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * SNMP Trap — VARBIND-TRIGGERED TRAP POLICY -> ALERT (end-to-end, Layer 3).
 *
 * The complete trap-alerting chain in ONE deterministic pass:
 *   create policy (trigger: trap.oid ~ cold-start, filter: Varbind N Contains 'kapadia', Critical)
 *   -> fire ONE cold-start trap whose sysDescr varbind is OVERRIDDEN to a run-unique kapadia token
 *   -> the processor matches the policy while ingesting the trap
 *   -> after the fixed ~5-min datastore flush the alert surfaces on Alerts -> Trap
 *   -> verify it by OUR policy name (unique per run), then delete the policy.
 *
 * ORDERING MATTERS: the policy must exist BEFORE the trap is received (policies act at processing
 * time, not retroactively), so unlike the propagation suite this 5-min wait cannot be hidden in
 * globalSetup — it is the product's real alert latency and the test owns it (15-min budget).
 *
 * The trigger uses the bespoke picker widget (harvest 2026-07-08): trigger condition is a trap
 * FIELD (trap.oid | trap.message | ...), operator from a fixed list, free-text value. The filter
 * criteria block adds (Criteria All/Any, Varbind index 1-16, operator, value).
 *
 * Author  : Zenil Kapadia
 * Created : 8 July 2026
 */

import { test, expect } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import { AIOPS_URL, assertTrapEnv } from './_helpers/trap-fixtures.js';
import { senderReachable, fireOne, cleanupOne } from './_helpers/trap-sender.js';
import { pickFromPicker, clickThroughOverlay, deleteRow } from './_helpers/trap-ui.js';

const RT = Date.now().toString(36);
const POLICY_NAME = `pw-varbind-${RT}`;
const KAPADIA_TOKEN = `kapadia-${RT}`; // run-unique varbind payload; policy matches Contains 'kapadia'

// cold-start: the "one trap" of this scenario. NO templateId — template-mode IGNORES custom
// varbinds (verified on the wire 2026-07-08), so the sender uses NetForge's CUSTOM mode
// (explicit trap_oid + varbinds), where our kapadia sysDescr value is actually emitted.
const TRAP = { key: 'policy-coldstart', oid: '.1.3.6.1.6.3.1.1.5.1', version: 'v2c' };

// Which varbind INDEX the Motadata policy engine sees for our sysDescr value. Wire order of the
// received cold-start (decoded from its Trap Explorer detail, 2026-07-08):
//   1 = sysUpTime (.1.3.6.1.2.1.1.3.0), 2 = snmpTrapOID (.1.3.6.1.6.3.1.1.4.1.0), 3 = sysDescr.
const VARBIND_INDEX = '3';

test.describe.serial('Motadata AIOps — varbind-triggered Trap Policy raises an alert', () => {
  let page;
  const state = { handle: null, policyCreated: false };

  test.beforeAll(async ({ browser }) => {
    assertTrapEnv();
    page = await (await browser.newContext()).newPage();
    page.setDefaultTimeout(60000);
  });

  test.afterAll(async () => {
    await cleanupOne(state.handle); // tear down the NetForge sender profile
    // safety net: never leave the policy behind (it would alert on every future kapadia trap)
    if (state.policyCreated) await deletePolicyBestEffort(page);
    await page.close().catch(() => {});
  });

  test('Login to Motadata AIOps', async () => { await login(page); });

  test('Sender is reachable', async () => {
    expect(await senderReachable(), 'the trap sender must respond before this E2E').toBe(true);
  });

  test('Create the varbind-filtered trap policy (trap.oid + Varbind Contains kapadia, Critical)', async () => {
    test.setTimeout(3 * 60 * 1000);
    await page.goto(`${AIOPS_URL}/settings/policy-settings/policies/trap/create`, { timeout: 120000 });
    // NB: #policy-name matches TWO nodes (Ant renders a wrapper <div id> around the <input id>) —
    // the input's name attribute is the unique hook (strict-mode verified 2026-07-08).
    await expect(page.locator("input[name='policy-name']")).toBeVisible({ timeout: 30000 });

    await page.locator("input[name='policy-name']").fill(POLICY_NAME);

    // --- Trigger Condition: trap.oid Contains <cold-start OID> ---
    // 'Contains' (not Equals) so a leading-dot formatting difference can never cause a silent miss.
    await pickFromPicker(page, page.locator("input[placeholder='Trigger Condition']"), 'trap.oid');
    await pickFromPicker(page, page.locator("input[placeholder='Select Operator.']"), 'Contains', { exact: true });
    await page.locator("input[placeholder='Value']").first().fill(TRAP.oid.replace(/^\./, ''));

    // --- Filter Criteria: Varbind <N> Contains kapadia ---
    // Two placeholder-'Select' pickers in this block (harvested order): [0]=Criteria(All/Any),
    // [1]=Varbind(1..16). Criteria defaults to 'All' which is correct for a single row.
    const selects = page.locator("input[placeholder='Select'][data-cy='dropdown-trigger-input']");
    await pickFromPicker(page, selects.nth(1), VARBIND_INDEX, { exact: true });
    await pickFromPicker(page, page.locator("input[placeholder='Select Operator']").last(), 'Contains', { exact: true });
    await page.locator("input[placeholder='Value']").last().fill('kapadia');

    // --- Severity: Critical (radio group Critical | Major | Warning) ---
    await page.locator('.ant-radio-wrapper, label:has(input[type=radio])').filter({ hasText: 'Critical' }).first()
      .locator('input[type=radio]').check({ force: true }).catch(async () => {
        // fallback: click the visible label text (some builds hide the native radio input)
        await clickThroughOverlay(page.getByText('Critical', { exact: true }).first());
      });

    // --- Save. 'Create Policy' is a single verified button; DOM-dispatch past the dev overlay. ---
    await clickThroughOverlay(page.locator("button:has-text('Create Policy')"));
    // Success signal: the form navigates away from /create (same signal the create-from-trap test
    // uses). If validation failed we would still be on the create route.
    await expect(page, 'policy save should navigate away from the create form')
      .not.toHaveURL(/\/trap\/create/, { timeout: 30000 });
    state.policyCreated = true;

    // Hard confirmation: the policy row exists in the Trap Policy list
    // (route + search verified 2026-07-08). A silent no-op save would fail here, not 10 min later.
    await page.goto(`${AIOPS_URL}/settings/policy-settings/trap`, { timeout: 120000 });
    const listSearch = page.locator("input[name='search']").first();
    await listSearch.waitFor({ state: 'visible', timeout: 30000 });
    await listSearch.fill(POLICY_NAME);
    await listSearch.press('Enter').catch(() => {});
    await expect(page.locator('tr.k-master-row', { hasText: POLICY_NAME }),
      'the new policy must appear in the Trap Policy list').toBeVisible({ timeout: 30000 });
  });

  test('Fire ONE cold-start trap carrying the kapadia varbind', async () => {
    // Override sysDescr with the run-unique token. NetForge accepts custom varbinds on the profile
    // (probed 2026-07-08: they stick and are emitted in place of the template's value).
    const { handle } = await fireOne(
      { ...TRAP, varbinds: [{ oid: '.1.3.6.1.2.1.1.1.0', type: 'string', value: KAPADIA_TOKEN }] },
      RT,
    );
    state.handle = handle;
    expect(handle, 'sender must return a cleanup handle').toBeTruthy();
  });

  test('The policy raises a CRITICAL alert on Alerts -> Trap after the flush', async () => {
    test.setTimeout(15 * 60 * 1000); // the ~5-min flush is product latency; budget generously

    // Poll the Alerts -> Trap surface for OUR policy name. Reload each round: alert data is
    // flush-driven, not socket-driven, so a static page would never update.
    await expect
      .poll(async () => findTrapAlert(page, POLICY_NAME), {
        timeout: 13 * 60 * 1000,
        intervals: [30000],
        message: `no Trap alert for policy ${POLICY_NAME} within the post-flush window`,
      })
      .toBe(true);
  });

  test('Cleanup — delete the policy', async () => {
    await deletePolicyBestEffort(page);
    state.policyCreated = false;
  });

  test('Logout from AIOps', async () => { await logout(page); });
});

/**
 * One reload-and-look round on the Alerts -> Trap surfaces. True when an alert attributable to
 * `policyName` is visible. Locators grounded via harvest_v6 (2026-07-08).
 */
async function findTrapAlert(page, policyName) {
  // Alerts -> Trap dashboard; the squared-button (top-right, verified single) toggles to the LIST
  // view (/alerts/Server/trap?view=live) with columns ALERT | EVENT SOURCE | TYPE | ... | ACTIONS.
  await page.goto(`${AIOPS_URL}/alerts/dashboard/trap`, { timeout: 120000 }).catch(() => false);
  await page.waitForTimeout(5000);
  const listToggle = page.locator('button.squared-button').last();
  if (await listToggle.count()) {
    // DOM-dispatch: the floating dev-tools overlay can swallow pointer clicks on this build
    await listToggle.evaluate((el) => el.click()).catch(() => {});
    await page.waitForTimeout(4000);
  }
  // Prefer a scoped search (list has input[name='search']) so the row count is unambiguous.
  const search = page.locator("input[name='search']").first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill(policyName);
    await search.press('Enter').catch(() => {});
    await page.waitForTimeout(2500);
  }
  if ((await page.locator('tr.k-master-row, .ant-table-row', { hasText: policyName }).count()) > 0) return true;
  return (await page.locator(`text=${policyName}`).count()) > 0;
}

/** Delete the policy row from the trap-policy list. Best-effort (also used from afterAll).
 *  List route verified 2026-07-08: /settings/policy-settings/trap (grid + input[name='search']). */
async function deletePolicyBestEffort(page) {
  try {
    await page.goto(`${AIOPS_URL}/settings/policy-settings/trap`, { timeout: 120000 });
    await page.waitForTimeout(2500);
    const search = page.locator("input[name='search']").first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill(POLICY_NAME);
      await search.press('Enter').catch(() => {});
      await page.waitForTimeout(2000);
    }
    await deleteRow(page, POLICY_NAME);
  } catch { /* cleanup must never fail the test */ }
}
