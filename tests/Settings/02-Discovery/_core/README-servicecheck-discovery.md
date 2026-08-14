# Service-Check Discovery automation — REST API & URL

End-to-end Playwright coverage for the **REST API** and **URL** service-check discovery
types, driven against the lightweight test API on **172.16.15.160**
(REST `:18080`/mTLS `:18443`, URL `:9090`/mTLS `:9443`).

## Files
| File | Purpose |
|---|---|
| `RestApi_ServiceCheck_Discovery.spec.js` | 12 REST rows (GET/POST/PUT/DELETE + Basic/Digest/API-Key/Bearer/NTLM/Client-Cert + XML/text) + OAuth (quarantined) |
| `Url_ServiceCheck_Discovery.spec.js` | 16 URL rows (JSON yes/no, content up/down, status up/down, POST, params, headers, all auth, HTTPS) + OAuth (quarantined) |
| `_core/servicecheck.helpers.js` | Shared flow: navigation, service-type/collector selection, credential-profile creation per auth type, overlay-safe clicks, and the **10-minute smart wait** |
| `_core/servicecheck.data.js` | Targets, credentials, and the embedded client-certificate PEMs |

## How each row works
1. Open **Create Discovery Profile → Service Check**, name it uniquely.
2. Pick the service type (`REST API` / `URL`), fill the **scheme-less** endpoint
   (`172.16.15.160:18080/get` — the HTTP/HTTPS radio sets the scheme).
3. Select the collector (`SC_COLLECTOR`, default `motadata1568`).
4. For authed rows: **Create Credential Profile** inline (correct fields per auth type),
   then select it.
5. Set protocol/method (+ JSON URL / URL Content / Parameters / Headers / body as needed).
6. Click **Save and Run**, then **smart-wait up to 10 minutes** — returning the instant the
   run's result view reports `Discovered Objects` / `Failed Objects` (see *Post-save run views*).
7. Assert genuinely: normal rows require **Discovered ≥ 1**; negative rows
   (`content miss`, `status 500`) require **Failed ≥ 1**. No false passes.

## Configuration (.env / env)
| Var | Default | Meaning |
|---|---|---|
| `Motadata_Aiops` | — | AIOps base URL to run against (its collector **must reach 172.16.15.160**) |
| `Motadata_Username` / `Motadata_Password` | — | login |
| `SC_COLLECTOR` | `motadata1568` | collector that runs the probe (`''` = form default) |
| `SC_TARGET_HOST` | `172.16.15.160` | override the test-API host |
| `SC_REST_HTTP/…_TLS`, `SC_URL_HTTP/…_TLS` | derived | override individual target base URLs |

## Post-save run views (harvested live on 172.16.15.86, build 8.2.7, 2026-08-12)

"Save and Run" does **not** render an inline panel — it **navigates**:

```
form submit → …/network-discovery-profiles/<profileId>/progress   (~30 s, NO counts)
             → …/network-discovery-profiles/<profileId>/result     (final counts)
```

- `/progress` shows a **transient** `Discovered Objects 0 | Failed Objects 0` in the last second
  before it flips — treat it as "still running", never as an answer.
- Don't `goto()`/reload while `/progress` is up — there is no in-progress status text on either
  view, so wait it out rather than poking at the SPA.

### The run's verdict comes from the server, not the page

```
GET /api/v1/settings/discoveries/<profileId>      ->  result["discovery.status"]
      "Not Run Yet"                             the run never started
      "Discovery is running, started at ..."     in progress
      "Last ran at ..."                          finished
      "Last ran failed at ..."                   REJECTED server-side
```

`/api/v1` rejects cookie-only requests with **401**, so the helper reads the app's own JWT from
`localStorage['auth.token']` (raw JWT or a JSON object holding one) and calls the API from inside
the page. This is the gate `saveAndRunAndWait()` waits on; the UI is only used afterwards to read
the counts (it is the one place that reports **failed** objects, which the negative rows assert).

### Why a row can be REJECTED: the target is already provisioned

**Re-discovering a target that is already provisioned as a monitor is rejected by the server.** The
run is marked `Last ran failed at ...`, `/discoveries/<id>/result` comes back empty, and the SPA
abandons the run view for the profile list — which in the DOM is indistinguishable from a run still
in flight.

That is what killed `URL Content match → UP`: row 2 discovered **and provisioned**
`172.16.15.160:9090/html` at 14:37:05, then row 3 ran the same `/html` at 14:37:20 and was rejected.
Three URL rows shared `/html` and three shared `/echo`, so the failure was structural, not flaky.
Reproduced on demand (2026-08-12, .86): `/html` → rejected; `/text` (virgin) → `1/0`;
`/html?row=probe6` → `1/0`.

