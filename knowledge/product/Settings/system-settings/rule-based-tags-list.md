---
screen: System Settings · Rule-Based Tags
module: Settings
category: system-settings
route: "/settings/system-settings/rule-based-tags-list"
build: 8.2.6
status: draft
sources: [catalog, kb]        # locators/catalog/settings_system_settings_rule_based_tags_list.json ; known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# System Settings · Rule-Based Tags

## 1. Purpose
Manages **rule-based tagging rules** — automation that applies a **tag** to every monitor/object matching
a defined condition, instead of tagging each device by hand. Each rule shows its operation, how many
objects currently qualify (Qualified Count), the tag applied, and when it last ran.

- **Business objective:** keep tags consistent and current at scale by auto-tagging objects that match a
  rule (e.g. all devices in a subnet → "site-x"), rather than manual/CSV tagging.
- **Screen description:** a list/grid under `Settings → System Settings → Rule-Based Tags` with a
  **Create Rule** action, row-selection checkboxes, per-row actions, and a run/rediscovery-style trigger.
- **Primary use cases:** create/edit/delete a tagging rule, run a rule, review Qualified Count and Last
  Ran At, bulk-select rules, search.
- **Who uses it:** administrators.
- **Dependencies:** discovered monitors/objects to match against; the tag store.

## 2. Navigation
```
Settings → System Settings → Rule-Based Tags
```
- **Breadcrumb:** Settings › System Settings › Rule-Based Tags
- **URL:** `/settings/system-settings/rule-based-tags-list`

## 3. Actions
- **Create Rule** — `#btn-create-rule-tag` (opens a create form/drawer)
- Run rules / trigger evaluation — `#start-rediscovery` (rediscovery-style trigger — confirm exact semantics)
- **Search** the grid — `input[name="rule-search"]` (placeholder "Search")
- Bulk-select rows — row checkboxes (14 checkboxes captured, i.e. select-all + per-row on the visible page)
- Per-row **Actions** (edit / delete / run) — `[data-cy='grid-action']`

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="rule-search"]` (placeholder "Search") |
| Create Rule | `#btn-create-rule-tag` |
| Run / trigger | `#start-rediscovery` |
| Row-select checkboxes | 14 checkboxes (select-all + per-row for the current page) |
| Grid | columns below |
| Row actions | `[data-cy='grid-action']` |

**Grid columns:** Rule Name · description · Operation · Qualified Count · tag · Last Ran At · Actions

> The **rule builder / create form** (condition operators, match fields, target tag) was not captured by
> the list-state sweep. Confirm the exact rule-condition inputs live or via the KG before writing a
> create test.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Rule-Based Tags)._

## 5. Permissions
- **Administrators** manage tagging rules.
- TODO(source: KG/docs) — non-admin visibility.

## 6. Entry Conditions
- Logged in as an administrator.
- Objects exist to be matched (a fresh install with no monitors yields Qualified Count 0).

## 7. Exit Conditions
- **On Create/Save (success):** success toast; new rule appears in the grid.
- **On Run:** **Qualified Count** and **Last Ran At** update; matching objects receive the tag.
- **On Delete:** rule removed. TODO(source: docs) — whether already-applied tags are also removed.

## 8. Validations
- **Rule Name** — likely required/unique. TODO(source: docs).
- Rule condition + target **tag** required to run. TODO(source: docs) — operator/value validation.

## 9. Business Rules
- A rule auto-applies its **tag** to all qualifying objects; **Qualified Count** reflects current matches.
- Rules are re-evaluated on a run/rediscovery trigger (`#start-rediscovery`) — TODO(source: KG/docs)
  confirm whether they also run automatically on a schedule / after discovery.
- Rule-based tagging is the **documented workaround** for bulk/hierarchical tagging gaps (see Known Bugs).
- TODO(source: KG/docs) — tag case handling (the KB notes CSV tags weren't always lowercased).

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (Tag handling defects, section 1):
- **"Tag Error" after upgrade** from blank tags introduced by an upgrade (PQD-32287 [MOTADATA-6551]) —
  fixed in 8.0.25.
- **Uppercase CSV tags accepted inconsistently / not lowercased** (PQD-34441) — auto-lowercase planned.
- **No bulk hierarchical tagging** (PQD-32063) — **rule-based tagging (this screen) is the workaround.**
Verify against build 8.2.6.

## 11. Edge Cases
- Rule matching zero objects (Qualified Count 0) vs. matching everything.
- Duplicate rule name; conflicting rules assigning different tags to the same object.
- Uppercase vs. lowercase tag values (KB case-handling defect).
- Deleting a rule — are previously applied tags retained or removed?
- Running many rules at once (bulk-select) — performance/order.
- Rule condition that becomes stale after devices change (re-run needed).
