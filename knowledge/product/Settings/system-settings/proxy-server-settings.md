---
screen: System Settings · Proxy Server Settings
module: Settings
category: system-settings
route: "/settings/system-settings/proxy-server-settings"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_proxy_server_settings.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · Proxy Server Settings

## 1. Purpose
Defines the outbound **HTTP/HTTPS proxy** the appliance uses to reach external services from within a
restricted network. Other System Settings (Mail, SMS) can opt to route through this proxy via their
"Use Proxy Server" toggle.

- **Business objective:** let the appliance make outbound connections (mail relay, SMS gateway, updates,
  integrations) through the corporate proxy in networks that block direct egress.
- **Screen description:** an enable-gated form under `Settings → System Settings → Proxy Server` with
  proxy host/port, timeout, proxy type, and optional authentication; a **Test** validates reachability.
- **Primary use cases:** enable/disable proxying, set proxy host/port/timeout, choose proxy type,
  configure proxy authentication, verify via **Test**.
- **Who uses it:** administrators.
- **Dependencies:** a reachable proxy server; correct proxy credentials if the proxy requires auth; the
  network path from the appliance to the proxy.

## 2. Navigation
```
Settings → System Settings → Proxy Server Settings
```
- **Breadcrumb:** Settings › System Settings › Proxy Server Settings
- **URL:** `/settings/system-settings/proxy-server-settings`

## 3. Actions
- Toggle **Proxy Server Enable** (master enable) — one of 2 switches
- Enter **Proxy Server** host — `input[name="proxy-server"]#smtp-server-id`
- Enter **Proxy Server Port** — `input[name="proxy-server-port"]`
- Enter **Timeout (sec)** — `input[name="timeout"]`
- Choose **Proxy Type** (radio group, 3 radios)
- Toggle **Authentication Requires** — `#smtp-server-requires-authentication-btn-`
- **Test** — `#test-btn`
- **Save Proxy Server Settings** — `#configure-btn`
- **Reset** — `#reset-btn`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[placeholder="Search"]` |
| Proxy Server Enable (toggle) | ant-switch (master enable) |
| Proxy Server * | `input[name="proxy-server"]#smtp-server-id` |
| Proxy Server Port * | `input[name="proxy-server-port"]` |
| Timeout (sec) | `input[name="timeout"]` |
| Proxy Type | radio group (3 radios — e.g. HTTP/HTTPS/SOCKS; exact options TODO(source: docs)) |
| Authentication Requires (toggle) | `#smtp-server-requires-authentication-btn-` (reveals credentials when ON) |
| Test | `#test-btn` |
| Save Proxy Server Settings (primary) | `#configure-btn` |
| Reset | `#reset-btn` |

> **Automation caveat:** the Proxy Server host input carries `id="smtp-server-id"` — the **same id** used
> by the Mail Server SMTP field. Scope by `name="proxy-server"` or the screen container, not by that id.
> Catalog: 2 switches, 3 radios; the auth credential fields (shown when auth ON) were not captured.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Proxy Server)._

## 5. Permissions
- **Administrators** configure the proxy (global setting).
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- **Proxy Server Enable** ON to make the host/port/type fields meaningful.

## 7. Exit Conditions
- **On Save (success):** success toast; proxy config persists and is available to Mail/SMS "Use Proxy".
- **On Test:** pass/fail on reaching the proxy. TODO(source: docs) — exact result UI.
- **On Reset:** form reverts to last-saved values.

## 8. Validations
- **Proxy Server** — required when enabled; hostname/IP.
- **Proxy Server Port** — required when enabled; numeric port.
- **Timeout (sec)** — numeric seconds. TODO(source: docs) — min/max.
- **Authentication (when ON)** — username/password required.
- TODO(source: docs) — validation when Enable is OFF (fields disabled/ignored?).

## 9. Business Rules
- Host/port/type/auth are only in effect when **Proxy Server Enable** is ON.
- Mail and SMS settings that toggle **Use Proxy Server** depend on this proxy being configured.
- **Authentication credentials render only when "Authentication Requires" is ON.**
- TODO(source: KG/docs) — which product egress paths honour the proxy (updates, integrations, mail, SMS).

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md`. (Related environment
class: firewall/AV/NAT blocking outbound traffic — sections 1 & 3 — is infrastructure-side, not a
Proxy-Settings defect.)

## 11. Edge Cases
- Enable ON but host/port blank → save blocked / test fails.
- Unreachable proxy or wrong port → **Test** must fail clearly.
- Auth ON with wrong credentials; auth ON then OFF.
- Very small/zero or very large **Timeout** value.
- Toggle Enable OFF while Mail/SMS still have "Use Proxy Server" ON (dangling dependency).
- Wrong Proxy Type for the actual proxy (HTTP vs SOCKS).
