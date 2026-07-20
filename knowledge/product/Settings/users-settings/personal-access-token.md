---
screen: Users Settings · personal-access-token
module: Settings
category: users-settings
route: "/settings/users-settings/personal-access-token"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # catalog/settings_users_settings_personal_access_token.json · screenshots/Settings1.png (left-nav) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Users Settings · Personal Access Token

## 1. Purpose
The **Personal Access Token (PAT)** screen issues and manages **API tokens** that let scripts and
integrations call the ObserveOps API as a user, without embedding that user's password.

- **Business objective:** enable secure programmatic/API access with revocable, time-bounded
  credentials that carry the issuing user's permissions and can be rotated independently of the login
  password.
- **Screen description:** a searchable grid of tokens under `Settings → User Settings → Personal Access
  Token` with a **Create Token** entry point and per-row Actions. Columns: **Name**, **Description**,
  **User Name**, **Validity**, **Actions**.
- **Primary use cases:** create a token (name, description, validity), copy the secret at creation
  time, review existing tokens and their **Validity** (expiry), revoke/delete a token.
- **Who uses it:** any user who needs API access; administrators may view/manage others'
  TODO(source: KG/docs) — whether the grid is per-user or all-users for admins.
- **Dependencies:** the auth store; the API layer that accepts the token; the issuing user's role
  (a token inherits that user's permissions).

## 2. Navigation
```
Settings → User Settings → Personal Access Token
```
- **Breadcrumb:** Settings › User Settings › Personal Access Token
- **Left-nav group:** *User Settings* — order confirmed from `screenshots/Settings1.png`.
- **URL:** `/settings/users-settings/personal-access-token`

## 3. Actions
- **Create Token** — opens the token editor (`#create-access-token-btn`,
  `[data-testid='pat-create-btn']`).
- **Search** tokens (`access-token-search`, `[data-testid='pat-search-input']`).
- **Export** — **PDF** (`[data-testid='pat-export-pdf-btn']`) / **CSV**
  (`[data-testid='pat-export-csv-btn']`).
- **Row Actions** — view / revoke / delete a token (exact set TODO(source: KG/docs)).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name='access-token-search']` · `[data-testid='pat-search-input']` |
| Create Token (primary) | `#create-access-token-btn` · `[data-testid='pat-create-btn']` |
| Export PDF / CSV | `[data-testid='pat-export-pdf-btn']` / `[data-testid='pat-export-csv-btn']` |
| Grid | columns: **Name**, **Description**, **User Name**, **Validity**, **Actions** |
| Row Actions | view / revoke / delete |

> The **Create Token** dialog — name, description, **validity/expiry** selection, and the **one-time
> secret reveal** — was **not captured** by the grid sweep. The generated token secret is typically
> shown **once** at creation; author tests to copy it immediately. Harvest the dialog live/KG.
> _Promote verified locators into `selector-cookbook.md`._

## 5. Permissions
- **Self-service (expected):** a user creates tokens for themselves; a token **inherits the issuing
  user's role/permissions**, so it can do exactly what that user can via the API.
  TODO(source: KG/docs) confirm.
- The **User Name** column implies visibility of the owner; TODO(source: KG/docs) whether admins see/
  revoke all users' tokens or only their own.

## 6. Entry Conditions
- Logged in. Settings reachable; the token grid loads (may be empty for a new user).

## 7. Exit Conditions
- **On Create (success):** success toast; the **secret is shown once** (copy it); a row appears with
  **Name**, **User Name**, and **Validity**. Assertion: row present + the token authenticates an API call.
- **On Revoke/Delete:** row removed; the token immediately stops authenticating. Assertion: a
  subsequent API call with it is rejected.
- **On Export:** PDF/CSV of the current grid downloads (metadata only — never the secret).

## 8. Validations
- **Name** — required, expected **unique per user**; duplicate → inline error. TODO(source: KG/docs).
- **Validity/expiry** — required selection (bounded set or date). TODO(source: KG/docs) allowed values.
- **Description** — optional; max length TODO(source: docs).

## 9. Business Rules
- The **secret is displayed only at creation** and cannot be retrieved later — lost token ⇒ create a
  new one. TODO(source: KG/docs) confirm.
- A token **carries the issuing user's permissions**; revoking the user (or downgrading their role)
  should curtail the token. TODO(source: KG/docs) confirm.
- **Validity** bounds the token lifetime; an expired token is rejected at the API. TODO(source: KG/docs)
  confirm expiry enforcement + any grace.
- TODO(source: KG/docs): max tokens per user; whether disabling a user auto-revokes their tokens.

## 10. Known Bugs
None recorded specifically for the PAT screen in `customer-issue-kb.md` for build 8.2.6. (Auth-adjacent
context: §9 VAPT flagged concurrent sessions and clear-text-password claims — PQD-41192 / MOTADATA-8587,
PQD-32083 / MOTADATA-5979 — mitigated via `motadata.json`, not on this screen.) Do not invent bugs.

## 11. Edge Cases
- Create a token, **navigate away without copying** the secret — assert it is unrecoverable.
- Duplicate token **Name**; empty name → save blocked.
- Token at/after **expiry** — assert the API rejects it (Validity enforcement).
- Revoke a token mid-use — assert in-flight/next API calls fail cleanly.
- Downgrade/disable the **issuing user** — assert the token's effective permissions shrink/revoke.
- Very long name/description; special characters; search with no matches.
- Export grid and confirm the **secret is never** included (metadata only).
