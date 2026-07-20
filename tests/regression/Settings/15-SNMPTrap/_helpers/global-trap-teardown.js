/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * GLOBAL trap teardown — deletes the NetForge sender profiles created by global-trap-setup and
 * removes the temp state file. Never throws (teardown must not fail the run).
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */
import fs from 'fs';
import { cleanupBatch } from './trap-sender.js';
import { TRAP_STATE_FILE } from './global-trap-setup.js';

export default async function globalTrapTeardown() {
  try {
    if (!fs.existsSync(TRAP_STATE_FILE)) return;
    const { created } = JSON.parse(fs.readFileSync(TRAP_STATE_FILE, 'utf-8'));
    await cleanupBatch(created);
    fs.unlinkSync(TRAP_STATE_FILE);
  } catch (e) {
    console.warn('[trap globalTeardown] ' + e.message);
  }
}
