/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * AGGREGATED globalSetup.
 *
 * Playwright supports exactly ONE globalSetup entry, but more than one suite needs to act at t=0:
 *
 *   - SNMP trap : fire the trap batch early so the fixed ~5-min datastore flush overlaps the run.
 *   - Flow      : start the flow batch early so the ~5-min aggregation window overlaps the run.
 *
 * Both exist for the same reason — a product-imposed ingest latency that cannot be shortened, only
 * hidden behind other work. Adding a second suite's setup here is the supported way to keep both.
 *
 * Each step is independently guarded: one suite's environment being unconfigured must never stop the
 * other from firing, and neither may fail the whole run (both specs have inline fallbacks that pay the
 * wait themselves). Errors are logged, never thrown.
 *
 * Author  : Zenil Kapadia
 * Created : 11 August 2026
 */
import globalTrapSetup from '../Settings/15-SNMPTrap/_helpers/global-trap-setup.js';
import globalFlowSetup from '../Settings/16-Flow/_helpers/global-flow-setup.js';

export default async function globalSetup(config) {
  for (const [name, fn] of [['trap', globalTrapSetup], ['flow', globalFlowSetup]]) {
    try {
      await fn(config);
    } catch (e) {
      // A globalSetup throw aborts the ENTIRE run. These steps are optimisations, not prerequisites,
      // so they must never have that power.
      console.warn(`[globalSetup] ${name} setup failed (continuing): ${e.message}`);
    }
  }
}
