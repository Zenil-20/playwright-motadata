/*
 * Test-case store — the single API for loading/saving/promoting/querying test cases.
 * JS port of observeops-qa framework/services/testcase_repository.py.
 *
 * Layout (relative to repo root):
 *   tests/regression/   canonical regression suites (source of truth)
 *   tests/generated/    AI/tool-authored suites awaiting promotion
 *
 * A "case" is a flat object with the 13 canonical fields (see mapping.js).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, toCsv } from './csv.js';
import { CANONICAL_FIELDS, REQUIRED_FIELDS, canonicalOf, emptyCase } from './mapping.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..'); // framework/core/testcase-store → repo root
const REGRESSION_DIR = path.join(REPO_ROOT, 'tests', 'regression');
const GENERATED_DIR = path.join(REPO_ROOT, 'tests', 'generated');

/** Read a CSV from any source and normalize headers to the canonical schema. */
export function loadCases(csvPath) {
  const raw = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  return raw.map((rawRow) => {
    const row = emptyCase();
    for (const [header, value] of Object.entries(rawRow)) {
      const canon = canonicalOf(header);
      if (canon) row[canon] = (value || '').trim();
    }
    return row;
  });
}

/** Load every *.csv in the regression suite, flattened. */
export function loadRegression() {
  if (!fs.existsSync(REGRESSION_DIR)) return [];
  return fs.readdirSync(REGRESSION_DIR)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .flatMap((f) => loadCases(path.join(REGRESSION_DIR, f)));
}

/** Validate rows against the schema; returns an array of error strings (empty = ok). */
export function validate(cases) {
  const errs = [];
  cases.forEach((c, i) => {
    for (const req of REQUIRED_FIELDS) {
      if (!c[req] || !String(c[req]).trim()) errs.push(`row ${i}: missing required field '${req}'`);
    }
  });
  return errs;
}

/** Save a validated suite under tests/generated/<slug>.csv. */
export function saveGenerated(slug, cases) {
  const errs = validate(cases);
  if (errs.length) throw new Error('Invalid test cases: ' + errs.slice(0, 5).join('; '));
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const dst = path.join(GENERATED_DIR, `${slug}.csv`);
  // ensure every row carries all canonical columns in stable order
  const rows = cases.map((c) => ({ ...emptyCase(), ...c }));
  fs.writeFileSync(dst, toCsv(rows, CANONICAL_FIELDS), 'utf8');
  return dst;
}

/** Promote a validated generated suite into the regression suite (pipeline stage 14). */
export function promote(slug) {
  const src = path.join(GENERATED_DIR, `${slug}.csv`);
  if (!fs.existsSync(src)) throw new Error(`no generated suite to promote: ${slug}`);
  fs.mkdirSync(REGRESSION_DIR, { recursive: true });
  const dst = path.join(REGRESSION_DIR, `${slug}.csv`);
  fs.copyFileSync(src, dst);
  return dst;
}

/** Filter cases by module substring and/or exact automated flag. */
export function query(cases, { module, automated } = {}) {
  return cases.filter((c) => {
    if (module && !String(c.module).toLowerCase().includes(module.toLowerCase())) return false;
    if (automated && String(c.automated).toLowerCase() !== automated.toLowerCase()) return false;
    return true;
  });
}

export const paths = { REPO_ROOT, REGRESSION_DIR, GENERATED_DIR };
