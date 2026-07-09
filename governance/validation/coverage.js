/*
 * Gate: coverage (exit gate of stage 05, part 1).
 * Every acceptance criterion must be traced by >=1 case, and the suite must include
 * positive, negative, and boundary scenarios. No orphan cases (each traces to an AC).
 * Input: (cases[], acIds[]).
 */

import { result, evidence } from './result.js';

const NEG = /\b(invalid|negative|error|reject|fail|unauthor|forbidden|denied|missing|empty|wrong)\b/i;
const BND = /\b(boundary|max|min|limit|zero|overflow|too long|too short|exactly|edge)\b/i;

export function validateCoverage(cases, acIds = []) {
  const ev = [];
  let checks = 0;
  const traced = new Set();
  cases.forEach((c) => (c.traces_to || []).forEach((a) => traced.add(a)));

  // 1. every AC covered
  acIds.forEach((ac) => {
    checks++;
    if (!traced.has(ac)) ev.push(evidence('error', `acceptance criterion ${ac} has no test case`, ac));
  });

  // 2. no orphan cases
  cases.forEach((c) => {
    checks++;
    if (!c.traces_to || c.traces_to.length === 0)
      ev.push(evidence('error', `case ${c.id || c.title} traces to no AC (orphan)`, c.id));
  });

  // 3. scenario diversity across the suite
  const blob = cases.map((c) => `${c.title} ${(c.edge_cases || []).join(' ')} ${(c.tags || []).join(' ')}`).join(' ');
  checks += 2;
  if (!NEG.test(blob)) ev.push(evidence('error', 'suite has no negative scenario'));
  if (!BND.test(blob)) ev.push(evidence('warn', 'suite has no obvious boundary scenario'));

  if (!ev.some((e) => e.level === 'error'))
    ev.push(evidence('info', `coverage OK: ${acIds.length} AC covered by ${cases.length} cases`));
  return result('coverage', ev, checks);
}
