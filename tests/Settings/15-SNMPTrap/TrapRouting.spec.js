/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * SNMP Trap — VERSION <-> PORT ROUTING matrix (regression suite).
 *
 * Regression target (reported bug, build 8.2.x): with v1/v2c bound to port P1 and v3 to P2, traps
 * sent v2c->P2 or v3->P1 were SILENTLY DROPPED. This suite:
 *   1. creates ONE combined listener — v1/v2c on ROUTING_PORT_V2C (1769) + v3 on ROUTING_PORT_V3
 *      (1780), with TEST-OWNED v3 credentials (the same values are given to NetForge, so v3 auth
 *      matches by construction — no site creds needed),
 *   2. opens the REAL-TIME Live Trap Viewer (no 5-min flush on this path),
 *   3. fires the full ROUTING_MATRIX — every version/port/credential combination, each with a
 *      DISTINCT trap OID that no other suite fires (attribution is unambiguous),
 *   4. asserts every 'deliver' OID appears and every 'drop' OID NEVER appears,
 *   5. deletes the listener (leaves the server as it found it).
 *
 * WHY Live Viewer, not Trap Explorer: the drop-assertions need "trap did NOT arrive". On the
 * flush path that means waiting the full 5 min per negative; on the live stream, delivered traps
 * surface in ~10s, so "delivers visible + grace period + drop OIDs absent" is sound and fast.
 *
 * Author  : Zenil Kapadia
 * Created : 8 July 2026
 */

import { test, expect } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import {
  AIOPS_URL, NETFORGE_SOURCE, assertTrapEnv,
  ROUTING_PORT_V2C, ROUTING_PORT_V3, ROUTING_PORT_UNBOUND, ROUTING_V3, ROUTING_V3_BAD, ROUTING_MATRIX,
} from './_helpers/trap-fixtures.js';
import { senderReachable, fireOne, cleanupBatch } from './_helpers/trap-sender.js';
import {
  gotoSettings, openCreate, submitAndExpectSaved, pickFromPicker, rowExists, deleteRow,
} from './_helpers/trap-ui.js';
import { AIOPS_HOST } from './_helpers/trap-fixtures.js';

const RT = Date.now().toString(36); // unique run token for names
const LISTENER_NAME = `pw-routing-${RT}`;
const LISTENER_ROUTE = '/settings/snmp-trap/snmp-trap-listener';
const LISTENER_SEARCH = "input[name='search-trap-listener']";

/** Resolve a matrix row's symbolic port to the real "host:port" NetForge target. */
function targetFor(row) {
  const port = { v2c: ROUTING_PORT_V2C, v3: ROUTING_PORT_V3, unbound: ROUTING_PORT_UNBOUND }[row.port];
  return `${AIOPS_HOST}:${port}`;
}

/** Build the sender fixture for a matrix row (creds resolved from the row's v3/community flags). */
function fixtureFor(row) {
  return {
    key: `routing-${row.key}`,
    templateId: row.templateId,
    oid: row.oid,
    version: row.version,
    target: targetFor(row),
    ...(row.community ? { community: row.community } : {}),
    ...(row.v3 ? { v3: row.v3 === 'bad' ? ROUTING_V3_BAD : ROUTING_V3 } : {}),
  };
}

