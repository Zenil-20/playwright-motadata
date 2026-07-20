---
screen: System Settings · MAC Address Scanner
module: Settings
category: system-settings
route: "/settings/system-settings/mac-address-scanner"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_mac_address_scanner.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · MAC Address Scanner

## 1. Purpose
Maintains a list of **MAC-address to device/interface mappings** the platform has discovered (or that an
admin adds manually), correlating a MAC address with the device IP, interface IP, and interface name it
was seen on. This supports switch-port/endpoint tracking and topology/interface correlation.

- **Business objective:** know which MAC addresses live behind which device interfaces, enabling
  endpoint/switch-port location and better topology/interface mapping.
- **Screen description:** a list/grid under `Settings → System Settings → MAC Address Scanner` with a
  **Create Mac Address** action and per-row actions.
- **Primary use cases:** review discovered MAC mappings, manually add a MAC mapping, search, edit/delete.
- **Who uses it:** administrators / network engineers.
- **Dependencies:** discovery of switching devices that expose MAC/interface tables (SNMP bridge/forwarding
  tables) to populate rows automatically.

## 2. Navigation
```
Settings → System Settings → MAC Address Scanner
```
- **Breadcrumb:** Settings › System Settings › MAC Address Scanner
- **URL:** `/settings/system-settings/mac-address-scanner`

## 3. Actions
- **Create Mac Address** — `#create-mac-address-btn` (opens a create form/drawer)
- **Search** the grid — `input[name="search-mac-address-list"]` (placeholder "Search")
- Per-row **Actions** (edit / delete) — `[data-cy='grid-action']`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search-mac-address-list"]` (placeholder "Search") |
| Create Mac Address | `#create-mac-address-btn` |
| Grid | columns below |
| Row actions | `[data-cy='grid-action']` |

**Grid columns:** Mac Address · Device IP Address · Interface IP Address · Interface Name · Actions

> The **create/edit form fields** (MAC, device IP, interface IP, interface name) were not captured by the
> list-state sweep. Confirm inputs live or via the KG before writing a create test.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > MAC Address Scanner)._

## 5. Permissions
- **Administrators / network engineers** manage MAC mappings.
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- Rows populate from discovered switching devices (empty on fresh install / before discovery).

## 7. Exit Conditions
- **On Create (success):** success toast; new mapping appears as a grid row.
- **On Delete:** row removed.
- **On Edit/Save:** row reflects updated mapping.

## 8. Validations
- **Mac Address** — must be a valid MAC format. TODO(source: docs) — accepted separators/case.
- **Device IP / Interface IP** — valid IP addresses. TODO(source: docs).
- TODO(source: docs) — uniqueness (same MAC on one interface).

## 9. Business Rules
- Rows are primarily **discovered** from device forwarding/bridge tables; manual entries supplement them.
  TODO(source: KG/docs) — how manual vs. discovered entries interact and whether discovery overwrites
  manual rows.
- TODO(source: KG/docs) — how this data feeds topology/interface correlation.

## 10. Known Bugs
None recorded specifically for this screen in `knowledge/known_issues/customer-issue-kb.md`. (Related
topology/interface-mapping defects — section 8 — concern LLDP/interface-name parsing, not the MAC scanner
list directly.)

## 11. Edge Cases
- Invalid MAC format; MAC with mixed case / different separators.
- Duplicate MAC across two interfaces (roaming endpoint).
- Invalid device/interface IP.
- Very large tables (paging/performance) on core switches.
- Discovered row edited manually then re-discovered (overwrite behaviour).
- Search returning no rows.
