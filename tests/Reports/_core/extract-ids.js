#!/usr/bin/env node
/**
 * Rebuild the report catalog from exported report JSON — port of
 * extract_report_ids.py. Reads every *.json under a source dir (each a
 * top-level array of report objects with `id` + `report.name`) and writes:
 *
 *   _data/report-ids.json    [{ id, name }, ...]  (what the spec iterates)
 *   _data/report-names.json  { "<id>": "<name>" } (id → display name)
 *
 * Usage:
 *   node tests/Reports/_core/extract-ids.js [srcDir]
 *   REPORTS_SRC=/path/to/exports node tests/Reports/_core/extract-ids.js
 *
 * srcDir defaults to tests/Reports/_data/reports-src/. Re-run only when the
 * source reports change.
 */
const fs = require('node:fs');
const path = require('node:path');

const DATA = path.join(__dirname, '..', '_data');
const SRC = process.argv[2] || process.env.REPORTS_SRC || path.join(DATA, 'reports-src');

if (!fs.existsSync(SRC) || !fs.statSync(SRC).isDirectory()) {
  console.error(`Source dir not found: ${SRC}`);
  console.error('Drop exported report JSON files there (each a top-level array of report objects), or pass a dir: node extract-ids.js <dir>');
  process.exit(2);
}

const files = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.json')).sort();
const entries = [];
const names = {};
const seen = new Set();
let duplicates = 0;
let missing = 0;

for (const f of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf-8'));
  } catch (e) {
    console.log(`[skip] ${f}: invalid JSON — ${e.message}`);
    continue;
  }
  if (!Array.isArray(data)) {
    console.log(`[skip] ${f}: expected a top-level JSON array`);
    continue;
  }
  let count = 0;
  for (const item of data) {
    if (item && typeof item === 'object' && 'id' in item) {
      const rid = item.id;
      if (seen.has(rid)) {
        duplicates++;
        continue;
      }
      seen.add(rid);
      const name = (item['report.name'] || item.name || '').trim();
      entries.push({ id: rid, name });
      names[String(rid)] = name;
      count++;
    } else {
      missing++;
    }
  }
  console.log(`  ${f.padEnd(28)} ${count} ids`);
}

fs.mkdirSync(DATA, { recursive: true });
fs.writeFileSync(path.join(DATA, 'report-ids.json'), JSON.stringify(entries, null, 2) + '\n');
fs.writeFileSync(path.join(DATA, 'report-names.json'), JSON.stringify(names, null, 2) + '\n');

console.log(`\nTotal unique ids : ${entries.length}`);
console.log(`Duplicates       : ${duplicates}`);
console.log(`Missing id field : ${missing}`);
console.log('Wrote _data/report-ids.json and _data/report-names.json');
