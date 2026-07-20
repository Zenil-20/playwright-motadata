---
screen: Discovery (section landing)
module: Settings
category: network-discovery
route: "/settings/network-discovery/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_network_discovery.json · "network discovery with/without ncm.png" · customer-issue-kb §1
verified: 2026-07-10
---

# Discovery — Section Landing

## 1. Purpose
The **landing route for the Discovery Settings area**. It groups the two working screens that onboard
infrastructure into monitoring: **Network Discovery Profiles** (what/how/when to scan) and **Credential
Profiles** (the reusable secrets those scans authenticate with).

- **Business objective:** a single entry point for setting up and managing device discovery.
- **Screen description:** the section root redirects to / renders its default child. The captured
  catalog for `/settings/network-discovery/` is **identical to the Credential Profiles grid**
  (same search, `#create-credential-profile-btn`, and Credential Profile Name / Used Count / Protocol
  / Actions columns), so the landing appears to resolve to the credential-profiles view (or shares its
  shell). TODO(source: KG/live) — confirm the exact default child and whether this route is just a
  redirect.
- **Primary use cases:** navigate to discovery profiles or credential profiles.
- **Who uses it:** monitoring admins/operators.
- **Dependencies:** Discovery module/license.

## 2. Navigation
```
Settings → Discovery
```
- **URL:** `/settings/network-discovery/`
- **Children:** Network Discovery Profiles (`…/network-discovery-profiles`) · Credential Profiles
  (`…/credential-profiles`)

## 3. Actions
- Navigate to a child screen (Network Discovery Profiles / Credential Profiles).
- As captured (credential view): **Create Credential Profile** (`#create-credential-profile-btn`),
  **Search**, row actions (`[data-cy='grid-action']`).

## 4. Components
Captured content mirrors **Credential Profiles**:
| Component | Control |
|---|---|
| Search | `input[name='search']` (placeholder _Search_) |
| Create Credential Profile | `#create-credential-profile-btn` |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns (as captured):** Credential Profile Name · Used Count · Protocol · Actions

> Because the sweep captured the credential grid here, treat the authoritative documentation for these
> controls as living in `credential-profiles.md`. This file documents the **section landing** role.

_Locators: see `credential-profiles.md` and `network-discovery-profiles.md` for the real per-screen controls._

## 5. Permissions
- Same as the Discovery area — admin/operator. TODO(source: KG/docs) — exact RBAC.

## 6. Entry Conditions
- Logged in; Discovery module enabled; Settings reachable.

## 7. Exit Conditions
- Lands on the default Discovery child screen (credential-profiles per the capture; TODO confirm).

## 8. Validations
- None at the landing level (see the child screens' create forms).

## 9. Business Rules
- Discovery = **Credential Profiles (secrets)** + **Network Discovery Profiles (scans)**; a scan
  references a credential profile. TODO(source: KG) — confirm the default landing child.

## 10. Known Bugs
No landing-specific defects recorded. Discovery-area issues are documented on the child screens
(`network-discovery-profiles.md` §10, `credential-profiles.md` §10, `network-discovery-profiles-create.md`
§10) and in `knowledge/known_issues/customer-issue-kb.md` §1 (the largest ticket hotspot).

## 11. Edge Cases
- Direct-navigating to `/settings/network-discovery/` — confirm it resolves to a valid child, not a
  blank page.
- Deep-link vs. SPA routing (open the full URL so the router loads the section).
