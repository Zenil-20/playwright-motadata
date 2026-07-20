---
screen: Discovery · credential-profiles
module: Settings
category: network-discovery
route: "/settings/network-discovery/credential-profiles"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_network_discovery_credential_profiles.json · "network discovery with ncm.png" (Create Credential Profile control) · customer-issue-kb §1
verified: 2026-07-10
---

# Discovery · Credential Profiles

## 1. Purpose
The **library of reusable credentials** (SNMP v1/v2c/v3, SSH, WinRM, cloud keys, DB logins, etc.) that
discovery profiles use to authenticate to targets. Defining credentials once here lets many discovery
profiles reference them, and centralizes rotation.

- **Business objective:** separate secrets from discovery definitions — one credential profile can be
  reused across many discovery profiles, and updated in one place.
- **Screen description:** a searchable grid of credential profiles showing name, how many places use
  it, and its protocol, with a **Create Credential Profile** button. The same create action is also
  reachable inline from the discovery create wizard.
- **Primary use cases:** add a credential for a protocol, see where a credential is used before
  editing/deleting it, search for a credential by name.
- **Who uses it:** monitoring admins/operators managing device access. TODO(source: KG/docs) — exact role.
- **Dependencies:** none to view; used by Network Discovery Profiles at scan time.

## 2. Navigation
```
Settings → Discovery → Credential Profiles
```
- **Breadcrumb:** Settings › Discovery › Credential Profiles
- **Sibling screen:** Network Discovery Profiles (`…/network-discovery-profiles`)
- **URL:** `/settings/network-discovery/credential-profiles`
- **Also reachable** via **Create Credential Profile** on the discovery create wizard
  (`#create-credential-btn-id`, opens the same create flow inline).

## 3. Actions
- **Create Credential Profile** — opens the create form (`#create-credential-profile-btn`).
- **Search** — filter the grid by name (`input[name='search']`).
- **Row actions** — per-row menu (`[data-cy='grid-action']`): TODO(source: KG/docs) confirm exact set
  (expected: Edit, Delete, Clone). Delete is expected to be blocked/warned when **Used Count > 0**.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name='search']` (placeholder _Search_) + header search |
| Create Credential Profile (primary) | `#create-credential-profile-btn` |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns**
- Credential Profile Name
- Used Count (how many discovery profiles/monitors reference it)
- Protocol (SNMP / SSH / WinRM / cloud / DB … — TODO confirm full set)
- Actions

> The **create form fields** (protocol selector, username/password/community/keys, SNMP v3 auth/priv,
> etc.) were **not captured** in this list-screen sweep. TODO(source: KG/live) — document the create
> dialog's fields and validations.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Credential Profiles)._

## 5. Permissions
- Manages secrets — expected to be an **admin-level** capability; operators may only select existing
  profiles in discovery. TODO(source: KG/docs) — confirm who can create/view/edit/delete, and whether
  secret values are ever readable back (they usually are write-only/masked).

## 6. Entry Conditions
- Logged in with a Discovery-capable role.
- Settings → Discovery reachable.

## 7. Exit Conditions
- **Create (success):** new row appears with **Used Count = 0** and the chosen protocol.
- **Edit:** values updated; referencing discovery runs use the new secret on next run.
- **Delete:** row removed — expected only when **Used Count = 0**; TODO(source: KG) confirm the guard.

## 8. Validations
- Grid screen — field validations live in the create form (not captured; TODO).
- Expected: profile name required + unique; protocol-specific required fields (e.g. SNMP community for
  v2c; username + auth/priv for SNMP v3; username/password or key for SSH). TODO(source: KG/live).

## 9. Business Rules
- **Used Count** reflects how many discovery profiles reference the credential — the basis for a safe-
  delete guard.
- One credential profile is **reusable across many** discovery profiles.
- The credential's **protocol must match** the target's access method for discovery to authenticate.
- TODO(source: KG/docs): name uniqueness, whether secrets are re-readable, credential-to-group scoping.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` §1 — credential issues are a top cause of "data
missing for one device":
- **Credential / permission problems block discovery or specific KPIs** (13x; PQD-30159, PQD-32697,
  PQD-38137, PQD-39521): read-only instead of admin creds (Cisco WLC); a **changed credential profile**
  caused ESXi timeouts; WinRM unconfigured / wrong AD username format; PAM `pam_faillock` locking root;
  restricted security policies limiting SSH sessions (PQD-34864: only 2 of 12 polls/hour succeeded).
  **Workaround/fix:** correct the credential profile scope, follow WinRM/non-admin SOPs, prefer SSH
  key-based auth, whitelist the AIOps poller in the security policy.
- **SSH/TLS algorithm & auth-protocol mismatches** (5x; PQD-29912, PQD-33284, PQD-36217): KEX not
  offered, WinRM-HTTPS gap. **Fix:** add KEX to `ssh_config`; `"plugin.engine": "python"` for HTTPS
  WinRM (8.1.3).
> Editing a live credential profile is a recognized regression trigger (ESXi timeout above) — changing
> a profile in use should be tested as a first-class regression.

## 11. Edge Cases
- Delete a credential with **Used Count > 0** (must be guarded or warned).
- Edit a credential currently in use → next discovery run must pick up the change (or fail cleanly).
- Duplicate profile name; empty required secret fields.
- SNMP v3 with blank username (a documented discovery failure — §1/§7 of KB).
- Read-only vs admin credentials for the same device (partial data).
- Wrong protocol vs. target (SSH creds on an SNMP-only device).
- Special characters / very long secrets; whitespace in username/community.
- Concurrent edit of the same credential from two sessions.
