---
screen: Settings · application-registration
module: Settings
category: apm-settings
route: "/settings/apm-settings/application-registration"
build: 8.2.6
status: draft
sources: [catalog, screenshot, kb]   # settings_apm_settings_application_registration.json · "APM.png" (consumer APM dashboard, related) · customer-issue-kb §12
verified: 2026-07-10
---

# APM Settings · Application Registration

## 1. Purpose
The screen where **application services are registered for Application Performance Monitoring (APM)** —
each row is a service/application that sends distributed traces to ObserveOps. Registration defines the
service identity (name, type, IP, language) so incoming traces can be attributed and shown in the APM
module (Services / Explorer / Error Tracker / Compare — see `APM.png`, the consumer side).

- **Business objective:** onboard instrumented services so their traces, errors and latency appear in
  APM; without a registration, incoming trace data has no home.
- **Screen description:** a searchable grid of registered services with an **Application Registration**
  button to add a new one. Columns include the service's type, IP, language, current status and when
  the last trace was received.
- **Primary use cases:** register a new service for tracing, check whether a service is receiving
  traces (Status / Last Received Trace), edit or remove a registration.
- **Who uses it:** APM/observability admins and the app teams instrumenting services. TODO(source:
  KG/docs) — exact role.
- **Dependencies:** the APM/tracing module + license; services instrumented with a compatible tracer
  sending data to the collector/endpoint.

## 2. Navigation
```
Settings → APM Settings → Application Registration
```
- **Breadcrumb:** Settings › APM Settings › Application Registration
- **URL:** `/settings/apm-settings/application-registration`
- **Consumer module:** the top-level **APM** screen (Services / Explorer / Error Tracker / Compare)
  visualizes the data these registrations produce (`APM.png`).

## 3. Actions
- **Application Registration** — open the create/register form (`#create-application-registration-btn-id`).
- **Search** — filter the grid (`input[name='search-application-registration']`).
- **Row actions** — per-row menu (`[data-cy='grid-action']`): TODO(source: KG/docs) confirm set
  (expected: Edit, Delete, View traces).

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search | `input[name='search-application-registration']` (placeholder _Search_) + header search |
| Application Registration (primary) | `#create-application-registration-btn-id` |
| Row action menu | `[data-cy='grid-action']` |

**Grid columns**
- Services Name
- Type
- IP
- Language (the service's runtime/SDK language)
- Status
- Service Attributes
- Last Received Trace (freshness signal)
- Actions

> The **registration form fields** (service name, type, language/SDK, key/token, attributes) were
> **not captured** in this grid sweep. TODO(source: KG/live) — document the create form.

_Locators: promote verified ones into `knowledge/locators/selector-cookbook.md` (Settings > Application Registration)._

## 5. Permissions
- APM administration — expected **admin-level**. TODO(source: KG/docs) — confirm who can register/edit/
  delete vs. view.
- Requires the APM/tracing module to be licensed.

## 6. Entry Conditions
- Logged in with an APM-capable role.
- APM module enabled/licensed.

## 7. Exit Conditions
- **Register (success):** new service row appears; **Status** and **Last Received Trace** populate once
  the service actually sends traces. TODO(source: KG) confirm the initial status and toast.
- **Delete:** registration removed; TODO — whether historical traces are retained.

## 8. Validations
- Grid screen — validations live in the registration form (not captured; TODO).
- Expected: unique service name, valid IP, a selected type/language. TODO(source: KG/live).

## 9. Business Rules
- A service must be registered before its traces are attributed in APM. TODO(source: KG) confirm
  whether auto-registration on first trace exists.
- **Last Received Trace** is the health/freshness signal — a stale value indicates the service stopped
  sending or the pipeline broke.
- TODO(source: KG/docs): whether APM registrations consume license capacity (see Known Bugs — APM
  counting has been a licensing pain point).

## 10. Known Bugs
From `knowledge/known_issues/customer-issue-kb.md`:
- **APM count confusion in licensing** (§12, PQD-36926): "License Exceeded" / consumption-mismatch
  tickets where **APM counts registered agent applications** — counts differed between screens.
  **Fix/workaround:** license code refactored in 8.0.26; restart clears cache-driven miscounts.
- No APM-registration-specific functional defect is otherwise recorded for this screen. (The `APM.png`
  consumer dashboard shows an empty "No data found" state, i.e. no registered services with traces.)

## 11. Edge Cases
- Register a service that never sends a trace (Status stays empty / Last Received Trace blank).
- Duplicate service name; invalid IP; unsupported language/SDK.
- Delete a service that is actively sending traces (in-flight data handling).
- Registration counted against license near the cap (see Known Bugs).
- Clock skew between service and platform affecting **Last Received Trace**.
- Search with no matches; large number of registered services (grid paging).
