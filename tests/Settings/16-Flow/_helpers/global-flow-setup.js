/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * GLOBAL flow setup — starts the propagation traffic batch at the VERY START of `npx playwright test`.
 *
 * WHY: flow ingest has a measured ~5-minute floor (aggregation window 3 min + query lag; probe
 * 2026-08-11 saw 294 s). Starting the batch here at t=0 and only VERIFYING later (when FlowPropagation
 * runs, minutes into the run) means the window overlaps the rest of the suite and costs ~0 wall-clock
 * instead of a blocking 5-minute wait. Same trick the SNMP-trap suite uses for its datastore flush.
 *
 * It ONLY generates traffic — no verification, no waiting. It records what it started to a temp file
 * that the propagation spec reads and that global-flow-teardown deletes. Disable with FLOW_FIRE=0.
 *
 * SAFETY: every profile is bounded by max_flows, so even if this process dies the generator stops on
 * its own rather than flooding a shared server. Nothing but our own profiles is ever touched.
 *
 * Author  : Zenil Kapadia
 * Created : 11 August 2026
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { startBatch, supportedProtocols, sendStats } from './flow-sender.js';
import { FLOW_BATCH, assertFlowEnv } from './flow-fixtures.js';

/** Fixed temp path shared with the spec + teardown (deliberately NOT in the project tree). */
export const FLOW_STATE_FILE = path.join(os.tmpdir(), 'playwright-flow-started.json');

export default async function globalFlowSetup() {
  if (process.env.FLOW_FIRE === '0') {
    console.log('[flow globalSetup] FLOW_FIRE=0 — skipping the early traffic start');
    return;
  }
  try {
    assertFlowEnv();
    // Skip any fixture whose protocol this generator can't emit, rather than failing the whole run
    // on an environment limitation. (All four are supported on NetForge as of 2026-08-11.)
    const supported = await supportedProtocols();
    const canSend = (fx) => !supported.length || supported.includes(fx.protocol);
    const skipped = FLOW_BATCH.filter((fx) => !canSend(fx)).map((fx) => `${fx.key}(${fx.protocol})`);

    const { startedAt, started } = await startBatch(FLOW_BATCH, `gs${Date.now().toString(36)}`, canSend);
    console.log(`[flow globalSetup] started ${started.length} flow profiles at suite start — the ` +
      `~5-min aggregation window now overlaps the rest of the run`);

    /*
     * SAMPLE THE COUNTERS BRIEFLY, BEFORE THE GENERATOR THROWS THEM AWAY.
     *
     * NetForge exposes a profile's flows/packets/bytes/errors ONLY while it is running; the moment the
     * bounded burst completes the stats block disappears (measured 2026-08-11). globalSetup also runs in
     * a DIFFERENT PROCESS from the tests, so the adapter's in-memory peak cache cannot reach them. So
     * they have to be captured here, or the propagation spec has no ground truth and cannot tell "the
     * product lost it" from "we never sent it".
     *
     * !! THIS MUST NOT BLOCK THE RUN !!
     * An earlier revision awaited each burst to completion, SEQUENTIALLY, up to 3 min apiece — 2-4 min
     * of dead air on every single `npx playwright test`, including runs that touch no flow test at all.
     * It looked exactly like a hang after the globalSetup banner. That defeats the entire purpose of
     * firing early (to overlap the wait, not to add one).
     *
     * So: poll all bursts CONCURRENTLY, for a short fixed budget, and stop the moment they have all
     * finished. Partial counters are fine for the job they do — proving traffic reached the wire is
     * what distinguishes a product failure from a generator failure, and a non-zero count proves it
     * just as well as a final one. `partial: true` marks any burst still in flight when we stopped.
     *
     * DEFAULT IS OFF (0). Sampling costs up to ~40s of startup on EVERY `npx playwright test`, including
     * the overwhelming majority of runs that touch no flow test at all — that is not a reasonable tax to
     * charge someone debugging an unrelated spec. globalSetup now fires and returns in ~2s.
     *
     * Turn it on only when running the flow suite, where the ground truth is actually consumed:
     *   FLOW_SAMPLE_SECONDS=40 npx playwright test --project=settings_16_flow      (bash)
     *   $env:FLOW_SAMPLE_SECONDS=40; npx playwright test --project=settings_16_flow  (PowerShell)
     * FLOW_FIRE=0 skips this whole step.
     */
    const SAMPLE_SECONDS = Number(process.env.FLOW_SAMPLE_SECONDS ?? 0);
    const counters = {};
    if (SAMPLE_SECONDS > 0 && started.length) {
      console.log(`[flow globalSetup] sampling generator counters for up to ${SAMPLE_SECONDS}s ` +
        `(they are destroyed when each burst ends)...`);
      const deadline = Date.now() + SAMPLE_SECONDS * 1000;
      while (Date.now() < deadline) {
        const snap = await Promise.all(started.map((h) => sendStats(h).catch(() => null)));
        // Every burst finished and reported traffic — no reason to keep waiting.
        if (snap.every((s) => s && !s.running && s.flows > 0)) break;
        await new Promise((r) => setTimeout(r, 1000));
      }
      // sendStats caches the peak, so this returns the high-water mark even after a burst has ended.
      const finals = await Promise.all(started.map((h) => sendStats(h).catch(() => null)));
      started.forEach((h, i) => {
        const s = finals[i];
        counters[h.key] = s
          ? { flows: s.flows, packets: s.packets, bytes: s.bytes, errors: s.errors, partial: !!s.running }
          : null;
      });
    }
    // Stamp the OWNING PROCESS. The state file lives at a fixed temp path because worker processes must
    // be able to find it, but that makes it shared across concurrent runs — and teardown deleting
    // another run's live generator profiles mid-flight is a real hazard (observed: a second run wiped
    // the first run's traffic). globalTeardown refuses to clean up unless this pid matches its own.
    fs.writeFileSync(FLOW_STATE_FILE, JSON.stringify({ pid: process.pid, startedAt, started, counters }));
    if (Object.keys(counters).length) {
      const summary = Object.entries(counters)
        .map(([k, v]) => `${k}=${v ? `${v.flows}f/${v.bytes}B${v.partial ? '(partial)' : ''}${v.errors ? `/${v.errors}err` : ''}` : 'unknown'}`)
        .join(' ');
      console.log(`[flow globalSetup] generator counters captured: ${summary}`);
    } else {
      console.log('[flow globalSetup] counters not sampled (FLOW_SAMPLE_SECONDS=0) — set it to 40 when ' +
        'running the flow suite if you want send-side ground truth');
    }
    // A burst that never reported running emitted nothing — say so now rather than let the propagation
    // spec discover it as a mysterious absence 5 minutes later.
    const silent = Object.entries(counters).filter(([, v]) => !v || v.flows === 0).map(([k]) => k);
    if (silent.length) {
      console.warn(`[flow globalSetup] WARNING these profiles reported NO traffic sent: ${silent.join(', ')} ` +
        `— verification failures for them are a GENERATOR problem, not a product problem`);
    }
    // Never let a bounded coverage decision be silent: say what was dropped and why.
    if (skipped.length) {
      console.log(`[flow globalSetup] SKIPPED (generator lacks the protocol): ${skipped.join(', ')}`);
    }
  } catch (e) {
    // Never fail the whole run because the early start couldn't happen — the spec has an inline
    // fallback that starts traffic itself and absorbs the full window.
    console.warn('[flow globalSetup] early traffic start skipped: ' + e.message);
  }
}
