/*
 * Failure reporter — writes a triage-ready JSON summary of failed tests.
 *
 * Bridges playwright-motadata's failure-triager agent (agents/
 * failure-triager.md) with observeops-qa's "capture evidence on failure" habit.
 * The triager reads reports/failures.json (spec, step, error, trace) instead of
 * being hand-fed each trace path.
 *
 * Registered in playwright.config.js:  ['./lib/reporters/failure-reporter.js']
 */

import fs from 'node:fs';
import path from 'node:path';

export default class FailureReporter {
  constructor() { this.failures = []; }

  onTestEnd(test, result) {
    if (result.status === 'passed' || result.status === 'skipped') return;

    const err = (result.errors && result.errors[0]) || result.error || {};
    const trace = (result.attachments || []).find((a) => a.name === 'trace');
    const errorContext = (result.attachments || []).find((a) => a.name === 'error-context');

    this.failures.push({
      spec: test.location ? path.relative(process.cwd(), test.location.file) : test.title,
      title: test.titlePath().join(' › '),
      status: result.status,           // 'failed' | 'timedOut' | 'interrupted'
      retry: result.retry,
      failing_step: err.location
        ? `${path.relative(process.cwd(), err.location.file)}:${err.location.line}`
        : null,
      error: (err.message || String(err)).split('\n').slice(0, 12).join('\n'),
      trace: trace ? path.relative(process.cwd(), trace.path) : null,
      error_context: errorContext ? path.relative(process.cwd(), errorContext.path) : null,
      duration_ms: result.duration,
    });
  }

  onEnd() {
    const dir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'failures.json');
    fs.writeFileSync(out, JSON.stringify({
      generated_at: new Date().toISOString(),
      count: this.failures.length,
      failures: this.failures,
    }, null, 2), 'utf8');
    if (this.failures.length) {
      // eslint-disable-next-line no-console
      console.log(`\n[failure-reporter] ${this.failures.length} failure(s) → ${path.relative(process.cwd(), out)} (feed to failure-triager)`);
    }
  }
}
