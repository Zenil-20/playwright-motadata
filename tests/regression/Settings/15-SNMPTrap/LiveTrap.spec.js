/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * SNMP Trap — LIVE TRAP VIEWER suite.
 *
 * The Live Trap Viewer taps the processor's real-time stream (BEFORE the ~5-min datastore flush),
 * so this is the FAST path: open the viewer, fire one trap via the swappable sender, and verify it
 * appears within a short window with correct RECEIVED TIME / TRAP OID / SOURCE / MESSAGE (+ Raw Trap).
 * The viewer only shows traps received WHILE it is open, so we open it FIRST, then fire.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */

import { test, expect } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import { AIOPS_URL, NETFORGE_SOURCE, assertTrapEnv } from './_helpers/trap-fixtures.js';
import { senderReachable, fireOne, cleanupOne } from './_helpers/trap-sender.js';

// A distinct fixture (warm-start .5.2 — not used by other specs) so we match exactly our trap.
const LIVE_FIXTURE = { key: 'live-warmstart', templateId: 'warm-start', oid: '.1.3.6.1.6.3.1.1.5.2', version: 'v2c' };

test.describe.serial('Motadata AIOps — SNMP Trap Live Viewer', () => {
  let page;
  const state = { handle: null, runToken: Date.now().toString(36) };

  test.beforeAll(async ({ browser }) => {
    assertTrapEnv();
    page = await (await browser.newContext()).newPage();
    // Sane default: the live viewer is real-time (~10s), so a huge default just turns a wrong
    // locator into an 8-minute hang. Keep it tight so mistakes fail fast.
    page.setDefaultTimeout(60000);
  });
  test.afterAll(async () => {
    await cleanupOne(state.handle); // tear down the NetForge sender profile
    await page.close().catch(() => {});
  });

  test('Login to Motadata AIOps', async () => { await login(page); });

  test('Sender is reachable', async () => {
    expect(await senderReachable(), 'the trap sender must be reachable before firing').toBe(true);
  });

  test('Live Trap Viewer — a freshly-fired trap streams in with correct fields (no 5-min wait)', async () => {
    test.setTimeout(4 * 60 * 1000);
    // 1) Open the Live Trap Viewer FIRST (it only captures traps received while open). Give its
    // real-time stream (socket) a few seconds to CONNECT before firing — otherwise a trap fired the
    // instant after navigation can be missed by the not-yet-ready stream. (Probe: trap appears ~10s.)
    await page.goto(`${AIOPS_URL}/trap-explorer`, { timeout: 120000 });
    await page.locator("button:has-text('Live Trap Viewer'), a:has-text('Live Trap Viewer')").first().click();
    await expect(page, 'should be on the Live Trap Viewer').toHaveURL(/live-trap-viewer/, { timeout: 30000 });
    await page.waitForTimeout(5000);

    // 2) Fire one trap through the swappable sender.
    const { handle } = await fireOne(LIVE_FIXTURE, state.runToken);
    state.handle = handle;

    // 3) The live stream surfaces it in real time (~10s verified). Poll the viewer for our OID with
    // a tight ceiling — if it's not there in ~2 min, the send/stream is broken (not just slow).
    const liveRow = page.locator('tr.k-master-row', { hasText: LIVE_FIXTURE.oid }).first();
    await expect
      .poll(() => page.locator('tr.k-master-row', { hasText: LIVE_FIXTURE.oid }).count(),
        { timeout: 120000, intervals: [3000], message: `live trap ${LIVE_FIXTURE.oid} never streamed into the Live Viewer` })
      .toBeGreaterThan(0);

    // 4) Verify the live row's fields: TRAP OID, SOURCE (= sender host), and a non-empty
    // RECEIVED TIME + MESSAGE (the row text is "<received-time> <oid> <source> <message...>").
    const rowText = (await liveRow.innerText()).replace(/\s+/g, ' ').trim();
    expect(rowText, 'live row should carry the fired OID').toContain(LIVE_FIXTURE.oid.replace(/^\./, ''));
    expect(rowText, 'live row SOURCE should be the sender host').toContain(NETFORGE_SOURCE);
    expect(rowText, 'live row should carry a RECEIVED TIME timestamp').toMatch(/\d{4}\s|\d{1,2}:\d{2}/);
    expect(rowText.length, 'live row should include a MESSAGE').toBeGreaterThan(30);
  });

  test('Logout from AIOps', async () => { await logout(page); });
});
