---
screen: System Settings · Mail Server Settings
module: Settings
category: system-settings
route: "/settings/system-settings/mail-server-settings"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_mail_server_settings.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · Mail Server Settings

## 1. Purpose
Configures the outbound **SMTP mail server** the appliance uses to deliver email — alert notifications,
scheduled reports, and any system email. Without a valid mail server here, no email leaves the product.

- **Business objective:** connect Motadata to the customer's SMTP relay so alert/notification and report
  emails are delivered reliably.
- **Screen description:** a single connection form under `Settings → System Settings → Mail Server`,
  with SMTP host/port, security type, authentication, and a **From Email** sender identity; a **Test**
  button validates the settings before saving.
- **Primary use cases:** first-time SMTP setup, switching relays, enabling authentication, routing mail
  through the configured proxy, verifying delivery via **Test**.
- **Who uses it:** administrators.
- **Dependencies:** a reachable SMTP server, correct credentials (if auth required), open network path
  (SMTP port) — optionally via the configured Proxy Server; the From Email address must be accepted by
  the relay.

## 2. Navigation
```
Settings → System Settings → Mail Server Settings
```
- **Breadcrumb:** Settings › System Settings › Mail Server Settings
- **URL:** `/settings/system-settings/mail-server-settings`
- This is also the **default landing** of the System Settings hub (`/settings/system-settings/`).

## 3. Actions
- Enter **SMTP Server** host and **SMTP Server Port**
- Choose **Security Type** and **Authentication Type** (radio groups)
- Enter **From Email** sender address
- Toggle **Use Proxy Server** (route mail through the configured proxy) — `#auto-sync-id`
- Toggle **Authentication Requires** — `#smtp-server-requires-authentication-btn-` (reveals credential fields)
- **Test** the configuration — `#test-btn`
- **Save Mail Server Settings** — `#configure-btn`
- **Reset** — `#reset-btn`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` |
| SMTP Server * | `input[name="smtp-server"]#smtp-server-id` (placeholder _e.g. smtp.google.com_) |
| SMTP Server Port * | `input[name="smtp-server-port"]#smtp-server-port-id` |
| From Email * | `input[name="email"]#email-id` (placeholder _Valid email address_) |
| Security Type | radio group (e.g. None / SSL / TLS — exact options TODO(source: docs)) |
| Authentication Type | radio group — part of the 5 radios captured |
| Use Proxy Server (toggle) | `#auto-sync-id` (ant-switch) |
| Authentication Requires (toggle) | `#smtp-server-requires-authentication-btn-` (ant-switch) — reveals username/password when ON |
| Test | `#test-btn` |
| Save Mail Server Settings (primary) | `#configure-btn` |
| Reset | `#reset-btn` |

> The catalog counts **2 switches** and **5 radios**. The username/password fields shown when
> "Authentication Requires" is ON were **not captured** in the OFF-state sweep — confirm live/KG.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Mail Server)._

## 5. Permissions
- **Administrators** configure the mail server (global setting).
- TODO(source: KG/docs) — whether a non-admin can view (read-only) these settings.

## 6. Entry Conditions
- Logged in as an administrator.
- To meaningfully **Test**, the target SMTP server must be reachable and (if used) the Proxy Server
  must already be configured.

## 7. Exit Conditions
- **On Save (success):** success toast; settings persist; subsequent alert/report emails use this relay.
- **On Test:** a success/failure result indicating whether the appliance could reach and authenticate to
  the SMTP server. TODO(source: docs) — exact success/failure UI.
- **On Reset:** form reverts to last-saved values.

## 8. Validations
- **SMTP Server** — required; hostname/IP (placeholder _e.g. smtp.google.com_).
- **SMTP Server Port** — required; numeric port. TODO(source: docs) — range check.
- **From Email** — must be a **valid email address** (placeholder _Valid email address_).
- **Authentication (when ON)** — username/password required. TODO(source: docs).
- TODO(source: docs) — whether **Test** is required/allowed before Save.

## 9. Business Rules
- **Authentication credentials render only when "Authentication Requires" is ON.**
- **Use Proxy Server** routes SMTP through the appliance's configured Proxy Server (System Settings →
  Proxy Server); implies proxy must be set up first when enabled.
- The **From Email** is the sender identity on all outgoing product mail.
- TODO(source: KG/docs) — OAuth2.0/modern-auth support (see Known Bugs); exact Security Type options.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (Notification channel failures & SSO/OAuth SMTP):
- **Alert emails missing — AIOps IP not whitelisted on the mail server** (PQD-40517 and related,
  section 5). Workaround: whitelist the AIOps server IP on the mail relay.
- **Noisy "Email Service Unavailable" alert** from a 3-retry socket break was cosmetic — suppressed in
  an 8.0.18 hotfix, permanent fix 8.0.26 (section 5).
- **OAuth2.0 SMTP config errors / Azure AD SSO SMTP** (PQD-38421, section 11) — wrong Azure auth/token
  URLs; follow the Azure OAuth doc.
Verify exact reproduction against build 8.2.6 before treating as open.

## 11. Edge Cases
- Unreachable SMTP host / wrong port → **Test** must fail clearly (not silently).
- Auth ON with wrong credentials; auth ON then OFF (should discard credentials on save?).
- **Use Proxy Server** ON while no proxy is configured.
- Invalid **From Email** format; relay that rejects the From address.
- Wrong Security Type vs. port (e.g. TLS type on a plaintext port).
- AIOps IP not whitelisted on relay (see Known Bugs) — delivery silently drops.
- Save without Test; Test success but Save fails.
