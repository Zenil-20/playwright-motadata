/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * GLOBAL flow teardown — stops + deletes the generator profiles created by global-flow-setup and
 * removes the temp state file. Never throws (teardown must not fail the run).
 *
 * This matters more here than for traps: a leftover flow profile keeps GENERATING traffic against a
 * shared server, where a leftover trap profile had already fired its single trap.
 *
 * Author  : Zenil Kapadia
 * Created : 11 August 2026
 */
import fs from 'fs';
import { cleanupAll } from './flow-sender.js';
import { FLOW_STATE_FILE } from './global-flow-setup.js';

export default async function globalFlowTeardown() {
  try {
    if (!fs.existsSync(FLOW_STATE_FILE)) return;
    const state = JSON.parse(fs.readFileSync(FLOW_STATE_FILE, 'utf-8'));

    /*
     * OWNERSHIP CHECK — do not tear down another run's traffic.
     *
     * The state file sits at a fixed temp path so worker processes can read it, which also means a
     * SECOND concurrent run sees the FIRST run's file. Without this guard the second run's teardown
     * stops and deletes generator profiles the first run is still verifying against, and the first run
     * then fails with what looks like a product-side ingest failure. That is not hypothetical — it was
     * observed while validating this suite.
     *
     * globalSetup and globalTeardown share a process, so a pid match proves ownership. A file with no
     * pid predates this guard and is treated as ours (nothing else could have written it).
     */
    if (state.pid && state.pid !== process.pid) {
      console.warn(`[flow globalTeardown] state file belongs to another run (pid ${state.pid}, we are ` +
        `${process.pid}) — leaving its generator profiles and the file alone. If that run is dead, its ` +
        `profiles are bounded by max_flows and have already stopped sending; delete them in the ` +
        `generator UI if they linger.`);
      return;
    }

    const started = state.started || [];
    await cleanupAll(started);
    fs.unlinkSync(FLOW_STATE_FILE);
    console.log(`[flow globalTeardown] stopped + deleted ${started.length} generator profiles`);
  } catch (e) {
    console.warn('[flow globalTeardown] ' + e.message);
  }
}
