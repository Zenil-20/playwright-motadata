---
key: DISCOVERY-02
title: ifSpeed=0 guard — utilization must never compute to 100%/infinite on a zero-speed interface
modules: [Settings]
screens: [Settings/network-discovery]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: null
---

# DISCOVERY-02 — ifSpeed=0 guard

## Rule
When a discovered device reports an interface speed (`ifSpeed`) of 0 — common on some virtual/logical
interfaces — the utilization calculation (`traffic / ifSpeed`) must not be allowed to divide by zero
and surface as 100% or infinite utilization. The UI should either suppress the metric with a validation
nudge, or require/allow a manual speed override before computing utilization.

## Why
QA-implication #7 in `customer-issue-kb.md`: "provision a device whose ifSpeed is 0; assert utilization
is not 100%/infinite and a validation nudge appears." A silently wrong 100% utilization number on a
monitoring dashboard is worse than a missing one — it looks like real signal and can trigger false
alert storms.

## Test implications
- Provision/simulate a device with `ifSpeed = 0`; assert the utilization widget/report does not show
  100% or an error value, and that a validation nudge/tooltip is present.
- Assert this interface does not spuriously trigger utilization-threshold alert policies.

## Related
[[DISCOVERY-01]]
