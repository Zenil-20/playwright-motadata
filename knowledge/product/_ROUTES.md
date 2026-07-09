# ObserveOps route map (build 8.2.6 @ 172.16.15.156) — locator-sweep index

Extracted live from the Vue router on 2026-07-02. **Totals: 273 routes · 180 static screens
(no `:params`) · 153 under `/settings/`.** This is the checklist for the locator sweep.

## How to (re)generate the full list
Run in the page console / `javascript_tool` on any authenticated tab:
```js
const el=document.querySelector('#app');
const r=el.__vue_app__.config.globalProperties.$router;
[...new Set((r.getRoutes?r.getRoutes():r.options.routes).map(x=>x.path))]
  .filter(p=>p && !/[:*]/.test(p)).sort().join('\n');
```

## Collection method (per screen)
1. `navigate` (full URL load — SPA JS-click routing doesn't render).
2. `javascript_tool`: poll ~18s for `.ant-form-item-label`/`input`, then dump labels + input
   name/id/placeholder + buttons + `[data-cy]`/`[data-testid]` + grid `th` + `.ant-select`/`.ant-switch`.
   Return **attributes only** (safety filter blocks HTML/values).
3. Store confirmed selectors in the screen's POM `locators.py` (or the catalog).

## Top-level modules (16, confirmed)
`/dashboard` · `/inventory/` (Monitors) · `/alerts/` · `/slo/` · `/reports/` · `/topology/network`
· `/nccm/` · `/netroute/` · `/metric-explorer/` · `/log/` · `/apm/` · `/rum/` · `/flow/`
· `/trap-explorer/` · `/audit/` · `/settings/`  (+ `/notifications`)

## Settings categories (confirmed)
`my-account` (my-profile · ui-preference · license) · `users-settings` (roles · user-profiles ·
password-settings · ldap · sso · radius · personal-access-token) · `group-settings` (data-security)
· `system-settings` (rebranding · two-factor · mail/sms/proxy servers · data-retention ·
mac-address-scanner · motadata-collector · dns-server-profiles · …) · **`policy-settings`**
(availability · metric · log · flow · trap · netroute · apm · network-config · real-user-monitoring)
· `monitoring` (service-check-monitor-settings · services) · **`integration`** (motadata-serviceops ·
service-now) · `compliance-settings` (audit-policy · benchmark · rules · weighted-calculation) ·
`service-level-objective` (slo-profile · correction-profile · penalty-profile) · `ai`
(dependency-mapper) · `apm-settings` (application-registration) · `digital-experience-monitoring`
(rum-applications) · `flow-settings` (application/as/domain/geolocation/ip/protocol/sampling mapping)
· **`network-discovery`** (network-discovery-profiles [+ /create])

## Key routes for Phase-1 regression
| Screen | Route | POM | Status |
|---|---|---|---|
| Login | `/login` | pages/login | ✅ confirmed |
| Discovery list | `/settings/network-discovery/network-discovery-profiles` | settings/network_discovery | ✅ confirmed |
| Discovery create (Linux) | `.../network-discovery-profiles/create` | settings/network_discovery | ✅ confirmed |
| Credential panel | (inline on create) | settings/network_discovery | ✅ confirmed |
| **Availability policy create** | `/settings/policy-settings/policies/availability/create` | settings/policy_settings | ✅ core confirmed |
| Monitors / Inventory | `/inventory/:category` | monitors_inventory | ⏳ next |
| Alerts | `/alerts/` | alerts | ⏳ |
| ServiceOps integration | `/settings/integration/motadata-serviceops` | settings/integrations | ⏳ (S9) |
| Policy landing (categories) | `/settings/policy-settings/` | settings/policy_settings | ⏳ |

Other policy types reuse the same form via `/settings/policy-settings/policies/<policyType>/create`
(`metric`, `log`, `flow`, `trap`, `netroute`, `apm`, `network-config`, `real-user-monitoring`).
