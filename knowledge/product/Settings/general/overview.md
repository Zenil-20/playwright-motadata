---
screen: Settings root (general landing → My Profile)
module: Settings
category: general
route: "/settings/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings.json (== My Profile form) · "My Account - UI Preference.png" (Settings left-nav) · customer-issue-kb (none specific)
verified: 2026-07-10
---

# Settings — Root Landing

## 1. Purpose
The **top-level Settings landing** (`/settings/`). It opens the Settings shell — a left-nav of
categories plus a content pane — and **defaults to My Account → My Profile**. The captured catalog for
`/settings/` is the **My Profile form** (First/Last/User Name, Email, Mobile, Change Password toggle,
Update My Profile / Reset), confirming the root resolves to My Profile.

- **Business objective:** a single hub for all configuration — personal, user/RBAC, system, policy,
  discovery, monitoring, and integrations — with a consistent left-nav + search shell.
- **Screen description (Settings left-nav from `My Account - UI Preference.png`):**
  **My Account** (My Profile · UI Preference · License), **User Settings**, **System Settings**,
  **Policy Settings**, **Discovery Settings**, **Monitor Settings**, **Network Config Settings**,
  **Compliance Settings**, **SNMP Trap**, **Observability Pipeline**, **Flow Settings**,
  **Plugin Library**, **Dependency Mapper**, **Service Level Objective (BETA)**, **Utility**.
- **Primary use cases:** land on My Profile, then navigate (or use the Settings search) to any
  configuration screen.
- **Who uses it:** every authenticated user (self-service My Profile) up to full admins (all sections).
- **Dependencies:** an authenticated session; per-section module/license gating.

## 2. Navigation
```
Top bar → Settings (gear)  →  /settings/  (defaults to My Account → My Profile)
```
- **URL:** `/settings/`
- **Default content:** My Profile (see `my-account/my-profile.md`, which is `verified`).
- **Left-nav search:** the Settings shell has a search box (the `#phone-number`/search-focus caveat
  noted in `my-profile.md` applies).

## 3. Actions
- Navigate to any Settings section via the left-nav or search.
- As captured (My Profile default): edit profile fields, toggle **Change Password**
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
| Settings left-nav + Search | shared Settings shell |

> The authoritative documentation for these fields lives in `my-account/my-profile.md`. This file
> documents the **Settings root / shell** role and the left-nav category map.

_Locators: see `my-account/my-profile.md` and the per-section screen docs._

## 5. Permissions
- Everyone reaches Settings and their own My Profile. Individual sections are **RBAC/license-gated**
  (e.g. User/System/Policy settings are admin areas). TODO(source: KG/docs) — the exact per-section
  role matrix.

## 6. Entry Conditions
- Logged in with a valid session; Settings shell reachable.

## 7. Exit Conditions
- Lands on My Profile; left-nav lists the sections the user is permitted to see.

## 8. Validations
- None at the root; validations belong to each section's screens (My Profile validations in
  `my-profile.md`).

## 9. Business Rules
- `/settings/` **defaults to My Account → My Profile**.
- The visible left-nav sections depend on the user's role/licensed modules. TODO(source: KG) confirm.

## 10. Known Bugs
No Settings-root-specific defects recorded in `knowledge/known_issues/customer-issue-kb.md`. Note the
platform-wide GUI-access issues (§3, e.g. WS/WSS blocked, stale cache after IP change) can prevent the
Settings shell from loading, but they are not screen-specific.

## 11. Edge Cases
- Direct-navigating to `/settings/` — confirm it resolves to My Profile, not a blank page.
- A low-privilege user — confirm restricted sections are hidden, not just disabled.
- Deep-link vs. SPA routing (open the full URL so the router loads the shell).
- Left-nav search focus vs. the `#phone-number` id collision noted in `my-profile.md`.
