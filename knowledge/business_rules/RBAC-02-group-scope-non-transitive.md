---
key: RBAC-02
title: Group scope is non-transitive — parent group membership does not cascade to child groups
modules: [Settings]
screens: [Settings/group-settings]
status: draft
sources: [kb, catalog]
verified: 2026-08-07
related_defects: [PQD-38219]
gate_rule: BR-CASCADE-NOT-IMPLICIT
---

# RBAC-02 — Group scope is non-transitive

## Rule
Data-security **Group** assignment does not automatically cascade from a parent group to its child
groups. A user scoped to a parent group sees only what is explicitly assigned to that group; visibility
into a child group's monitors requires an explicit, separate assignment. Effective visibility for any
plane (Monitoring / Log / Flow) is:

```
visibility = group_assignment ∩ profile_scope   (per plane, evaluated per group — not inherited)
```

## Why
A customer-reported defect showed the **parent group did not automatically include child groups** —
users assumed nesting implied inheritance and were surprised by both under- and over-exposure of
monitors (`customer-issue-kb.md`, **PQD-38219**).

## Test implications
- Any parent/child group case must assert the child scope is **not** auto-included — cite this
  explicitly in the expected result (e.g. "child group monitors remain hidden until explicitly
  assigned").
- Cover both directions: a user scoped only to the parent must NOT see child-group monitors; a user
  scoped only to a child must NOT see sibling or parent-only monitors.
- Enforced by governance gate rule `BR-CASCADE-NOT-IMPLICIT`.

## Related
[[RBAC-01]] · [[RBAC-03]] · `Settings/group-settings` (Data Security)
