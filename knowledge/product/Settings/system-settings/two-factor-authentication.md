---
screen: System Settings · Two-Factor Authentication
module: Settings
category: system-settings
route: "/settings/system-settings/two-factor-authentication"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_two_factor_authentication.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · Two-Factor Authentication

## 1. Purpose
Enables and configures **two-factor authentication (2FA)** for the platform login, adding a second
verification step on top of username/password to strengthen access security.

- **Business objective:** meet security/compliance requirements by requiring a second factor at login,
  reducing the risk of credential-only compromise.
- **Screen description:** a minimal form under `Settings → System Settings → Two-Factor Authentication`
  with a single master **enable** switch plus **Save** and **Reset**.
- **Primary use cases:** turn 2FA on/off platform-wide, save the setting.
- **Who uses it:** administrators (the setting governs all users' login).
- **Dependencies:** the second-factor mechanism (authenticator app/OTP/email — not captured; TODO) and,
  for email-based OTP, a working Mail Server configuration.

## 2. Navigation
```
Settings → System Settings → Two-Factor Authentication
```
- **Breadcrumb:** Settings › System Settings › Two-Factor Authentication
- **URL:** `/settings/system-settings/two-factor-authentication`

## 3. Actions
- Toggle **Two Factor Authentication** on/off — `#Two Factor Authentication` (switch; currently OFF)
- **Save** — `#configure-btn`
- **Reset** — `#reset-btn`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` |
| Two Factor Authentication (master toggle) | `#Two Factor Authentication` (ant-switch, default **OFF**) |
| Save | `#configure-btn` |
| Reset | `#reset-btn` |

> Only the enable switch + Save/Reset were captured. Any **method selection** (authenticator/TOTP vs.
> email OTP), enrollment/QR flow, or per-user scoping was **not captured** — confirm live or via the KG
> before writing a 2FA test. Note the toggle id contains **spaces** (`#Two Factor Authentication`); in
> Playwright escape it or prefer a role/label locator.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Two-Factor Authentication)._

## 5. Permissions
- **Administrators** enable/disable 2FA (global, affects every user's login).
- TODO(source: KG/docs) — whether it can be scoped per user/role, and non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- If the second factor is delivered by email, a working **Mail Server** is required.

## 7. Exit Conditions
- **On Save with 2FA ON:** success toast; subsequent logins require the second factor.
  TODO(source: KG/docs) — whether the admin's current session must re-authenticate/enroll immediately.
- **On Save with 2FA OFF:** logins revert to single-factor.
- **On Reset:** form reverts to last-saved value.

## 8. Validations
- The toggle is boolean; no field-level validation captured.
- TODO(source: docs) — if a method must be chosen before enabling, or a mail server required for email OTP.

## 9. Business Rules
- 2FA is a **global** login control (default OFF).
- Enabling it changes the authentication flow for all users at next login. TODO(source: KG/docs) — the
  exact second-factor mechanism and enrollment.
- TODO(source: KG/docs) — interaction with SSO/LDAP logins (does 2FA apply to federated logins?).

## 10. Known Bugs
None recorded specifically for this screen in `knowledge/known_issues/customer-issue-kb.md`. (Related
security/VAPT hardening items — e.g. concurrent-session control `"allow.concurrent.sessions": "no"`
in 8.1.3, section 9/11 — are separate motadata.json settings, not this screen.)

## 11. Edge Cases
- Enabling 2FA without a configured mail server when email-OTP is the method (users locked out).
- Admin enabling 2FA and being unable to complete their own enrollment (self-lockout).
- Toggling ON then OFF before Save (Reset behaviour).
- Interaction with SSO/LDAP-authenticated users.
- Behaviour of existing active sessions when 2FA is turned on.
