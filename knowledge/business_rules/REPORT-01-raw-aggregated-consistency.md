---
key: REPORT-01
title: Raw vs aggregated data-layer consistency across retention boundaries and large instance counts
modules: [Reports]
screens: [Reports]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: null
---

# REPORT-01 — Raw/aggregated consistency

## Rule
The same availability/interface (or similar) report, run over a date range that (a) sits fully inside
raw-data retention, (b) straddles the raw→aggregated boundary, or (c) is fully inside aggregated
retention, must return **consistent values** for the overlapping period regardless of which data layer
answers the query. The same invariant holds when a tag covers more than 200 instances (an internal
aggregation threshold).

## Why
Root-cause theme #10 in `customer-issue-kb.md`: "raw vs aggregated data-layer divergence — retention
differences and >200-instance thresholds produce inconsistent report/availability numbers depending on
which layer answers the query." This class of bug erodes trust in reported numbers because it's silent
and depends on exactly which range/instance-count a customer happens to query.

## Test implications
- Run the identical report three times: fully-raw range, boundary-straddling range, fully-aggregated
  range; assert values match for the overlapping period (QA-implication #8).
- Repeat with a tag/group covering more than 200 instances to trip the aggregation threshold.
- Treat any mismatch as a defect regardless of magnitude — this is a correctness invariant, not a
  tolerance/rounding question.

## Related
[[REPORT-02]]
