/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Trap-sender FACADE + FACTORY.
 *
 * Specs call getSender()/fireBatch()/fireOne() and never touch a specific tool. The concrete sender
 * is chosen by env `TRAP_SENDER` (default 'netforge'). To migrate to another generator: add an
 * adapter under ./senders/ implementing the contract, register it in SENDERS, and set TRAP_SENDER —
 * NO spec changes. (Your requirement: "if NetForge is stopped/unsupported we should easily migrate.")
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */
import { createNetForgeSender } from './senders/netforge.js';

// Registry of available senders. Add new tools here (e.g. snmptrap: createSnmpTrapCliSender).
const SENDERS = {
  netforge: createNetForgeSender,
};

let _sender = null;

/** The active trap sender (chosen by env TRAP_SENDER, cached). Fails loud on an unknown name. */
export function getSender() {
  if (_sender) return _sender;
  const name = (process.env.TRAP_SENDER || 'netforge').toLowerCase();
  const factory = SENDERS[name];
  if (!factory) {
    throw new Error(`[trap-sender] unknown TRAP_SENDER='${name}'. Known: ${Object.keys(SENDERS).join(', ')}`);
  }
  _sender = factory();
  return _sender;
}

export const senderName = () => getSender().name;

/** Health check on the active sender. (Kept the old name too for back-compat with existing specs.) */
export const senderReachable = () => getSender().reachable();
export const netforgeReachable = senderReachable;

/**
 * Fire a whole batch of traps in one burst (no wait) and return their cleanup handles + burst time.
 * @param {Array} batch   rows from trap-fixtures.TRAP_BATCH
 * @param {string} runToken unique per-run token
 * @param {(fx)=>boolean} [filter]
 */
export async function fireBatch(batch, runToken, filter = () => true) {
  const sender = getSender();
  const created = [];
  for (const fx of batch) {
    if (!filter(fx)) continue;
    created.push(await sender.fire(fx, runToken));
  }
  return { sentAt: Date.now(), created };
}

/** Fire a single trap (live-viewer / create-policy->alert tests). Returns { sentAt, handle }. */
export async function fireOne(fixture, runToken) {
  const handle = await getSender().fire(fixture, runToken);
  return { sentAt: Date.now(), handle };
}

/** Best-effort teardown of everything the sender created. Never throws. */
export async function cleanupBatch(created) {
  await getSender().cleanup(created || []);
}
export async function cleanupOne(handle) {
  if (handle) await getSender().cleanup([handle]);
}
