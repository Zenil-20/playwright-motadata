/*
 * Gate: locator quality (exit gate of stage 07, part 1).
 * Every actionable step must carry a verified, cited locator with acceptable confidence and
 * no positional/order-dependent selector. This enforces the cookbook rule in code.
 * Input: resolvedCases[].
 */

import { result, evidence, checkProvenance, ACTIONABLE } from './result.js';

const POSITIONAL = /\[\s*\d+\s*\]|\.nth\(\s*\d+\s*\)|\/\/\w+\[\d+\]/; // //div[13], .nth(2), [3]
const CONF_OK = ['high', 'medium'];

export function validateLocators(resolvedCases) {
  const ev = [];
  let checks = 0;

  resolvedCases.forEach((c) => {
    (c.steps || []).forEach((s, i) => {
      if (!ACTIONABLE.includes(s.action)) return;
      const ref = `${c.id || c.title}:step${i}(${s.action})`;

      checks++;
      const loc = s.action === 'raw' ? s.code : s.locator;
      if (!loc || !String(loc).trim()) {
        ev.push(evidence('error', `${ref}: no locator — spec-writer must refuse to invent one`, ref));
        return;
      }

      checks++;
      if (s.verified !== true) ev.push(evidence('error', `${ref}: locator not verified (count()===1 unproven)`, ref));

      checks++;
      if (POSITIONAL.test(String(loc)))
        ev.push(evidence('error', `${ref}: positional/order-dependent selector is banned — re-scope to role/label/row`, ref));

      checks++;
      const p = checkProvenance(s, ref, ref);
      if (p) ev.push(p);

      if (s.confidence) {
        checks++;
        if (s.confidence === 'reject')
          ev.push(evidence('error', `${ref}: reject-tier locator must never reach automation`, ref));
        else if (!CONF_OK.includes(s.confidence) && !s.fallback)
          ev.push(evidence('warn', `${ref}: '${s.confidence}' confidence with no fallback (self-heal weak)`, ref));
      }
    });
  });

  if (!ev.some((e) => e.level === 'error'))
    ev.push(evidence('info', `locators OK across ${resolvedCases.length} resolved cases`));
  return result('locators', ev, checks);
}
