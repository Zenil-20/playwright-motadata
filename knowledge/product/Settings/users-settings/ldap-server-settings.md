---
screen: Users Settings · ldap-server-settings
module: Settings
category: users-settings
route: "/settings/users-settings/ldap-server-settings"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # catalog/settings_users_settings_ldap_server_settings.json · screenshots/Settings1.png (left-nav) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Users Settings · LDAP Server Settings

## 1. Purpose
The **LDAP Server Settings** screen registers external **LDAP/Active Directory** servers so users and
groups can authenticate against, and be imported from, a corporate directory instead of being created
locally.

- **Business objective:** centralise identity — let AD/LDAP be the source of truth for users and group
  membership, with periodic **sync** keeping ObserveOps in step.
- **Screen description:** a grid of configured LDAP servers under `Settings → User Settings → LDAP
  Server Settings` with an **Add LDAP Server** entry point, per-row **Sync** and Actions, and a
  column-chooser. Columns: **ip/Host**, **fqdn**, **LDAP Groups**, **Last Sync At**, **Sync**,
  **Actions**.
- **Primary use cases:** add/edit an LDAP server, trigger a **sync** (rediscovery) of users/groups,
  review **Last Sync At**, map **LDAP Groups** to roles/profiles, delete a server.
- **Who uses it:** administrators with identity/integration rights.
- **Dependencies:** reachable LDAP/AD server + bind credentials; **Role** and **User Profile** (imported
  groups map to these); network path/ports to the directory.

## 2. Navigation
```
Settings → User Settings → LDAP Server Settings
```
- **Breadcrumb:** Settings › User Settings › LDAP Server Settings
- **Left-nav group:** *User Settings* — order confirmed from `screenshots/Settings1.png`.
- **URL:** `/settings/users-settings/ldap-server-settings`

## 3. Actions
- **Add LDAP Server** — opens the server-config form. Note the id/label mismatch below.
- **Sync / rediscover** users+groups for a server — `#start-rediscovery`,
  `[data-testid='ldap-sync-trigger']` (also the *Sync* grid column).
- **Show/Hide columns** — `#btn-show-hide-columns`, `[data-testid='ldap-column-selector']`.
- **Search** servers (`search`, `[data-testid='ldap-search-input']`).
- **Export** — **PDF** (`[data-testid='ldap-export-pdf-btn']`) / **CSV**
  (`[data-testid='ldap-export-csv-btn']`).
- **Row Actions** — edit / delete (via `[data-cy='grid-action']`).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Grid container | `[data-testid='ldap-grid-container']` |
| Search | `input[name='search']` · `[data-testid='ldap-search-input']` |
| Add LDAP Server (primary) | button labelled **Add LDAP Server** — **id `#create-user-btn`** · `[data-testid='ldap-create-btn']` |
| Sync / Rediscover | `#start-rediscovery` · `[data-testid='ldap-sync-trigger']` |
| Show/Hide Columns | `#btn-show-hide-columns` · `[data-testid='ldap-column-selector']` |
| Export PDF / CSV | `[data-testid='ldap-export-pdf-btn']` / `[data-testid='ldap-export-csv-btn']` |
| Row action menu | `[data-cy='grid-action']` |
| Grid | columns: **ip/Host**, **fqdn**, **LDAP Groups**, **Last Sync At**, **Sync**, **Actions** |

> **Automation caveat:** the **Add LDAP Server** button carries the id **`#create-user-btn`** (not
> `create-ldap-…`) — prefer the label or `[data-testid='ldap-create-btn']` to avoid confusion with a
> user-create control. The **Add/Edit LDAP Server** dialog fields (host/IP, port, bind DN, bind
> password, base DN, group filter, TLS) were **not captured** in the grid sweep — harvest live/KG.
> _Promote verified locators into `selector-cookbook.md`._

## 5. Permissions
- **Admin-gated:** configuring identity sources is a privileged integration action.
  TODO(source: KG/docs) — exact grant.
- Imported **LDAP Groups** are mapped to **Roles/User Profiles**, so an LDAP misconfiguration directly
  affects who can log in and with what privileges. TODO(source: KG/docs) confirm the mapping UI.

## 6. Entry Conditions
- Logged in with identity/integration rights.
- For a successful add/sync: the LDAP/AD server is reachable, the **bind credentials** are valid, and
  the **base DN / group CN** are correct (see Known Bugs — CN mistakes are the top failure).

## 7. Exit Conditions
- **On Add/Edit (success):** success toast; server row appears with its **fqdn**/**ip/Host**.
- **On Sync (success):** **Last Sync At** updates; **LDAP Groups** count reflects imported groups;
  imported users become able to authenticate. Assertion: Last Sync At advances and no error toast.
- **On Sync (failure):** an error surfaces (e.g. "Invalid Credential") — see Known Bugs.
- **On Delete:** row removed; TODO(source: KG/docs) fate of already-imported users/groups.

## 8. Validations
- **Host/IP** and **Base/Group DN (CN)** — required; a wrong **CN** does not error obviously but yields
  empty/failed group sync (Known Bugs). TODO(source: KG/docs) exact field set.
- **Bind credentials** — required; invalid → "Invalid Credential" on sync.
- **Port / TLS** — TODO(source: KG/docs) defaults (389/636) and validation.

## 9. Business Rules
- **Group mapping uses the container CN**, not the group name — a recurring source of failed/empty
  syncs (Known Bugs). Getting CN vs Group Name right is a hard rule.
- **Sync is periodic + on-demand**; AD-side changes between syncs can spawn **duplicate users** if
  identity keys drift (Known Bugs).
- TODO(source: KG/docs): whether local and LDAP users can coexist; conflict resolution on username
  collision; whether disabling a server disables its imported users.

## 10. Known Bugs
- **version: ~8.0.20-era** · **issue:** **"Invalid Credential" on LDAP integration** and **group sync
  failures** caused by using the **wrong CN** — the CN must be the *container of the group*, and
  operators frequently supplied the **Group Name where a CN was expected**
  (`customer-issue-kb.md` §11 "LDAP/AD sync failures", PQD-30127 / MOTADATA-6010, PQD-37328). ·
  **workaround:** use the correct CN / Group-Name mapping; apply the patched LDAP executables.
- **issue:** **duplicate users** appear after AD-side configuration changes (PQD-39839, PQD-38845). ·
  **workaround:** de-duplicate and upgrade to the fixed build.
- Do not invent bugs beyond the above.

## 11. Edge Cases
- Wrong **CN** vs correct container CN (assert clear failure vs empty group list) — regression for
  PQD-30127.
- Invalid/expired bind credentials → "Invalid Credential" (distinguishable error, not silent).
- Unreachable server / wrong port / firewall-blocked → timeout with actionable message.
- AD-side rename/move between syncs → assert **no duplicate users** created (PQD-39839 class).
- TLS/LDAPS vs plain LDAP; self-signed cert on the directory.
- Sync a server with **thousands of groups/users** — performance/timeout behaviour.
- Delete a server whose users are logged in — session/access outcome.
- **Add LDAP Server** control resolved by the misleading `#create-user-btn` id — assert tests target
  the right button.
