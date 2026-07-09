/*
 * Run manifest — the orchestrator's record of one pipeline run.
 *
 * Phase-1 skeleton: gives the pipeline a single, resumable, auditable state object.
 * The orchestrator (agents/orchestrator.md) creates one manifest per run under
 * workspace/<TICKET>/<run-id>/run-manifest.json, records each stage + gate result, pins the
 * model/prompt versions used, and resumes from the last passing checkpoint.
 *
 * This module is intentionally dependency-free and side-effect-light so any stage runner can use it.
 */

import fs from 'node:fs';
import path from 'node:path';

/** The 12 canonical stages, in order. Keep in sync with pipeline/NN_* dirs. */
export const STAGES = [
  'requirement_ingestion', 'context_builder', 'requirement_analysis', 'test_planning',
  'testcase_generation', 'validation', 'automation_generation', 'execution',
  'failure_analysis', 'self_healing', 'reporting', 'learning',
];

/** Create a fresh manifest for a run. `now` is injected (ISO string) for reproducibility. */
export function createManifest({ ticket, runId, now, versions = {} }) {
  return {
    ticket,
    run_id: runId,
    created_at: now,
    versions: { model: null, prompts: null, framework: null, knowledge: null, ...versions },
    budget: { tokens: null, spent: 0 },
    stages: STAGES.map((name) => ({ name, status: 'pending', gate: null, output: null, at: null })),
  };
}

/** Record a stage result. status: 'pass' | 'fail' | 'skipped' | 'running'. */
export function recordStage(manifest, name, { status, gate = null, output = null, now = null }) {
  const s = manifest.stages.find((x) => x.name === name);
  if (!s) throw new Error(`unknown stage: ${name}`);
  Object.assign(s, { status, gate, output, at: now });
  return manifest;
}

/** The stage to resume from: the first not-yet-passed stage (checkpoint resume). */
export function nextStage(manifest) {
  const s = manifest.stages.find((x) => x.status !== 'pass' && x.status !== 'skipped');
  return s ? s.name : null;
}

/** A run may advance only if the current stage's gate passed (or there is no gate). */
export function canAdvance(manifest, name) {
  const s = manifest.stages.find((x) => x.name === name);
  return !!s && s.status === 'pass' && (s.gate == null || s.gate.pass === true);
}

export function save(manifest, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'run-manifest.json');
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2), 'utf8');
  return file;
}

export function load(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
