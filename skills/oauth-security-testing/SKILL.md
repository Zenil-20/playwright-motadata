---
name: oauth-security-testing
description: Security testing for Motadata ObserveOps's federated-auth screens — SAML Single Sign-On, LDAP/Active Directory, and RADIUS server settings — covering redirect/host validation, token/assertion handling, user auto-import, and login fallback. Use when a change touches SSO/LDAP/RADIUS config or the login path; cites the SSO redirect bug PQD-36619.
---
# Federated-Auth / SSO Security Testing (ObserveOps)

ObserveOps delegates authentication to enterprise identity via three real screens, all under
`Settings → User Settings`:
- **Single Sign-On** (`knowledge/product/Settings/users-settings/single-sign-on.md`) — **SAML**, ObserveOps as
  the Service Provider (SP) against a corporate IdP (Azure AD / ADFS / Okta). Route
  `/settings/users-settings/single-sign-on`.
- **LDAP Server Settings** (`users-settings/ldap-server-settings.md`) — LDAP/AD auth + user/group **sync**.
  Route `/settings/users-settings/ldap-server-settings`.
- **RADIUS Server Settings** (`users-settings/radius-server-settings.md`) — external RADIUS/AAA auth (IP, port,
  shared secret, protocol). Route `/settings/users-settings/radius-server-settings`.

This is not textbook OAuth2 authorization-code/PKCE — it is ObserveOps's actual SAML-SSO + directory-auth stack.
The security stakes are high: **enabling SSO changes how everyone logs in** (high blast radius), and a
misconfiguration can lock every user out.

## When to use / When NOT
- **Use** when a change touches any of the three screens, the login page's SSO entry, user auto-import, or the
  SP↔IdP URL/cert exchange.
- **Use** to regress the cited SSO redirect defect on affected builds/deployments (below).
- **Do NOT** run a live SP→IdP round trip against a shared corporate IdP casually — use the lab IdP / test tenant;
  a bad ACS/Logout URL registration breaks real logins.
- **Do NOT** invent conditional fields. The screen docs mark the metadata-upload control, manual IdP fields
  (Entity ID / SSO URL / x509 cert), and the **Save** button (no captured id) as not-fully-captured — harvest
  live via `motadata-explorer` and resolve **Save** by role/label before asserting.

## Procedure (ObserveOps-specific)
1. **SP identifier integrity.** On the SSO screen the four SP URLs — **Service Provider Entity ID**, **Redirect
   URL**, **Service Provider Login URL (ACS)**, **Service Provider Logout URL (SLO)** — are generated read-only to
   paste into the IdP. Assert they are read-only and that a mismatched ACS/Logout URL at the IdP breaks the round
   trip (this is where most SSO breakage lives).
2. **Redirect / host validation — regress PQD-36619.** The **Azure AD SSO redirect fails when the SP is reached
   via a NAT'd public domain**; SSO redirect only supports the **local/VIP IP**
   (`customer-issue-kb.md` §11, PQD-36619 / MOTADATA-7744). Assert the documented local/VIP-only limitation:
   reaching the SP via a public/NAT domain must fail the documented way (not a generic hang), and the local/VIP-IP
   redirect must succeed. Related: OAuth2.0 **SMTP** config errors from wrong Azure auth/token URLs (PQD-38421) —
   shares the Azure app-registration setup; check when SMTP-OAuth is in scope.
3. **Assertion / cert handling.** Test an invalid/expired IdP **x509 certificate**, a malformed/oversized SAML
   **metadata file**, and **clock-skew** between SP and IdP (SAML assertion time window) — each must be rejected
   cleanly, not accepted or crashed.
4. **User auto-import scope.** With **Enable User Import** ON, a first-login IdP-authenticated unknown user is
   auto-provisioned — assert *which Role/Profile* they receive (must be least-privilege, `TODO(source: KG/docs)`
   in the doc — confirm live, don't assume admin). With it OFF, the unknown user must be **rejected**, not
   silently created.
5. **Lockout / fallback (highest-severity).** Enable SSO, then remove/break the IdP: assert a **local-admin
   fallback login** still exists so the platform is not bricked. Toggle SSO OFF after enabling and assert whether
   active SSO sessions survive or drop. This is the single most important SSO safety check.
6. **LDAP/AD.** Test bind with wrong credentials (clean failure, no leak of the bind DN/password), a **Sync**
   (`#start-rediscovery` / `[data-testid='ldap-sync-trigger']`) mapping LDAP Groups → Roles/Profiles, and that a
   disabled/removed directory user loses access on next sync. Confirm the **shared secret** (RADIUS) and LDAP bind
   password are never echoed back in any response or error.
7. **RADIUS.** Verify protocol/secret mismatch fails auth cleanly; the shared secret field is write-only/masked.
8. **Single-logout & concurrency.** Test SLO initiated at the IdP vs at the SP; combine with the concurrent-session
   control (PQD-41192 / MOTADATA-8587, `"allow.concurrent.sessions":"no"`).

## Rules & anti-patterns (tie to our conventions)
- **Local-admin fallback is mandatory before enabling SSO in any test** — never leave the lab bricked.
- **Secrets never round-trip.** LDAP bind password, RADIUS shared secret, IdP private material must be masked and
  never appear in responses, errors, or logs.
- **No fabricated fields/URLs; provenance always.** SP URLs, conditional IdP fields, and grant names come from a
  live harvest or the KG — the docs explicitly flag what wasn't captured. Resolve **Save** by role/label
  (`count()===1`), don't assume an id.
- **Smart waits, lab env only.** Await the redirect/response; no `networkidle`. Federated-auth changes hit every
  user — never against a shared prod IdP.
- **Quarantine, don't mask.** A reproduced SSO/LDAP defect is filed with its PQD id in
  `knowledge/known_issues/customer-issue-kb.md`, not worked around to green the suite.

Adapted from qaskills/seed-skills/oauth-security-testing
