---
screen: All · inventory
module: Monitors
route: "/inventory/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/inventory.json · screenshots/monitor screen.png · known_issues/customer-issue-kb.md §1
verified: 2026-07-09
---

# Monitors — Inventory (All)

## 1. Purpose
The **master monitor list** — every discovered/provisioned monitor (device, VM, database, interface,
service, etc.) in one filterable grid. This is the operational home base for "what are we monitoring and
what's its state."

- **Business objective:** a single searchable inventory of all monitored entities with live status, group,
  tags, and active-alert counts, so operators can find a device and pivot into it fast.
- **Screen description:** a header row of **category tabs** (Inventory, Network, SDN, Server & Apps,
  Storage, Virtualization, HCI, Database, Container Orchestration, Cloud, Interface, WAN Link, Process,
  Container, Service, Service Check), a **Search** box, quick-filter chips (**Groups**, **Types**,
  **Severity**) and a **+ Filter** builder, a right-side toolbar (show/hide columns, tag, and two export
  icons), and the main grid. Rows carry a status dot (Up/Down/Unreachable), Monitor name, IP, a type icon,
  Group (with `+N` overflow), Collector IP, Host, Tags (with `+N`), Active Alerts (severity-colored count
  badges), Status, and Environment. Footer paginates (screenshot: **1–50 of 475 items**, 50/page) with a
  severity legend (Down · Critical · Major · Warning · Clear · Unreachable).
- **Primary use cases:** locate a monitor, read its status/alerts, filter by group/type/severity, bulk-tag,
  export the inventory, jump into a monitor's detail page.
- **Who uses it:** operators and administrators.
- **Dependencies:** discovery/provisioning · the poller (for live status) · groups & tags · collector(s).

## 2. Navigation
```
Left icon rail → Inventory (server/stack icon)
```
- **Category tabs:** Inventory · Network · SDN · Server & Apps · Storage · Virtualization · HCI · Database ·
  Container Orchestration · Cloud · Interface · WAN Link · Process · Container · Service · Service Check
- **URL:** `/inventory/` — open the full URL; SPA routing must load the page.

## 3. Actions
- **Search** — free-text filter over the grid (`input` placeholder _Search_; sweep name
  `search-snmp-device-catalog`).
- **Quick filters** — **Groups**, **Types**, **Severity** chips narrow the list.
- **Advanced filter** — **Filter** button opens a filter builder.
- **Show / Hide columns** — `#btn-show-hide-columns`.
- **Tag** — `#btn-tag-inventory` (bulk-tag selected monitors).
- **Filter agent** — `#btn-filter-agent` (agent-monitored subset).
- **Export** — two export icons in the right toolbar (screenshot). TODO(source: KG) confirm formats (PDF / XLSX).
- **Switch category tab** — re-scopes the grid to that entity family.
- **Open a monitor** — click a row to open its detail/monitoring page. TODO(source: KG) confirm route.
- **Paginate / change page size** — footer (default 50/page).

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Category tabs (16) | Inventory … Service Check |
| Search | `input` _Search_ (name `search-snmp-device-catalog`) |
| Quick filters | Groups · Types · Severity chips |
| Filter | **Filter** button (advanced filter builder) |
| Show/Hide Columns | `#btn-show-hide-columns` |
| Tag | `#btn-tag-inventory` |
| Filter Agent | `#btn-filter-agent` |
| Export | two toolbar export icons (right) |
| Grid columns | Monitor · IP · Type · Group · Collector IP · Host · Tags · Active Alerts · Status · Environment |
| Row status | leading dot: Up (green) / Down (red) / Unreachable (hollow) |
| Active Alerts | severity-colored count badges per row |
| Footer | pagination + page-size + severity legend |

> The grid header in the catalog ends at **status**; the screenshot shows an additional **Environment**
> column on the right — include it. Group and Tags render as chips with a `+N` overflow.

