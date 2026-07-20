---
screen: Health · health
module: Global
route: "/health/"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/health.json (live Vue-router sweep 2026-07-02); customer-issue-kb.md
verified: 2026-07-09
---

# Health · health

## 1. Purpose
The **self-monitoring** screen for the Motadata ObserveOps deployment itself — it shows the health of
the product's own servers and services (Application, Database, Collector, Observer), not of the
customer's monitored devices.

- **Business objective:** give an admin a single place to confirm the AIOps platform is healthy —
  every server is up, event queues are draining, datastores are attached — so they can catch a stalled
  pipeline or a down node before it turns into missing monitoring data.
- **Screen description:** a tabbed screen (**Health Overview** default) with a per-server grid plus a
  **Motadata Application** selector, per-panel **Search** boxes and a **filter by name…** box.
- **Primary use cases:** verify all deployment servers are Running; watch Pending/Queued/Finished/
  Dropped event counts per engine; check datastore attachment; review the platform's own Alerts;
  trigger/track an **Upgrade**; perform a **Restore**.
- **Who uses it:** platform administrators / operators managing the Motadata install. TODO(source:
  KG/docs) — exact role gating.
- **Dependencies:** an authenticated session; the deployment's server inventory (App/DB/Collector/
  Observer registered); the internal health/event-pipeline telemetry.

## 2. Navigation
```
Direct route → /health/
```
- **URL:** `/health/` (open the full URL; SPA routing must load the page).
- **Tabs:** Health Overview · Application · Database · Live Session · Alert · Upgrade · Restore
- **Breadcrumb / menu path:** TODO(source: KG/docs) — confirm the in-product menu entry that opens
  this route.

## 3. Actions
- Switch between the health tabs (**Health Overview / Application / Database / Live Session / Alert /
  Upgrade / Restore**).
- Select a **Motadata Application** instance via the `Select` dropdown (`[data-cy='dropdown-trigger-input']`).
- **Search** within a panel (two `Search` inputs — `search-rpe` and `search`) and **filter by name…**
  to narrow the server grid.
- Review platform **Alert**s (the Alert tab).
- Initiate / monitor an **Upgrade** (Upgrade tab).
- Initiate / monitor a **Restore** (Restore tab).
- TODO(source: KG/docs) — confirm whether Upgrade/Restore are actionable here or read-only status
  views; no buttons were captured in the Overview sweep.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Motadata Application selector | dropdown, placeholder `Select`, hook `[data-cy='dropdown-trigger-input']` |
| Search (RPE) | `input[name='search-rpe']` (text, placeholder _Search_) |
| Search | `input[name='search']` (text, placeholder _Search_) |
| Filter by name | text input, placeholder _filter by name…_ |
| Tabs | Health Overview · Application · Database · Live Session · Alert · Upgrade · Restore |
| Server grid | columns: Server · IP · Type · Deployment · Duration · State · Datastore |
| Event-pipeline columns | Pending Events · Queued Events · Finished Events · Dropped Events · Engine Type (repeated per engine/section) |

> The event-pipeline columns (Pending / Queued / Finished / Dropped / Engine Type) repeat across
> engine sections in the raw sweep — treat them as per-engine metrics, not a single flat grid.

_Locators: see `knowledge/locators/catalog/health.json` (raw sweep) — promote verified ones into the
cookbook. No stable button ids were captured._

## 5. Permissions
- Platform-health visibility is an **administrative** function (managing the deployment, not the
  monitored estate).
- TODO(source: KG/docs) — exact RBAC (which roles see Health; whether Upgrade/Restore require a
  super-admin); any license/module gating.

## 6. Entry Conditions
- User is logged in with a valid session.
- The deployment has registered servers (App/DB/Collector/Observer) so the grid can populate.
- Internal health telemetry / event-pipeline metrics are being collected.

## 7. Exit Conditions
- **Overview loads:** each deployment server appears once with State (e.g. Running) and a Datastore
  binding; event counters render per engine.
- **After Upgrade/Restore actions:** TODO(source: KG/docs) — confirm the success signal (state change,
  toast, progress indicator).

## 8. Validations
- Search / filter inputs are free-text narrowing controls; no field-level validation captured.
- TODO(source: docs) — any validation on the Upgrade/Restore flows.

## 9. Business Rules
- Health reflects the **deployment's own servers**, keyed by the registered server inventory — a
  server appears here because it is registered in deployment settings (see Known Bugs re: stale/
  duplicate entries).
- Event pipeline is measured per **Engine Type** with Pending/Queued/Finished/Dropped counters —
  Dropped > 0 or an ever-growing Queued indicates a stalled pipeline. TODO(source: KG) confirm the
  precise semantics and thresholds.
- TODO(source: KG/docs) — how "Duration" (uptime) and "State" are computed; what "Deployment" denotes
  (Standalone vs HA/DC-DR role).

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (§3 Platform / DB / Services — "Hostname / dual-NIC /
IP-resolution confusion"):
- **Wrong IPs shown on the Health screen** — `issue:` two NICs both register, or the hostname wasn't
  set by the post-install script, so Health shows the wrong server IP (PQD-35468, PQD-33632).
  `workaround:` fix hostname; set the physical IP in PostgreSQL; add `"local.host": "<SERVER-IP>"` to
  `motadata-datastore.json`.
- **DB / server invisible or duplicated in Health monitoring** — `issue:` stale deployment-settings
  entries with an old hostname duplicate the APP/DB rows, or the DB doesn't appear at all (PQD-39258).
  `workaround:` purge duplicate deployment entries (permanent fix noted in 8.1.0).
> These are environment/config defects surfaced *on* this screen. Do not treat as UI-logic bugs.

## 11. Edge Cases
- A deployment server is down / unreachable at load — does its row show, and with what State?
- Dual-NIC server registering twice → duplicate rows (see Known Bugs).
- Hostname unset post-install → wrong/blank IP column.
- Event pipeline stalled: Queued grows unbounded, Dropped > 0 — assert the counters surface it.
- HA / DC-DR deployment: Primary vs Secondary vs Observer roles all present in the grid.
- Filter/search returning zero rows (empty state).
- Very large deployment (many collectors) — grid pagination / performance.
- Upgrade or Restore in progress while viewing Overview (mid-operation state).
