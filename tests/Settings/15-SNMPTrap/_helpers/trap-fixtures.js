/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * SNMP Trap test fixtures + environment config.
 *
 * This module is the SINGLE source of truth for:
 *   - where the AIOps trap server + the NetForge sender live (from .env),
 *   - the trap "batch" every propagation test fires (one row per scenario), grounded in the
 *     14 real NetForge templates (see memory: project_trap_harness / project_trap_flow).
 *
 * Design rationale (see the harness plan): the AIOps datastore flushes traps to Trap Explorer on
 * a FIXED ~5-minute window that cannot be shortened. So propagation tests fire ONE batch of
 * distinct traps, wait ONCE, and verify them all — never one 5-min wait per scenario.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

/**
 * Extract the bare host from a URL/host string.
 * NetForge trap `targets` are "host:port" (NOT a URL), so we need the AIOps host without scheme.
 * e.g. "https://172.16.15.151/" -> "172.16.15.151"
 */
function hostOf(urlOrHost) {
  if (!urlOrHost) return '';
  return String(urlOrHost).replace(/^\w+:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
}

/** AIOps trap server (writable) — reuses the standard .env AIOps creds/URL. */
export const AIOPS_URL = (process.env.Motadata_Aiops || '').replace(/\/+$/, '');
export const AIOPS_HOST = hostOf(AIOPS_URL);

/** NetForge sender + listener wiring — the 6 trap-specific keys the user added to .env. */
export const NETFORGE_URL = (process.env.NETFORGE_URL || 'http://172.16.12.36:8080').replace(/\/+$/, '');
export const LISTENER_PORT = process.env.TRAP_LISTENER_PORT || '1620'; // NetForge existing profiles target :1620, not 162
export const LISTENER_COMMUNITY = process.env.TRAP_LISTENER_COMMUNITY || 'public';
export const V3_USER = process.env.TRAP_V3_USER || '';
export const V3_SECURITY_LEVEL = process.env.TRAP_V3_SECURITY_LEVEL || ''; // authPriv | authNoPriv | noAuthNoPriv
export const FORWARDER_DEST = process.env.TRAP_FORWARDER_DEST || ''; // "host:162"

/** Where NetForge must aim its traps so THIS AIOps listener receives them. */
export const TRAP_TARGET = `${AIOPS_HOST}:${LISTENER_PORT}`;

/**
 * NetForge is the trap SOURCE for every trap we generate. Trap Explorer shows this exact IP in
 * its SOURCE column (verified live on .68). Because ALL NetForge traps share this source, tests
 * must key determinism on (distinct trap OID + a recent timestamp window) — NOT on source alone.
 */
export const NETFORGE_SOURCE = hostOf(NETFORGE_URL);

/**
 * The propagation batch. Each row is one distinct trap, grounded in a real NetForge template so
 * its `oid` is what Trap Explorer will show in the TRAP OID column.
 *
 *   templateId  : NetForge built-in template id (POST /api/trap-profiles { template_id })
 *   version     : v1 | v2c | v3  (v3 requires a v3 listener configured with V3_USER)
 *   oid         : the trap OID this template emits — the primary verify key in Trap Explorer
 *   dimension   : which scenario-matrix dimension this fixture exercises
 *   expectPolicyAlert : true if a Trap Policy is set up to match this trap → expect an alert
 */
export const TRAP_BATCH = [
  { key: 'link-down-v2c', templateId: 'link-down', version: 'v2c', oid: '.1.3.6.1.6.3.1.1.5.3', dimension: 'positive/arrival' },
  { key: 'link-up-v2c', templateId: 'link-up', version: 'v2c', oid: '.1.3.6.1.6.3.1.1.5.4', dimension: 'positive/translated-name' },
  { key: 'bgp-established', templateId: 'bgp-established', version: 'v2c', oid: '.1.3.6.1.2.1.15.0.1', dimension: 'vendor-oid/forwarder' },
  { key: 'cpu-threshold', templateId: 'cpu-threshold', version: 'v2c', oid: '.1.3.6.1.4.1.9.9.9.109.0.1', dimension: 'policy/varbind-match', expectPolicyAlert: true },
  // v3 requires a v3 listener + security user; skipped unless TRAP_V3_USER is set.
  { key: 'cold-start-v3', templateId: 'cold-start', version: 'v3', oid: '.1.3.6.1.6.3.1.1.5.1', dimension: 'protocol/v3', requiresV3: true },
  // NOTE: SNMP v1 delivery to this environment's listener was NOT observed (a v1 cold-start never
  // surfaced in Trap Explorer while all v2c traps did). v1 coverage is deferred pending an env check
  // of the listener's v1 handling — kept out of the asserted batch so the E2E stays deterministic.
];

/* ============================================================================================
 * ROUTING MATRIX — version <-> port binding (TrapRouting.spec.js)
 *
 * Regression target: a build where the listener bound v1/v2c to port P1 and v3 to P2, but traps
 * sent v2c->P2 or v3->P1 were silently DROPPED with no error. The suite creates ONE combined
 * listener (v1/v2c on ROUTING_PORT_V2C + v3 on ROUTING_PORT_V3) and fires every version/port
 * combination, asserting deliver/drop via the REAL-TIME Live Trap Viewer (no 5-min flush).
 * ============================================================================================ */

/** Ports for the combined routing listener (user-specified; overridable via .env). */
export const ROUTING_PORT_V2C = process.env.TRAP_ROUTING_PORT_V2C || '1769';
export const ROUTING_PORT_V3 = process.env.TRAP_ROUTING_PORT_V3 || '1780';
/** A port NO listener binds — traps aimed here must never surface anywhere. */
export const ROUTING_PORT_UNBOUND = process.env.TRAP_ROUTING_PORT_UNBOUND || '1799';

/**
 * TEST-OWNED SNMP v3 credentials. No env/site creds exist for v3 — the test creates the Motadata
 * listener AND configures NetForge with the SAME values, so auth always matches by construction.
 * (Passwords > 8 chars per SNMPv3 spec + user requirement.)
 */
export const ROUTING_V3 = {
  username: 'pwtrapv3',
  securityLevel: 'authPriv',
  authProtocol: 'sha', // NetForge accepts sha|sha256|none; Motadata UI label 'SHA'
  authPassword: 'TrapAuth2026!',
  privProtocol: 'aes', // NetForge accepts aes|none; Motadata UI label 'AES'
  privPassword: 'TrapPriv2026!',
};
/** Deliberately-wrong v3 creds (same user, wrong passwords) for the auth-failure combo. */
export const ROUTING_V3_BAD = { ...ROUTING_V3, authPassword: 'WrongAuth2026!', privPassword: 'WrongPriv2026!' };

/**
 * The full version<->port combination matrix. Every row uses a DISTINCT NetForge template (OIDs
 * grounded via GET /api/trap-templates, 2026-07-08) that no other suite fires, so the Live Viewer
 * can attribute each row unambiguously — critical for the DROP assertions, where seeing the OID
 * at all means the bug regressed.
 *
 *   port    : which routing port to aim at ('v2c' | 'v3' | 'unbound' — resolved by the spec)
 *   expect  : 'deliver' (must appear in Live Viewer) | 'drop' (must NEVER appear)
 */
export const ROUTING_MATRIX = [
  // -------- positive: version matches the port binding --------
  { key: 'v2c-to-v2cport', templateId: 'auth-failure', oid: '.1.3.6.1.6.3.1.1.5.5', version: 'v2c', port: 'v2c', expect: 'deliver', why: 'v2c on the v1/v2c port — baseline positive' },
  // KNOWN ISSUE (pinned 2026-07-08, ATTRIBUTED): the defect is NETFORGE'S v1 SEND PATH, not
  // Motadata. Proof: a v1 ColdStart sent manually from an independent desktop trap sender arrived
  // in Trap Explorer with VERSION=v1 (2026-07-08 10:30 AM) — Motadata v1 ingestion works. NetForge
  // v1 sends (template mode AND custom mode) never arrive. Pinned as 'drop' so the suite ALARMS
  // (drop-assert fails) if a NetForge fix ever lands — then flip this row back to expect:'deliver'.
  { key: 'v1-to-v2cport', templateId: 'memory-threshold', oid: '.1.3.6.1.4.1.9.9.9.48.0.1', version: 'v1', port: 'v2c', expect: 'drop', knownIssue: true, why: 'v1 on the v1/v2c port SHOULD deliver; Motadata v1 ingestion is verified working (manual sender) — NetForge v1 sending is the broken link (an arrival here means NetForge got fixed: promote to deliver)' },
  { key: 'v3-to-v3port', templateId: 'bgp-backward-transition', oid: '.1.3.6.1.2.1.15.0.2', version: 'v3', port: 'v3', v3: 'good', expect: 'deliver', why: 'v3 with matching creds on the v3 port — baseline positive' },
  // -------- THE regression: version <-> port mismatch must drop --------
  { key: 'v2c-to-v3port', templateId: 'power-supply-failure', oid: '.1.3.6.1.4.1.9.9.9.13.0.1', version: 'v2c', port: 'v3', expect: 'drop', why: 'v2c aimed at the v3 port — the reported bug direction #1' },
  { key: 'v3-to-v2cport', templateId: 'fan-failure', oid: '.1.3.6.1.4.1.9.9.9.13.0.2', version: 'v3', v3: 'good', port: 'v2c', expect: 'drop', why: 'v3 aimed at the v1/v2c port — the reported bug direction #2' },
  // -------- security negatives --------
  { key: 'v2c-wrong-community', templateId: 'temperature-high', oid: '.1.3.6.1.4.1.9.9.9.91.0.1', version: 'v2c', community: 'pw-wrong-community', port: 'v2c', expect: 'drop', why: 'community mismatch must be rejected (if it DELIVERS, that is a security finding)' },
  { key: 'v3-wrong-creds', templateId: 'ospf-nbr-state-change', oid: '.1.3.6.1.2.1.14.16.2.2', version: 'v3', v3: 'bad', port: 'v3', expect: 'drop', why: 'v3 auth/priv password mismatch must fail SNMPv3 authentication' },
  // -------- routing negative --------
  { key: 'v2c-to-unbound', templateId: 'interface-utilization', oid: '.1.3.6.1.4.1.99999.1.1', version: 'v2c', port: 'unbound', expect: 'drop', why: 'no listener on the port — nothing may surface' },
];

/**
 * Assert the environment is wired before a trap test runs. Fail LOUD with a precise message rather
 * than letting a test flake against a half-configured env (senior-SDET: state must be known).
 */
export function assertTrapEnv() {
  const missing = [];
  if (!AIOPS_URL) missing.push('Motadata_Aiops');
  if (!NETFORGE_URL) missing.push('NETFORGE_URL');
  if (!LISTENER_PORT) missing.push('TRAP_LISTENER_PORT');
  if (missing.length) {
    throw new Error(`[trap-fixtures] missing required .env keys: ${missing.join(', ')}. ` +
      `Trap tests need the AIOps URL + NetForge URL + listener port.`);
  }
}
