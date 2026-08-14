/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Flow (NetFlow / sFlow / IPFIX) test fixtures + environment config.
 *
 * SINGLE source of truth for:
 *   - where AIOps and the NetForge flow generator live (from .env, with harvested defaults),
 *   - the flow listener ports and the ingest aggregation window,
 *   - the deterministic traffic batches every propagation/integrity test generates,
 *   - the protocol <-> port routing matrix.
 *
 * GROUNDING (all live-verified 2026-08-11 on 172.16.15.86, build 8.2.7):
 *   Settings > Flow Settings > Flow Settings exposes
 *     sFlow Port = 6343 · Netflow Port = 2055 · Aggregation Time (Min) = 3
 *     Traffic Direction = Ingress|Egress (radio) · BGP Port Enable = OFF (switch)
 *   Flow Explorer (/flow/dashboard) showed "AWAITING FIRST FLOW" — the listener is configured and
 *   idle; no exporter had ever reached this server. So the suite does NOT need to enable anything:
 *   it only needs to aim NetForge at <aiops-host>:2055.
 *
 * WHY THE AGGREGATION WINDOW MATTERS: unlike the SNMP-trap datastore flush (fixed ~5 min, hidden),
 * flow ingest latency is a CONFIGURED value the UI shows. We read it rather than hard-code a guess,
 * and every wait derives from it — so if a server is set to 1 or 10 minutes the suite still fits.
 *
 * Author  : Zenil Kapadia
 * Created : 11 August 2026
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

