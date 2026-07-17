/**
 * Created-report ids file — appended by every category test, so writes must be
 * safe across Playwright's worker PROCESSES. A mkdir-based lock (mkdir is
 * atomic on every platform) serializes the read-merge-write.
 *
 * Default file: _data/created-report-ids.local.json — the `.local.json`
 * suffix keeps it under the existing `_data/*.local.json` gitignore rule.
 * Point the default validator at it via REPORT_CATALOG to validate the batch.
 */
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_OUT = path.join(__dirname, '..', '..', '_data', 'created-report-ids.local.json');

function outFile() {
  return process.env.CREATE_OUT ? path.resolve(process.cwd(), process.env.CREATE_OUT) : DEFAULT_OUT;
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Append entries ([{id, name, category, scenario, picked}]) to the ids file. */
function appendIds(entries, file = outFile()) {
  if (!entries.length) return file;
  const lockDir = `${file}.lock`;
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      fs.mkdirSync(lockDir, { recursive: false });
      break;
    } catch {
      if (Date.now() > deadline) throw new Error(`Timed out waiting for lock ${lockDir}`);
      sleepSync(100);
    }
  }
  try {
    let current = [];
    if (fs.existsSync(file)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (Array.isArray(parsed)) current = parsed;
      } catch {
        /* corrupt/partial file — start over rather than crash the run */
      }
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(current.concat(entries), null, 2)}\n`);
  } finally {
    fs.rmdirSync(lockDir);
  }
  return file;
}

module.exports = { appendIds, outFile };
