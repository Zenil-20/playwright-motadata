---
screen: NCCM Settings · device-template
module: Settings
category: nccm-settings
route: "/settings/nccm-settings/device-template"
build: 8.2.6
status: draft                        # authored from catalog + customer-issue-kb §13; several rules TODO
sources: [catalog, kb]               # locators/catalog/settings_nccm_settings_device_template.json · known_issues/customer-issue-kb.md §13
verified: 2026-07-09
---

# NCCM Settings · Device Template

## 1. Purpose
The library of **device templates** that tell NCCM *how* to talk to a class of devices — the CLI
command sequences used to fetch running/startup configuration (and related operations) for a given
**Vendor** and **OS Type**. Every device in the Device Inventory is backed up using the template that
matches its vendor/OS.

- **Business objective:** encapsulate per-vendor CLI dialects (login prompts, paging commands, transfer
  protocol) once, so config backup works uniformly across a heterogeneous fleet. Per the customer KB,
  vendor CLI quirks are the #1 NCM failure cause — templates are the fix surface.
- **Screen description:** a grid of templates with **Create Template**, listing Template name, Vendor,
  OS Type, and how many **Devices** use each.
- **Primary use cases:** browse built-in templates, create a custom template for an unsupported device,
  see how many devices depend on a template before editing it.
- **Who uses it:** network/config administrators.
- **Dependencies:** used by Device Inventory (template assignment) and by config-backup operations.

## 2. Navigation
```
Settings → NCCM Settings → Device Template
```
- **Breadcrumb:** Settings › NCCM Settings › Device Template
- **Sibling screens:** Device Inventory · Firmware Update Profile
- **Create route:** `/settings/nccm-settings/device-template/create`
- **URL:** `/settings/nccm-settings/device-template`

## 3. Actions
- **Create Template** — opens the create form (button "Create Template")
- **Search** — `input[placeholder="Search"]` / `input[name="search"]`
- **Filter** — `#filter-btn` (button "Filter")
- **Row actions** — `[data-cy='grid-action']` (edit / delete / clone — exact items TODO(source: KG))
- **Row selection** — checkboxes (~86 captured)

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Create Template | button **Create Template** |
| Search | `input[placeholder="Search"]` · `input[name="search"]` |
| Filter | **Filter** / `#filter-btn` |
| Row action menu | `[data-cy='grid-action']` |
| Row select | ~86 checkboxes |
| Grid columns | Template · Vendor · OS Type · Devices · Actions |

> The **Devices** column is the usage count — check it before editing/deleting a template, since
> changes propagate to every device that uses it.

_Locators: see `knowledge/locators/catalog/settings_nccm_settings_device_template.json`; promote verified ones into the cookbook._

## 5. Permissions
- **Config-admin scoped** for create/edit/delete. TODO(source: KG/docs) — read-only for other roles.
- **License/module gated** — NCM module required.

## 6. Entry Conditions
- Logged in; NCCM module enabled.

## 7. Exit Conditions
- **Create/Edit:** new/updated template appears in the grid; becomes selectable when assigning a
  device in the inventory. TODO(source: KG) confirm toast text.
- **Delete:** blocked or warned when the template is in use (Devices > 0)? TODO(source: KG/docs).

## 8. Validations
- TODO(source: docs) — grid is search/filter only; field validations live on the **create** form
  (see `device-template-create.md`).

## 9. Business Rules
- A template is keyed by **Vendor + OS Type**; the inventory matches a device to a template by its
  System OID / vendor. TODO(source: KG) confirm the exact matching key.
- Editing a template affects **all devices** currently using it (the Devices count).
- TODO(source: Motadata KG) — whether built-in/system templates are read-only vs. cloneable-only;
  whether a template in use can be deleted.

## 10. Known Bugs
From `customer-issue-kb.md` §13 (NCM / Configuration Management):
- **Template command sequences must match the vendor CLI exactly, or backup/firmware fails.**
  `issue:` FortiGate NCM dead, Cisco ISE config fetch shows `More`, TP-Link backup fails.
  `diagnosis:` FortiGate needs an `a` confirmation after `enable`; Cisco ISE ignores `terminal length 0`
  (so paging breaks the capture); TP-Link needs `\r\n` line endings and expects a changed prompt after
  `enable`. `workaround:` correct the template's command/prompt sequence; TP-Link handling shipped in
  **8.0.25** (PQD-33382 [MOTADATA-6866], PQD-33405, PQD-38572). → These are exactly the fields edited on
  the create/edit template form (Command / Prompt / Prompt Command / Timeout / Delay).

## 11. Edge Cases
- Two templates claiming the same Vendor + OS Type (ambiguous match).
- Editing a template with a large Devices count (blast radius).
- Deleting a template still assigned to devices.
- Vendor/OS with a non-standard prompt or paging command (see KB — FortiGate/ISE/TP-Link).
- Very long template name; duplicate name; Unicode in name/description.
