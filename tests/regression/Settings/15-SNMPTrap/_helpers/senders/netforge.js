/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * NetForge trap-sender adapter — implements the TrapSender contract (./sender-contract.js).
 *
 * NetForge (the Network Traffic Generator on NETFORGE_URL) exposes a JSON REST API:
 *   GET    /api/health
 *   POST   /api/trap-profiles                 {name, version, community, targets:["host:port"], template_id, traps_per_second, max_traps}
 *   POST   /api/trap-profiles/{id}/start | /stop
 *   DELETE /api/trap-profiles/{id}
 *
 * All wiring (URL, target host:port, community) comes from env via trap-fixtures — nothing is
 * hard-coded here, so pointing at a different NetForge or listener is a .env change.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */
import { NETFORGE_URL, TRAP_TARGET, LISTENER_COMMUNITY } from '../trap-fixtures.js';
import { assertSender } from './sender-contract.js';

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

/** Factory: returns a TrapSender bound to the env-configured NetForge + target listener. */
export function createNetForgeSender() {
  return assertSender({
    name: 'netforge',

    async reachable() {
      try { await nf('GET', '/api/health'); return true; } catch { return false; }
    },

    /**
     * Fire ONE trap for `fixture` and return a cleanup handle. We create a short-lived, single-shot
     * NetForge profile (max_traps:1) aimed at the configured listener, then start it.
     *
     * Fixture fields honoured (all optional except templateId):
     *   version   'v1' | 'v2c' | 'v3'          (default 'v2c')
     *   community string                        (v1/v2c community; default LISTENER_COMMUNITY)
     *   target    'host:port'                   (override the default TRAP_TARGET — used by the
     *                                            routing matrix to aim at 1769 vs 1780 or an unbound port)
     *   varbinds  [{oid,type,value}]            (custom varbinds — overrides the template's; enables
     *                                            varbind-triggered Trap Policy tests, e.g. value:"kapadia")
     *   v3        {username, securityLevel,     (SNMP v3 security params — sent as a NESTED object,
     *              authProtocol, authPassword,   which is the ONLY shape NetForge accepts. Flat v3
     *              privProtocol, privPassword}   fields are rejected with "v3 security parameters required".)
     */
    async fire(fixture, tag) {
      const body = {
        name: `playwright-trap-${fixture.key}-${tag}`,
        version: fixture.version || 'v2c',
        targets: [fixture.target || TRAP_TARGET],
        traps_per_second: 1,
        max_traps: fixture.maxTraps || 1,
      };
      // Two send modes (probed live 2026-07-08):
      //  - template mode: template_id set -> NetForge emits the template's varbinds and IGNORES a
      //    custom `varbinds` array (verified on the wire: the override never arrives).
      //  - custom mode: NO template_id, explicit trap_oid (+ varbinds) -> NetForge emits exactly
      //    these varbinds. REQUIRED whenever a test needs a deterministic varbind value.
      if (fixture.templateId) body.template_id = fixture.templateId;
      else body.trap_oid = fixture.oid;
      // v1/v2c authenticate by community string; v3 authenticates by the nested security block.
      if ((fixture.version || 'v2c') === 'v3') {
        const v = fixture.v3 || {};
        body.v3 = {
          username: v.username,
          security_level: v.securityLevel || 'authPriv',
          auth_protocol: v.authProtocol || 'sha',
          auth_password: v.authPassword,
          priv_protocol: v.privProtocol || 'aes',
          priv_password: v.privPassword,
        };
      } else {
        body.community = fixture.community || LISTENER_COMMUNITY;
      }
      // Custom varbinds override the template's (deterministic run-token / policy-trigger values).
      if (Array.isArray(fixture.varbinds) && fixture.varbinds.length) body.varbinds = fixture.varbinds;

      const profile = await nf('POST', '/api/trap-profiles', body);
      const id = profile && (profile.id || profile.ID);
      if (!id) throw new Error(`[NetForge] create returned no id: ${JSON.stringify(profile)}`);
      await nf('POST', `/api/trap-profiles/${id}/start`);
      return { id, key: fixture.key, oid: fixture.oid };
    },

    /** Stop + delete every profile we created. Never throws (teardown must not fail a test). */
    async cleanup(handles) {
      for (const h of handles || []) {
        await nf('POST', `/api/trap-profiles/${h.id}/stop`).catch(() => {});
        await nf('DELETE', `/api/trap-profiles/${h.id}`).catch(() => {});
      }
    },
  });
}
