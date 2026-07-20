---
screen: My Account (section landing → My Profile)
module: Settings
category: my-account
route: "/settings/my-account/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_my_account.json (== My Profile form) · "My Account - UI Preference.png" (My Account nav) · customer-issue-kb (none specific)
verified: 2026-07-10
---

# My Account — Section Landing

## 1. Purpose
The **landing route for the My Account area** — the per-user self-service hub containing **My Profile**
(identity + password), **UI Preference** (per-user display settings), and **License** (entitlement /
usage). The captured catalog for `/settings/my-account/` is the **My Profile form**, confirming the
section **defaults to My Profile**.

- **Business objective:** one place for a user to manage their own account (identity, UI, and — for
  admins — the instance license view).
- **Screen description:** the section root renders its default child (**My Profile**) inside the
  Settings shell, with the three sibling tabs **My Profile · UI Preference · License** (seen in
  `My Account - UI Preference.png`).
- **Primary use cases:** land on My Profile; switch to UI Preference or License.
- **Who uses it:** every authenticated user (My Profile / UI Preference are self-service; License is
  admin-oriented).
- **Dependencies:** an authenticated session; the user store; an applied license (for the License tab).

## 2. Navigation
```
Settings → My Account   (defaults to My Profile)
   — or —
Top bar → Avatar (initials) → My Account
```
- **URL:** `/settings/my-account/`
- **Children / tabs:** My Profile (`…/my-profile`, `verified`) · UI Preference (`…/ui-preference`) ·
  License (`…/license`)

## 3. Actions
- Switch between **My Profile**, **UI Preference**, **License**.
- As captured (My Profile default): edit profile fields, toggle Change Password
  (`#change-password-switch`), **Update My Profile** (`#btn-save-my-profile`), **Reset**
  (`#btn-cancel-my-profile`).

## 4. Components
Captured content is the **My Profile** form (the default child):
| Component | Control |
|---|---|
| First / Last / User Name | `#first-name` · `#last-name` · `#user-name` (_"Must be unique"_) |
| Email Address | `#email-address` |
| Mobile Number | `#phone-number` |
| Change Password (toggle) | `#change-password-switch` (default OFF) |
| Update My Profile / Reset | `#btn-save-my-profile` · `#btn-cancel-my-profile` |

> Authoritative documentation for each child lives in `my-profile.md` (verified), `ui-preference.md`,
> and `license.md`. This file documents the **My Account section landing** role.

_Locators: see the three child docs._

## 5. Permissions
- **My Profile / UI Preference:** self-service for any authenticated user (own account only).
- **License:** admin-oriented (Export / Upgrade). TODO(source: KG/docs) — confirm non-admin visibility.

## 6. Entry Conditions
- Logged in with a valid session; Settings shell reachable.

## 7. Exit Conditions
- Lands on My Profile with the My Account tabs available.

## 8. Validations
- None at the landing level; per-tab validations live in the child screens (My Profile field rules in
  `my-profile.md`).

## 9. Business Rules
- `/settings/my-account/` **defaults to My Profile**.
- My Account groups the **three per-user tabs**: My Profile, UI Preference, License.
- TODO(source: KG/docs): whether the License tab is hidden for non-admin roles.

## 10. Known Bugs
No My-Account-landing-specific defects recorded in `knowledge/known_issues/customer-issue-kb.md`. The
License tab's licensing defects are documented in `license.md` §10 (KB §12). Do not invent bugs.

## 11. Edge Cases
- Direct-navigating to `/settings/my-account/` — confirm it resolves to My Profile, not a blank page.
- A non-admin user — confirm expected visibility of the License tab.
- Deep-link to a specific tab vs. SPA routing.
