---
name: api-contract-validator
description: Pair a Motadata ObserveOps UI E2E with API-layer assertions — validate the AIOps backend REST responses behind discovery/policy/monitor CRUD against their shape, status codes and backward compatibility using a Playwright request context. Use when a UI test creates/edits an entity and you also want to prove the API contract held.
---
# API Contract Validator (ObserveOps)

ObserveOps is a Vue 3 + Ant Design SPA (build 8.2.6) driven by AIOps backend REST APIs. Every UI flow you
automate — a **network discovery profile**, an **availability/metric/log policy**, a **monitor** provisioned
from discovery — is a thin skin over a JSON API. A UI-only test proves the button worked; it does not prove the
backend returned the right shape, status, or a backward-compatible payload. This skill pairs the UI E2E (driven
by `framework/playwright/flow.js`) with **request-context assertions** on the same backend, so a silent contract
regression (a renamed field, a dropped status code, a `200` that should be `403`) fails loudly.

## When to use / When NOT
- **Use** when a spec under `tests/regression/**` or `tests/scenarios/**` performs CRUD that a REST endpoint
  backs — discovery profile create (`network-discovery-profiles-create.md`), policy create (`policy-settings/*.md`
  — availability/metric/log/apm/flow/trap), monitor list/inventory, roles/user-profiles CRUD.
- **Use** to guard a **version bump** (8.2.x → next): keep last release's response shape and diff for breaking
  changes before a UI symptom ever appears.
- **Do NOT** invent endpoint paths, field names, or status codes. If you have not observed the request, harvest
  it first (see Procedure step 1). A fabricated contract is worse than none — quarantine, don't guess.
- **Do NOT** replace the UI assertion. Contract checks *complement* the E2E; they never stand in for "the row
  appears in the grid".

## Procedure (ObserveOps-specific)
1. **Capture the real contract, don't assume it.** Run the existing UI flow once with tracing on, or use the
   `motadata-explorer` skill / Chrome network panel, and record the actual request the SPA fires when you click
   **Create** — method, path, request body, response status, response JSON. Save that observed payload as the
   baseline (e.g. `tests/data/contracts/discovery-profile.json`). This is the same discipline the knowledge docs
   use: every claim cited, nothing invented.
2. **Reuse the logged-in session.** ObserveOps auth is the avatar-visible login the framework already performs
   (no `networkidle`, smart waits only). Build a Playwright `request` context that carries the same auth (token
   or session cookie) the UI holds — do not re-login per request. Pull `baseURL` from the same env the E2E uses
   (the 172.16.x lab host), never a hardcoded prod host.
3. **Assert the response contract next to the UI step.** After `flow.js` creates the entity and you assert the
   grid row, also assert the backend:
   - **Status code** — create returns its documented success code; an unauthorized caller returns `403`, a bad
     body returns `400/422` (not `500`).
   - **Shape** — required fields present, types correct (validate the JSON against a saved schema; a schema
     validator like AJV catches nested/format cases a manual `toHaveProperty` misses).
   - **Round-trip** — the field you typed in the UI (profile name, policy threshold) is echoed back verbatim by
     the GET.
   - **Empty/`No data found` state** — a list endpoint with no rows returns a well-formed empty collection, not
     `null` (mirror the SPA's "No data found" empty state).
4. **Guard backward compatibility on version bumps.** Diff the current response against last release's saved
   baseline: a removed field, a changed type, or a newly-required request field is a breaking change → fail. An
   added optional field is safe.
5. **Feed verified endpoints back into knowledge.** When you confirm a path/shape live, record it (screen doc's
   §Actions or a contracts fixture) with provenance — same rule as promoting a locator into
   `knowledge/locators/selector-cookbook.md`.

Example (Playwright, sharing the UI's auth against the AIOps backend):
```js
// after flow.js has created the discovery profile and the grid row is asserted:
const api = await request.newContext({ baseURL: process.env.OBSERVEOPS_BASE, extraHTTPHeaders: authHeaders });
const res = await api.get('/api/.../discovery-profiles');   // path OBSERVED from the live SPA, never guessed
expect(res.status(), 'discovery list should be 200').toBe(200);
const body = await res.json();
expect(Array.isArray(body.data ?? body)).toBe(true);        // well-formed collection, not null
// round-trip: the name typed in the UI must come back from the API
expect(JSON.stringify(body)).toContain(profileNameTypedInUI);
```

## Rules & anti-patterns (tie to our conventions)
- **Contract is observed, not imagined.** Provenance / no fabrication is a hard rule here as everywhere in this
  repo — every path, field, and status you assert must trace to a real captured request.
- **Smart waits only.** No `networkidle`, no blind `waitForTimeout`; await the response you fired.
- **Never point contract tests at production.** Use the lab env the E2E uses; discovery/policy CRUD mutates state.
- **Validate error contracts as hard as success.** A discovery create by an under-privileged user must be a
  clean `403` with a message, never a stack trace or `500` — that also feeds authorization-testing.
- **Quarantine, don't mask.** If the API shape drifts from the baseline, fail and flag it; do not loosen the
  assertion to make the suite green.

Adapted from qaskills/seed-skills/api-contract-validator
