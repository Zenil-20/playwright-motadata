---
screen: Ai · dependency-mapper
module: Settings
category: ai
route: "/settings/ai/dependency-mapper"
build: 8.2.6
status: draft
sources: [catalog, kb]   # settings_ai_dependency_mapper.json · customer-issue-kb §8 (Topology & Dependency Mapper). No matching screenshot.
verified: 2026-07-10
---

# AI · Dependency Mapper

## 1. Purpose
The screen that manages **monitor-to-monitor relationships** — the dependency graph that says which
device/interface is a *parent* of which *child*. These relationships drive **root-cause /
suppression** logic (when a parent is down, its children's alarms can be correlated/suppressed) and
feed topology and availability correlation. Rows can be auto-discovered (via topology / link-layer) or
created manually.

- **Business objective:** reduce alert noise and speed root-cause by modeling real dependencies — an
  upstream failure explains downstream symptoms instead of a storm of independent alarms.
- **Screen description:** a searchable grid of parent→child relationships with per-row **ON/OFF**
  toggles (the catalog counted **39 switches**, i.e. one enable toggle per relationship row plus a
  header/bulk control), a **Filter** control, and a **Create Relationship** button.
- **Primary use cases:** review/enable/disable discovered dependencies, manually add a relationship,
  filter the graph, correct a mis-mapped link.
- **Who uses it:** monitoring/observability admins tuning correlation. TODO(source: KG/docs) — exact role.
- **Dependencies:** provisioned monitors (and their interfaces); topology/LLDP data for auto-discovered
  links; the AI/correlation module.

## 2. Navigation
```
Settings → Dependency Mapper
```
- **Breadcrumb:** Settings › (AI) › Dependency Mapper
- **URL:** `/settings/ai/dependency-mapper`
- Note: the left-nav label observed on other Settings screens is **"Dependency Mapper"** (see
  `My Account - UI Preference.png` nav); the route namespace is `ai`.

## 3. Actions
- **Create Relationship** — manually add a parent→child dependency (opens a form/dialog).
- **Filter** — open filter controls (`#filter-btn`).
- **Search** — filter the grid (`input[name='role-search']`).
- **Enable / disable a relationship** — per-row **ON/OFF** toggle (status column).
- **Row actions** — per-row menu (`[data-cy='grid-action']`): TODO(source: KG/docs) confirm set
  (expected: Edit, Delete).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name='role-search']` (placeholder _Search_) + header search |
| Filter | `#filter-btn` |
| Create Relationship (primary) | button "Create Relationship" — TODO(source: live) capture its id |
| Per-row enable toggle | ant-switch per row (catalog counted **39** switches) |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns**
- Parent Monitor
- Parent Interface
- Child Monitor
- Child Interface
- Type (relationship type — TODO confirm the enum)
- Link Layer (e.g. L2/L3 / LLDP-derived — TODO confirm)
- Status (enabled/disabled via the row toggle)
- Actions

> The **Create Relationship form** and **Filter** fields were not captured. TODO(source: KG/live) —
> document parent/child monitor & interface pickers, Type/Link Layer options, and filter criteria.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Dependency Mapper)._

## 5. Permissions
- Editing correlation topology — expected **admin-level**. TODO(source: KG/docs) — confirm who can
  create/edit/delete/enable vs. view.

## 6. Entry Conditions
- Logged in with an appropriate role.
- Monitors (and interfaces) are provisioned; topology has run for auto-discovered links.

## 7. Exit Conditions
- **Create (success):** new parent→child row appears, enabled by default (TODO confirm default state).
- **Enable/disable:** row toggle flips; correlation/suppression for that pair activates/deactivates.
- **Delete:** relationship removed; children no longer suppressed by that parent. TODO(source: KG) —
  confirm that deleting a dependency un-suspends previously suppressed children (see Known Bugs).

## 8. Validations
- Grid screen — validations live in the Create Relationship form (not captured; TODO).
- Expected: parent and child must be distinct provisioned monitors; a given parent-interface↔child-
  interface pair should be unique. TODO(source: KG/live).

## 9. Business Rules
- A **parent-down state can suppress/correlate child alarms** (dependency-based availability
  correlation).
- Relationships can be **auto-discovered** (topology/link-layer) or **manually created**; the row
  toggle enables/disables each.
- Uniqueness is expected on **device + interface**, not interface index alone (see Known Bugs — a real
  defect existed where uniqueness was validated on interface index only).
- TODO(source: KG/docs): how Dependency Mapper relates to the Topology view; whether disabling a
  relationship immediately clears active suppression.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` §8 (Topology & Dependency Mapper):
- **Deleted dependency child stays suspended/unreachable** (§5/§8, PQD-… policy-semantics cluster):
  availability-correlation **suspension persists after the dependency is removed**. **Workaround:** a
  bulk metric-collection option to un-suspend groups; verify un-suspend on delete.
- **Wrong port connectivity vs. dependency mapper / duplicate-connection error on legitimate same-index
  interfaces** (§8, PQD-38710 [MOTADATA-8179], PQD-40859 [MOTADATA-8544]): uniqueness validated on
  **interface index only**, not device+interface. **Fix:** 8.2.0–8.2.2 (+8.2.1 hotfix exe).
- **Name/IP parsing misclassification breaks topology** (§8, PQD-29906, PQD-36424 [MOTADATA-7745]):
  16-char device names parsed as IPv6; a later fix regressed ASCII A.B.C.D octet parsing (worked
  8.0.15, broke 8.1.0). **Combined parser fix in 8.1.2** — treat as the canonical "fix-introduced-
  regression" case; must never regress.
- **Interface-name mismatches prevent neighbour mapping** (§8, PQD-33405 [MOTADATA-6884]): LLDP full vs
  short names, garbage chars. **Fix:** normalize names, fall back to interface-description OID.

## 11. Edge Cases
- Create a self-referential relationship (parent == child) — should be blocked.
- Duplicate parent-interface↔child-interface pair (uniqueness on device+interface — see Known Bugs).
- Same-index interfaces on two different devices (must not error as duplicate).
- Delete a relationship and assert previously suppressed children resume (Known Bugs).
- Enable/disable many rows quickly (39+ toggles) — bulk consistency.
- Auto-discovered link that is wrong (LLDP short/full name mismatch) — manual correction.
- Filter combinations returning no rows; search on partial monitor/interface names.
- Relationship referencing a monitor that is later deleted (orphaned parent/child).