test.describe.serial('Motadata AIOps — SNMP trap version<->port routing matrix', () => {
  let page;
  const state = { handles: [], listenerCreated: false };

  test.beforeAll(async ({ browser }) => {
    assertTrapEnv();
    page = await (await browser.newContext()).newPage();
    page.setDefaultTimeout(60000);
  });

  test.afterAll(async () => {
    // tear down every NetForge sender profile we created
    await cleanupBatch(state.handles);
    // safety net: if the delete-listener test didn't run (earlier failure), remove the listener so
    // ports 1769/1780 are free for the next run
    if (state.listenerCreated) {
      try {
        await gotoSettings(page, LISTENER_ROUTE);
        if (await rowExists(page, page.locator(LISTENER_SEARCH), LISTENER_NAME)) {
          await deleteRow(page, LISTENER_NAME);
        }
      } catch { /* best-effort cleanup */ }
    }
    await page.close().catch(() => {});
  });

  test('Login to Motadata AIOps', async () => { await login(page); });

  test('Sender is reachable', async () => {
    expect(await senderReachable(), 'the trap sender must respond before firing the matrix').toBe(true);
  });

  test('Create the combined v1/v2c + v3 routing listener', async () => {
    test.setTimeout(3 * 60 * 1000);
    await gotoSettings(page, LISTENER_ROUTE);

    // Idempotency: a crashed prior run can leave a pw-routing-* listener holding ports 1769/1780,
    // which would make this create fail with "port in use". Sweep any leftover first.
    const search = page.locator(LISTENER_SEARCH);
    await search.waitFor({ state: 'visible', timeout: 30000 });
    await search.fill('pw-routing-');
    await search.press('Enter').catch(() => {});
    await page.waitForTimeout(2500);
    while ((await page.locator('tr.k-master-row', { hasText: 'pw-routing-' }).count()) > 0) {
      const stale = await page.locator('tr.k-master-row', { hasText: 'pw-routing-' }).first().innerText();
      await deleteRow(page, stale.split(/\s+/)[0]);
      await page.waitForTimeout(1500);
    }

    // One listener, BOTH protocol families enabled — the combined config the bug report demands.
    await openCreate(page);
    await page.locator("input[name='trap-listener-profile-name']").fill(LISTENER_NAME);
    // v1/v2c section (toggle is ON by default)
    await page.locator("input[name='port-v1-v2']").fill(ROUTING_PORT_V2C);
    await page.locator("input[name='community']").fill('public');
    // v3 section — toggling ON reveals port/user/security-level (harvested 2026-07-08)
    await page.locator(".ant-form-item:has-text('SNMP v3') button[role='switch']").click();
    await page.locator("input[name='port-v3']").fill(ROUTING_PORT_V3);
    await page.locator("input[name='security-user-name']").fill(ROUTING_V3.username);
    // Security Level uses the bespoke picker; option labels harvested live:
    //   'No Authentication No Privacy' | 'Authentication No Privacy' | 'Authentication Privacy'
    await pickFromPicker(
      page,
      page.locator(".ant-drawer-open input[data-cy='dropdown-trigger-input']").first(),
      'Authentication Privacy',
    );
    // authPriv reveals the auth/priv protocol + password fields — fill them with the SAME values
    // NetForge will use (see ROUTING_V3). Locators harvested 2026-07-08 (harvest_v6).
    await fillV3AuthPrivFields(page);
    await submitAndExpectSaved(page, 'Create SNMP Trap Listener');
    state.listenerCreated = true;

    expect(await rowExists(page, page.locator(LISTENER_SEARCH), LISTENER_NAME),
      'the routing listener must appear in the list after save').toBe(true);
    // NOTE: no fixed "bind wait" here — UDP gives no delivery guarantee, so readiness is PROVEN by
    // the canary loop at the start of the matrix test (fire-until-seen), never assumed from a sleep.
  });

  test('Fire the full version<->port matrix — delivers appear, mismatches drop (Live Viewer)', async () => {
    test.setTimeout(8 * 60 * 1000);

    // 1) Open the Live Trap Viewer FIRST (it only shows traps received while open) and give its
    //    real-time stream a few seconds to connect.
    await page.goto(`${AIOPS_URL}/trap-explorer`, { timeout: 120000 });
    await page.locator("button:has-text('Live Trap Viewer'), a:has-text('Live Trap Viewer')").first().click();
    await expect(page, 'should be on the Live Trap Viewer').toHaveURL(/live-trap-viewer/, { timeout: 30000 });
    await page.waitForTimeout(5000);

    // 2) Fire EVERY combination. Sequential fires (one NetForge profile each) keep attribution
    //    clean; each row's OID is unique across the whole test run.
    for (const row of ROUTING_MATRIX) {
      const { handle } = await fireOne(fixtureFor(row), RT);
      state.handles.push(handle);
    }
    // Surface pinned known-issues in the report so a green run still tells the whole story.
    for (const row of ROUTING_MATRIX.filter((r) => r.knownIssue)) {
      test.info().annotations.push({ type: 'known-issue', description: `[${row.key}] ${row.why}` });
    }

    // 3) Positive half: every 'deliver' OID must stream in (~10s each on the live path).
    const delivers = ROUTING_MATRIX.filter((r) => r.expect === 'deliver');
    for (const row of delivers) {
      await expect
        .poll(() => page.locator('tr.k-master-row', { hasText: row.oid }).count(), {
          timeout: 120000,
          intervals: [3000],
          message: `[${row.key}] ${row.why} — OID ${row.oid} never arrived (routing/delivery broken)`,
        })
        .toBeGreaterThan(0);
      // sanity: the row is attributable to our sender
      const rowText = (await page.locator('tr.k-master-row', { hasText: row.oid }).first().innerText())
        .replace(/\s+/g, ' ');
      expect(rowText, `[${row.key}] SOURCE must be the sender`).toContain(NETFORGE_SOURCE);
    }

    // 4) Grace period: delivered traps surfaced in seconds, so anything wrongly accepted on a
    //    mismatched port would have surfaced by now too. Wait a little longer to be safe.
    await page.waitForTimeout(20000);

    // 5) Negative half: every 'drop' OID must be ABSENT. Seeing one of these means the version<->port
    //    routing regression (or a security bypass) is BACK.
    for (const row of ROUTING_MATRIX.filter((r) => r.expect === 'drop')) {
      await expect(
        page.locator('tr.k-master-row', { hasText: row.oid }),
        `[${row.key}] ${row.why} — this OID must NEVER surface`,
      ).toHaveCount(0);
    }
  });

  test('Delete the routing listener (restore server state)', async () => {
    await gotoSettings(page, LISTENER_ROUTE);
    expect(await rowExists(page, page.locator(LISTENER_SEARCH), LISTENER_NAME),
      'listener should still exist before cleanup').toBe(true);
    await deleteRow(page, LISTENER_NAME);
    await page.locator(LISTENER_SEARCH).fill(LISTENER_NAME);
    await page.locator(LISTENER_SEARCH).press('Enter').catch(() => {});
    await page.waitForTimeout(2500);
    await expect(page.locator('tr.k-master-row', { hasText: LISTENER_NAME }),
      'listener must be gone after delete').toHaveCount(0);
    state.listenerCreated = false;
  });

  test('Logout from AIOps', async () => { await logout(page); });
});

