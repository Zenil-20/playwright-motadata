/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * AGGREGATED globalTeardown — the counterpart to fixtures/global-setup.js.
 *
 * Both steps ALWAYS run, even if one throws: leaving generator state behind is worse than a noisy log.
 * That matters most for flow, where an orphaned profile keeps GENERATING traffic against a shared
 * server (a leftover trap profile had already fired its single trap and was merely untidy).
 *
 * Author  : Zenil Kapadia
 * Created : 11 August 2026
 */
import globalTrapTeardown from '../Settings/15-SNMPTrap/_helpers/global-trap-teardown.js';
import globalFlowTeardown from '../Settings/16-Flow/_helpers/global-flow-teardown.js';

export default async function globalTeardown(config) {
  for (const [name, fn] of [['trap', globalTrapTeardown], ['flow', globalFlowTeardown]]) {
    try {
      await fn(config);
    } catch (e) {
      console.warn(`[globalTeardown] ${name} teardown failed: ${e.message}`);
    }
  }
}
