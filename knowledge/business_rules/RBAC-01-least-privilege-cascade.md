---
key: RBAC-01
title: Least-privilege cascade — a Role's grants gate both visibility and action everywhere
modules: [Settings]
screens: [Settings/users-settings/roles, Settings/users-settings/user-profile]
status: draft
sources: [kb, catalog]
verified: 2026-08-07
related_defects: [PQD-38798]
gate_rule: BR-PERMISSION-DENIAL-EXPLICIT
---

# RBAC-01 — Least-privilege cascade

## Rule
A **Role**'s permission grants are the single source of truth for what a user may see and do across
every module of ObserveOps (dashboards, reports, monitors, policies, admin screens). Removing or never
granting a permission must be **visible and explicit** to the affected user — the product must not
silently drop a capability without an error/toast explaining why the action isn't available.

## Why
A **read-only user could not download reports** because their role was missing the **Query** grant.
The capability was silently absent — no error, no explanation — which made the defect very hard to
diagnose from the support side (`customer-issue-kb.md` §4, **PQD-38798**).

## Test implications
- For every "missing permission" negative case, assert an explicit error/toast/message is shown, not
  just an absent button or a no-op click.
- Regress the exact PQD-38798 scenario: grant/revoke the **Query** permission on a role and assert
  report-download availability toggles accordingly, with a clear message on the denied path.
- Enforced by governance gate rule `BR-PERMISSION-DENIAL-EXPLICIT`
  (`governance/validation/business-rules.js`).

## Related
[[RBAC-02]] · [[RBAC-03]] · [[RBAC-04]] · `Settings/users-settings/roles.md` §9/§10
