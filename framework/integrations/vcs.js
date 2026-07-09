/*
 * VCS integration — detect changed files for change-impact analysis.
 * JS port of observeops-qa framework/services/vcs_service.py (implemented via git).
 *
 * Returns [{ ref, title, paths[] }]. Safe no-op ([]) outside a git repo.
 */

import { execFileSync } from 'node:child_process';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

/**
 * Changes since a ref (default: last commit). `since` may be a commit/branch/tag.
 * e.g. detectChanges('origin/main') → files changed vs origin/main.
 */
export function detectChanges(since) {
  try {
    const range = since ? `${since}...HEAD` : 'HEAD~1...HEAD';
    const ref = git(['rev-parse', '--short', 'HEAD']);
    const title = git(['log', '-1', '--pretty=%s']);
    const paths = git(['diff', '--name-only', range]).split('\n').filter(Boolean);
    return paths.length ? [{ ref, title, paths }] : [];
  } catch {
    return []; // not a git repo / git unavailable — behave like the observeops stub
  }
}

/**
 * Map changed paths to affected discovery device rows (naive keyword match) so the
 * pipeline can target regeneration/regression at the impacted area.
 */
export function impactedDevices(paths, deviceKeys) {
  const blob = paths.join(' ').toLowerCase();
  return deviceKeys.filter((k) => blob.includes(k.split('_')[0]));
}
