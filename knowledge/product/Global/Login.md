---
screen: Login
module: Global
url: "{{env.Motadata_Aiops}}"        # e.g. https://172.16.15.156
build: 8.2.5
status: draft
sources: [spec, cookbook]            # no dedicated login screenshot in the UI set
verified: 2026-07-09
---

# Login

## Purpose
Authenticate a user into ObserveOps AIOps and start a session. Gateway to the whole product.

## Navigation
Open the base URL directly (`{{env.Motadata_Aiops}}`). Unauthenticated users are redirected here.

## Actions
- Enter username
- Enter password
- Submit (Login)
- Log out (from the avatar menu, once inside)
- TODO(source: Motadata KG/docs): "Forgot password", SSO/LDAP login, remember-me — confirm which exist.

## Components
| Control | Locator (cookbook: Global > Login) |
|---|---|
| Username field | `//input[@placeholder='Username']` |
| Password field | `//input[@placeholder='Password']` |
| Login button | `//button[@type='submit']` |
| Success signal (post-login) | `//img[@alt='Avatar']` |
| Logout | avatar → `Logout` |

_Locators verified from the working discovery specs + `knowledge/locators/selector-cookbook.md`._

## Permissions
Open to unauthenticated users. Post-login role governs everything else. RBAC roles TODO(source: docs).

## Entry Conditions
User is not authenticated (no active session/cookie).

## Exit Conditions
- **Success:** lands on the Dashboard (Performance Summary); avatar becomes visible.
- **Failure:** stays on login with an error; no session created.
- **Logout:** session cleared (cookies/permissions), back to Login.

## Validations
- Username and password are required.
- Invalid credentials are rejected (no dashboard, error shown).
- Exact inline-error copy: TODO(source: Motadata KG/docs).

## Business Rules
- Session persists via cookies until logout/expiry.
- Account lockout / password policy / session timeout: TODO(source: docs).

## Known Bugs
_None recorded. Add with a ticket link when found — never invent._

## Edge Cases
- Empty username / empty password.
- Invalid username, invalid password, both invalid.
- Trailing spaces, case sensitivity.
- Locked / disabled account (TODO confirm behavior).
- Session already active (re-login).
