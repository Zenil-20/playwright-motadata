/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * CSV generation + export (PDF/CSV) parsing + temp-file lifecycle for the trap suite.
 *
 * Design note (your requirement): exported files must NOT linger on disk. Everything is written to
 * an OS temp dir and removed after verification via withTempDir() — the project tree stays clean.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

/** Run `fn(dir)` with a fresh OS temp dir, then delete it no matter what (files never persist). */
export async function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-trap-'));
  try { return await fn(dir); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

/**
 * Build an app-valid bulk-profile CSV using the EXACT headers Motadata's own Sample CSV uses
 * (downloaded from the Bulk Profile Creation UI): "Trap Name,Trap OID,Filter,Trap Translator".
 * Rows use unique per-run names + private OIDs so the upload never conflicts and is cleanable.
 * @returns {{file:string, rows:Array<{name:string,oid:string}>}}
 */
export function writeBulkProfileCsv(dir, runToken, n = 3) {
  const base = (parseInt(runToken, 36) % 80000);
  const rows = [];
  const lines = ['Trap Name,Trap OID,Filter,Trap Translator'];
  for (let i = 1; i <= n; i++) {
    const name = `pw-bulk-${runToken}-${i}`;
    const oid = `.1.3.6.1.4.1.99999.${base + i}`;
    const filter = i % 2 ? 'no' : 'yes';
    const translator = filter === 'no' ? `$2 bulk test ${i}` : '';
    lines.push(`${name},${oid},${filter},${translator}`);
    rows.push({ name, oid });
  }
  const file = path.join(dir, `bulk-profiles-${runToken}.csv`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return { file, rows };
}

/** Parse a CSV file into { headers, rows } (rows = array of objects keyed by header). Simple, no quoting-in-quotes. */
export function parseCsv(file) {
  const text = fs.readFileSync(file, 'utf-8').replace(/^﻿/, '').trim();
  const [head, ...body] = text.split(/\r?\n/);
  const headers = head.split(',').map((h) => h.trim());
  const rows = body.filter(Boolean).map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });
  return { headers, rows };
}

/**
 * Trigger a download by running `clickAction`, save it into `dir`, and return the saved path.
 * @param {import('@playwright/test').Page} page
 * @param {string} dir  a temp dir (from withTempDir)
 * @param {() => Promise<void>} clickAction  the click that starts the download
 */
export async function downloadTo(page, dir, clickAction) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    clickAction(),
  ]);
  const dest = path.join(dir, download.suggestedFilename() || 'export.bin');
  await download.saveAs(dest);
  return dest;
}

/**
 * Best-effort PDF text check. Robust PDF text extraction needs a parser lib (not a hard dep here),
 * so we assert the file is a real, non-trivial PDF and optionally that expected tokens appear in the
 * raw bytes (works when the PDF stores text uncompressed). Returns { size, isPdf, contains(token) }.
 */
export function inspectPdf(file) {
  const buf = fs.readFileSync(file);
  const head = buf.slice(0, 5).toString('latin1');
  const raw = buf.toString('latin1');
  return {
    size: buf.length,
    isPdf: head === '%PDF-',
    contains: (token) => raw.includes(token),
  };
}