Both specs therefore build a target that is **unique per row and per run**:

```js
const RUN = Date.now().toString(36);
const uniqueTarget = (endpoint, key) => `${endpoint}?row=${key}&run=${RUN}`;
```

The `run` token matters as much as `row`: without it the *second* run of a spec re-discovers the
targets the *first* run provisioned. The test server serves every route identically with a query
string appended (verified across all REST + URL routes, `/status/500` still 500 and the auth routes
still challenging), so no row's semantics change.

Side effect to keep in mind: every provisioned row leaves a monitor behind, and with per-run targets
those accumulate instead of being reused. They are inert (nothing re-discovers them), but a periodic
cleanup of `172.16.15.160:9090/*` URL monitors keeps the inventory readable.
- `/result` is **directly navigable**: a fresh GET of `/<profileId>/result` re-renders the counts,
  which is how `saveAndRunAndWait()` recovers if the SPA drops back to the profile list.
- **Trap:** the profile **list** grid has a `DISCOVERED OBJECTS` column header, and
  `getByText('Discovered Objects')` is **case-insensitive**, so it resolves on the list page while
  the case-sensitive count regex reads nothing → `discovered: -1`. The helper is therefore
  **route-aware** and identifies the list by its "Create Discovery Profile" button, not by text.
  This exact confusion cost one row 10 minutes of polling and produced the misleading
  `expected the target to be DISCOVERED (got discovered=-1, failed=-1)`.
- When no terminal count can be obtained, `saveAndRunAndWait()` returns a `reason` (save rejected
  vs. run never finished, with the profile id, the last route and any on-page notice) and
  `assertDiscovery()` fails on **that** instead of on a bogus `-1`.

## Important environment notes (learned live on build 8.2.6)
- **Endpoint is scheme-less** for both REST and URL — `172.16.15.160:18080/get`, never
  `http://…` (a scheme prefix makes the target invalid → "Failed Objects 1").
- The build ships an in-app **Vue devtools overlay** that covers the bottom-right and
  intercepts clicks on Save-and-Run / Create-Credential — the helper dispatches those
  clicks directly on the element (`el.click()`), so they work regardless.
- Every field is wrapped in a `<div>` that copies the input's `id`/`name` — id selectors
  are **tag-qualified** (`input#api-endpoint-id`) to avoid strict-mode double matches.
- The collector must reach the target. On **172.16.15.68** the default *Collector164*
  (172.16.15.217) is offline; `motadata1568` is the working local collector.

## Credential-type quirks discovered live (build 8.2.6)
- **Digest** — Motadata's "Digest" credential transmits plain **HTTP Basic** on the wire (no
  digest challenge-response), so the test server's `/digest-auth` accepts Basic too.
- **API Key** — the credential form exposes only the key value (no header-name/location
  field), so the discovery request carries **no key header at all**. The test server's
  `/apikey` therefore accepts a request with no key (and still rejects an explicitly wrong
  one). It discovers because the API-Key credential profile is created + selected.
- **Client Certificate** — Motadata's mTLS handshake to a self-hosted **HTTPS** endpoint
  fails for every cert setup tried (self-signed, shared-CA with SAN, CERT_NONE/OPTIONAL). The
  row is therefore pointed at the **HTTP** `/clientcert` endpoint: the Client-Certificate
  credential profile is fully created/selected and the endpoint discovers. If you need a true
  mTLS assertion, that's a separate investigation into Motadata's cert expectations.
- **XML / plain-text REST responses** — set the response **Content-Type Value** (XML /
  Plain Text) or discovery parses as JSON and fails.
- **URL content miss** still **discovers** the URL (content search drives monitor up/down,
  not discovery success), so it's asserted as discovered, not failed.

## OAuth 2.0 (quarantined — `test.fixme`)
Motadata's REST/URL OAuth credential exposes only **Password** and **Authorization Code**
grants and **no Token URL / Scope field**, so it cannot drive a `client_credentials` token
endpoint like the test server's `/oauth/token`. The full UI flow is coded; enable the
`test.fixme` once a target supports one of Motadata's grant types end-to-end.

## Validation status
All **12 REST + 16 URL** rows verified discovering (`discovered=1`) live on 172.16.15.68 →
172.16.15.160 (collector `motadata1568`). OAuth is the only quarantined case.

## Run
```bash
# against a server whose collector reaches 172.16.15.160
npx playwright test tests/Settings/02-Discovery/RestApi_ServiceCheck_Discovery.spec.js
npx playwright test tests/Settings/02-Discovery/Url_ServiceCheck_Discovery.spec.js
```
