/*
 * Gate: assertion quality (exit gate of stage 07, part 2).
 * Every case must assert observable behavior — a toast, text, row, status, URL or count —
 * not DOM structure or CSS classes. Input: cases[].
 */

import { result, evidence } from './result.js';

const BEHAVIORAL = ['toast', 'text', 'row_visible', 'row', 'status', 'url', 'count', 'value', 'visible'];
const STRUCTURAL = /class=|\.ant-|css|nth-child|tagName|innerHTML/i;

export function validateAssertions(cases) {
  const ev = [];
  let checks = 0;

  cases.forEach((c) => {
    checks++;
    const exp = c.expected || [];
    if (exp.length === 0) {
      ev.push(evidence('error', `${c.id || c.title}: no assertion`, c.id));
      return;
    }
    exp.forEach((e, i) => {
      checks++;
      const key = typeof e === 'object' ? Object.keys(e)[0] : String(e);
      const val = typeof e === 'object' ? Object.values(e)[0] : e;
      if (!BEHAVIORAL.includes(key))
        ev.push(evidence('warn', `${c.id}: assertion '${key}' is not a known behavioral key`, c.id));
      if (STRUCTURAL.test(String(val)))
        ev.push(evidence('error', `${c.id}: assertion[${i}] checks DOM/CSS structure, not behavior`, c.id));
    });
  });

  if (!ev.some((e) => e.level === 'error'))
    ev.push(evidence('info', `assertions behavioral across ${cases.length} cases`));
  return result('assertions', ev, checks);
}
