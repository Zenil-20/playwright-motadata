---
key: REPORT-02
title: Export fidelity — scheduled/manual exports preserve tag values, ordering, and clean filenames
modules: [Reports]
screens: [Reports]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: BR-EXPORT-VALUE-FIDELITY
---

# REPORT-02 — Export fidelity

## Rule
Any report or grid export (PDF/XLSX/CSV, scheduled or on-demand) must:
- Show tag/column **values** as the user would recognize them (names), not internal IDs.
- Preserve correct ordering for parent/child group hierarchies.
- Produce filenames without stray suffixes/artifacts from the export pipeline.
- Correctly render every export format for every filter operator used in the report (including
  **Between**).

## Why
QA-implication #9 in `customer-issue-kb.md`: "report export fidelity: schedule reports in every format
(PDF/XLSX), with Between operators, tags, and parent/child groups; verify format, tag *values* (not
IDs), ordering, and suffix-free filenames." Exported reports are often the artifact a customer actually
shares outward (to their own stakeholders), so fidelity issues here are high-visibility.

## Test implications
- Schedule/export the same report in each supported format, with a **Between** filter, at least one
  tag, and a parent/child group; assert value fidelity, ordering, and filename cleanliness in every
  case.
- Assert expected results reference actual values/order/filenames — not internal identifiers — per
  governance gate rule `BR-EXPORT-VALUE-FIDELITY`.

## Related
[[REPORT-01]]
