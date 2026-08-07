---
key: HA-01
title: HA bring-up must fail explicitly on bad preconditions — never settle into dual-primary/dual-VIP
modules: [Settings]
screens: [Settings/system-settings]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: null
---

# HA-01 — No dual-primary

## Rule
Bringing up an HA pair (Primary/Secondary/Observer) under any of the following adverse conditions must
produce an **explicit diagnostic** and refuse to complete — it must never settle into a dual-primary or
dual-VIP state:
- Observer node is down during bring-up.
- Clock skew between nodes exceeds NTP drift tolerance.
- Nodes have mismatched timezones.

## Why
Root-cause theme #1 (manual config edits / skipped SOPs) and the HA-specific QA-implication #3 in
`customer-issue-kb.md` identify dual-primary/dual-VIP as the class of outage that manual/rushed HA
bring-up produces, and it is called out as "the #1 preventable outage source."

## Test implications
- Attempt HA bring-up with Observer down; assert an explicit blocking diagnostic, not a degraded
  "succeeded" state.
- Attempt bring-up with induced clock skew beyond tolerance and with mismatched timezones; assert the
  same explicit-failure behavior in both cases.
- Never accept "it eventually stabilized" as a pass — a transient dual-primary window is itself the
  defect being tested for.

## Related
[[LICENSE-01]]
