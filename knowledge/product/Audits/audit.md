---
screen: Audit · audit
module: Audits
route: "/audit/"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # locators/catalog/audit.json · screenshots/Audits.png · known_issues/customer-issue-kb.md
verified: 2026-07-09
---

# Audit Trail

## 1. Purpose
The **audit trail** — an immutable, searchable log of who did what in the platform (config changes, logins,
monitor/policy edits, discovery runs), with dashboards summarizing audit volume by module and by user.

- **Business objective:** accountability and compliance — every operator action is attributed (user, remote
  IP, timestamp, success/fail) so admins can answer "who changed this and when."
- **Screen description:** a header **date-range selector** (a `today` preset + explicit from/to timestamps,
  e.g. *Wed, Jun 03, 2026 12:00:00 AM → 10:00:00 PM*); three summary widgets — **Audit Event** donut
  (Total, e.g. 3.05 K), **Top Audit Events By Module** bar (Metric, User, Monitor, Discovery,
  Configuration), **Top Audit Events by User** bar (e.g. system); an **Audit Trend** hourly stacked bar
  (succeed vs fail); then a **Search** box, quick-filter chips (**Module**, **Operation Type**), a
  **+ Filter** builder, two export icons + a view icon, and the audit **grid**. Grid columns: Timestamp,
  Module, Operation Type, User, Remote IP, Message (with "Show more…"), Status (Success/fail badge).
- **Primary use cases:** investigate a change, filter audit by module/user/operation, verify a config edit
  succeeded, export the audit log for compliance.
- **Who uses it:** administrators, security/compliance reviewers.
- **Dependencies:** the audit-logging subsystem (writes an entry on each auditable action) · the user store
  · system clock/timezone.

## 2. Navigation
```
Left icon rail → Audit (document-with-check icon)
```
- **URL:** `/audit/` — open the full URL; SPA routing must load the page.
- Title header: **Audit**.

## 3. Actions
- **Set date range** — `today` preset + explicit from/to timestamps (top-right).
- **Search** — free-text over the grid (`input` _Search_).
- **Quick filters** — **Module** and **Operation Type** chips.
- **Advanced filter** — **Filter** button (`#filter-btn`) opens a filter builder.
- **Export** — two export icons in the toolbar (screenshot). TODO(source: KG) confirm formats (PDF / XLSX).
- **Show more** — expand a truncated Message cell.
- **Paginate** — footer.

## 4. Components
| Component | Control (from catalog / screenshot) |
|---|---|
| Date range | `today` preset + from/to timestamps |
| Audit Event | donut widget — **Total** (e.g. 3.05 K) |
| Top Audit Events By Module | bar — Metric · User · Monitor · Discovery · Configuration |
| Top Audit Events by User | bar — per-user (e.g. system) |
| Audit Trend | hourly stacked bar — **succeed** vs **fail** |
| Search | `input` _Search_ |
| Quick filters | Module · Operation Type chips |
| Filter | **Filter** button `#filter-btn` |
| Export / view | two export icons + view/eye icon (toolbar) |
| Grid columns | Timestamp · Module · Operation Type · User · Remote IP · Message · Status |
| Status badge | Success (green) / fail (red) |

_Locators: see `knowledge/locators/catalog/audit.json`; promote verified ones into the cookbook (Audit).
Export/view icons and the date-range control were not id-captured — resolve live._

## 5. Permissions
- **View:** administrators / compliance reviewers. Audit is sensitive; broad edit is never allowed here —
  the trail is **read-only** by design (no create/update/delete of entries).
- TODO(source: KG/docs): whether Operator/Viewer roles can see the Audit module at all, and whether export
  requires an extra permission (the KB notes a "Query" permission gated report downloads for a read-only
  role, PQD-38798 — an analogous gate may apply).

## 6. Entry Conditions
- User is logged in with a role that can see Audit.
- Auditable actions have occurred in the selected range (else widgets/grid are empty for that window).
- System clock/timezone correct (the range and trend depend on it).

## 7. Exit Conditions
- **Widgets + grid populate** for the selected date range; the donut Total equals the grid's filtered count.
- **On filter/search:** grid narrows; summary widgets re-scope to the filtered set.
- **On export:** a file downloads.
- **No write side effects** — viewing/searching audit does **not** itself create an audit entry (avoid
  recursion). TODO(source: KG) confirm.

## 8. Validations
- **Date range** — from ≤ to; an inverted or empty range should be rejected or normalized.
  TODO(source: docs) max range span and default window.
- **Search / filter** — free-text; empty/whitespace is a no-op.
- No user-editable data fields (read-only log) → no field validations.

## 9. Business Rules
- **Every auditable action writes exactly one entry** with user, remote IP, timestamp, module, operation
  type, message, and status.
- **Entries are immutable** — no edit/delete from the UI.
- **Status = Success / fail** — failed actions are still recorded (visible as `fail` on the trend).
- Widgets are **scoped to the active date range** — changing the range re-queries everything.
- TODO(source: KG/docs): audit **retention** period and whether audit rows are exportable beyond retention.

## 10. Known Bugs
_None recorded specifically for the Audit screen in `customer-issue-kb.md`._
Related, tangential items to be aware of (not audit-screen defects):
- **Export/format defects** across the product (§4; e.g. PQD-38909 / MOTADATA-8254: scheduled PDF arrived as
  XLSX) — worth checking the Audit export honors the chosen format.
- Audit **policy** configuration lives under Settings → Compliance Settings → Audit Policy, a different
  screen; defects there don't belong here.

## 11. Edge Cases
- **Empty range** (no events in the window) — empty widgets/grid, donut Total 0 (no divide-by-zero).
- **Very large range / high volume** (screenshot: 3.05 K) — pagination and query performance; day-boundary
  and DST on the trend.
- Inverted from/to range; range spanning a timezone change.
- **Long Message** cells — "Show more…" expansion, truncation, and export fidelity.
- **fail**-heavy window — verify fail bars/status render distinctly from succeed.
- Filter by a **Module** or **Operation Type** with zero events.
- Remote IP shown as `127.0.0.1` (system/self actions, per screenshot) vs external operator IPs.
- Export a filtered vs full range — does export honor the active filter and date range?
