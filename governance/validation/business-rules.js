/*
 * Gate: business-rule satisfaction (exit gate of stage 05, part 3).
 * Config-driven, so product rules live as data, not scattered code. Each rule inspects a
 * case and returns an error string when violated. Extend RULES (or pass your own).
 * Input: (cases[], rules?).
 */

import { result, evidence } from './result.js';

const hasStep = (c, action) => (c.steps || []).some((s) => s.action === action);
const text = (c) => `${c.title || ''} ${(c.steps || []).map((s) => s.target).join(' ')}`.toLowerCase();
const isCreateFlow = (c) => /\bcreate\b|save and run|save & run/.test(text(c));
const hasIdempotency = (c) =>
  (c.preconditions || []).some((p) => /skip[- ]?if[- ]?exists|already exists|unique/i.test(p)) ||
  (c.edge_cases || []).some((e) => /not unique|already exists|duplicate/i.test(e));

/** Default ruleset — extend per product/module. Each: {id, when, check, msg}. */
export const RULES = [
  {
    id: 'BR-IDEMPOTENT-CREATE',
    when: isCreateFlow,
    check: hasIdempotency,
    msg: 'create-flow must declare idempotency (skip-if-exists / unique precondition or edge case)',
  },
  {
    id: 'BR-EXPECTED-PRESENT',
    when: () => true,
    check: (c) => Array.isArray(c.expected) && c.expected.length > 0,
    msg: 'case has no expected result',
  },
  {
    id: 'BR-NO-SECRET-IN-DATA',
    when: (c) => c.data && Object.keys(c.data).length > 0,
    // Violation = a secret-ish KEY (or value) carrying a hardcoded (non-templated) literal.
    check: (c) => !Object.entries(c.data).some(([k, v]) => {
      const looksSecret = /password|secret|token|pwd|pass|apikey|api[_-]?key/i.test(k) || /password|secret|token/i.test(String(v));
      const literal = !/\{\{/.test(String(v)) && String(v).trim() !== '';
      return looksSecret && literal;
    }),
    msg: 'literal secret in test data — parameterize via {{env.*}}',
  },
];

export function validateBusinessRules(cases, rules = RULES) {
  const ev = [];
  let checks = 0;
  cases.forEach((c) => {
    rules.forEach((r) => {
      if (!r.when(c)) return;
      checks++;
      if (!r.check(c)) ev.push(evidence('error', `${r.id} — ${c.id || c.title}: ${r.msg}`, c.id));
    });
  });
  if (!ev.some((e) => e.level === 'error'))
    ev.push(evidence('info', `business rules satisfied (${checks} checks over ${cases.length} cases)`));
  return result('business-rules', ev, checks);
}
