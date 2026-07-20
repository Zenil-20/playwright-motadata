---
screen: Settings · rum-applications
module: Settings
category: digital-experience-monitoring
route: "/settings/digital-experience-monitoring/rum-applications"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_digital_experience_monitoring_rum_applications.json · "RUM.png" (consumer Real User Monitoring dashboard, related) · customer-issue-kb (none specific)
verified: 2026-07-10
---

# Digital Experience Monitoring · RUM Applications

## 1. Purpose
The screen where **Real User Monitoring (RUM) applications are registered** — each row is a web/mobile
application instrumented with the RUM SDK, sending real end-user session, page-load and event telemetry
into ObserveOps. Registration issues the application identity/key and sets capture policy (sampling,
privacy) so the browser/app agent can report. The data surfaces in the **Real User Monitoring**
consumer module (`RUM.png`).

- **Business objective:** measure the actual end-user experience (page loads, errors, session health)
  of front-end applications, complementing server-side APM.
- **Screen description:** a searchable grid of RUM applications with a **Create Application** button and
  a column chooser. Columns cover type, version, environment, sampling rate, privacy mode, last event
  time, status and tags.
- **Primary use cases:** register a new front-end app for RUM, tune session sample rate / privacy,
  verify events are arriving (Last Event Received at / Application Status), edit or remove an app.
- **Who uses it:** DEM/observability admins and front-end teams. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Digital Experience Monitoring (RUM) module + license; the RUM SDK embedded in
  the target application reporting to the ingest endpoint.

## 2. Navigation
```
Settings → Digital Experience Monitoring → RUM Applications
```
- **Breadcrumb:** Settings › Digital Experience Monitoring › RUM Applications
- **URL:** `/settings/digital-experience-monitoring/rum-applications`
- **Consumer module:** the top-level **Real User Monitoring** screen (`RUM.png`).

## 3. Actions
- **Create Application** — open the registration form (`#create-rum-application-btn-id`).
- **Search** — filter the grid (`input[name='search-rum-application']`).
- **Show / hide columns** — column chooser (`#btn-show-hide-columns`).
- **Row actions** — per-row menu (`[data-cy='grid-action']`): TODO(source: KG/docs) confirm set
  (expected: Edit, Delete, View SDK snippet/key, View sessions).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name='search-rum-application']` (placeholder _Search_) + header search |
| Column chooser | `#btn-show-hide-columns` |
| Create Application (primary) | `#create-rum-application-btn-id` |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns**
- Application Name
- Application Type (e.g. web / SPA / mobile — TODO confirm)
- Version
- Environment (e.g. prod / staging — TODO confirm)
- Session Sample Rate (% of sessions captured)
- Privacy (data-masking mode)
- Last Event Received at (freshness signal)
- Application Status
- Tags
- Action

> The **create-application form fields** (name, type, environment, sample rate, privacy options, SDK
> key/snippet) were **not captured** in this grid sweep. TODO(source: KG/live) — document the form.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > RUM Applications)._

## 5. Permissions
- DEM/RUM administration — expected **admin-level**. TODO(source: KG/docs) — confirm who can create/
  edit/delete vs. view.
- Requires the DEM/RUM module to be licensed.

## 6. Entry Conditions
- Logged in with a DEM-capable role.
- DEM/RUM module enabled/licensed.

## 7. Exit Conditions
- **Create (success):** new application row appears; the SDK key/snippet is issued for embedding.
  **Last Event Received at** / **Application Status** populate once the app starts sending events.
  TODO(source: KG) confirm initial status + toast.
- **Delete:** application removed; TODO — whether historical sessions are retained.

## 8. Validations
- Grid screen — validations live in the create form (not captured; TODO).
- Expected: unique application name; **Session Sample Rate** within 0–100%; a selected type/environment;
  a privacy mode. TODO(source: KG/live) — exact rules.

## 9. Business Rules
- **Session Sample Rate** governs what fraction of real user sessions are captured (cost vs. fidelity).
- **Privacy** mode controls masking of captured user data (compliance). TODO(source: KG) — the modes.
- **Last Event Received at** is the freshness/health signal — stale means the SDK stopped reporting or
  ingest broke.
- TODO(source: KG/docs): whether RUM applications consume license/quota capacity; name uniqueness.

## 10. Known Bugs
None recorded for this screen in `knowledge/known_issues/customer-issue-kb.md` (no RUM/DEM-specific
tickets in the export). The `RUM.png` consumer dashboard shows an empty "No data found" state, i.e. no
RUM applications reporting events. Do not invent bugs — capture real ones from the KG when found.

## 11. Edge Cases
- Register an app that never sends events (Status empty / Last Event blank).
- Session Sample Rate at boundaries: 0% (nothing captured) and 100% (full capture / volume).
- Privacy mode toggled after data is flowing.
- Duplicate application name; wrong environment/type vs. actual deployment.
- Delete an app that is actively reporting sessions.
- Clock skew affecting **Last Event Received at**.
- Search with no matches; many applications (grid paging, column chooser).
