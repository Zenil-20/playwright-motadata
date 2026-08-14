/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * NetForge FLOW adapter — implements the FlowGenerator contract (./sender-contract.js).
 *
 * NetForge (the traffic generator on NETFORGE_URL) exposes a JSON REST API. Endpoints and payload
 * shape were extracted from its shipped bundle and CONFIRMED by live read-back (2026-08-11):
 *   GET    /api/health
 *   GET    /api/protocols                  -> netflow5 | netflow9 | ipfix | sflow (all supported:true)
 *   GET    /api/nbar-apps                  -> {categories[], presets[{ports,protocol,application,category,weight}]}
 *   GET    /api/profiles                   -> list (each with a live `stats` block)
 *   POST   /api/profiles                   -> create (payload below)
 *   GET    /api/profiles/{id}              -> read back (+ stats)
 *   POST   /api/profiles/{id}/start|/stop
 *   DELETE /api/profiles/{id}
 *
 * Create payload (verified to PERSIST exactly as sent — every field below survived read-back):
 *   { name, tags[], protocol, target:{name,address,weight}, additional_targets[],
 *     mode:'generate'|'pcap', flows_per_second, max_flows,
 *     source_ip|dest_ip:{mode:'single'|'range'|'random', values[]},
 *     source_port|dest_port:{mode:'single',values[]} | {mode:'range',min,max},
 *     protocol_mix:{tcp,udp,icmp}, interfaces:{count},
 *     counters:{bytes_min,bytes_max,packets_min,packets_max},
 *     vlan:{enabled,min,max}, as_config:{enabled,source_as[],dest_as[]},
 *     tos:{enabled,values[]}, nbar:{enabled,mappings[{ports[],protocol,application,weight}]} }
 *
 * !! SHARED-RESOURCE DISCIPLINE !!
 * This NetForge instance is used by the whole team — 23 profiles existed when the suite was built,
 * several running at up to 20 000 flows/sec. Therefore this adapter:
 *   - only ever creates profiles named `pw-flow-*`,
 *   - only ever starts/stops/deletes profiles IT created (by id, from its own handles),
 *   - NEVER enumerates-and-cleans by prefix (the trap suite's stale-listener sweep is unsafe here:
 *     a name collision would stop somebody else's load test),
 *   - always sets max_flows, so a crashed run stops generating on its own instead of flooding a
 *     server indefinitely.
 *
 * Author  : Zenil Kapadia
 * Created : 11 August 2026
 */
import { NETFORGE_URL } from '../flow-fixtures.js';
import { assertGenerator } from './sender-contract.js';

async function nf(method, apiPath, body) {
  const res = await fetch(`${NETFORGE_URL}${apiPath}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`[NetForge] ${method} ${apiPath} -> HTTP ${res.status}: ${text.slice(0, 300)}`);
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

/**
 * Peak counters observed per profile id, kept because THE GENERATOR DESTROYS THEM ON COMPLETION.
 *
 * Measured lifecycle (2026-08-11):
 *   after create      state=idle     stats absent
 *   during the burst  state=running  stats present and climbing (flows 50 -> 370 ...)
 *   after completion  state=idle     stats ABSENT AGAIN — every counter is gone
 *
 * So the ground truth this whole suite relies on exists ONLY while the burst is in flight. Reading it
 * after waiting for completion returns zeros, which is exactly how "the generator should have emitted
 * 5000 flows but reports 0" happened. Counters are therefore sampled DURING the run and the peak is
 * cached here, so a later assertion still has a real number to compare against.
 */
const PEAK = new Map();

/** Merge a live stats snapshot into the cached peak for a profile (counters only ever increase). */
function recordPeak(id, s) {
  if (!s) return;
  const prev = PEAK.get(id) || { flows: 0, packets: 0, bytes: 0, errors: 0 };
  PEAK.set(id, {
    flows: Math.max(prev.flows, s.flows_generated ?? 0),
    packets: Math.max(prev.packets, s.packets_generated ?? 0),
    bytes: Math.max(prev.bytes, s.bytes_generated ?? 0),
    errors: Math.max(prev.errors, s.errors_generated ?? 0),
  });
}

/** Factory: a FlowGenerator bound to the env-configured NetForge. */
export function createNetForgeFlowGenerator() {
  return assertGenerator({
    name: 'netforge',

    async reachable() {
      try { await nf('GET', '/api/health'); return true; } catch { return false; }
    },

    /** Protocols this generator can emit — used to skip a matrix row rather than fail it. */
    async protocols() {
      try {
        return (await nf('GET', '/api/protocols')).filter((p) => p.supported).map((p) => p.id);
      } catch { return []; }
    },

    /** NBAR presets (port -> application/category), for driving application-breakdown assertions. */
    async nbarPresets() {
      try { return (await nf('GET', '/api/nbar-apps')).presets || []; } catch { return []; }
    },

    /**
     * Create + START one traffic profile for `fixture` (built by flow-fixtures.pinnedConversation).
     * Returns a handle carrying everything a later assertion or teardown needs.
     */
    async start(fixture, tag) {
      const body = {
        name: `pw-flow-${fixture.key}-${tag}`,
        tags: ['playwright', tag],
        protocol: fixture.protocol || 'netflow5',
        target: { name: 'default', address: fixture.target, weight: 1 },
        mode: 'generate',
        flows_per_second: fixture.flowsPerSecond || 20,
        // ALWAYS bounded: an unbounded profile left running by a crashed test would keep hammering a
        // shared server forever. This is a safety invariant, not a tuning knob.
        max_flows: fixture.maxFlows || 600,
        ...(fixture.payload || {}),
      };
      // Optional NBAR application tagging (drives "Volume Bytes by Application" style breakdowns).
      if (fixture.nbar && fixture.nbar.length) {
        body.nbar = { enabled: true, mappings: fixture.nbar };
      }
      if (fixture.asConfig) body.as_config = { enabled: true, ...fixture.asConfig };

      const profile = await nf('POST', '/api/profiles', body);
      const id = profile && (profile.id || profile.ID);
      if (!id) throw new Error(`[NetForge] create returned no id: ${JSON.stringify(profile)}`);

      // READ BACK before starting. The trap suite was burned by a payload that was accepted, stored,
      // and then silently not emitted (template mode dropping custom varbinds). Never assume the
      // wire will carry what we asked for — assert the generator kept it.
      const stored = await nf('GET', `/api/profiles/${id}`);
      const drift = [];
      if (stored.protocol !== body.protocol) drift.push(`protocol ${body.protocol}->${stored.protocol}`);
      if (stored.flows_per_second !== body.flows_per_second) drift.push(`fps ${body.flows_per_second}->${stored.flows_per_second}`);
      if (stored.max_flows !== body.max_flows) drift.push(`max_flows ${body.max_flows}->${stored.max_flows}`);
      if (body.counters && JSON.stringify(stored.counters) !== JSON.stringify(body.counters)) {
        drift.push(`counters ${JSON.stringify(body.counters)}->${JSON.stringify(stored.counters)}`);
      }
      if (drift.length) {
        // Clean up the useless profile before failing, so a rejected payload leaves nothing behind.
        await nf('DELETE', `/api/profiles/${id}`).catch(() => {});
        throw new Error(`[NetForge] profile did not persist as sent (${drift.join('; ')}) — ` +
          `an assertion on exact volume would be meaningless, so failing here instead.`);
      }

      await nf('POST', `/api/profiles/${id}/start`);
      return {
        id,
        key: fixture.key,
        name: body.name,
        protocol: body.protocol,
        target: fixture.target,
        startedAt: Date.now(),
        expectedBytes: fixture.expectedBytes,
        expectedPackets: fixture.expectedPackets,
        srcIp: fixture.srcIp,
        dstIp: fixture.dstIp,
        dstPort: fixture.dstPort,
      };
    },

    /**
     * What the generator believes it actually put on the wire. This is the INDEPENDENT ground truth
     * that lets a UI mismatch be attributed rather than merely observed.
     */
    /**
     * Current counters, falling back to the cached peak once the generator has wiped them.
     *
     * MUST read the LIST endpoint: GET /api/profiles/{id} returns the profile WITHOUT its `stats` block
     * (verified live — the detail response carries only config + state, so a detail-based reader
     * silently reports every counter as undefined). The list response embeds live stats per profile.
     *
     * `peak` is what callers should assert on: `flows`/`bytes` here are the LIVE values, which are zero
     * once the burst has finished. `fromPeak` says which one you got.
     */
    async stats(handle) {
      const all = await nf('GET', '/api/profiles');
      const p = (Array.isArray(all) ? all : []).find((x) => (x.id || x.ID) === handle.id);
      if (p && p.stats) recordPeak(handle.id, p.stats);
      const peak = PEAK.get(handle.id) || { flows: 0, packets: 0, bytes: 0, errors: 0 };
      if (!p) {
        // Profile gone (deleted elsewhere) — the cached peak is all we have left.
        return { ...peak, running: false, missing: true, fromPeak: true };
      }
      const s = p.stats;
      const running = p.state === 'running';
      if (!s) return { ...peak, running, fromPeak: true };
      return {
        flows: Math.max(s.flows_generated ?? 0, peak.flows),
        packets: Math.max(s.packets_generated ?? 0, peak.packets),
        bytes: Math.max(s.bytes_generated ?? 0, peak.bytes),
        errors: Math.max(s.errors_generated ?? 0, peak.errors),
        running,
        fromPeak: false,
      };
    },

    /**
     * Sample the burst to completion and return its FINAL counters.
     *
     * Polls fast (500ms) because the counters are destroyed as soon as the profile returns to 'idle' —
     * a slow poll can miss the entire run of a short burst. Completion is only concluded after the
     * profile has been SEEN running, so the poll cannot mistake the brief idle window right after
     * /start for "already finished" (the earlier bug returned zeros for exactly that reason).
     *
     * Falls back to no-progress detection so a profile that never enters 'running' still terminates.
     */
    async waitUntilSent(handle, { timeoutMs = 180000, pollMs = 500 } = {}) {
      const deadline = Date.now() + timeoutMs;
      let sawRunning = false;
      let idleStreak = 0;
      let lastFlows = -1;
      let stagnant = 0;

      while (Date.now() < deadline) {
        const s = await this.stats(handle).catch(() => null);
        if (s) {
          if (s.running) { sawRunning = true; idleStreak = 0; }
          else idleStreak++;

          // Progress watchdog: if the burst never starts and never counts, stop rather than hang.
          if (s.flows === lastFlows) stagnant++; else { stagnant = 0; lastFlows = s.flows; }

          // Done = we watched it run and it has now been idle for a few consecutive polls.
          if (sawRunning && idleStreak >= 3) break;
          // Never ran and nothing is counting after ~15s — give up and report what we have.
          if (!sawRunning && stagnant > 30) break;
        }
        await new Promise((r) => setTimeout(r, pollMs));
      }

      const peak = PEAK.get(handle.id) || { flows: 0, packets: 0, bytes: 0, errors: 0 };
      return { ...peak, running: false, sawRunning, fromPeak: true };
    },

    /** Stop + delete ONLY the profiles we created (by id). Never throws. */
    async cleanup(handles) {
      for (const h of handles || []) {
        if (!h || !h.id) continue;
        await nf('POST', `/api/profiles/${h.id}/stop`).catch(() => {});
        await nf('DELETE', `/api/profiles/${h.id}`).catch(() => {});
      }
    },
  });
}
