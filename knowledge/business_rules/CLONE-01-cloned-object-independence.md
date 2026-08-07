---
key: CLONE-01
title: Cloned-object independence — editing a clone must never affect the original
modules: [Dashboards, Settings]
screens: [Dashboards, Settings/policy-settings]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: [MOTADATA-6574]
gate_rule: BR-CLONE-INDEPENDENCE
---

# CLONE-01 — Cloned-object independence

## Rule
Cloning/duplicating a dashboard, policy, or template must produce a fully independent copy. Editing the
clone (widgets, thresholds, layout, any field) must never mutate the original object.

## Why
QA-implication #15 in `customer-issue-kb.md`: "clone dashboards/policies/templates, edit the clone,
assert the original is untouched (**MOTADATA-6574** class)."

## Test implications
- For every clonable entity type (dashboard, policy, template), clone it, make a distinguishing edit
  on the clone, then re-load the original and assert it is byte-for-byte unchanged from before the
  clone's edit.
- Also cover the companion QA-implication in the same bullet: delete a parent-child dependency entry
  and assert the child monitor resumes from suspension rather than staying orphaned/suspended.
- Enforced by governance gate rule `BR-CLONE-INDEPENDENCE`.

## Related
[[REPORT-01]]
