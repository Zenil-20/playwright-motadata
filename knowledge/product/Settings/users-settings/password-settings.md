---
screen: Users Settings · password-settings
module: Settings
category: users-settings
route: "/settings/users-settings/password-settings"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # catalog/settings_users_settings_password_settings.json · screenshots/Settings1.png (left-nav) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Users Settings · Password Settings

## 1. Purpose
The **Password Settings** screen defines the **system-wide password policy** enforced whenever any user
sets or changes a password (including the self-service *Change Password* on My Profile). It sets minimum
length and character-class requirements plus expiry.

- **Business objective:** enforce a password-strength baseline for compliance/VAPT (length, complexity,
  rotation) across every account in one place.
- **Screen description:** a single settings form under `Settings → User Settings → Password Settings`
  with a length input, five policy toggles, and Save/Reset actions.
- **Primary use cases:** set minimum length, require uppercase/lowercase/number/special-char, enable
  password expiry, reset to product defaults.
- **Who uses it:** administrators with user/security-management rights.
- **Dependencies:** the auth/user store; every password-set flow (My Profile change-password, admin
  user create/edit) validates against this policy.

## 2. Navigation
```
Settings → User Settings → Password Settings
```
- **Breadcrumb:** Settings › User Settings › Password Settings
- **Left-nav group:** *User Settings* — order confirmed from `screenshots/Settings1.png`.
- **URL:** `/settings/users-settings/password-settings`

## 3. Actions
- Set **Minimum password length** — `psw-length` (placeholder *6-15 characters*).
- Toggle the five policy switches (each an ant-switch, shown as **ON/OFF**):
  - **Password Expiry** — `#password-expiry`
  - **Require Uppercase** — `#password-uppercase`
  - **Require Lowercase** — `#password-lowercase`
  - **Require Number** — `#password-number`
  - **Require Special Character** — `#psw-special-char`
- **Reset to default** — `#default` (restores product-default policy).
- **Save Password Settings** — `#save` (persists the policy).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Minimum length | `input[name='psw-length']` — placeholder *6-15 characters* |
| Password Expiry (toggle) | `#password-expiry` (ant-switch) |
| Require Uppercase (toggle) | `#password-uppercase` |
| Require Lowercase (toggle) | `#password-lowercase` |
| Require Number (toggle) | `#password-number` |
| Require Special Character (toggle) | `#psw-special-char` |
| Reset to default | `#default` |
| Save Password Settings (primary) | `#save` |

> The catalog reports **5 switches**; ids above map to the five policy rules. When **Password Expiry**
> is ON, an *expiry period* sub-field (days) is expected to appear — it was **not captured** in the
> sweep; confirm live/KG. The **6-15 characters** placeholder implies the configurable length is bounded
> to that range. _Promote verified locators into `selector-cookbook.md`._

## 5. Permissions
- **Admin-gated:** only users with security/user administration should modify the global policy.
  TODO(source: KG/docs) — exact grant.
- Policy applies to **all users**; a single account cannot opt out. Self-service password change (My
  Profile) is validated against whatever is set here.

## 6. Entry Conditions
- Logged in with security-management rights.
- Settings reachable; the current policy values load into the form.

## 7. Exit Conditions
- **On Save (success):** success toast; new policy persists and is immediately enforced on the next
  password-set. Assertion: attempting a non-compliant password afterwards is rejected.
- **On Reset to default:** form reverts to product defaults (still must be Saved to persist —
  TODO(source: KG/docs) confirm whether Reset auto-saves or only repopulates).

## 8. Validations
- **Minimum length** — numeric, expected bounded to **6–15** (placeholder). Out-of-range → inline
  error. TODO(source: docs) exact bounds and default.
- **Character-class toggles** — independent booleans; TODO(source: KG/docs) whether at least one class
  must remain required.
- **Password Expiry (when ON)** — expiry-days sub-field expected required + numeric. TODO(source: KG/docs).

## 9. Business Rules
- The policy is **global and immediately effective** for subsequent password changes; existing
  passwords are not retro-invalidated except by **Expiry** (rotation). TODO(source: KG/docs) confirm.
- **Reset to default** restores the shipped baseline. TODO(source: KG/docs) — the exact default set.
- TODO(source: KG/docs): password history/re-use prevention and lockout-on-failure — whether configured
  here or elsewhere (note: account lockout via external PAM appears in field issues, not this screen).

## 10. Known Bugs
- **version: ≤8.0.4 installs upgraded via patch chain** · **issue:** **password-policy table ID
  mismatch** caused the service to fail to start post-upgrade (`customer-issue-kb.md` §2 "Upgrade
  executed without SOP / patch bugs", PQD-34609 / MOTADATA-7275). · **workaround:** apply the provided
  **SQL fix** for the password-policy table; follow the version-by-version upgrade chain.
- No defect recorded for the policy-editing UI itself for build 8.2.6. Do not invent bugs.

## 11. Edge Cases
- Length below/above the 6–15 bound; non-numeric length.
- All character-class toggles OFF (weakest policy) vs all ON — does a minimum stay enforced?
- Enable **Password Expiry** with 0 / very large days.
- Save policy, then test the My Profile *Change Password* flow rejects a now-non-compliant password
  (cross-screen enforcement regression).
- Reset to default without Save (does the old policy persist?).
- Upgrade regression: verify the policy table survives an N-2→N upgrade (PQD-34609 class).
