/*
 * Validation gatekeeper — the code the orchestrator calls between stages.
 *
 * Maps each gated stage transition to its validators, runs them over the run context, and
 * returns { stage, pass, results[] }. `pass:false` means the orchestrator must NOT advance.
 * This replaces "the rules are in POLICY.md" with "the rules are enforced here."
 */

import { validateRequirement } from './requirement.js';
import { validateCoverage } from './coverage.js';
import { validateBusinessRules } from './business-rules.js';
import { validateDedup } from './dedup.js';
import { validateAssertions } from './assertions.js';
import { validateLocators } from './locators.js';
import { validateSpec } from './automation-review.js';

/**
 * ctx shape (only the fields a given gate needs must be present):
 *   { requirement, acIds[], cases[], resolvedCases[], specText }
 */
export const GATES = {
  '01_requirement': {
    label: 'Requirement completeness',
    run: (ctx) => [validateRequirement(ctx.requirement || {})],
  },
  '05_testcases': {
    label: 'Coverage · business-rules · dedup · assertions',
    run: (ctx) => [
      validateCoverage(ctx.cases || [], ctx.acIds || []),
      validateBusinessRules(ctx.cases || []),
      validateDedup(ctx.cases || []),
      validateAssertions(ctx.cases || []),
    ],
  },
  '07_automation': {
    label: 'Locators · automation-review',
    run: (ctx) => {
      const out = [validateLocators(ctx.resolvedCases || [])];
      if (ctx.specText != null) out.push(validateSpec(ctx.specText));
      return out;
    },
  },
};

/** Run one gate. Returns { stage, label, pass, results }. Never throws on validation content. */
export function runGate(stageKey, ctx) {
  const gate = GATES[stageKey];
  if (!gate) throw new Error(`unknown gate: ${stageKey} (have: ${Object.keys(GATES).join(', ')})`);
  const results = gate.run(ctx);
  return { stage: stageKey, label: gate.label, pass: results.every((r) => r.pass), results };
}

/** Human-readable one-liner per validator result, for CLI/CI output. */
export function formatGate(g) {
  const head = `${g.pass ? 'PASS' : 'FAIL'}  gate ${g.stage} — ${g.label}`;
  const lines = g.results.flatMap((r) =>
    [`  ${r.pass ? '✓' : '✗'} ${r.validator} (score ${r.score})`].concat(
      r.evidence.filter((e) => e.level !== 'info').map((e) => `      [${e.level}] ${e.msg}`),
    ),
  );
  return [head, ...lines].join('\n');
}