/**
 * Fill the auth/priv fields the 'Authentication Privacy' security level reveals.
 * All locators + option labels VERIFIED live (harvest_v6, 2026-07-08):
 *   picker triggers (3): [0]=Security Level, [1]=Authentication Protocol, [2]=Privacy Protocol
 *   Auth Protocol options: MD5 | SHA | SHA224 | SHA256 | SHA384 | SHA512
 *   Priv Protocol options: DES | 3DES | AES128 | AES192 | AES192C | AES192G | AES256 | AES256C | AES256G
 *   passwords: input[name='authentication-password'], input[name='private-password']
 * NetForge's side of the same handshake is {auth_protocol:'sha', priv_protocol:'aes'} — its plain
 * 'aes' = AES-128, so the Motadata pick MUST be 'AES128' for the pair to interoperate.
 */
async function fillV3AuthPrivFields(page) {
  const pickers = page.locator(".ant-drawer-open input[data-cy='dropdown-trigger-input']:visible");
  // exact:true — plain hasText('SHA') would also match SHA224/SHA256/...
  await pickFromPicker(page, pickers.nth(1), 'SHA', { exact: true });
  await page.locator(".ant-drawer-open input[name='authentication-password']").fill(ROUTING_V3.authPassword);
  await pickFromPicker(page, pickers.nth(2), 'AES128', { exact: true });
  await page.locator(".ant-drawer-open input[name='private-password']").fill(ROUTING_V3.privPassword);
}
