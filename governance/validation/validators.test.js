/*
 * Self-tests for the validation gates. Run: `npm run test:gates` (node --test).
 * Each validator is checked BOTH ways: it must reject a violation and pass clean input.
 * This is the "who tests the tester" guarantee.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateRequirement } from './requirement.js';
import { validateCoverage } from './coverage.js';
import { validateDedup } from './dedup.js';
import { validateBusinessRules } from './business-rules.js';
import { validateLocators } from './locators.js';
import { validateAssertions } from './assertions.js';
import { validateSpec } from './automation-review.js';
import { validateCoverageApproval } from './coverage-approval.js';
import { runGate } from './index.js';

test('requirement: rejects missing/ambiguous/uncited AC, passes clean', () => {
  assert.equal(validateRequirement({ title: 'x', acceptance_criteria: [] }).pass, false);
  assert.equal(validateRequirement({ title: 'x', acceptance_criteria: [{ id: 'AC1', text: 'handle it somehow', source: 'jira' }] }).pass, false);
  assert.equal(validateRequirement({ title: 'x', acceptance_criteria: [{ id: 'AC1', text: 'user can log in' }] }).pass, false); // no source
  assert.equal(validateRequirement({ title: 'Login', acceptance_criteria: [{ id: 'AC1', text: 'valid creds land on dashboard', source: 'jira' }] }).pass, true);
});

test('coverage: rejects uncovered AC / orphan / no-negative, passes clean', () => {
  const uncovered = validateCoverage([{ id: 'TC1', title: 'happy', traces_to: ['AC1'] }], ['AC1', 'AC2']);
  assert.equal(uncovered.pass, false);
  const orphan = validateCoverage([{ id: 'TC1', title: 'x', traces_to: [] }], []);
  assert.equal(orphan.pass, false);
  const clean = validateCoverage(
    [{ id: 'TC1', title: 'valid login', traces_to: ['AC1'] }, { id: 'TC2', title: 'invalid login rejected at boundary max length', traces_to: ['AC1'] }],
    ['AC1'],
  );
  assert.equal(clean.pass, true);
});

test('dedup: catches identical step signatures', () => {
  const steps = [{ action: 'click', target: 'Save' }];
  assert.equal(validateDedup([{ id: 'A', steps }, { id: 'B', steps }]).pass, false);
  assert.equal(validateDedup([{ id: 'A', steps: [{ action: 'click', target: 'Save' }] }, { id: 'B', steps: [{ action: 'click', target: 'Cancel' }] }]).pass, true);
});

test('business-rules: create-flow needs idempotency; no literal secrets', () => {
  const bad = validateBusinessRules([{ id: 'TC1', title: 'Create profile', steps: [{ action: 'click', target: 'Save and Run' }], expected: [{ toast: 'ok' }] }]);
  assert.equal(bad.pass, false);
  const secret = validateBusinessRules([{ id: 'TC2', title: 'view', data: { password: 'hunter2' }, expected: [{ text: 'x' }] }]);
  assert.equal(secret.pass, false);
  const good = validateBusinessRules([{ id: 'TC3', title: 'Create profile', preconditions: ['skip-if-exists'], steps: [{ action: 'click', target: 'Save and Run' }], expected: [{ toast: 'ok' }] }]);
  assert.equal(good.pass, true);
});

test('locators: rejects missing/unverified/positional/uncited, passes clean', () => {
  assert.equal(validateLocators([{ id: 'A', steps: [{ action: 'click', target: 'Save' }] }]).pass, false); // no locator
  assert.equal(validateLocators([{ id: 'A', steps: [{ action: 'click', target: 'Save', locator: '#save', verified: false, source: 'cookbook' }] }]).pass, false);
  assert.equal(validateLocators([{ id: 'A', steps: [{ action: 'check', target: 'row', locator: "input[type=checkbox]').nth(1)", verified: true, source: 'cookbook' }] }]).pass, false); // positional
  assert.equal(validateLocators([{ id: 'A', steps: [{ action: 'click', target: 'Save', locator: '#save', verified: true }] }]).pass, false); // no source
  assert.equal(validateLocators([{ id: 'A', steps: [{ action: 'click', target: 'Save', locator: '#save-run-btn-id', verified: true, source: 'cookbook', confidence: 'high' }] }]).pass, true);
});

test('assertions: rejects none/structural, passes behavioral', () => {
  assert.equal(validateAssertions([{ id: 'A', expected: [] }]).pass, false);
  assert.equal(validateAssertions([{ id: 'A', expected: [{ text: 'has class=ant-btn active' }] }]).pass, false);
  assert.equal(validateAssertions([{ id: 'A', expected: [{ toast: 'provisioned successfully' }] }]).pass, true);
});

test('automation-review: rejects banned patterns, passes clean spec', () => {
  assert.equal(validateSpec("await page.waitForLoadState('networkidle');").pass, false);
  assert.equal(validateSpec('await page.locator("x").nth(2).click();').pass, false);
  assert.equal(validateSpec("const x=1;").pass, false); // no expect
  assert.equal(validateSpec("import {test,expect} from '@playwright/test'; test('t',async()=>{await expect(page.getByText('ok')).toBeVisible();});").pass, true);
});

test('coverage-approval: blocks on pending/stale/other, passes on Allow', () => {
  const proposal = { ticket: 'M-1', proposal_hash: 'h1', areas: [{ module: 'Settings', screen: 'discovery', traces_to: ['AC1'] }], totals: { estimated_cases: 24 } };
  assert.equal(validateCoverageApproval(proposal, { decision: 'pending' }).pass, false);       // awaiting
  assert.equal(validateCoverageApproval(proposal, { decision: 'allow', proposal_hash: 'OLD' }).pass, false); // stale
  assert.equal(validateCoverageApproval(proposal, { decision: 'other', proposal_hash: 'h1', additions: ['add IPv6'] }).pass, false); // changes requested
  assert.equal(validateCoverageApproval({ areas: [] }, { decision: 'allow' }).pass, false);      // no proposal
  assert.equal(validateCoverageApproval(proposal, { decision: 'allow', proposal_hash: 'h1', by: 'ansh' }).pass, true); // approved
});

test('gatekeeper: 04_coverage_approval gate blocks until Allow', () => {
  const proposal = { ticket: 'M-1', proposal_hash: 'h1', areas: [{ module: 'X', traces_to: ['AC1'] }], totals: { estimated_cases: 10 } };
  assert.equal(runGate('04_coverage_approval', { proposal, approval: { decision: 'pending' } }).pass, false);
  assert.equal(runGate('04_coverage_approval', { proposal, approval: { decision: 'allow', proposal_hash: 'h1' } }).pass, true);
});

test('gatekeeper: 05_testcases gate blocks a bad suite, passes a good one', () => {
  const bad = runGate('05_testcases', { cases: [{ id: 'A', title: 'x', traces_to: [] }], acIds: ['AC1'] });
  assert.equal(bad.pass, false);
  const good = runGate('05_testcases', {
    acIds: ['AC1'],
    cases: [
      { id: 'A', title: 'valid login', traces_to: ['AC1'], steps: [{ action: 'click', target: 'Login' }], expected: [{ toast: 'welcome' }] },
      { id: 'B', title: 'invalid login rejected, boundary max length', traces_to: ['AC1'], steps: [{ action: 'fill', target: 'User' }], expected: [{ text: 'error' }] },
    ],
  });
  assert.equal(good.pass, true);
});
