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

test('business-rules: domain rules (delete-guard, cascade, permission, clone, poller, export, session, positional)', () => {
  // BR-DELETE-GUARD-USED-COUNT
  assert.equal(validateBusinessRules([{ id: 'D1', title: 'Delete role with Used Count > 0', expected: [{ text: 'role removed' }] }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'D2', title: 'Delete role with Used Count > 0', expected: [{ text: 'delete blocked, role in use' }] }]).pass, true);

  // BR-CASCADE-NOT-IMPLICIT
  assert.equal(validateBusinessRules([{ id: 'C1', title: 'Parent group visibility vs child group', expected: [{ text: 'child group monitors also visible' }] }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'C2', title: 'Parent group visibility vs child group', expected: [{ text: 'child group is not inherited automatically' }] }]).pass, true);

  // BR-PERMISSION-DENIAL-EXPLICIT
  assert.equal(validateBusinessRules([{ id: 'P1', title: 'Report download without Query permission missing', expected: [{ text: 'download does nothing' }] }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'P2', title: 'Report download without Query permission missing', expected: [{ text: 'error toast: permission denied' }] }]).pass, true);

  // BR-UI-HIDDEN-NEEDS-BACKEND-403
  assert.equal(validateBusinessRules([{ id: 'H1', title: 'Viewer role', expected: [{ text: 'Delete button is hidden' }] }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'H2', title: 'Viewer role', expected: [{ text: 'Delete button is hidden; direct API call returns 403 forbidden' }] }]).pass, true);

  // BR-CLONE-INDEPENDENCE
  assert.equal(validateBusinessRules([{ id: 'CL1', title: 'Clone dashboard and edit', expected: [{ text: 'clone shows new widget' }] }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'CL2', title: 'Clone dashboard and edit', expected: [{ text: 'clone shows new widget; original dashboard is unchanged' }] }]).pass, true);

  // BR-POLLER-WINDOW-MATH
  assert.equal(validateBusinessRules([{ id: 'AL1', title: 'Policy occurrence and poll interval feasibility' }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'AL2', title: 'Policy occurrence and poll interval feasibility', data: { poll_interval: '5m', occurrence_window: '15m' }, expected: [{ text: 'fires' }] }]).pass, true);

  // BR-EXPORT-VALUE-FIDELITY
  assert.equal(validateBusinessRules([{ id: 'EX1', title: 'Export report to pdf', expected: [{ text: 'file downloads' }] }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'EX2', title: 'Export report to pdf', expected: [{ text: 'tag value and row order preserved in filename' }] }]).pass, true);

  // BR-CONCURRENT-SESSION-DENIAL
  assert.equal(validateBusinessRules([{ id: 'S1', title: 'Concurrent session for same user', expected: [{ text: 'both sessions active' }] }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'S2', title: 'Concurrent session for same user', expected: [{ text: 'first session forced logout' }] }]).pass, true);

  // BR-NO-POSITIONAL-TARGET
  assert.equal(validateBusinessRules([{ id: 'PO1', title: 'x', steps: [{ action: 'click', target: "row.nth(2)" }], expected: [{ text: 'ok' }] }]).pass, false);
  assert.equal(validateBusinessRules([{ id: 'PO2', title: 'x', steps: [{ action: 'click', target: "row with text 'Cisco'" }], expected: [{ text: 'ok' }] }]).pass, true);
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
