---
key: ALERT-02
title: Re-notification idempotence across severity transitions on multi-threshold policies
modules: [Settings]
screens: [Settings/policy-settings]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: null
---

# ALERT-02 — Re-notification idempotence

## Rule
A multi-threshold policy with re-notification enabled on a subset of severities must never send a
**duplicate** notification for the same alert state, nor **drop** a notification it owes. When severity
cycles up and back down across thresholds, the content of the original notification and any
re-notification for the same severity must be identical (no drift in fields/wording).

## Why
QA-implication #6 in `customer-issue-kb.md`: "re-notification permutations: multi-threshold policies
with re-notification on a subset of severities; cycle severity up/down; assert no duplicate or missing
notifications and identical content between original and re-notification mails." This is a named gap
in current coverage, not (yet) tied to a single filed defect — captured here so it gets a case, not
just a KB bullet.

## Test implications
- Build a severity-cycling scenario (e.g. Warning → Critical → Warning → Critical) against a policy
  with re-notification enabled only on a subset of severities; assert exactly the expected
  notification count and compare content byte-for-byte (or field-for-field) between the two Critical
  notifications.
- Pair with [[ALERT-01]] so the underlying occurrence timing is itself feasible before judging
  notification correctness.

## Related
[[ALERT-01]]
