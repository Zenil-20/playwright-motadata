---
screen: Users Settings · radius-server-settings
module: Settings
category: users-settings
route: "/settings/users-settings/radius-server-settings"
build: 8.2.6
status: draft
sources: [catalog, screenshot]   # catalog/settings_users_settings_radius_server_settings.json · screenshots/Settings1.png (left-nav)
verified: 2026-07-09
---

# Users Settings · Radius Server Settings

## 1. Purpose
The **Radius Server Settings** screen configures an external **RADIUS** server so users can be
authenticated against it — an alternative/additional external auth source alongside LDAP and SSO.

- **Business objective:** delegate authentication to a corporate RADIUS/AAA server (often fronting
  MFA/token systems) for centralised, policy-driven login.
- **Screen description:** a single configuration form under `Settings → User Settings → Radius Server
  Settings` with server IP, port, shared secret, protocol, and Save/Reset actions.
- **Primary use cases:** point ObserveOps at a RADIUS server (IP, auth port, shared secret, protocol),
  save it, reset unsaved edits.
- **Who uses it:** administrators with identity/integration rights.
- **Dependencies:** a reachable RADIUS server; matching **shared secret**; the chosen **protocol**
  (e.g. PAP/CHAP/MS-CHAP) supported on both ends; network path to the auth port.

## 2. Navigation
```
Settings → User Settings → Radius Server Settings
```
- **Breadcrumb:** Settings › User Settings › Radius Server Settings
- **Left-nav group:** *User Settings* — order confirmed from `screenshots/Settings1.png`.
- **URL:** `/settings/users-settings/radius-server-settings`

## 3. Actions
- Enter **Server IP** — `#server-ip-id` (placeholder *e.g. 172.16.18.11*).
- Enter **Authentication Port** — `#authentication-port-id`.
- Enter **Server Secret** (shared secret) — `#server-secret-id`.
- Select **Protocol** — dropdown (`[data-cy='dropdown-trigger-input']`).
- **Save Radius Server** — `#save-radius-server-btn`.
- **Reset** — `#reset-btn` (revert unsaved edits).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Server IP | `input#server-ip-id` (name `server-ip`) — placeholder *e.g. 172.16.18.11* |
| Authentication Port | `input#authentication-port-id` (name `authentication-port`) |
| Server Secret | `input#server-secret-id` (name `server-secret`) |
| Protocol | select via `[data-cy='dropdown-trigger-input']` |
| Save Radius Server (primary) | `#save-radius-server-btn` |
| Reset | `#reset-btn` |

> The **Server Secret** field renders as a text input in the catalog; confirm live whether it is
> masked. The **Protocol** dropdown options (PAP/CHAP/MS-CHAP…) were not enumerated in the sweep —
> harvest live/KG. A **test-connection** control, if any, was not captured. _Promote verified locators
> into `selector-cookbook.md`._

## 5. Permissions
- **Admin-gated:** configuring an external auth source is a privileged identity action.
  TODO(source: KG/docs) — grant.
- **Enabling RADIUS affects login for the users it covers** — misconfiguration can block authentication;
  TODO(source: KG/docs) whether local admin login remains a fallback.

## 6. Entry Conditions
- Logged in with identity/integration rights.
- For a working config: RADIUS server reachable on the auth port with a matching shared secret and a
  mutually supported protocol.

## 7. Exit Conditions
- **On Save (success):** success toast; the RADIUS configuration persists. Assertion: a covered user
  can authenticate via RADIUS afterward. TODO(source: KG/docs) whether a test/validate step runs on save.
- **On Reset:** unsaved edits reverted.

## 8. Validations
- **Server IP** — required; valid IP/host format (placeholder shows an IPv4 example).
- **Authentication Port** — required; numeric, valid port range (default RADIUS auth port 1812).
  TODO(source: docs) confirm default + range.
- **Server Secret** — required; TODO(source: KG/docs) min length/complexity.
- **Protocol** — required selection. TODO(source: KG/docs) allowed values.

## 9. Business Rules
- The **shared secret must match** the RADIUS server exactly, and the **protocol must be mutually
  supported**, or authentication silently fails. TODO(source: KG/docs) confirm error surfacing.
- TODO(source: KG/docs): single vs multiple RADIUS servers; precedence when RADIUS + LDAP + local all
  exist; whether RADIUS users are auto-imported or must pre-exist.

## 10. Known Bugs
None recorded for this screen in `customer-issue-kb.md` for build 8.2.6. (Note: "service check radius"
entries elsewhere concern *monitoring* a RADIUS service, not this authentication-source config — do not
conflate.) Do not invent bugs.

## 11. Edge Cases
- Wrong **shared secret** / mismatched **protocol** → assert a distinguishable auth failure, not a
  silent hang.
- Unreachable server / wrong port / firewall-blocked → timeout with actionable message.
- Non-numeric or out-of-range **Authentication Port**; invalid **Server IP** format.
- Save RADIUS config then verify a covered user can log in; verify local admin fallback still works.
- Very long / special-character shared secret.
- Reset after edits (old config persists?).
