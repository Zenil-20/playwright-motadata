---
key: RBAC-05
title: Concurrent session policy — allow.concurrent.sessions=no must deny/force-logout a second login
modules: [Settings, Global]
screens: [Global/Login]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: [PQD-41192, MOTADATA-8587]
gate_rule: BR-CONCURRENT-SESSION-DENIAL
---

# RBAC-05 — Concurrent session policy

## Rule
When the system config flag `"allow.concurrent.sessions": "no"` is set (`motadata.json`), a second
login attempt for a user who already has an active session must be **denied**, or must **force-logout**
the first session — never silently allow two live sessions for the same account.

## Why
Flagged by VAPT as a security finding: concurrent admin sessions were possible even where the policy
intent was to prevent them (`customer-issue-kb.md` §9, **PQD-41192 / MOTADATA-8587**). The documented
workaround is setting `allow.concurrent.sessions: "no"` — but that config's *enforcement* needs its own
regression coverage, not just a documented workaround.

## Test implications
- With the flag set to `no`: log in as the same user from two sessions/browsers; assert the second
  login is denied, or the first is force-logged-out (pick the actual observed behavior and assert it
  explicitly — don't assert "something happens").
- With the flag set to `yes` (or absent/default): assert both sessions remain valid, to confirm the
  gate isn't blocking the permitted case too.
- Regress alongside role-edit-mid-session cases (`roles.md` §11 edge cases) since both touch session
  state.
- Enforced by governance gate rule `BR-CONCURRENT-SESSION-DENIAL`.

## Related
[[RBAC-04]] · `Settings/users-settings/roles.md` §10 "Known Bugs"
