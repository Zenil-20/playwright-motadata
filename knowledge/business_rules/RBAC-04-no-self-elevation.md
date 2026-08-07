---
key: RBAC-04
title: No self-elevation — a UI-hidden control is not enforcement without a backend denial
modules: [Settings]
screens: [Settings/users-settings/roles, Settings/users-settings/user-profile]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: BR-UI-HIDDEN-NEEDS-BACKEND-403
---

# RBAC-04 — No self-elevation / hidden-control is not enforcement

## Rule
A user must never be able to grant themselves a wider **Role** or **Scope** than their current
session's admin grant allows — neither through the UI nor by calling the underlying API directly.
Consequently, any test that asserts "control X is hidden for role Y" is **incomplete** on its own: it
must be paired with a direct backend check (typically a `403 Forbidden` / permission-denied response)
proving the restriction is enforced server-side, not just cosmetically hidden client-side.

## Why
This is the stated invariant behind the `authorization-testing` skill (`skills/authorization-testing/
SKILL.md`): "a hidden button is not enforcement." A hidden Edit-Role button is easy to bypass by
calling the API directly if the server doesn't independently check the caller's grants.

## Test implications
- Every "control is hidden for this role" assertion must be accompanied by an attempted direct
  action (API call or forced navigation) that gets rejected with 403/forbidden.
- Include a dedicated privilege-escalation case: attempt to self-elevate Scope or Role and assert the
  attempt is rejected end-to-end.
- Enforced by governance gate rule `BR-UI-HIDDEN-NEEDS-BACKEND-403`.

## Related
[[RBAC-01]] · [[RBAC-05]] · `skills/authorization-testing/SKILL.md`
