#!/usr/bin/env node
/*
 * Validation gate CLI — for CI and manual runs.
 *
 *   node governance/validation/cli.mjs <gate> <ctx.json> [--spec spec.js]
 *
 * <gate>     one of: 01_requirement | 05_testcases | 07_automation
 * <ctx.json> a JSON file with the fields the gate needs
 *            (requirement, acIds, cases, resolvedCases, specText)
 * --spec     optional path to a generated spec; its text becomes ctx.specText
 *
 * Exits 1 if the gate FAILS — so a failing gate blocks a CI job.
 */

import fs from 'node:fs';
import { runGate, formatGate } from './index.js';

const [gate, ctxPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const specIdx = process.argv.indexOf('--spec');

if (!gate || !ctxPath) {
  console.error('usage: cli.mjs <gate> <ctx.json> [--spec spec.js]');
  process.exit(2);
}

const ctx = JSON.parse(fs.readFileSync(ctxPath, 'utf8'));
if (specIdx >= 0) ctx.specText = fs.readFileSync(process.argv[specIdx + 1], 'utf8');

const g = runGate(gate, ctx);
console.log(formatGate(g));
process.exit(g.pass ? 0 : 1);
