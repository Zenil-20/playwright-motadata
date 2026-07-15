/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * GLOBAL trap setup — fires the propagation trap batch at the VERY START of `npx playwright test`.
 *
 * Why: the AIOps datastore flush is a fixed ~5-minute floor before traps show in Trap Explorer. By
 * firing here (t=0) and only VERIFYING later (when TrapPropagation runs, minutes into the suite),
 * the flush overlaps the rest of the run — so it adds ~0 wall-clock instead of a blocking 5-min wait.
 *
 * It ONLY sends (no verification, no waiting). It records what it fired to a temp file that the
 * propagation spec reads and that global-trap-teardown cleans up. Disable with TRAP_FIRE=0.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fireBatch } from './trap-sender.js';
import { TRAP_BATCH, V3_USER, assertTrapEnv } from './trap-fixtures.js';

// Fixed temp path shared with the spec + teardown (NOT in the project tree).
export const TRAP_STATE_FILE = path.join(os.tmpdir(), 'pw-trap-fired.json');

export default async function globalTrapSetup() {
  if (process.env.TRAP_FIRE === '0') { console.log('[trap globalSetup] TRAP_FIRE=0 — skipping early fire'); return; }
  try {
    assertTrapEnv();
    const canV3 = Boolean(V3_USER);
    // Fire ALL propagation fixtures in one burst (no wait). v3 skipped unless a v3 listener is set.
    const { sentAt, created } = await fireBatch(TRAP_BATCH, `gs${Date.now().toString(36)}`, (fx) => !fx.requiresV3 || canV3);
    fs.writeFileSync(TRAP_STATE_FILE, JSON.stringify({ sentAt, created }));
    console.log(`[trap globalSetup] fired ${created.length} traps at suite start — the ~5-min flush now overlaps the rest of the run`);
  } catch (e) {
    // Never fail the whole run because the early-fire couldn't happen; the spec has an inline fallback.
    console.warn('[trap globalSetup] early trap fire skipped: ' + e.message);
  }
}
