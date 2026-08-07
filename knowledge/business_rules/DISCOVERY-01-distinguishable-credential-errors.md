---
key: DISCOVERY-01
title: Credential/config discovery failures must be distinguishable, never a silent data gap
modules: [Settings]
screens: [Settings/network-discovery]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: null
---

# DISCOVERY-01 — Distinguishable credential failures

## Rule
When device discovery fails due to a credential or configuration problem — wrong community string,
blank SNMPv3 username, response-IP ≠ request-IP, read-only (vs admin) credentials, WinRM/AD username
format mismatch, or a PAM lockout policy — the product must surface a **distinct, actionable** error for
each cause. It must never fail into a generic "no data"/silent gap that looks identical across causes.

## Why
Root-cause theme #5 in `customer-issue-kb.md`: "credential/permission drift ... the top cause of 'data
missing for one device'." Theme #6 (vendor heterogeneity) and #7 (environment interference) compound
this — operators cannot tell a wrong password apart from a firewalled port apart from an unsupported
CLI dialect unless the error names the cause.

## Test implications
- Build one negative case per credential-failure class listed above; assert each produces a
  **different, identifiable** error message/state — not the same "unreachable"/"no data" for all.
- Include restricted-shell (`appliancesh`) and PAM-lockout as their own cases (QA-implication #11).
- A single generic-looking error across two different injected causes is itself a bug — flag it, don't
  paper over it with a loose assertion.

## Related
[[DISCOVERY-02]]
