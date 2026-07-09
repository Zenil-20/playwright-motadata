/*
 * Gate: automation review (exit gate of stage 07, part 3).
 * Lints the GENERATED spec text for the bans in governance/policy/POLICY.md: no networkidle, no blind
 * timeouts, no positional selectors, and at least one real assertion. Input: specText (string).
 */

import { result, evidence } from './result.js';

const BANS = [
  { re: /waitForLoadState\(\s*['"]networkidle['"]\s*\)/, msg: "networkidle wait is banned — use toBeVisible / waitForURL / expect.poll" },
  { re: /waitForTimeout\(\s*\d+\s*\)/, msg: 'blind waitForTimeout is banned — wait on a condition' },
  { re: /\.nth\(\s*\d+\s*\)/, msg: 'positional .nth(index) is banned — scope to role/label/row' },
  { re: /\/\/\w+\[\d+\]/, msg: 'positional XPath //el[n] is banned — re-scope' },
];

export function validateSpec(specText) {
  const ev = [];
  let checks = 0;
  const src = String(specText || '');

  BANS.forEach((b) => {
    checks++;
    if (b.re.test(src)) ev.push(evidence('error', b.msg));
  });

  checks++;
  if (!/\bexpect\s*\(/.test(src)) ev.push(evidence('error', 'spec has no assertion (expect(...) missing)'));

  checks++;
  if (!/from ['"]@playwright\/test['"]/.test(src)) ev.push(evidence('warn', 'spec does not import @playwright/test'));

  if (!ev.some((e) => e.level === 'error')) ev.push(evidence('info', 'spec passes automation-review lints'));
  return result('automation-review', ev, checks);
}
