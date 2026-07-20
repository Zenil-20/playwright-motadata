/**
 * Report-module concurrency gate.
 *
 * Playwright's `workers` count is GLOBAL — there is no per-project worker
 * setting. When the whole framework runs, the report tests share the same big
 * worker pool as every other suite, which would let far more than a safe number
 * of PDF exports hit the server at once (that is what caused the mass `no_pdf`
 * overload at 8 workers).
 *
 * This is a cross-process semaphore over the filesystem: it caps how many report
 * checks run concurrently to REPORT_CONCURRENCY (default 4 — the value verified
 * to keep the export queue healthy), independent of how many workers the full
 * run uses for the other suites. So the report module always runs at its own
 * proven pace even inside `npx playwright test`.
 *
 * Tune per run with REPORT_CONCURRENCY (e.g. REPORT_CONCURRENCY=6).
 */
const fs = require('node:fs');
const path = require('node:path');

const CONCURRENCY = Math.max(1, Number(process.env.REPORT_CONCURRENCY || 4));
// Under test-results/, which Playwright wipes at the start of every run — so a
// crashed previous run can't leave slots behind. Stale-stealing (below) is the
// belt-and-suspenders for a worker that dies mid-run.
const DIR = path.join(process.cwd(), 'test-results', '.report-slots');
const STALE_MS = (Number(process.env.PER_REPORT_TIMEOUT || 360) + 60) * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Block until one of the CONCURRENCY slots is free; returns the slot handle. */
async function acquireSlot() {
  fs.mkdirSync(DIR, { recursive: true });
  for (;;) {
    for (let i = 0; i < CONCURRENCY; i++) {
      const slot = path.join(DIR, `slot_${i}`);
      try {
        fs.mkdirSync(slot); // atomic across processes — throws if the slot is held
        return slot;
      } catch {
        // Slot is taken. If its holder died (dir older than a full per-report
        // timeout), steal it so a crashed worker can't shrink capacity forever.
        try {
          if (Date.now() - fs.statSync(slot).mtimeMs > STALE_MS) fs.rmdirSync(slot);
        } catch {
          /* someone else already freed or stole it */
        }
      }
    }
    await sleep(150 + Math.floor(Math.random() * 150));
  }
}

/** Release a slot acquired with acquireSlot(). */
function releaseSlot(slot) {
  if (!slot) return;
  try {
    fs.rmdirSync(slot);
  } catch {
    /* already gone */
  }
}

module.exports = { acquireSlot, releaseSlot, CONCURRENCY };
