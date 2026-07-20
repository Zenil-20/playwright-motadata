---
screen: System Settings
module: Settings
category: system-settings
route: "/settings/system-settings/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings

## 1. Purpose
The **System Settings** area is the administrative hub for platform-wide configuration that is not tied
to a single monitor, policy, or user. It groups the server-integration profiles (mail, SMS, proxy, DNS),
platform-security controls (two-factor authentication, SSH/cipher security), data lifecycle (data
retention, backup profiles, external storage), and housekeeping utilities (rebranding, MAC-address
scanner, rule-based tags, Motadata collector inventory).

- **Business objective:** give an administrator one place to wire the appliance into the customer's
  infrastructure (SMTP/SMS gateways for alert delivery, proxy for outbound traffic, DNS profiles) and to
  govern how long data is kept, how it is backed up, and how the appliance is secured/branded.
- **Screen description:** the landing route `/settings/system-settings/` opens on the **Mail Server
  Settings** form (its catalog is identical to `mail-server-settings`), with a left sub-nav listing the
  ~14 system-settings screens.
- **Primary use cases:** configure alert/report email delivery, configure SMS delivery, set an outbound
  proxy, define data-retention windows, schedule backups, enforce 2FA, harden SSH ciphers.
- **Who uses it:** administrators. TODO(source: KG/docs) — confirm whether Operator/Viewer roles get
  read-only visibility.
- **Dependencies:** an authenticated admin session · reachable external servers (SMTP/SMS/proxy/DNS)
  for the profiles that point at them · the collector/datastore services for retention & backup.

## 2. Navigation
```
Settings → System Settings
```
- **Breadcrumb:** Settings › System Settings
- **Landing:** the hub opens on **Mail Server Settings** (default sub-screen).
- **Sub-screens (left nav):** Mail Server · SMS Server · Proxy Server · DNS Server Profiles ·
  Data Retention · Backup Profiles · External Storage Profile · Rebranding · Two-Factor Authentication ·
  SSH Security Settings · MAC Address Scanner · Motadata Collector · Rule-Based Tags. (Exact order/labels
  TODO(source: KG/docs).)
- **URL:** `/settings/system-settings/`
- A **Search** box (placeholder "Search") filters within the active screen.

## 3. Actions
Actions depend on the active sub-screen (each is documented in its own file). On the default Mail Server
landing: **Test** (`#test-btn`), **Save Mail Server Settings** (`#configure-btn`), **Reset**
(`#reset-btn`), and the **Use Proxy Server** / authentication toggles.

## 4. Components
This route renders the **Mail Server Settings** form (see `mail-server-settings.md` for the full control
table). Captured controls:

| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` |
| SMTP Server | `input[name="smtp-server"]#smtp-server-id` (placeholder _e.g. smtp.google.com_) |
| SMTP Server Port | `input[name="smtp-server-port"]#smtp-server-port-id` |
| From Email | `input[name="email"]#email-id` (placeholder _Valid email address_) |
| Use Proxy Server (toggle) | `#auto-sync-id` (switch) |
| Authentication Requires (toggle) | `#smtp-server-requires-authentication-btn-` (switch) |
| Security Type / Authentication Type | radio groups (5 radios total) |
| Test | `#test-btn` |
| Save Mail Server Settings | `#configure-btn` |
| Reset | `#reset-btn` |

_Locators: see `knowledge/locators/catalog/settings_system_settings.json`._

## 5. Permissions
- **Administrators** configure System Settings. These are global, appliance-wide settings.
- TODO(source: KG/docs) — exact RBAC: whether non-admin roles see this hub read-only or not at all;
  whether individual sub-screens (e.g. SSH Security, 2FA) have finer role gates.

## 6. Entry Conditions
- Logged in as an administrator with a valid session.
- Settings shell reachable (`/settings/`).

## 7. Exit Conditions
- On saving any sub-screen: a success toast and persisted values (per-screen).
- TODO(source: KG/docs) — confirm which changes take effect immediately vs. require a service restart.

## 8. Validations
Validations are per sub-screen (see each file). On the Mail Server landing: SMTP server/port required,
From Email must be a valid email address. TODO(source: docs) — full rules.

## 9. Business Rules
- The hub landing defaults to **Mail Server Settings**.
- Several server profiles share a **Use Proxy Server** toggle, implying an outbound-proxy dependency
  chain (mail/SMS can route through the configured proxy).
- TODO(source: KG/docs) — cross-screen dependencies (e.g. backup profiles requiring an external storage
  profile; DNS profiles consumed by discovery).

## 10. Known Bugs
Related customer patterns from `knowledge/known_issues/customer-issue-kb.md` (apply to the sub-screens
reached from here — see each sub-screen doc for detail):
- **Notification channel failures (email/SMS)** — AIOps IP not whitelisted on the mail server; SMS
  template not whitelisted at the gateway (PQD-29942, PQD-40517, PQD-33551 [MOTADATA-7016]).
- **VAPT weak-cipher findings** on SSH/TLS (PQD-28704, MOTADATA-7566/8035) → SSH Security Settings.
- **Backup/restore mistakes destroy installs**; UI-based restore delivered in 8.2.0 (PQD-30741,
  PQD-40534, PQD-38990) → Backup Profiles.
No hub-level (landing) defect is separately recorded.

## 11. Edge Cases
- Navigating directly to `/settings/system-settings/` deep-link vs. via the menu (SPA must hydrate).
- A non-admin (if permitted) opening the hub — expect read-only or a blocked action.
- Search term matching nothing on the active screen.
- Switching sub-screens with unsaved edits on the current one (discard/confirm?). TODO(source: docs).
