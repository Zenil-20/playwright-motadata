---
screen: Motadata ObserveOps · upgrade
module: Global
route: "/upgrade"
build: 8.2.6
status: draft
sources: [catalog, kb]        # knowledge/locators/catalog/upgrade.json (live Vue-router sweep 2026-07-02); customer-issue-kb.md
verified: 2026-07-09
---

# Motadata ObserveOps · upgrade

## 1. Purpose
A global **upgrade** route for the Motadata ObserveOps platform. It relates to upgrading the product
itself (patches / version bundles), as opposed to monitoring customer devices.

- **Business objective:** move the deployment from one build to the next in a controlled way, with
  visibility into upgrade status.
- **Screen description:** the router sweep captured **no interactive controls** at `/upgrade` (title
  _"Motadata ObserveOps"_) — the page likely renders its content lazily / conditionally (e.g. only when
  an upgrade bundle is present, or gated to certain roles). Its exact controls are **unconfirmed** from
  the catalog.
- **Primary use cases:** view current version / available upgrade; TODO(source: KG/docs) — initiate or
  monitor an upgrade (unconfirmed here; note the **Health** screen also exposes an *Upgrade* tab).
- **Who uses it:** platform administrators.
- **Dependencies:** an authenticated session; the deployment's version/upgrade backend; an available
  upgrade bundle.

> **Relationship note:** `Health` (`/health/`) exposes an **Upgrade** tab as well. Confirm whether
> `/upgrade` is a standalone screen or an alias/deep-link into that flow. TODO(source: KG/docs).

## 2. Navigation
```
Direct route → /upgrade
```
- **URL:** `/upgrade` (open the full URL; SPA routing must load the page).
- **Menu path:** TODO(source: KG/docs) — confirm how this route is reached in-product.

## 3. Actions
TODO(source: KG/docs) — no controls captured in the sweep. Expected but **unconfirmed**: view current/
target version, upload or select an upgrade bundle, start upgrade, monitor progress. Do not assume
these until verified live.

## 4. Components
_No controls captured in the sweep (page may lazy-render on interaction, or be gated)._ Treat the
component set as **unknown**, not empty.

_Locators: see `knowledge/locators/catalog/upgrade.json` (raw sweep) — nothing to promote yet; harvest
live via the explorer skill when this screen is automated._

## 5. Permissions
- Upgrading the platform is a **super-admin / platform-admin** operation.
- TODO(source: KG/docs) — confirm exact role gating and whether the route hard-blocks non-admins (→
  `/unauthorized`).

## 6. Entry Conditions
- User is logged in as an admin with a valid session.
- TODO(source: docs) — whether an upgrade bundle must be present for the page to show actionable
  content.

## 7. Exit Conditions
- TODO(source: docs) — success signal for an upgrade (version changes, progress/complete state,
  service restart). No control was captured to assert against yet.

## 8. Validations
TODO(source: docs) — any validation on bundle selection/compatibility (version chain, prerequisites).

## 9. Business Rules
- Upgrades must follow the documented **version-by-version chain** — skipping intermediate patches is
  a known failure mode (see Known Bugs). TODO(source: KG/docs) — confirm whether the UI enforces the
  chain or relies on operator SOP.

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md` (§2 HA / DC-DR / Upgrade / Backup — "Upgrade
executed without SOP / patch bugs during upgrade"):
- **Upgrade fails / service won't start when version jumps skip intermediate patches** (PQD-28399 and
  related). `workaround:` follow the docs.motadata.com upgrade chain version-by-version.
- **Default-policy notifications/actions wiped after a bundle upgrade** (e.g. 8.0.26→8.1.0;
  MOTADATA-7641 class, PQD-35982/PQD-35984); tickets/alerts stop post-upgrade. `workaround:`
  re-released bundle patches; verify policies/actions survive the upgrade.
- **Duplicated cron jobs created by an upgrade** (PQD-37540, PQD-35799). `workaround:` manual cron
  cleanup.
> These are upgrade-process defects, not defects of this specific screen's UI. Cited for regression
> awareness around the upgrade flow.

## 11. Edge Cases
- No upgrade bundle available → what does the page show (empty/current-version-only state)?
- Non-admin opens `/upgrade` directly → should be blocked / redirected to `/unauthorized`.
- Attempting an upgrade that skips the required patch chain (should be prevented or clearly warned).
- Upgrade in an HA / DC-DR deployment (ordering, both nodes) — high-risk path per KB.
- Interrupted upgrade (service restart mid-flow) — recovery/state on reload.
- Post-upgrade regression checks: default policies/actions still present; no duplicate cron jobs.
