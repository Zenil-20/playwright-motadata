#!/usr/bin/env node
/*
 * kg — one-shot MCP tool call against the knowledge-graph servers over raw HTTP+SSE.
 *
 *   node scripts/kg.mjs ui   search_nodes '{"query":"mail-server","mode":"regex","limit":20}'
 *   node scripts/kg.mjs code search_nodes '{"query":"ResponseProcessor","mode":"regex"}'
 *   node scripts/kg.mjs ui   read_source  '{"node_label":"src_..._vue","context_lines":200}'
 *   node scripts/kg.mjs ui   --tools
 *
 * Targets: `code`/`motadata-kg` -> :8821 (backend)   `ui`/`ui-kg` -> :8822 (frontend)
 * Override the host with KG_HOST (default 172.16.9.83).
 *
 * These servers speak the older MCP SSE transport: GET /mcp/sse streams an `endpoint` event
 * carrying a session URL, then JSON-RPC is POSTed there while every response comes back on
 * the SSE stream. Exists so scripts (and a future direct-API authoring backend) can reach the
 * KGs without an MCP-capable client.
 */
const HOST = process.env.KG_HOST || '172.16.9.83';
const PORTS = { code: 8821, 'motadata-kg': 8821, backend: 8821, ui: 8822, 'ui-kg': 8822, frontend: 8822 };

const [targetRaw, toolRaw, argsRaw] = process.argv.slice(2);
const port = PORTS[String(targetRaw || '').toLowerCase()];
if (!port) {
  console.error('usage: node scripts/kg.mjs <ui|code> <tool> \'<jsonArgs>\'   |   <ui|code> --tools');
  process.exit(2);
}
const base = `http://${HOST}:${port}`;
const listOnly = toolRaw === '--tools';
if (!listOnly && !toolRaw) { console.error('missing tool name (or pass --tools)'); process.exit(2); }

let toolArgs = {};
if (!listOnly && argsRaw) {
  try { toolArgs = JSON.parse(argsRaw); } catch (e) { console.error(`args are not valid JSON: ${e.message}`); process.exit(2); }
}

const TIMEOUT_MS = Number(process.env.KG_TIMEOUT_MS) || 45000;
const ctl = new AbortController();
const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);

/* ---- open the SSE stream and demux JSON-RPC responses by id ---- */
const waiters = new Map();          // id -> resolve
let endpointPath = null;
const gotEndpoint = (() => { let r; const p = new Promise((res) => { r = res; }); return { p, set: r }; })();

const streamRes = await fetch(`${base}/mcp/sse`, {
  headers: { Accept: 'text/event-stream' },
  signal: ctl.signal,
});
if (!streamRes.ok || !streamRes.body) { console.error(`SSE open failed: HTTP ${streamRes.status}`); process.exit(1); }

(async () => {
  const dec = new TextDecoder();
  let buf = '';
  try {
    for await (const chunk of streamRes.body) {
      // This server delimits SSE frames with CRLF, so normalise before splitting on a blank line.
      buf = (buf + dec.decode(chunk, { stream: true })).replace(/\r\n/g, '\n');
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const frame = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const ev = /^event:\s*(.+)$/m.exec(frame)?.[1]?.trim();
        const data = frame.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n');
        if (!data) continue;
        if (ev === 'endpoint') { endpointPath = data; gotEndpoint.set(data); continue; }
        let msg; try { msg = JSON.parse(data); } catch { continue; }
        if (msg.id != null && waiters.has(msg.id)) { waiters.get(msg.id)(msg); waiters.delete(msg.id); }
      }
    }
  } catch { /* stream closed / aborted — fine */ }
})();

await gotEndpoint.p;

const rpc = async (id, method, params) => {
  const wait = new Promise((res) => waiters.set(id, res));
  const r = await fetch(base + endpointPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    signal: ctl.signal,
  });
  if (!r.ok && r.status !== 202) throw new Error(`POST ${method} -> HTTP ${r.status}`);
  return wait;
};
const notify = (method, params) => fetch(base + endpointPath, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', method, params }),
  signal: ctl.signal,
});

try {
  await rpc(1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'qa-pipeline-kg', version: '1.0.0' },
  });
  await notify('notifications/initialized', {});

  if (listOnly) {
    const res = await rpc(2, 'tools/list', {});
    for (const t of res.result?.tools || []) {
      console.log(`${t.name.padEnd(26)} ${(t.description || '').split('\n')[0].slice(0, 110)}`);
    }
  } else {
    const res = await rpc(2, 'tools/call', { name: toolRaw, arguments: toolArgs });
    if (res.error) { console.error(`tool error: ${res.error.message}`); process.exitCode = 1; }
    else {
      for (const c of res.result?.content || []) {
        if (c.type === 'text') console.log(c.text);
        else console.log(JSON.stringify(c));
      }
      if (res.result?.isError) process.exitCode = 1;
    }
  }
} catch (e) {
  console.error(`kg failed: ${e.name === 'AbortError' ? `timed out after ${TIMEOUT_MS}ms` : e.message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  ctl.abort();
}
