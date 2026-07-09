/*
 * Gate: requirement completeness (exit gate of stage 01).
 * A requirement may not proceed unless it has testable, cited acceptance criteria.
 * Input: a requirement object { key, title, acceptance_criteria:[{id,text,source}], ... }.
 */

import { result, evidence, checkProvenance } from './result.js';

const VAGUE = /\b(etc|and so on|tbd|somehow|as needed|appropriate|handle it|works?\s+fine)\b/i;

export function validateRequirement(req) {
  const ev = [];
  let checks = 0;

  const bump = () => { checks++; };

  bump();
  if (!req || !req.title || !String(req.title).trim())
    ev.push(evidence('error', 'requirement has no title'));

  const acs = (req && req.acceptance_criteria) || [];
  bump();
  if (acs.length === 0)
    ev.push(evidence('error', 'no acceptance criteria — requirement is not testable', req && req.key));

  acs.forEach((ac, i) => {
    const ref = ac.id || `AC[${i}]`;
    bump();
    if (!ac.text || !String(ac.text).trim())
      ev.push(evidence('error', `${ref}: empty acceptance criterion`, ref));
    else if (VAGUE.test(ac.text))
      ev.push(evidence('error', `${ref}: ambiguous/untestable wording ("${ac.text.trim().slice(0, 60)}")`, ref));
    bump();
    const p = checkProvenance(ac, ref, ref);
    if (p) ev.push(p);
  });

  if (ev.length === 0) ev.push(evidence('info', `requirement OK: ${acs.length} cited, testable criteria`));
  return result('requirement-completeness', ev, checks);
}
