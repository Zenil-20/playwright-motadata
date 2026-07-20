---
screen: Unauthorized Access · unauthorized
module: Global
route: "/unauthorized"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/unauthorized.json (live Vue-router sweep 2026-07-02); customer-issue-kb.md
verified: 2026-07-09
---

# Unauthorized Access · unauthorized

## 1. Purpose
The **access-denied / 403** system screen. It is shown when an authenticated user tries to open a
route or resource their role is not permitted to access.

- **Business objective:** fail safe — when RBAC blocks a route, show a clear "unauthorized" page with a
  way back instead of a blank screen or a broken view.
- **Screen description:** a minimal message page with a single **Go Back** button (catalog title:
  _"Motadata ObserveOps | Unauthorized Access"_).
- **Primary use cases:** a lower-privilege user (e.g. Viewer/Operator) navigates to an admin-only URL
  and is redirected here; a deep link to a gated feature is opened without permission.
- **Who uses it:** any authenticated user who hits a route beyond their permissions.
- **Dependencies:** an authenticated session and the RBAC layer that performs the redirect.

## 2. Navigation
```
Redirected here by the app → /unauthorized
```
- **URL:** `/unauthorized` (open the full URL; SPA routing must load the page).
- **Not a menu item:** reached by redirect when access is denied, not via the nav.

## 3. Actions
- **Go Back** — return to the previous / a safe page (`button` labeled _Go Back_).
- TODO(source: KG/docs) — confirm exactly where Go Back navigates (browser history vs a fixed landing/
  home route).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Go Back (primary) | `button` labeled _Go Back_ |

_Locators: see `knowledge/locators/catalog/unauthorized.json` (raw sweep). No stable button id was
captured — scope by the accessible name `Go Back` when automating, or harvest a verified locator via
the explorer skill._

## 5. Permissions
- Reachable by **any authenticated user** — it is the *result* of a permission denial, not a gated
  screen itself.
- The screen exists specifically because RBAC denied access to the requested route. TODO(source:
  KG/docs) — enumerate which route classes redirect here.

## 6. Entry Conditions
- User is logged in.
- The user attempted a route/resource their role cannot access → app redirected to `/unauthorized`.

## 7. Exit Conditions
- **Go Back** returns the user to a permitted page; the unauthorized page is dismissed.
- TODO(source: docs) — confirm the destination and that no permitted state is lost.

## 8. Validations
Not applicable — no input fields.

## 9. Business Rules
- The page is a terminal RBAC outcome: it renders when and only when access is denied to the requested
  route. TODO(source: KG/docs) — whether it also covers expired-permission (role changed mid-session)
  vs never-permitted cases, and how it differs from the login/session-expiry flow.

## 10. Known Bugs
None recorded for this screen. (No `customer-issue-kb.md` entry references the Unauthorized page;
RBAC/permission tickets in the KB concern feature-level permissions such as report "Query" rights,
not this system screen.)

## 11. Edge Cases
- Direct-linking a gated URL while logged in as a low-privilege role.
- Role downgraded mid-session, then navigating to a now-forbidden route.
- **Go Back** when there is no meaningful history (opened via a fresh deep link).
- Reaching `/unauthorized` while the session is actually expired (should this be login/session-expiry
  instead?).
- Repeated redirects (a forbidden landing route causing a loop) — verify no loop occurs.
