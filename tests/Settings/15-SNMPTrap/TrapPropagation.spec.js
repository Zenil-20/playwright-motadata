/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * SNMP Trap — END-TO-END PROPAGATION suite (Layers 2-3 of the trap harness).
 *
 * Flow under test (grounded — memory project_trap_flow):
 *   NetForge (172.16.12.36) fires SNMP traps  ->  AIOps listener (:1620)  ->  SNMPTrapProcessor
 *   ->  profile OID match/translate  ->  datastore FLUSH (~5 min, FIXED)  ->  Trap Explorer grid.
 *
 * EFFICIENCY: the 5-minute flush is unavoidable, so we fire the WHOLE batch of distinct traps in
 * one burst and pay the wait ONCE (the first verification poll absorbs it; the rest are instant
 * lookups because all traps were flushed together). N scenarios ≈ one 5-min window, not N.
 *
 * DETERMINISM: every NetForge trap shows SOURCE = 172.16.12.36, so we discriminate by trap OID
 * (distinct per fixture) within a recent window, and run serially.
 *
 * WRITES: this suite mutates NetForge (creates short-lived sender profiles, cleaned up in afterAll)
 * and only READS AIOps (Trap Explorer). No AIOps state is created here.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */

import { test, expect } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import fs from 'fs';
import { TRAP_BATCH, NETFORGE_SOURCE, V3_USER, assertTrapEnv } from './_helpers/trap-fixtures.js';
import { netforgeReachable, fireBatch, cleanupBatch } from './_helpers/trap-sender.js';
import { openTrapExplorer, waitForTrapByOid, rowByOid, readRow } from './_helpers/trap-explorer.js';
import { TRAP_STATE_FILE } from './_helpers/global-trap-setup.js';

test.describe.serial('Motadata AIOps — SNMP Trap end-to-end propagation', () => {
  let page;
  const canV3 = Boolean(V3_USER);
  // Handles for traps we fire INLINE (fallback path). The batch fired by globalSetup is torn down by
  // globalTeardown, so we only clean up what we created here.
  const state = { inlineHandles: [] };

  test.beforeAll(async ({ browser }) => {
    assertTrapEnv(); // fail LOUD if the .env wiring is incomplete
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (state.inlineHandles.length) await cleanupBatch(state.inlineHandles);
    await page.close().catch(() => {});
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('NetForge sender is reachable', async () => {
    expect(await netforgeReachable(), 'the trap sender /health must respond').toBe(true);
  });

  test('Fired traps are present in Trap Explorer (5-min flush handled at globalSetup)', async () => {
    test.setTimeout(12 * 60 * 1000);
    // PREFER the batch fired at suite start by globalSetup: by the time this test runs (minutes into
    // the suite) the ~5-min flush has overlapped the rest of the run, so verification is usually
    // instant — the 5-min floor costs ~0 wall-clock. See _helpers/global-trap-setup.js.
    let firedOids = [];
    try {
      if (fs.existsSync(TRAP_STATE_FILE)) {
        const { created } = JSON.parse(fs.readFileSync(TRAP_STATE_FILE, 'utf-8'));
        firedOids = (created || []).map((c) => c.oid);
      }
    } catch { /* fall through to inline fire */ }

    // FALLBACK: spec run in isolation (no globalSetup) or TRAP_FIRE=0 -> fire now (and the poll below
    // absorbs the full 5-min flush). Handles are cleaned up in afterAll.
    if (!firedOids.length) {
      const { created } = await fireBatch(TRAP_BATCH, `playwright-${Date.now().toString(36)}`, (fx) => !fx.requiresV3 || canV3);
      state.inlineHandles = created;
      firedOids = created.map((c) => c.oid);
    }
    expect(firedOids.length, 'at least one trap must have been fired').toBeGreaterThan(0);

    // 1) waitForTrapByOid on the first OID absorbs ANY remaining flush time (instant if already done).
    const firstRow = await waitForTrapByOid(page, firedOids[0]);
    expect(firstRow.oid, `TRAP OID column should show ${firedOids[0]}`).toContain(firedOids[0].replace(/^\./, ''));
    // SOURCE column must be the sender host — proves the path end-to-end.
    expect(firstRow.source, 'SOURCE column must be the trap sender').toContain(NETFORGE_SOURCE);

    // 2) The rest were flushed together — verify each without re-waiting.
    await openTrapExplorer(page);
    for (const oid of firedOids.slice(1)) {
      const row = rowByOid(page, oid);
      await expect(row, `trap OID ${oid} should be present after the flush`).toBeVisible({ timeout: 60000 });
      const cells = await readRow(row);
      expect(cells.source, `${oid} SOURCE should be the sender`).toContain(NETFORGE_SOURCE);
      expect(cells.name.length, `${oid} should have a translated TRAP NAME`).toBeGreaterThan(0);
    }
  });

  /*
   * LAYER 3 — Trap Policy -> Alert correlation.
   *
   * The `cpu-threshold` fixture (expectPolicyAlert) is designed to match a Trap Policy so it raises
   * an alert with the policy's severity. That assertion needs (a) a matching Trap Policy to exist on
   * this server and (b) verified Alerts-screen locators. The Alerts grid was NOT part of the trap
   * harvest, so this step is scaffolded and marked to complete once a policy is seeded (TrapConfig
   * spec) and the Alerts screen is harvested. It is NOT left silently passing.
   */
  test.fixme('Policy-matched trap raises an alert with the configured severity', async () => {
    // TODO(build): pre-create a Trap Policy matching cpu-threshold (via TrapConfig or fixture),
    //   harvest the Alerts grid locators, then assert an alert exists for OID .1.3.6.1.4.1.9.9.9.109.0.1
    //   with the expected severity within the post-flush window.
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
