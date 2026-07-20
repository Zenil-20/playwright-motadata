---
screen: NCM · Approval
module: NCCM
route: "/ncm-approval"
build: 8.2.6
status: draft
sources: [catalog, kb]   # locators/catalog/ncm_approval.json · known_issues §13  (no dedicated screenshot)
verified: 2026-07-09
---

# NCM · Approval

## 1. Purpose
The **change-approval queue** for NCM — a maker/checker gate where config-change and firmware
operations initiated in NCCM Explorer wait for an authorized **approver** to approve or reject before
they are applied to network devices.

- **Business objective:** enforce governed change management on network configs — no config/firmware
  push reaches a device without a second-person approval, giving an auditable trail of who requested,
  who approved, and when. This is the control that makes NCM safe for production networks.
- **Screen description:** a grid of approval requests with columns **Approvals · Device Name ·
  Device Type · Approver · Status · Type · Requested On · Actions**, a **Search** box, and a
  **Filter** control (`#filter-btn`) plus show/hide-columns (`#btn-show-hide-columns`).
- **Primary use cases:** an approver reviews pending change requests, sees the target device and
  change type, and approves/rejects each via the row **Actions**; a requester tracks the status of
  their submitted changes.
- **Who uses it:** designated NCM **approvers** (and requesters checking status). TODO(source:
  KG/docs) — role gating and how an approver is designated.
- **Dependencies:** the NCM Approval workflow enabled; pending change requests generated from
  Explorer operations; an approver role assigned.

## 2. Navigation
```
NCM / NCCM area → Approval   →  /ncm-approval
```
- **URL:** `/ncm-approval` (a top-level route, not under `/nccm/…` — reached from the NCM area /
  notifications rather than the NCCM tab strip). TODO(source: docs) — exact menu path.
- **Related:** requests originate from **NCCM → Explorer** (`/nccm/explorer`) config/firmware actions.

## 3. Actions
- **Search** requests (`input[name="search"]`, placeholder "Search").
- **Filter** (`#filter-btn`) — filter the queue (by status/type/approver/date). TODO(source: docs) —
  the exact filter fields.
- **Show / hide columns** (`#btn-show-hide-columns`).
- **Row Actions** — **Approve** / **Reject** (and likely **View** the requested change/diff).
  TODO(source: docs) — enumerate exact row actions; the sweep captured only the **Filter** button.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name="search"]` (placeholder "Search") |
| Filter | `#filter-btn` (button label "Filter") |
| Show/hide columns | `#btn-show-hide-columns` |
| Approval grid | Approvals · Device Name · Device Type · Approver · Status · Type · Requested On · Actions |

_`buttonIds: [btn-show-hide-columns, filter-btn]`, `buttons: [Filter]`. `tabs:[]`, `selects:0,
switches:0, radios:0, checkboxes:0` — no top tabs; row-level approve/reject actions live in the
**Actions** column and were not individually captured._

> No dedicated screenshot exists for this route; the **Approve/Reject** row controls and any
> approval-detail/diff drawer are **not captured** in the sweep. Confirm live or via the KG.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (NCM > Approval)._

## 5. Permissions
- **Approve/Reject** requires an **approver** role; a requester (Explorer operator) can submit and
  view status but not self-approve. TODO(source: KG/docs) — exact RBAC, whether self-approval is
  blocked, and how approvers are configured.

## 6. Entry Conditions
- Logged in with access to the NCM Approval queue.
- The Approval workflow is enabled and at least one change request is pending (else empty grid).
- For actioning: the user holds the approver role.

## 7. Exit Conditions
- Grid lists requests with Device Name/Type, Approver, **Status**, **Type**, Requested On.
- **Approve** → request Status moves to approved and the underlying config/firmware change proceeds
  to the device (via Explorer's execution path); an audit entry is written. TODO(source: docs).
- **Reject** → Status moves to rejected; the change is **not** applied. TODO(source: docs).
- Search/Filter narrows the visible requests.

## 8. Validations
- **Search / Filter** — free text / filter selections; no format rule. TODO(source: docs).
- **Reject** — may require a reason/comment. TODO(source: docs).
- A request already actioned should not be re-actionable (idempotency). TODO(source: docs).

## 9. Business Rules
- **Maker/checker:** config/firmware changes from Explorer are **held pending** until approved — the
  approval gates execution. TODO(source: KG/docs) — confirm which operation Types require approval.
- **Status** lifecycle: Pending → Approved / Rejected (terminal). TODO(source: KG) — confirm states.
- **Approver** is the party responsible for the decision; separation of duties from the requester is
  the point of the workflow. TODO(source: KG/docs) — self-approval policy.
- Approved changes then run through the same vendor-CLI execution path as Explorer backups/upgrades
  (so vendor-dialect failures still apply post-approval — see Known Bugs).

## 10. Known Bugs
None recorded **specifically for the NCM Approval screen** in `customer-issue-kb.md`. The relevant
downstream class (§13) is that an **approved** config/firmware change can still fail at execution on
certain vendors (Cisco firmware, FortiGate, Cisco ISE "More", TP-Link `\r\n` — see `explorer.md`) —
i.e. approval succeeding does not guarantee the device operation succeeds. **None recorded for this
screen** otherwise.

## 11. Edge Cases
- Empty queue (no pending requests) → empty grid, not an error.
- Approver tries to approve their own request (self-approval — should be blocked if separation of
  duties is enforced).
- Approve/Reject a request that was already actioned by another approver (concurrency / double-action).
- Approved change that then **fails at device execution** (vendor CLI dialect — KB §13): status
  should reflect the execution failure, not stay "approved/success".
- Reject without a reason (if reason mandatory).
- Filter/Search producing zero results; large backlog of pending requests (grid performance).
- Request for a device deleted/re-provisioned after submission (stale target).
