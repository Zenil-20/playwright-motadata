/*
 * Gate: human coverage approval (between stage 04-plan and 05-generate).
 *
 * The observeops "Human Gate #1 (Allow / Other)": no test cases are generated until a HUMAN has
 * approved the coverage proposal. This is a human-in-the-loop gate — the validator confirms the
 * approval exists, matches the CURRENT proposal, and says `allow`. Anything else BLOCKS.
 *
 * Inputs (ctx):
 *   proposal — the planner's coverage proposal  { ticket, proposal_hash, areas[], exclusions, assumptions, totals }
 *   approval — the human decision               { proposal_hash, decision: 'allow'|'other'|'pending', by, additions[] }
 */

import { result, evidence } from './result.js';

export function validateCoverageApproval(proposal, approval) {
  const ev = [];
  let checks = 0;

  // 0. the proposal itself must be non-trivial (planner produced real areas)
  checks++;
  const areas = (proposal && proposal.areas) || [];
  if (areas.length === 0) {
    ev.push(evidence('error', 'no coverage proposal to approve — the planner produced no areas'));
    return result('coverage-approval', ev, checks);
  }

  // 1. an approval decision must exist
  checks++;
  if (!approval || !approval.decision || approval.decision === 'pending') {
    ev.push(evidence('error', `coverage plan awaiting human approval — run /coverage-gate to Allow or request changes (${areas.length} areas, ~${proposal.totals?.estimated_cases ?? '?'} cases)`));
    return result('coverage-approval', ev, checks);
  }

  // 2. the approval must be for THIS proposal (not a stale one)
  checks++;
  if (approval.proposal_hash !== proposal.proposal_hash) {
    ev.push(evidence('error', `approval is for a stale proposal (approval ${approval.proposal_hash} ≠ current ${proposal.proposal_hash}) — re-present and re-approve`, proposal.ticket));
  }

  // 3. 'other' = human requested changes → block, loop back to the planner
  checks++;
  if (approval.decision === 'other') {
    const adds = (approval.additions || []).join('; ') || '(unspecified)';
    ev.push(evidence('error', `human requested changes (Other): ${adds} — update the plan and re-propose`, proposal.ticket));
  } else if (approval.decision !== 'allow') {
    ev.push(evidence('error', `unknown decision '${approval.decision}' — must be 'allow' or 'other'`));
  }

  if (!ev.some((e) => e.level === 'error'))
    ev.push(evidence('info', `coverage approved by ${approval.by || 'human'}: ${areas.length} areas / ~${proposal.totals?.estimated_cases ?? '?'} cases`));
  return result('coverage-approval', ev, checks);
}
