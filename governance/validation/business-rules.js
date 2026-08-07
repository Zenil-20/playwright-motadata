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

// expectedText/allText fold expected results (and, for allText, steps/data too) into one lowercase
// blob so a rule can pattern-match without caring whether the fact lives in a string or an object.
const expectedText = (c) => JSON.stringify(c.expected || []).toLowerCase();
const allText = (c) => `${text(c)} ${expectedText(c)} ${JSON.stringify(c.data || {})}`.toLowerCase();

const DELETE_PROTECTED = /\b(role|profile|group|policy|template)\b/;
const isDeleteOfProtectedEntity = (c) => /\bdelete\b/.test(text(c)) && DELETE_PROTECTED.test(text(c)) && /used count|in use/.test(allText(c));
const isParentChildGroupCase = (c) => /parent group/.test(allText(c)) && /child group/.test(allText(c));
const isPermissionDenialCase = (c) => /\b(permission|grant)\b/.test(allText(c)) && /\b(missing|without|revoked|denied)\b/.test(allText(c));
const assertsHiddenControl = (c) => /\b(hidden|not visible|no longer visible)\b/.test(expectedText(c)) && /\b(button|control|action|menu item)\b/.test(expectedText(c));
const isCloneCase = (c) => /\b(clone|duplicate)\b/.test(text(c));
const isPollerWindowCase = (c) => /\b(occurrence|flap)\b/.test(allText(c)) && /\b(poll|interval)\b/.test(allText(c));
const isExportCase = (c) => /\bexport\b/.test(text(c)) && /\b(pdf|csv|xlsx)\b/.test(allText(c));
const isConcurrentSessionCase = (c) => /concurrent session/.test(allText(c)) || (/second login/.test(allText(c)) && /same user/.test(allText(c)));
const POSITIONAL = /nth\(|\/\/[a-zA-Z*]+\[\d+\]/;
const hasPositionalTarget = (c) => (c.steps || []).some((s) => POSITIONAL.test(String(s.target || '') + String(s.locator || '')));

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
  // --- Product/domain rules below — see knowledge/business_rules/ for the cited defect/rule behind each. ---
  {
    id: 'BR-DELETE-GUARD-USED-COUNT',
    when: isDeleteOfProtectedEntity,
    check: (c) => /block|prevent|cannot|denied|error|warn/.test(expectedText(c)),
    msg: 'deleting a role/profile/group/policy/template with Used Count > 0 must assert a block/warning, not silent success ([[RBAC-03]])',
  },
  {
    id: 'BR-CASCADE-NOT-IMPLICIT',
    when: isParentChildGroupCase,
    check: (c) => /not inherit|non[- ]?cascad|does not cascade|explicit|isolated/.test(expectedText(c)),
    msg: 'parent/child group case must assert scope is non-transitive — child groups are not auto-included (PQD-38219, [[RBAC-02]])',
  },
  {
    id: 'BR-PERMISSION-DENIAL-EXPLICIT',
    when: isPermissionDenialCase,
    check: (c) => /error|denied|toast|message|blocked/.test(expectedText(c)),
    msg: 'a missing/revoked permission must assert an explicit error, not a silently absent capability (PQD-38798, [[RBAC-01]])',
  },
  {
    id: 'BR-UI-HIDDEN-NEEDS-BACKEND-403',
    when: assertsHiddenControl,
    check: (c) => /403|forbidden|permission denied|not authorized|unauthorized/.test(allText(c)),
    msg: "a hidden button is not enforcement — pair the UI assertion with a backend 403/forbidden check ([[RBAC-04]])",
  },
  {
    id: 'BR-CLONE-INDEPENDENCE',
    when: isCloneCase,
    check: (c) => /original/.test(expectedText(c)) && /unchanged|unaffected|untouched|unmodified|not (be )?affected/.test(expectedText(c)),
    msg: 'a clone/duplicate case must assert the original is untouched after editing the clone (MOTADATA-6574 class)',
  },
  {
    id: 'BR-POLLER-WINDOW-MATH',
    when: isPollerWindowCase,
    check: (c) => /interval/i.test(JSON.stringify(c.data || {})) && /window|occurrence|flap/i.test(JSON.stringify(c.data || {})),
    msg: 'occurrence/flap alert case must parametrize poll interval alongside the window so feasibility is testable ([[ALERT-01]])',
  },
  {
    id: 'BR-EXPORT-VALUE-FIDELITY',
    when: isExportCase,
    check: (c) => (c.expected || []).length > 0 && /value|name|order|filename/.test(expectedText(c)) && !/\binternal id\b|\btag id\b/.test(expectedText(c)),
    msg: 'export case must assert tag/column values (not internal IDs) and filename/order fidelity ([[REPORT-02]])',
  },
  {
    id: 'BR-CONCURRENT-SESSION-DENIAL',
    when: isConcurrentSessionCase,
    check: (c) => /denied|blocked|logged out|logout|forced/.test(expectedText(c)),
    msg: 'concurrent-session case must assert the second session is denied/force-logged-out per allow.concurrent.sessions (PQD-41192, [[RBAC-05]])',
  },
  {
    id: 'BR-NO-POSITIONAL-TARGET',
    when: () => true,
    check: (c) => !hasPositionalTarget(c),
    msg: 'positional selector (nth()/indexed XPath) found in a step target/locator — re-scope to role/label/data-cy/row text',
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
