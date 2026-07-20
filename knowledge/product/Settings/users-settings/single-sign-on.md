---
screen: Users Settings · single-sign-on
module: Settings
category: users-settings
route: "/settings/users-settings/single-sign-on"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # catalog/settings_users_settings_single_sign_on.json · screenshots/Settings1.png (left-nav) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Users Settings · Single Sign-On

## 1. Purpose
The **Single Sign-On (SSO)** screen configures **SAML-based** federated login so users authenticate
through a corporate **Identity Provider** (IdP — e.g. Azure AD / ADFS / Okta) instead of local
credentials. ObserveOps acts as the **Service Provider (SP)**.

- **Business objective:** delegate authentication to the enterprise IdP for centralised access control,
  MFA, and single-logout; optionally auto-import users on first login.
- **Screen description:** an SP/IdP configuration form under `Settings → User Settings → Single
  Sign-On` with SP identifiers (read-only, to paste into the IdP), an IdP configuration section (metadata
  file **or** manual), an **Enable User Import** toggle, and a master enable switch.
- **Primary use cases:** turn SSO on, publish SP Entity ID / ACS (Login) / Logout URLs to the IdP,
  upload the **IdP metadata file** (or enter values manually), enable user auto-import, save/reset.
- **Who uses it:** administrators with identity/integration rights.
- **Dependencies:** a configured SAML IdP; correct SP↔IdP URL/cert exchange; network reachability of
  the IdP redirect endpoints (see Known Bugs — NAT/public-domain limitation).

## 2. Navigation
```
Settings → User Settings → Single Sign-On
```
- **Breadcrumb:** Settings › User Settings › Single Sign-On
- **Left-nav group:** *User Settings* — order confirmed from `screenshots/Settings1.png`.
- **URL:** `/settings/users-settings/single-sign-on`

## 3. Actions
- **Enable/Disable SSO** — the master toggle (catalog: 1 switch; shown **OFF** in the sweep).
- **Choose IdP configuration mode** — the **2 radios** select **metadata file** vs **manual** config
  (labels *Identify Provider Configuratio[n]* / *Identity Provider Metadata Fil[e]*, truncated in catalog).
- **Select Identity Provider** — dropdown (`[data-cy='dropdown-trigger-input']`).
- **Enable User Import** — toggle to auto-provision users on first SSO login.
- **Configure** — `#configure-btn` (applies the IdP config / uploads metadata).
- **Reset** — `#reset-btn` (revert unsaved changes).
- **Save** — persist the SSO configuration.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Service Provider Entity ID | label *Service Provider Entity ID* (SP identifier, copy to IdP) |
| Redirect URL | label *Redirect URL* |
| Service Provider Login URL | label *Service Provider Login URL* (ACS) |
| Service Provider Logout URL | label *Service Provider Logout URL* (SLO) |
| Identity Provider | label *Identity Provider* — select via `[data-cy='dropdown-trigger-input']` |
| IdP Configuration mode | **2 radios** (*Identify Provider Configuratio[n]* / *Identity Provider Metadata Fil[e]*) |
| Enable User Import | label *Enable User Import* (toggle) |
| SSO master enable | 1 ant-switch (shown **OFF**) |
| Configure | `#configure-btn` |
| Reset | `#reset-btn` |
| Save | button **Save** (no id captured) |

> The SP URLs are typically **read-only** (generated for you to paste into the IdP). The **metadata
> file upload** control and the manual-entry fields (IdP Entity ID, SSO URL, x509 cert) appear when the
> corresponding radio is chosen — these conditional fields were **not fully captured**; harvest live/KG.
> The **Save** button has no captured id — resolve by role/label. _Promote verified locators into
> `selector-cookbook.md`._

## 5. Permissions
- **Admin-gated:** SSO configuration is a privileged identity action. TODO(source: KG/docs) — grant.
- **Enabling SSO changes how everyone logs in** — high blast radius; a misconfiguration can lock users
  out. TODO(source: KG/docs): whether local admin login remains available as a fallback when SSO is on.

## 6. Entry Conditions
- Logged in with identity/integration rights.
- A working IdP whose metadata/URLs you can supply; the SP URLs from this screen registered at the IdP.
- The IdP redirect must resolve to a **supported host** — see Known Bugs (local/VIP IP only).

## 7. Exit Conditions
- **On Save (success):** success toast; SSO config persists; when enabled, the login page offers SSO.
  Assertion: a full SP→IdP→SP round trip signs a user in.
- **On failed round-trip:** IdP redirect fails / assertion rejected — see Known Bugs.
- **On Reset:** unsaved changes reverted.

## 8. Validations
- **IdP metadata file** — required in metadata mode; must be valid SAML metadata. TODO(source: KG/docs)
  accepted format/size.
- **Manual IdP fields** — IdP Entity ID / SSO URL / certificate required in manual mode.
  TODO(source: KG/docs) exact set + URL/cert validation.
- **Identity Provider** select — required to save. TODO(source: KG/docs).

## 9. Business Rules
- ObserveOps is the **SP**; the four SP URLs are generated here and must be registered verbatim at the
  IdP. Mismatched ACS/Logout URLs break the round trip.
- **Enable User Import** governs whether an unknown-but-IdP-authenticated user is auto-provisioned vs
  rejected. TODO(source: KG/docs) — which role/profile an auto-imported user receives.
- **SSO redirect is limited to the local/VIP IP** — NAT'd public domains are unsupported (Known Bugs);
  this is a hard deployment constraint.
- TODO(source: KG/docs): single-logout behaviour; coexistence of SSO and local login.

## 10. Known Bugs
- **version: ~8.x** · **issue:** **Azure AD SSO redirect fails** when the SP is reached via a NAT'd
  **public domain** — SSO redirect only supports the **local/VIP IP** (`customer-issue-kb.md` §11 "SSO
  / OAuth SMTP config", PQD-36619 / MOTADATA-7744). · **workaround:** use the local/VIP IP for the SSO
  redirect; an early-release SSO bundle (backend file swap) was provided, later productized.
- **version: ~8.x** · **issue:** **OAuth2.0 SMTP config errors** from wrong Azure auth/token URLs
  (PQD-38421). · **workaround:** follow the Azure OAuth documentation for the correct URLs. (SMTP-OAuth
  is a Mail-Server concern but shares the Azure app-registration setup with SSO.)
- Do not invent bugs beyond the above.

## 11. Edge Cases
- SP reached via **public/NAT domain** — assert the documented local/VIP-only limitation (PQD-36619).
- Invalid/expired IdP **certificate**; clock-skew between SP and IdP (SAML assertion time window).
- Metadata mode with a malformed/oversized metadata file; manual mode with a wrong SSO URL.
- **Enable SSO then lose IdP** — verify a local-admin fallback exists (avoid full lockout).
- First-login user with **Enable User Import** ON vs OFF (auto-provision vs rejected).
- Toggle SSO OFF after enabling — do active SSO sessions survive or drop?
- Single-logout initiated at the IdP vs at the SP.
