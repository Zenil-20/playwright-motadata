---
key: RBAC-03
title: In-use entities are delete-protected — Used Count > 0 must block delete or force reassignment
modules: [Settings]
screens: [Settings/users-settings/roles, Settings/users-settings/user-profile, Settings/group-settings]
status: draft
sources: [kb, catalog]
verified: 2026-08-07
related_defects: []
gate_rule: BR-DELETE-GUARD-USED-COUNT
---

# RBAC-03 — Delete protection for in-use entities

## Rule
Any entity that other configuration references by count (**Role**, **User Profile**, **Group**,
**Policy**, dashboard/report **Template**) must not be deletable while its "Used Count"/"Used By" is
greater than zero. The product must either block the delete with a clear message, or force an explicit
reassignment step — never silently orphan the referencing entities (e.g. a user left with no role).

## Why
`roles.md` §9 documents **Used Count** as the mechanism that should protect a role in active use from
deletion; the same shape (a grid column counting consumers, gating a destructive action) recurs across
Profiles, Groups, Policies, and Templates. Treating this as a cross-cutting rule (rather than
re-deriving it per screen) keeps the behavior consistent and testable everywhere it appears.

## Test implications
- For every delete flow on a protected entity type, assert: **Used Count == 0** → delete succeeds;
  **Used Count > 0** → delete is blocked/warned, with the message naming the reason (in use).
- Never assert delete succeeds silently for an in-use entity without also checking downstream state
  (referencing users/profiles/monitors still intact).
- Enforced by governance gate rule `BR-DELETE-GUARD-USED-COUNT`.

## Related
[[RBAC-01]] · [[RBAC-02]] · `Settings/users-settings/roles.md` §9 "Business Rules"
