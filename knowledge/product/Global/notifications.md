---
screen: Motadata ObserveOps · notifications
module: Global
route: "/notifications"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/notifications.json (live Vue-router sweep 2026-07-02); customer-issue-kb.md
verified: 2026-07-09
---

# Motadata ObserveOps · notifications

## 1. Purpose
The in-app **notification center** — a global route that surfaces system/user notifications to the
signed-in user. It is a lightweight, system-level screen (no data-entry form).

- **Business objective:** give the user one place to see notifications raised by the platform (e.g.
  background job / alert / system messages) without leaving their current context.
- **Screen description:** a simple notifications view at `/notifications`. The router sweep captured
  **no interactive controls** — the page renders its list lazily on interaction, so its exact contents
  are unconfirmed from the catalog alone.
- **Primary use cases:** view recent notifications; TODO(source: KG/docs) — mark read / dismiss / open
  the linked item (unconfirmed).
- **Who uses it:** any authenticated user.
- **Dependencies:** an authenticated session; the notification producer(s) that populate the list.

> **Scope note:** this is the notification *center* UI. It is distinct from **Alert / notification
> *policy*** configuration (email/SMS channels, re-notification rules) which lives under Alerts /
> Settings. Do not conflate the two.

## 2. Navigation
```
Direct route → /notifications
```
- **URL:** `/notifications` (open the full URL; SPA routing must load the page).
- **Entry point:** typically a bell/notification icon in the top bar. TODO(source: KG/docs) — confirm
  the exact trigger and menu path.

## 3. Actions
TODO(source: KG/docs) — no controls were captured in the sweep (the page lazy-renders on interaction).
Expected but **unconfirmed**: view list, open a notification, mark read / mark all read, dismiss/clear.
Do not assume these exist until verified live.

## 4. Components
_No controls captured in the sweep (page may lazy-render on interaction)._ The catalog reports no
inputs, buttons, tabs, or grid — treat the component set as **unknown**, not empty.

_Locators: see `knowledge/locators/catalog/notifications.json` (raw sweep) — nothing to promote yet;
harvest live via the explorer skill when this screen is automated._

## 5. Permissions
- Available to any authenticated user (personal notification stream).
- TODO(source: docs) — whether notification content is role-scoped (e.g. admin-only system messages).

## 6. Entry Conditions
- User is logged in with a valid session.
- TODO(source: docs) — whether the list is empty for a brand-new user vs seeded with system items.

## 7. Exit Conditions
- The notifications list renders (or an empty state shows when there are none).
- TODO(source: docs) — after mark-read/dismiss, confirm the unread badge/count updates.

## 8. Validations
Not applicable — no data-entry fields captured. TODO(source: docs) if any inline controls exist.

## 9. Business Rules
TODO(source: Motadata KG) — retention/ordering of notifications, read vs unread state, what events
produce a notification, badge-count logic. None derivable from the current (empty) sweep.

## 10. Known Bugs
None recorded for this screen. (`customer-issue-kb.md` §5 covers alert/notification **channel** and
**policy** defects — email/SMS delivery, re-notification — not the in-app notification-center UI, so
they are not attributed here.)

## 11. Edge Cases
- Empty state (no notifications).
- Very large backlog — pagination / lazy-load / performance.
- Unread badge count vs actual list count consistency.
- Notification linking to a deleted/inaccessible object.
- Real-time arrival while the panel is open (does the list update live?).
- Session expiry while viewing → redirect to login / unauthorized.