_Locators: see `knowledge/locators/catalog/inventory.json`; promote verified ones into the cookbook
(Monitors > Inventory)._

## 5. Permissions
- **View:** Admin / Operator / Viewer can browse the inventory (scoped to the groups their role permits).
- **Tag / bulk actions / export:** typically Admin/Operator. TODO(source: KG/docs) confirm which roles may
  tag and export; the KB notes a **read-only role lacked "Query" permission** to download reports
  (PQD-38798) — an analogous permission may gate export here.

## 6. Entry Conditions
- User is logged in.
- At least one monitor has been discovered/provisioned (else the grid is empty).
- Poller/collector up for **live** status; otherwise rows may show stale/Unreachable.

## 7. Exit Conditions
- **Grid loads** with the monitor set for the active tab; counts in the footer reflect the filter.
- **On tag save:** selected rows show the new tag chip; an **audit entry** is written (Audit Trail).
- **On filter/search:** grid narrows; footer count updates.
- **On row click:** navigates into the monitor detail page.

## 8. Validations
- **Search / filter** are free-text; no strict validation, but empty/whitespace search should be a no-op.
- **Tag** dialog — tag key/value rules apply. The KB records tag defects (see §10): CSV tags not
  lowercased, blank tags after upgrade — tag input should normalize case. TODO(source: KG) exact tag
  key/value format & length.
- TODO(source: docs): max page size, max selectable rows for bulk tag.

## 9. Business Rules
- **One row = one monitor**; the type icon and category tab classify it (Network, Server, Database, …).
- **Active Alerts** badge count is severity-broken-down per monitor and drives the status dot.
- **Groups and Tags** are many-per-monitor (`+N` overflow); filtering by Group/Tag scopes the grid.
- **Monitor name maps to hostname** for topology — renaming a monitor can break topology mapping
  (KB §8, see below). Treat monitor name as significant.
- TODO(source: KG): whether a monitor can be deleted from this grid and what re-provisioning does.

## 10. Known Bugs
From `customer-issue-kb.md` — inventory/monitor data defects (cite for regression scenarios):
- **Tag handling defects** (§1; PQD-32287 / MOTADATA-6551, PQD-34441, PQD-32063): "Tag Error" after
  upgrade; **uppercase CSV tags accepted inconsistently** (not lowercased); no bulk hierarchical tagging.
  *Fix:* 8.0.25 for the blank-tag error; auto-lowercase in a later release; rule-based tagging as
  workaround. → Test the **Tag** action here with mixed-case and blank tags.
- **Stale / duplicate monitor records after re-provisioning or hardware swap** (§1; PQD-40358, PQD-40196,
  PQD-37767, PQD-31977): device can't be deleted; same device under two clusters; duplicate Object ID from
  CSV import. *Workaround:* delete + re-provision, purge legacy DB rows. → Expect no duplicate rows for one
  physical device.
- **Monitor name must equal hostname for topology** (§8; PQD-36818, PQD-36965): renaming a monitor drops it
  from topology. Relevant when editing a monitor's name from inventory.

## 11. Edge Cases
- **Large inventory** (screenshot: 475 items) — pagination, sort, and filter performance; select-all across
  pages for bulk tag.
- Monitor with **many groups/tags** (`+N` overflow) — chip truncation and tooltip.
- Row in **Unreachable** vs **Down** — confirm the two states are distinguished in the status dot and legend.
- **Duplicate-looking rows** (same IP, different type) — is that a real duplicate (KB) or two distinct
  monitors (e.g. device + its Service Check on the same IP)?
- Search with special characters / IP fragments / partial hostname.
- Category tab with **zero** entities of that type — empty-state, not error.
- Bulk-tag a mixed selection spanning groups the user can't fully see (permission scope).
- Export a filtered vs unfiltered grid — does export honor the active filter and column visibility?
- **Interface tab** for a device whose ifSpeed = 0 (KB §1, PQD-31144) — utilization can read 100%.