/** Strip scheme/path/port so NetForge `targets` ("host:port", NOT a URL) can be built. */
function hostOf(urlOrHost) {
  if (!urlOrHost) return '';
  return String(urlOrHost).replace(/^\w+:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
}

/* ============================================================================ AIOps + generator */

export const AIOPS_URL = (process.env.Motadata_Aiops || '').replace(/\/+$/, '');
export const AIOPS_HOST = hostOf(AIOPS_URL);

/** NetForge — the same generator the SNMP-trap suite uses, different API surface (/api/profiles). */
export const NETFORGE_URL = (process.env.NETFORGE_URL || 'http://172.16.12.36:8080').replace(/\/+$/, '');
/** Every generated flow packet arrives FROM this host, so it is the Flow Explorer "source". */
export const FLOW_SOURCE = hostOf(NETFORGE_URL);

/* ============================================================================ listener ports */

/** Verified live on the Flow Settings form (2026-08-11). Overridable when a server differs. */
export const NETFLOW_PORT = process.env.FLOW_NETFLOW_PORT || '2055';
export const SFLOW_PORT = process.env.FLOW_SFLOW_PORT || '6343';

/**
 * BGP-mode listener ports. THE PRODUCT BINDS FOUR PORTS, NOT TWO — FlowListener.start() launches
 * sfacctd+nfacctd for sFlow/NetFlow, and when "BGP Port Enable" is on it launches TWO MORE collectors
 * on these ports (FlowSettingsConfigStore defaults: BGP sFlow 6344, BGP NetFlow 2056).
 *
 * They are declared here for ONE critical reason: so the "unbound" port used by the routing matrix can
 * be proven not to collide with them. An earlier revision of this file used 2056 as the unbound port —
 * which IS the BGP NetFlow default. With BGP enabled that row would have been aimed at a real listener,
 * and its drop assertion would have failed while looking like a product bug.
 */
export const BGP_SFLOW_PORT = process.env.FLOW_BGP_SFLOW_PORT || '6344';
export const BGP_NETFLOW_PORT = process.env.FLOW_BGP_NETFLOW_PORT || '2056';

/**
 * A port NO flow listener binds — traffic aimed here must never surface.
 * Deliberately far from every default (2055/6343/6344/2056) and from the common
 * flow-port range, so no future default can quietly reclaim it. Guarded by assertFlowEnv().
 */
export const UNBOUND_PORT = process.env.FLOW_UNBOUND_PORT || '21055';

/** Every port the product may legitimately be listening on. */
export const ALL_LISTENER_PORTS = [NETFLOW_PORT, SFLOW_PORT, BGP_SFLOW_PORT, BGP_NETFLOW_PORT].map(String);

/**
 * Ingest aggregation window in MINUTES, as configured on the server ("Aggregation Time (Min)" = 3
 * when harvested). Waits are derived from it, never hard-coded: readAggregationMinutes() reads the
 * live value off the settings form and specs fall back to this when they haven't looked.
 */
export const AGGREGATION_MIN = Number(process.env.FLOW_AGGREGATION_MIN || 3);

/**
 * MEASURED, not assumed: with Aggregation Time = 3 min, the first flow took **294 s (~4.9 min)** to
 * leave Flow Explorer's "AWAITING FIRST FLOW" state (probe 2026-08-11, netflow5, 1200 flows @20/s at
 * 172.16.15.86:2055). So real latency is the aggregation window PLUS ~2 min of query/dashboard lag —
 * trusting the configured 3 min alone would have produced a suite that flakes on every run.
 *
 * Ceiling = window + 7 min of headroom. Polls before the flush simply find nothing and retry.
 */
export const INGEST_TIMEOUT_MS = (AGGREGATION_MIN * 60 + 420) * 1000;
/** The floor below which finding nothing is EXPECTED, not a failure — used to keep logs honest. */
export const INGEST_FLOOR_MS = AGGREGATION_MIN * 60 * 1000;

/* ============================================================================ explorer query API */

/**
 * Flow Explorer's query surface (/flow/explorer), harvested live 2026-08-11. It is a query builder,
 * not a fixed grid — which is what makes exact-volume assertions possible:
 *   Counter     -> e.g. 'volume.bytes'   (picker, data-cy='dropdown-trigger-input')
 *   Aggregation -> e.g. 'sum'            (picker)
 *   Result by   -> group-by fields, multi (source.ip | source.port | destination.ip | destination.port | +3 more)
 *   render as   -> Sankey | Area | Line | HorizontalBar | VerticalBar | Pie | Grid
 * Assertions use the Grid rendering so values are readable text, never chart geometry.
 */
export const EXPLORER = {
  COUNTER_VOLUME_BYTES: 'volume.bytes',
  AGG_SUM: 'sum',
  BY_SOURCE_IP: 'source.ip',
  BY_SOURCE_PORT: 'source.port',
  BY_DEST_IP: 'destination.ip',
  BY_DEST_PORT: 'destination.port',
  RENDER_GRID: 'Grid',
};

/** Target string for a protocol's own listener port. */
export const targetFor = (which) =>
  `${AIOPS_HOST}:${{ netflow: NETFLOW_PORT, sflow: SFLOW_PORT, unbound: UNBOUND_PORT }[which]}`;

/* ============================================================================ product invariants */

/**
 * THE PORT-ZEROING RULE — the single most surprising thing in the flow pipeline.
 *
 * FlowProcessor stores ports as `port > 1024 ? 0 : port` for BOTH source and destination
 * (FlowProcessor.java:1029-1030 and :1038-1045). So ANY port above 1024 is recorded as 0 on the
 * `source.port` / `destination.port` fields. The real value survives ONLY on
 * `original.source.port` / `original.destination.port` (FlowProcessor.java:1054-1055).
 *
 * Consequence for tests: a conversation pinned to a high port (8443, 3306, 5432...) can never be found
 * by searching `destination.port` — it must be asserted on `original.destination.port`, or the fixture
 * must use a well-known port. Getting this wrong produces a failure that looks exactly like data loss.
 */
export const PORT_ZEROING_THRESHOLD = 1024;
/** True when the product will record this port verbatim rather than zeroing it. */
export const portIsPreserved = (port) => Number(port) <= PORT_ZEROING_THRESHOLD;

/**
 * THE SAMPLING MULTIPLIER — why displayed volume can legitimately exceed what was sent.
 *
 * FlowProcessor.java:910-928: `if (samplingRate > 1) { volumeBytes *= samplingRate; packets *= samplingRate; }`.
 * The rate is resolved in this order (FlowProcessor.java:880-908):
 *   1. FlowSamplingRateConfigStore.getSamplingRate("<source>#<ifIndex>") — the CUSTOM SAMPLING RATE
 *      column on Settings > Flow Settings > Sample Rate Settings. Present ONLY for rows where
 *      `interface.custom.sampling.rate` is non-null (FlowSamplingRateConfigStore.java:78-81).
 *   2. otherwise the rate carried in the exporter's own packets.
 *
 * Our generator sends NO sampling field (confirmed: NetForge's profile payload has no sampling key), so
 * with no custom rate configured the effective rate is 0/absent and NO multiplication occurs — displayed
 * volume should match what was sent. A custom rate turns that into an exact multiple, which is why the
 * volume test READS the live rate and folds it into the expectation instead of widening its tolerance.
 *
 * NOTE the resolution order bug worth watching: the iface_in lookup OVERWRITES the iface_out result, so
 * when both interfaces carry custom rates the iface_in rate wins regardless of the flow's direction.
 */
export const expectedVolumeMultiplier = (samplingRate) =>
  Number.isFinite(Number(samplingRate)) && Number(samplingRate) > 1 ? Number(samplingRate) : 1;

/**
 * THE DIRECTION RULE — why ingress/egress can both be zero on a perfectly healthy flow.
 *
 * pmacct tags each record via nflow.tag.rule / sflow.tag.rule:
 *   tag 1 = NetFlow ingress · 2 = NetFlow egress · 5 = NetFlow, direction UNKNOWN (catch-all)
 *   tag 3 = sFlow  ingress · 4 = sFlow  egress · 6 = sFlow,  direction UNKNOWN (catch-all)
 * FlowProcessor.java:947-976 assigns ingress/egress volume ONLY for tags 1-4 (or from a bidirectional
 * record's own ingress_bytes/egress_bytes, or — for sFlow v5 ONLY — from the "Traffic Direction" setting).
 *
 * NetFlow v5 has no direction field, so it lands on the catch-all tag 5 and gets NEITHER ingress nor
 * egress: `volume.bytes` carries the traffic while `ingress.volume.bytes` and `egress.volume.bytes`
 * stay 0. Anything derived from them — the In/Out traffic columns, the interface volume percentiles —
 * is therefore legitimately empty for NetFlow v5. Asserting otherwise reports a bug that isn't one.
 */
export const DIRECTIONLESS_PROTOCOLS = ['netflow5'];
export const hasDirectionalVolume = (protocol) => !DIRECTIONLESS_PROTOCOLS.includes(protocol);

/* ============================================================================ traffic batches */

/**
 * A FULLY-PINNED conversation. Every field is fixed so the expected volume is exact arithmetic
 * (`max_flows x bytes = expectedBytes`) — this is what makes flow testable in a way traps never
 * were: we assert numbers, not just presence.
 *
 * Field support CONFIRMED by NetForge read-back (2026-08-11): source_ip/dest_ip {mode:'single'},
 * dest_port {mode:'single'}, counters {bytes_min,bytes_max,packets_min,packets_max} all persist
 * exactly as sent.
 *
 * NB the 10.99.x.x space is deliberately OUTSIDE every lab range in .env, so our synthetic
 * conversations can never be confused with real monitored traffic on a shared server.
 */
export function pinnedConversation({
  key, protocol = 'netflow5', srcIp, dstIp, dstPort = 443, bytes = 1500, packets = 1,
  fps = 20, maxFlows = 1200, target = targetFor('netflow'), application, tcp = 100, udp = 0, icmp = 0,
}) {
  return {
    key,
    protocol,
    target,
    flowsPerSecond: fps,
    maxFlows,
    /*
     * PER-RECORD values, and the only safe basis for a volume expectation.
     *
     * The generator's own `bytes_generated` counter is WIRE BYTES of the export datagrams, NOT the sum
     * of the flow records' byte counters (measured: 500 records pinned at 1000 bytes reported
     * bytes_generated=25872, i.e. ~53 wire bytes per record at ~5 records per UDP packet, matching the
     * generator's own AvgPacketSize/AvgRecordsPerPacket fields). Comparing that against Flow Explorer's
     * volume.bytes compares two different quantities and is wrong by more than an order of magnitude.
     *
     * So the expected displayed volume is (flows actually emitted) x bytesPerFlow, using the generator's
     * `flows_generated` — which IS a flow-record count and therefore directly comparable.
     */
    bytesPerFlow: bytes,
    packetsPerFlow: packets,
    expectedBytes: maxFlows * bytes,
    expectedPackets: maxFlows * packets,
    srcIp,
    dstIp,
    dstPort,
    application,
    payload: {
      source_ip: { mode: 'single', values: [srcIp] },
      dest_ip: { mode: 'single', values: [dstIp] },
      source_port: { mode: 'range', min: 1024, max: 65535 },
      dest_port: { mode: 'single', values: [dstPort] },
      protocol_mix: { tcp, udp, icmp },
      interfaces: { count: 1 },
      counters: { bytes_min: bytes, bytes_max: bytes, packets_min: packets, packets_max: packets },
    },
  };
}

/**
 * PROPAGATION batch — one distinct conversation per dimension, all fired in ONE burst so the single
 * aggregation window is paid once (the trap suite's hard-won lesson: N scenarios must cost one wait,
 * not N). Distinct src/dst pairs make every row independently attributable in the UI.
 */
export const FLOW_BATCH = [
  pinnedConversation({ key: 'nf5-https', protocol: 'netflow5', srcIp: '10.99.11.1', dstIp: '10.99.11.2', dstPort: 443, application: 'HTTPS/TLS' }),
  pinnedConversation({ key: 'nf9-dns', protocol: 'netflow9', srcIp: '10.99.12.1', dstIp: '10.99.12.2', dstPort: 53, tcp: 0, udp: 100, application: 'DNS' }),
  pinnedConversation({ key: 'ipfix-ssh', protocol: 'ipfix', srcIp: '10.99.13.1', dstIp: '10.99.13.2', dstPort: 22, application: 'SSH' }),
  pinnedConversation({ key: 'sflow-http', protocol: 'sflow', srcIp: '10.99.14.1', dstIp: '10.99.14.2', dstPort: 80, target: targetFor('sflow'), application: 'HTTP' }),
];

/**
 * INTEGRITY fixture — a single conversation whose byte total is chosen to be unmistakable in the UI
 * (a round, large number no incidental traffic would produce). Used to reconcile three independent
 * numbers: what we ASKED for, what NetForge REPORTS sending (its own stats counters), and what Flow
 * Explorer DISPLAYS. The trap suite had no equivalent — it could only assert presence.
 */
export const FLOW_INTEGRITY = pinnedConversation({
  key: 'integrity-exact',
  srcIp: '10.99.21.1',
  dstIp: '10.99.21.2',
  // 443 is deliberate, NOT arbitrary: it is <= PORT_ZEROING_THRESHOLD, so the product preserves it on
  // `destination.port` and the conversation is findable by port. An earlier revision used 8443, which
  // FlowProcessor zeroes — the assertion could never have passed. See PORT_ZEROING_THRESHOLD above.
  dstPort: 443,
  bytes: 1000,      // round number => expected total is trivially checkable by eye in the report
  packets: 1,
  fps: 50,
  maxFlows: 5000,   // => exactly 5,000,000 bytes (5 MB) and 5,000 packets
});

/**
 * A conversation pinned to a HIGH port, existing purely to prove the port-zeroing rule is real and
 * still in force. Turning the surprise that broke the integrity fixture into an explicit assertion is
 * what stops it silently reappearing: if a future build stops zeroing high ports (or starts zeroing low
 * ones), this fixture fails and names the change.
 */
export const FLOW_HIGH_PORT = pinnedConversation({
  key: 'highport-zeroing',
  srcIp: '10.99.22.1',
  dstIp: '10.99.22.2',
  dstPort: 8443,    // > 1024 => expected to be recorded as 0, preserved only on original.destination.port
  bytes: 1200,
  packets: 1,
  fps: 20,
  maxFlows: 600,
});

/* ============================================================================ routing matrix */

/**
 * PROTOCOL <-> PORT routing matrix.
 *
 * The product stores the two listener ports as SEPARATE config keys (verified: the form has two
 * distinct `input[name='port']` fields, "sFlow Port" 6343 and "Netflow Port" 2055; backend
 * FlowSettingsConfigStore.getsFlowPort vs MotadataConfigUtil.getFlowPort). That is structurally the
 * same shape as the SNMP-trap v1/v2c-vs-v3 port bug this pattern was built to catch, so the same
 * deliver/drop matrix applies.
 *
 * EXPECTATION PROVENANCE — stated honestly, since no Flow bug was reported to us:
 *   - 'deliver' rows: a protocol aimed at ITS OWN configured port. Non-negotiable product behaviour.
 *   - 'drop' rows for cross-protocol: an sFlow datagram handed to the NetFlow parser (and vice
 *     versa) is malformed input for that decoder. If one DELIVERS, that is a real finding worth
 *     reporting (parser accepting a foreign wire format), not a test bug.
 *   - 'drop' for the unbound port: nothing is listening; arrival would be inexplicable.
 * Each row's `why` is written so a FAILURE message explains what the failure means.
 */
export const FLOW_ROUTING_MATRIX = [
  // -------- positive: protocol on its own port --------
  { key: 'nf5-to-netflow', protocol: 'netflow5', port: 'netflow', expect: 'deliver', srcIp: '10.99.31.1', dstIp: '10.99.31.2', why: 'NetFlow v5 on the configured NetFlow port — baseline positive' },
  { key: 'nf9-to-netflow', protocol: 'netflow9', port: 'netflow', expect: 'deliver', srcIp: '10.99.32.1', dstIp: '10.99.32.2', why: 'NetFlow v9 (template-based) on the NetFlow port — baseline positive' },
  { key: 'ipfix-to-netflow', protocol: 'ipfix', port: 'netflow', expect: 'deliver', srcIp: '10.99.33.1', dstIp: '10.99.33.2', why: 'IPFIX on the NetFlow port — IPFIX is the IETF successor to v9 and shares the listener' },
  { key: 'sflow-to-sflow', protocol: 'sflow', port: 'sflow', expect: 'deliver', srcIp: '10.99.34.1', dstIp: '10.99.34.2', why: 'sFlow on the dedicated sFlow port — baseline positive' },
  // -------- the regression shape: protocol aimed at the OTHER protocol's port --------
  { key: 'sflow-to-netflow', protocol: 'sflow', port: 'netflow', expect: 'drop', srcIp: '10.99.35.1', dstIp: '10.99.35.2', why: 'sFlow datagram aimed at the NetFlow port — the NetFlow decoder must reject a foreign wire format, not half-parse it (delivery here is a real finding)' },
  { key: 'nf5-to-sflow', protocol: 'netflow5', port: 'sflow', expect: 'drop', srcIp: '10.99.36.1', dstIp: '10.99.36.2', why: 'NetFlow v5 aimed at the sFlow port — mirror of the above, the other bug direction' },
  // -------- routing negative --------
  { key: 'nf5-to-unbound', protocol: 'netflow5', port: 'unbound', expect: 'drop', srcIp: '10.99.37.1', dstIp: '10.99.37.2', why: 'no listener bound on this port — nothing may surface' },
];

/** Build the sender fixture for a matrix row. */
export function routingFixture(row) {
  return pinnedConversation({
    key: `routing-${row.key}`,
    protocol: row.protocol,
    srcIp: row.srcIp,
    dstIp: row.dstIp,
    target: targetFor(row.port),
    fps: 20,
    maxFlows: 600, // ~30s of traffic per row — enough to be unmissable, short enough to stay cheap
  });
}

/* ============================================================================ env assertion */

/**
 * Fail LOUD (not flaky) when the environment isn't wired. A half-configured env must produce a
 * precise message, never a mysterious timeout 8 minutes into a run.
 */
export function assertFlowEnv() {
  const missing = [];
  if (!AIOPS_URL) missing.push('Motadata_Aiops');
  if (!NETFORGE_URL) missing.push('NETFORGE_URL');
  if (!AIOPS_HOST) missing.push('a resolvable AIOps host in Motadata_Aiops');
  if (missing.length) {
    throw new Error(`[flow-fixtures] missing required env: ${missing.join(', ')}. ` +
      `Flow tests need the AIOps URL + the NetForge generator URL.`);
  }
  if (!Number.isFinite(AGGREGATION_MIN) || AGGREGATION_MIN <= 0) {
    throw new Error(`[flow-fixtures] FLOW_AGGREGATION_MIN must be a positive number of minutes (got ${AGGREGATION_MIN}).`);
  }
  // The routing matrix's whole negative half rests on nothing listening at UNBOUND_PORT. If it ever
  // equals a port the product binds (there are FOUR, including the two BGP ones), every drop assertion
  // becomes a lie that reads like a product bug. Fail loudly at setup instead.
  if (ALL_LISTENER_PORTS.includes(String(UNBOUND_PORT))) {
    throw new Error(`[flow-fixtures] FLOW_UNBOUND_PORT=${UNBOUND_PORT} collides with a REAL flow ` +
      `listener port (netflow=${NETFLOW_PORT}, sflow=${SFLOW_PORT}, bgp-sflow=${BGP_SFLOW_PORT}, ` +
      `bgp-netflow=${BGP_NETFLOW_PORT}). The routing matrix's drop assertions would be meaningless — ` +
      `pick a port the product never binds.`);
  }
  // Every generated conversation must be distinguishable, so duplicate source IPs across the batch
  // would make an "it arrived" assertion ambiguous about WHICH row arrived.
  const srcIps = [...FLOW_BATCH, FLOW_INTEGRITY, FLOW_HIGH_PORT].map((f) => f.srcIp)
    .concat(FLOW_ROUTING_MATRIX.map((r) => r.srcIp));
  const dupes = srcIps.filter((ip, i) => srcIps.indexOf(ip) !== i);
  if (dupes.length) {
    throw new Error(`[flow-fixtures] duplicate source IPs across fixtures (${[...new Set(dupes)].join(', ')}) — ` +
      `each conversation must be uniquely attributable in Flow Explorer.`);
  }
}
