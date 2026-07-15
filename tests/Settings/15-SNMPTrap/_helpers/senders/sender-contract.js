/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Trap-sender ADAPTER CONTRACT.
 *
 * The trap suite must not be coupled to any one trap generator. Today we use NetForge; if it is
 * stopped/unsupported tomorrow, migrating must be a config change, not a code rewrite. Every sender
 * implements this contract, and specs obtain one via getSender() (see ../trap-sender.js) — they
 * NEVER call a specific tool directly.
 *
 * A TrapSender implements:
 *   name                : string                          // e.g. 'netforge'
 *   reachable()         : Promise<boolean>                // health check; suite fails fast if false
 *   fire(fixture, tag)  : Promise<handle>                 // send ONE trap; returns an opaque cleanup handle
 *   cleanup(handles)    : Promise<void>                   // best-effort teardown; must never throw
 *
 * `fixture` shape (from trap-fixtures.TRAP_BATCH):
 *   { key, templateId, oid, version, community? }
 * `tag` is a unique per-run token to namespace anything the sender creates.
 * `handle` is opaque to the caller (the sender's own bookkeeping, e.g. { id }).
 *
 * To add a sender: create ./<tool>.js exporting a factory returning an object with these methods,
 * register it in ../trap-sender.js SENDERS map, and set TRAP_SENDER=<tool> in .env.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */
export const TRAP_SENDER_METHODS = ['reachable', 'fire', 'cleanup'];

/** Throws if an object doesn't satisfy the contract — used by the factory to fail loud on a bad adapter. */
export function assertSender(sender) {
  for (const m of TRAP_SENDER_METHODS) {
    if (typeof sender[m] !== 'function') {
      throw new Error(`[trap-sender] adapter '${sender.name}' is missing required method ${m}()`);
    }
  }
  return sender;
}
