/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Flow-generator ADAPTER CONTRACT.
 *
 * The suite must not be coupled to any one traffic generator. Today we use NetForge; if it is
 * stopped or unsupported tomorrow, migrating must be a config change, not a rewrite. Specs obtain a
 * generator via getGenerator() (../flow-sender.js) and NEVER call a specific tool.
 *
 * A FlowGenerator implements:
 *   name                     : string                 // e.g. 'netforge'
 *   reachable()              : Promise<boolean>       // health check; suite fails fast if false
 *   start(fixture, tag)      : Promise<handle>        // create + start ONE traffic profile
 *   stats(handle)            : Promise<SendStats>     // what the generator BELIEVES it sent
 *   cleanup(handles)         : Promise<void>          // best-effort teardown; must never throw
 *
 * SendStats = { flows, packets, bytes, errors, running }
 *
 * `stats()` is the addition the SNMP-trap contract lacks, and it is the whole point of flow testing:
 * it gives an INDEPENDENT ground truth for what was emitted, so a mismatch in the UI can be
 * attributed — generator under-sent vs product under-counted — instead of just "the number is off".
 *
 * To add a generator: create ./<tool>.js exporting a factory that returns these methods, register it
 * in ../flow-sender.js GENERATORS, and set FLOW_GENERATOR=<tool> in .env.
 *
 * Author  : Zenil Kapadia
 * Created : 11 August 2026
 */
export const FLOW_GENERATOR_METHODS = ['reachable', 'start', 'stats', 'cleanup'];

/** Throws if an object doesn't satisfy the contract — fail loud on a bad adapter, not at use-time. */
export function assertGenerator(gen) {
  for (const m of FLOW_GENERATOR_METHODS) {
    if (typeof gen[m] !== 'function') {
      throw new Error(`[flow-sender] adapter '${gen.name}' is missing required method ${m}()`);
    }
  }
  return gen;
}
