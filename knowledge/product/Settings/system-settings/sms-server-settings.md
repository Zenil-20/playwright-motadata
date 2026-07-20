---
screen: System Settings · SMS Server Settings
module: Settings
category: system-settings
route: "/settings/system-settings/sms-server-settings"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_sms_server_settings.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · SMS Server Settings

## 1. Purpose
Configures the **SMS gateway** the appliance calls to deliver text-message notifications (typically for
alerts). It stores the gateway's HTTP(S) URL and whether to route the request through the configured
proxy.

- **Business objective:** enable SMS alert delivery via a customer-supplied HTTP SMS gateway so on-call
  staff get texts even when email is unavailable.
- **Screen description:** a minimal form under `Settings → System Settings → SMS Server` with a single
  **SMS Gateway URL** field, a **Use Proxy Server** toggle, and **Test** / **Save** actions.
- **Primary use cases:** first-time SMS gateway setup, changing the gateway URL, routing SMS through the
  proxy, verifying delivery via **Test**.
- **Who uses it:** administrators.
- **Dependencies:** a reachable HTTP SMS gateway that accepts the product's request format; optionally
  the configured Proxy Server; the gateway must have the AIOps message template/IP whitelisted.

## 2. Navigation
```
Settings → System Settings → SMS Server Settings
```
- **Breadcrumb:** Settings › System Settings › SMS Server Settings
- **URL:** `/settings/system-settings/sms-server-settings`

## 3. Actions
- Enter **SMS Gateway URL** — `input[name="sms-gateway-url"]#sms-gateway-url-id`
- Toggle **Use Proxy Server** — `#auto-sync-id`
- **Test** — `#test-btn`
- **Save SMS Server Settings** — `#save-btn`
- **Reset** — `#reset-btn`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` |
| SMS Gateway URL * | `input[name="sms-gateway-url"]#sms-gateway-url-id` |
| Use Proxy Server (toggle) | `#auto-sync-id` (ant-switch, 1 switch captured) |
| Test | `#test-btn` |
| Save SMS Server Settings (primary) | `#save-btn` |
| Reset | `#reset-btn` |

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > SMS Server)._

## 5. Permissions
- **Administrators** configure the SMS gateway (global setting).
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- To **Test**, the gateway URL must be reachable (via proxy if enabled).

## 7. Exit Conditions
- **On Save (success):** success toast; the gateway is used for subsequent SMS notifications.
- **On Test:** pass/fail indicating whether the gateway responded. TODO(source: docs) — exact result UI.
- **On Reset:** form reverts to last-saved values.

## 8. Validations
- **SMS Gateway URL** — required; should be a valid URL. TODO(source: docs) — whether the URL must carry
  placeholder macros (e.g. for number/message) and how they are validated.
- TODO(source: docs) — whether Test is required before Save.

## 9. Business Rules
- **Use Proxy Server** routes the SMS HTTP call through the configured Proxy Server; implies proxy must
  exist first when enabled.
- TODO(source: KG/docs) — the exact request contract (GET/POST, expected macros) the gateway must accept;
  message template configuration.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (Notification channel failures, section 5):
- **SMS triggered but not delivered — SMS template not whitelisted at the gateway** (PQD-29942 and
  related). Workaround: whitelist the AIOps SMS template/sender at the gateway provider.
Verify against build 8.2.6 before treating as open.

## 11. Edge Cases
- Unreachable gateway / wrong URL → **Test** must fail clearly.
- **Use Proxy Server** ON while no proxy is configured.
- Gateway reachable but rejects the message format / unwhitelisted template (delivery silently fails).
- Malformed URL; URL missing required macros.
- Save without Test; Test success but later delivery fails at provider.
