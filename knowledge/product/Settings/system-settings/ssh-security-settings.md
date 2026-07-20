---
screen: System Settings · SSH Security Settings
module: Settings
category: system-settings
route: "/settings/system-settings/ssh-security-settings"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_ssh_security_settings.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · SSH Security Settings

## 1. Purpose
Controls which **SSH cryptographic algorithms** the appliance permits when it establishes SSH sessions
to monitored devices — typically grouped as Key Exchange (KEX), ciphers, MACs, and host-key algorithms —
each selectable via checkboxes. Tightening this list is a common response to VAPT findings; loosening it
restores compatibility with older devices.

- **Business objective:** let security teams disable weak SSH algorithms (to pass VAPT/CIS audits) while
  keeping enough enabled to still poll legacy network gear.
- **Screen description:** a large multi-section checkbox form under `Settings → System Settings → SSH
  Security Settings`. The catalog counts **88 checkboxes** across (likely) four algorithm groups, each
  with its own **Search** box (4 in-section search inputs captured), plus **Save** and **Reset**.
- **Primary use cases:** enable/disable specific KEX/cipher/MAC/host-key algorithms, search within a
  group, apply the hardened set.
- **Who uses it:** administrators / security engineers.
- **Dependencies:** the SSH client stack used for device polling; changing this affects whether specific
  devices can be reached.

## 2. Navigation
```
Settings → System Settings → SSH Security Settings
```
- **Breadcrumb:** Settings › System Settings › SSH Security Settings
- **URL:** `/settings/system-settings/ssh-security-settings`

## 3. Actions
- Check/uncheck individual algorithms (88 checkboxes across the groups)
- **Search** within each algorithm group — four `input[name="search"]` (placeholder "Search")
- **Save** — `#configure-btn`
- **Reset** — `#reset-btn`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Section search (×4) | `input[name="search"]` (placeholder "Search") — one per algorithm group |
| Algorithm checkboxes | 88 checkboxes (grouped: KEX / ciphers / MACs / host-key — grouping TODO(source: docs)) |
| Save | `#configure-btn` |
| Reset | `#reset-btn` |

> The catalog reports **88 checkboxes** and **4 search inputs** (all `name="search"`), consistent with
> four searchable algorithm groups. The exact group headings and individual algorithm labels/ids were not
> individually captured — enumerate live or via the KG before writing a targeted enable/disable test.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > SSH Security Settings)._

## 5. Permissions
- **Administrators / security engineers** manage SSH algorithm policy (global, affects device polling).
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- Current enabled/disabled algorithm state loads into the checkboxes.

## 7. Exit Conditions
- **On Save (success):** success toast; the appliance uses only the enabled algorithms for new SSH
  sessions. TODO(source: KG/docs) — whether existing sessions/poll cycles pick it up immediately or need
  a service restart.
- **On Reset:** form reverts to last-saved selection.

## 8. Validations
- TODO(source: docs) — whether at least one algorithm per group must remain enabled (disabling all would
  break SSH). This is a strong candidate for a guard rule; confirm.

## 9. Business Rules
- Disabling weak algorithms hardens the appliance but can **break polling to legacy devices** that only
  offer those algorithms (the classic compatibility-vs-security trade-off — see Known Bugs, where a
  *missing* KEX broke a Linux VM add).
- TODO(source: KG/docs) — the four algorithm groups and their exact members; interaction with the
  backend `ssh_config` / `jdk.tls.disabledAlgorithms` referenced in the KB.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (SSH/TLS mismatches & VAPT, sections 1 & 9):
- **SSH KEX algorithm mismatch blocks discovery** — a Linux VM couldn't be added because
  `diffie-hellman-group-exchange-sha256` wasn't offered (PQD-29912 and related, section 1). Fix: add the
  required KEX (this screen is where algorithm availability is controlled).
- **VAPT weak-cipher / weak-SSH findings** — SWEET32 and weak TLS/SSH ciphers flagged by bank/government
  audits (PQD-28704, MOTADATA-7566/8035, section 9). Solution shipped via `jdk.tls.disabledAlgorithms`
  additions and the SOP_Update_Secure_Cipher_Configuration; strong-cipher SOP tied to 8.2.0.
Verify exact behaviour on build 8.2.6.

## 11. Edge Cases
- Disabling all algorithms in a group (should be blocked / breaks SSH entirely).
- Disabling an algorithm a production device requires → that device stops polling.
- Enabling a weak algorithm re-flagged by VAPT (reverse of hardening).
- Search within a group returning no matches.
- Save then immediately poll a legacy device (does the change apply mid-cycle?).
- Reset after a large multi-group change.
