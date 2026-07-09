/*
 * Gate: duplicate detection (exit gate of stage 05, part 2).
 * Two cases are duplicates when their normalized step-signature matches. Catches the
 * common AI failure of emitting the same test under two titles.
 * Input: cases[].
 */

import { result, evidence } from './result.js';

function signature(c) {
  return (c.steps || [])
    .map((s) => `${s.action}:${String(s.target || '').toLowerCase().replace(/\s+/g, ' ').trim()}`)
    .join('|');
}

export function validateDedup(cases) {
  const ev = [];
  const seen = new Map();
  cases.forEach((c) => {
    const sig = signature(c);
    if (!sig) return;
    if (seen.has(sig))
      ev.push(evidence('error', `case ${c.id || c.title} duplicates ${seen.get(sig)} (identical steps)`, c.id));
    else seen.set(sig, c.id || c.title);
  });
  if (ev.length === 0) ev.push(evidence('info', `no duplicates across ${cases.length} cases`));
  return result('dedup', ev, cases.length || 1);
}
