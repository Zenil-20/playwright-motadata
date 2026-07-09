/*
 * Shared validation primitives.
 *
 * Every validator returns a ValidationResult: { validator, pass, score, evidence[] }.
 * `pass:false` blocks the pipeline stage transition. This is the code form of the rules
 * that used to live only in governance/policy/POLICY.md.
 */

/** @typedef {{level:'error'|'warn'|'info', msg:string, ref?:string}} Evidence */

export function evidence(level, msg, ref) {
  return ref === undefined ? { level, msg } : { level, msg, ref };
}

/**
 * Build a result. It PASSES iff there are zero `error`-level evidence items.
 * score = 1 - errors/checks (clamped), so partial credit is visible in reports.
 */
export function result(validator, evidenceList, checks) {
  const errors = evidenceList.filter((e) => e.level === 'error').length;
  const denom = checks && checks > 0 ? checks : Math.max(1, evidenceList.length || 1);
  const score = Math.max(0, Math.min(1, 1 - errors / denom));
  return { validator, pass: errors === 0, score: Number(score.toFixed(3)), evidence: evidenceList };
}

/** Allowed provenance sources for any AI-emitted fact/locator. */
export const PROVENANCE_SOURCES = ['cookbook', 'suite', 'explored', 'jira', 'figma', 'trace'];

/**
 * The core anti-hallucination rule: no AI output is trusted without a cited source.
 * Returns an error Evidence when the item lacks a valid `source`, else null.
 */
export function checkProvenance(item, label, ref) {
  const src = item && item.source;
  if (!src) return evidence('error', `${label}: missing provenance (no cited source)`, ref);
  if (!PROVENANCE_SOURCES.includes(String(src)))
    return evidence('error', `${label}: invalid source '${src}' (allowed: ${PROVENANCE_SOURCES.join(', ')})`, ref);
  return null;
}

/** Actions that touch the UI and therefore require a verified locator. */
export const ACTIONABLE = ['navigate', 'click', 'fill', 'select', 'check', 'uncheck', 'raw'];
