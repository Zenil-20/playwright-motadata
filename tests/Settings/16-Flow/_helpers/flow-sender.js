/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Flow-generator FACADE + FACTORY.
 *
 * Specs call getGenerator()/startBatch()/startOne()/cleanupAll() and never touch a specific tool.
 * The concrete generator is chosen by env `FLOW_GENERATOR` (default 'netforge'). To migrate: add an
 * adapter under ./senders/ implementing the contract, register it in GENERATORS, set FLOW_GENERATOR —
 * NO spec changes.
 *
 * Author  : Zenil Kapadia
 * Created : 11 August 2026
 */
import { createNetForgeFlowGenerator } from './senders/netforge-flow.js';

const GENERATORS = {
  netforge: createNetForgeFlowGenerator,
};

let _gen = null;

/** The active flow generator (chosen by env, cached). Fails loud on an unknown name. */
export function getGenerator() {
  if (_gen) return _gen;
  const name = (process.env.FLOW_GENERATOR || 'netforge').toLowerCase();
  const factory = GENERATORS[name];
  if (!factory) {
    throw new Error(`[flow-sender] unknown FLOW_GENERATOR='${name}'. Known: ${Object.keys(GENERATORS).join(', ')}`);
  }
  _gen = factory();
  return _gen;
}

export const generatorName = () => getGenerator().name;
export const generatorReachable = () => getGenerator().reachable();
/** Protocols the generator can actually emit — used to SKIP a matrix row honestly, not fail it. */
export const supportedProtocols = () => getGenerator().protocols();

/**
 * Start a whole batch of traffic profiles in one burst (no waiting) and return their handles.
 * @param {Array} batch     rows built by flow-fixtures.pinnedConversation
 * @param {string} runToken unique per-run token (namespaces everything the generator creates)
 * @param {(fx)=>boolean} [filter]
 */
export async function startBatch(batch, runToken, filter = () => true) {
  const gen = getGenerator();
  const started = [];
  for (const fx of batch) {
    if (!filter(fx)) continue;
    started.push(await gen.start(fx, runToken));
  }
  return { startedAt: Date.now(), started };
}

/** Start a single traffic profile. */
export async function startOne(fixture, runToken) {
  const handle = await getGenerator().start(fixture, runToken);
  return { startedAt: Date.now(), handle };
}

/** What the generator believes it emitted — the independent ground truth for volume assertions. */
export const sendStats = (handle) => getGenerator().stats(handle);
/** Block until a bounded burst has finished emitting, so totals are final before we assert them. */
export const waitUntilSent = (handle, opts) => getGenerator().waitUntilSent(handle, opts);

/** Best-effort teardown of everything we created. Never throws (teardown must not fail a test). */
export async function cleanupAll(handles) {
  await getGenerator().cleanup((handles || []).filter(Boolean));
}
export async function cleanupOne(handle) {
  if (handle) await getGenerator().cleanup([handle]);
}
