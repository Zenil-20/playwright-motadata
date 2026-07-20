---
name: api-security-testing
description: OWASP-API-Top-10 security checks against the Motadata ObserveOps AIOps backend REST APIs behind discovery/policy/monitor/RBAC CRUD — BOLA/object-level auth, broken auth, mass assignment, injection, rate limiting and info leakage — asserted via a Playwright request context alongside the UI E2E. Use when a flow touches a privileged or multi-tenant endpoint.
---
# API Security Testing (ObserveOps)

ObserveOps is a multi-tenant AIOps platform: monitors, policies and dashboards are scoped to **groups** via
RBAC (Roles + User Profiles + Group → Data Security). Its UI is a Vue 3 / Ant Design SPA over JSON REST APIs.
The security surface that matters most is **not** the login page — it is whether the backend re-checks
authorization on every object, or trusts the UI to hide buttons. This skill runs OWASP-API-Top-10 checks against
those endpoints with a Playwright `request` context, using ObserveOps's real RBAC screens as the source of the
role/scope dimensions.

## When to use / When NOT
- **Use** when a spec exercises an endpoint that returns tenant-scoped data (monitor data, logs, flows, policies)
  or a privileged admin action (discovery, RBAC config, LDAP/SSO settings).
- **Use** to prove that hiding a control in the SPA is backed by a backend `403` — the classic AIOps risk is a
  read-only operator hitting the create/delete endpoint directly.
- **Do NOT** run against production or a shared lab others depend on — these checks mutate/enumerate. Use the
  disposable 172.16.x lab env.
- **Do NOT** fabricate endpoints or "findings". A real finding cites the request, the two roles used, and the
  wrong status. No captured request → no claim.

## Procedure (ObserveOps-specific)
Drive these against endpoints you have **observed** the SPA fire (harvest via `motadata-explorer` / Chrome
network panel), reusing the framework's avatar-visible authenticated session per role.

1. **BOLA / object-level authorization (top AIOps risk).** Create a monitor/policy/discovery-profile as an admin
   scoped to **Group A**. Authenticate as an operator whose **User Profile** `Scope By` is **Group B**
   (`knowledge/product/Settings/users-settings/user-profiles.md`) and hit `GET/PUT/DELETE .../{id}` for the
   Group-A object. Expect `403`/`404`, never `200`. This is the API-level proof of the **Data Security** rule
   *"visibility = group assignment ∩ user profile scope"* (`group-settings/data-security.md`) — and directly
   regresses **PQD-38219** (parent group does not auto-include children; nested groups must be selected
   explicitly).
2. **BFLA / function-level authorization.** Take an operator whose **Role**
   (`users-settings/roles.md`) lacks a grant and call the privileged endpoint directly (create discovery
   profile, delete role, edit LDAP server). The UI hides the button; the API must still return `403`. Regress
   **PQD-38798** at the API layer: a role missing the **Query** grant must be *denied* the report/query endpoint,
   not silently returned empty.
3. **Broken authentication.** Call a protected endpoint with: no token, an expired token, a tampered token, and
   after logout. Each must be `401`. Confirm **concurrent admin sessions** are governed per **PQD-41192 /
   MOTADATA-8587** (`"allow.concurrent.sessions": "no"`) — an old session token must stop working once disabled.
4. **Mass assignment.** POST/PUT a user-profile or role update with extra fields the UI never sends
   (`"role":"admin"`, `"scope":"all"`, internal ids). Re-GET and assert the privileged field did **not** change —
   an operator must not escalate their own scope/role by padding the body.
5. **Injection & info leakage.** Send SQL/NoSQL/command payloads through discovery filters, monitor search, log
   query params. Assert no `500`, and the response/error never leaks SQL text, stack traces, internal file paths,
   or backend host details. ObserveOps runs real device credentials (SNMP/SSH/WMI) — an error must never echo a
   stored credential.
6. **Rate limiting.** Hammer the login endpoint and any expensive discovery/report trigger; expect `429` and a
   `Retry-After`/`X-RateLimit-*` header. Assert pagination caps (`limit=100000` must not return everything).

Example (two real ObserveOps roles, one object — the BOLA core):
```js
const admin    = await request.newContext({ baseURL: BASE, extraHTTPHeaders: adminAuth });
const scopedOp = await request.newContext({ baseURL: BASE, extraHTTPHeaders: groupBOperatorAuth });
// admin owns a Group-A monitor id (created earlier); scoped operator is Group-B only
const res = await scopedOp.get(`/api/.../monitors/${groupAMonitorId}`);   // path OBSERVED, not guessed
expect([403, 404], 'Group-B operator must not read a Group-A object').toContain(res.status());
```

## Rules & anti-patterns (tie to our conventions)
- **Every finding is cited.** Provenance / no fabrication: a claim needs the request, the roles, and the status
  observed. Route confirmed defects into `knowledge/known_issues/customer-issue-kb.md` with the PQD id.
- **UI-hidden ≠ secure.** Always re-test the action at the API layer with the least-privileged role; the SPA
  hiding a button proves nothing.
- **Reuse real RBAC fixtures.** Roles/User-Profiles/Data-Security are actual screens — seed the two test
  identities through them (or the `seed-data` skill), don't mock a token with a hand-made `role` claim unless the
  test *is* the alg/none / tampered-token check.
- **Lab only, quarantine not mask.** Destructive/enumerating checks stay off prod; a real vuln is quarantined and
  reported, never silenced to keep the suite green.

Adapted from qaskills/seed-skills/api-security-testing
