---
screen: My Profile
module: Settings
category: my-account
route: "/settings/my-account/my-profile"
build: 8.2.6
status: verified                     # UI-image + catalog verified; a few business rules marked TODO
sources: [ui-image, catalog]         # UI-ObserveOps/"My Account - My Profile", locators/catalog/settings.json
verified: 2026-07-09
---

# My Account — My Profile

## 1. Purpose
The self-service identity screen for the **currently logged-in user**. It lets a user view and edit
their own account details (name, username, email, mobile, avatar) and change their own password.

- **Business objective:** every user maintains their own profile without an admin — keeps contact
  details and credentials current for login, notifications and audit attribution.
- **Screen description:** a single profile form under `Settings → My Account`, with sibling tabs
  **UI Preference** and **License**.
- **Primary use cases:** update display name / email / mobile, change avatar, change own password.
- **Who uses it:** every authenticated user (Admin, Operator, Viewer) — each edits **only their own**
  profile. Editing *other* users is a different screen (`User Settings → User Profiles`).
- **Dependencies:** an authenticated session · the user store · email (used for notifications) ·
  password policy (System Settings) for the change-password flow.

## 2. Navigation
```
Top bar → Avatar (initials, e.g. "MA") → My Account → My Profile
   — or —
Settings → My Account → My Profile
```
- **Breadcrumb:** Settings › My Account › My Profile
- **Sibling tabs:** My Profile · UI Preference · License
- **URL:** `/settings/my-account/my-profile`

## 3. Actions
- Edit **First Name**, **Last Name**, **User Name**, **Email Address**, **Mobile Number**
- **Change** avatar (image upload) — the `Change` link under the avatar
- Toggle **Change Password** → reveals new-password fields → set a new password
- **Update My Profile** — save changes (`#btn-save-my-profile`)
- **Reset** — discard unsaved edits, revert to last-saved (`#btn-cancel-my-profile`)

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Avatar + `Change` (upload) | avatar block with Change link (initials shown when no image) |
| First Name * | `input#first-name` (text) |
| Last Name * | `input#last-name` (text) |
| User Name * | `input#user-name` (text) — hint _"Must be unique"_ |
| Email Address * | `input#email-address` (text) |
| Mobile Number | `input#phone-number` (text) |
| Change Password (toggle) | `#change-password-switch` (ant-switch, default **OFF**) → reveals the password sub-fields when ON |
| Update My Profile (primary) | `#btn-save-my-profile` |
| Reset | `#btn-cancel-my-profile` |
| Settings left-nav + Search | shared Settings shell |

> The password sub-fields (New / Confirm / possibly Current) render only when the toggle is ON;
> they were **not captured** in the OFF-state sweep — confirm the exact field set live or via the KG.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > My Profile)._

> **Automation caveat:** the Mobile Number input id is `#phone-number` — the **same id** the Settings
> search-focus trick targets in `framework/playwright/flow.js` (`S.nav.search_focus`). On this screen
> `#phone-number` is the Mobile field; scope carefully so a test doesn't cross the two.

## 5. Permissions
- **Self-service:** any authenticated user (Admin / Operator / Viewer) can view and edit **their own**
  profile and change **their own** password. No extra role or license gates this screen.
- **Not here:** creating/editing *other* users, roles, or password policy → `User Settings`.
- TODO(source: KG/docs): whether **User Name** is editable by non-admins or read-only after creation.

## 6. Entry Conditions
- User is logged in with a valid session.
- Settings is reachable (`/settings/`).
- The user's own profile record loads (name/email/mobile populate).

## 7. Exit Conditions
- **On Update (success):** success toast; fields persist; the top-bar avatar/initials + display name
  reflect the new values; an audit entry is written (Audit Trail).
- **On password change:** password updated; TODO(source: KG/docs) — confirm whether the session (or
  other active sessions) is invalidated / re-login is required.
- **On Reset:** form reverts to last-saved values; no server call.

## 8. Validations
- **First Name** — required (`*`).
- **Last Name** — required (`*`).
- **User Name** — required (`*`) **and unique** (hint "Must be unique"); duplicate → inline error.
- **Email Address** — required (`*`) + valid email format.
- **Mobile Number** — numeric (observed 10 digits); TODO(source: docs) exact length/format rule.
- **Change Password (when ON)** — new password + confirm must match; must satisfy the system password
  policy. TODO(source: System Settings) — exact policy (min length, complexity, history).
- Field max-lengths: TODO(source: docs).

## 9. Business Rules
- **User Name is unique** across all users; save is blocked on a collision.
- **Change Password is hidden until the toggle is ON** — profile fields and password change are one
  form but the password sub-form only renders when `#change-password-switch` is ON.
- Avatar shows **initials derived from the name** when no image is uploaded (e.g. "MA").
- Email is the user's notification address (used by alert/report delivery). TODO(source: KG) confirm.
- TODO(source: KG/docs): changing password invalidates existing sessions? · can a user change their
  own **role**? (expected: no — role is admin-managed).

## 10. Known Bugs
_None verified from the provided sources (UI sweep + catalog) for build 8.2.6._
> Fill from the Motadata KG / documentation-review session in this format when found:
> `version: 8.2.x` · `issue: …` · `workaround: …`. Do not invent bugs.

## 11. Edge Cases
- Duplicate **User Name** (collision with another user).
- Invalid email format; email already used by another user.
- Empty required field (First/Last/User Name, Email) → save blocked.
- Mobile with non-digits, wrong length, or `+country` prefix.
- **Change Password:** new ≠ confirm; weak password vs policy; toggle ON then OFF (should discard the
  password change on save).
- Very long names; Unicode / emoji in name fields; leading/trailing spaces.
- Avatar upload: unsupported format, oversized image, non-image file.
- No-op save (Update with zero changes).
- Concurrent edit of the same profile from two sessions (last-write-wins?).
- Session/permission change mid-edit (role downgraded) before Update.
