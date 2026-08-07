---
key: UPGRADE-01
title: Upgrades must never wipe existing policy notifications/actions; alerting must survive
modules: [Settings]
screens: [Settings/policy-settings, Settings/system-settings]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: [MOTADATA-7641]
gate_rule: null
---

# UPGRADE-01 — Policy/config survival across upgrades

## Rule
An N → N+2 (or any supported jump) product upgrade must preserve every existing policy's notification
and action configuration. Post-upgrade, alerts and downstream tickets must continue to generate exactly
as they did pre-upgrade for unchanged policies.

## Why
Root-cause theme #1 and #4 in `customer-issue-kb.md` (manual config edits/skipped SOPs; version
mismatch after upgrade) both surface as wiped policies or broken notification/action wiring after an
upgrade — cited as the **MOTADATA-7641** class of defect.

## Test implications
- QA-implication #1: run an upgrade matrix (N → N+2) with default policies carrying notifications and
  actions configured; assert none are wiped and that alerts/tickets still generate post-upgrade.
- Cover both a same-version-family upgrade and a skipped-version jump, since the KB explicitly calls
  out "ISO patch chains skipped" as a contributing cause.

## Related
[[HA-01]]
