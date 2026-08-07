---
key: ALERT-01
title: Poller/window feasibility — an occurrence/flap alert can only fire when the math allows it
modules: [Settings]
screens: [Settings/policy-settings]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: BR-POLLER-WINDOW-MATH
---

# ALERT-01 — Poller/policy-window feasibility

## Rule
For an occurrence- or flap-based alert policy (e.g. "fire after N occurrences within window W"), the
alert can only ever fire if the configured poll interval makes that condition mathematically
satisfiable: `W ≥ poll_interval × N` (adjust per the exact occurrence semantics of the policy type). If
the poller cannot sample often enough to reach N occurrences inside W, the alert must **never fire** —
not fire late, not fire on a partial count, and not silently "sometimes" fire depending on timing luck.

## Why
Root-cause theme #8 in `customer-issue-kb.md`: "poller-interval vs policy-window math — alerts falsely
missing/firing when occurrence/flap windows can't be satisfied by the configured poll cadence." This is
one of the ten most recurring customer-defect themes, meaning policy authors routinely configure
infeasible combinations without the product telling them.

## Test implications
- Parametrize test data with both a poll interval and a window/occurrence count (`data.poll_interval`,
  `data.occurrence_window` or similar) so feasibility is explicit and reviewable, not implicit in
  prose.
- Cover: window feasible → alert fires exactly at the Nth occurrence; window infeasible → alert never
  fires (assert absence over a bounded observation period, not just "no assertion").
- Companion case: re-notification permutations on multi-threshold policies — cycle severity up/down
  and assert no duplicate/missing notifications, with identical content between original and
  re-notification (QA-implication #6 in the KB).
- Enforced by governance gate rule `BR-POLLER-WINDOW-MATH`.

## Related
[[ALERT-02]]
