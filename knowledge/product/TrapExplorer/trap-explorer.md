---
screen: Trap Explorer · trap-explorer
module: TrapExplorer
route: "/trap-explorer/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/trap_explorer.json · screenshots/TRAP.png (BUILD 8.2.5) · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Trap Explorer · trap-explorer

## 1. Purpose
The main **Trap Explorer** screen — the searchable, time-scoped view of **SNMP traps** received by
Motadata. It shows a histogram of trap volume over time and a grid of aggregated traps (name, OID,
source device, vendor, count, message, timestamp), so a NOC user can see what traps are arriving,
acknowledge them, and act on them.

- **Business objective:** give NOC/network teams visibility into inbound SNMP traps for
  troubleshooting and alerting — which devices are sending which traps, how often, and when.
- **Screen description:** a full-page module titled **"Trap Explorer"** with a **time-range picker**
  (screenshot shows _Today_), a **Live Trap Viewer** button (top-right), a **bar chart** of
  `trap.message.count` bucketed hourly, a **Search** box, quick-filter chips (**Trap OID · Source ·
  Vendor**), a **+ Filter** button, export/utility icons (preview, PDF, CSV/XLSX, filter funnel), and a
  **trap grid**.
- **Primary use cases:** search/filter received traps, inspect the histogram for spikes, acknowledge a
  trap, create a trap (policy) from a received trap, export the list, and open the Live Trap Viewer.
- **Who uses it:** NOC / network engineers. TODO(source: KG/docs) — role gating.
- **Dependencies:** the trap receiver enabled; devices configured to send SNMP traps with correct
  community string (v2c) / v3 credentials; a time range containing traps.

## 2. Navigation
```
Left icon rail → Trap Explorer (binoculars icon) → /trap-explorer/
```
- **Header:** `Trap Explorer`.
- **URL:** `/trap-explorer/`.
- **Related view:** **Live Trap Viewer** (`/trap-explorer/live-trap-viewer`) via the top-right button.

## 3. Actions
- **Open Live Trap Viewer** — `Live Trap Viewer` button → real-time incoming-trap stream.
- **Search** — `input[placeholder="Search"]` (name `search`).
- **Quick filter** — the **Trap OID / Source / Vendor** chips (screenshot) scope the grid by that facet.
- **Advanced filter** — `Filter` button (`#filter-btn`) / **+ Filter** for attribute filtering.
- **Show / Hide columns** — `#btn-show-hide-columns`.
- **Export** — the PDF and CSV/XLSX icons (top-right of the grid) export the list.
- **Acknowledge** — the per-row **Acknowledged** control (thumbs-up in screenshot).
- **Create Trap** — the per-row **Action → Create Trap** link (create a trap policy/definition from a
  received trap).
- **Set time range** — quick-range picker scopes both chart and grid.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Module header | "Trap Explorer" |
| Live Trap Viewer | `Live Trap Viewer` button (→ `/trap-explorer/live-trap-viewer`) |
| Trap-volume chart | bar chart, series `trap.message.count`, hourly buckets |
| Search | `input[placeholder="Search"]` (name `search`) |
| Quick-filter chips | Trap OID · Source · Vendor (from screenshot) |
| Filter | `Filter` button — id `#filter-btn` |
| Show/Hide columns | `#btn-show-hide-columns` |
| Export icons | preview / PDF / CSV(XLSX) / filter (top-right, from screenshot) |
| Trap grid | Trap Name · Trap OID · Source · **Vendor** · Count · Message · Timestamp · Acknowledged · Action |
| Time-range picker | quick-range (observed _Today_) |

> Catalog `gridHeaders` list `Trap Name · Trap OID · Source · Count · Message · Timestamp ·
> Acknowledged · Action`; the screenshot also shows a **Vendor** column (and Vendor as a quick-filter
> chip). Treat Vendor as present.

_Locators: see `knowledge/locators/catalog/trap_explorer.json`. `#filter-btn` and `#btn-show-hide-columns`
are stable; harvest the row Acknowledge / Create-Trap / export-icon locators live and promote to
`selector-cookbook.md` (Trap Explorer)._

## 5. Permissions
- Viewing traps requires trap-receiver/monitoring access. **Create Trap** (creating a trap policy) and
  **Acknowledge** are write actions likely gated to Admin/Operator. TODO(source: KG/docs) — exact
  role split (view vs acknowledge vs create).

## 6. Entry Conditions
- Logged in; trap receiver enabled; devices sending traps with correct community/v3 credentials.
- Traps exist in the selected range (else the grid is empty / "No data found").

## 7. Exit Conditions
- **Acknowledge:** the row's Acknowledged state flips (expect a visual toggle / toast).
- **Create Trap:** navigates to / opens the trap-policy creation flow. TODO(source: KG/docs) — confirm
  destination and success signal.
- **Live Trap Viewer:** navigates to `/trap-explorer/live-trap-viewer`.
- **Export:** a PDF/CSV file downloads.
- Search / filter / time-range changes re-query chart + grid.

## 8. Validations
- **Search** — free text; no observed constraint.
- **Filter / quick-filter** — TODO(source: KG/docs) — field enumerations and operators.
- **Time range** — from ≤ to.

## 9. Business Rules
- Grid rows are **aggregated per trap** — the **Count** column implies repeated identical traps are
  rolled up with an occurrence count (screenshot shows counts like 1468 / 15 / 9).
- Chart and grid are **time-scoped** by the shared range picker.
- **Create Trap** turns a received trap into a reusable trap definition/policy (Action column).
- Traps only appear if the receiver's **community string (v2c)** or **v3 credentials** match the
  sender — see Known Bugs.
- TODO(source: Motadata KG) — trap retention, how Vendor is resolved, and what Acknowledge changes
  downstream (alerting).

## 10. Known Bugs
- **Traps not visible** (kb §7, PQD-33528): traps seen in `tcpdump` at the receiver but **not shown in
  Trap Explorer**. Diagnosis: **wrong SNMPv2c community string**, or **SNMPv3 traps sent with a blank
  username**. Workaround/solution: correct the community / v3 credentials on both the sending device and
  the receiver, then **validate in the Live Trap screen** (the Live Trap Viewer is the recommended
  verification surface). No fix-version pinned in the KB — treat as a configuration-class defect.

## 11. Edge Cases
- Traps arriving with a mismatched community/blank v3 username (silently absent — the PQD-33528 case).
- Empty range → no traps / empty chart.
- Very high Count values (formatting/sort).
- Unknown OID / unresolved Vendor (blank Vendor cell).
- Acknowledge then new traps of the same OID arrive (does the ack persist / re-arm?).
- Create Trap from a trap that already has a definition (duplicate?).
- Export with an active filter (does the export honour the filter?).
- Long Message text truncation; rapid time-range switching mid-query.
