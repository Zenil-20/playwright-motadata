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
   result panel shows `Discovered Objects` / `Failed Objects`.
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
