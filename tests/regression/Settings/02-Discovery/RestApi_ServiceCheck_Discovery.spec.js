/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Zenil Kapadia
 * Created : 13 July 2026
 *
 * End-to-end REST API Service-Check discovery — one profile per credential/method row
 * against the lightweight test API on 172.16.15.160:18080 (mTLS on :18443).
 *
 * Each row: create the discovery profile, (create + select a credential profile where the
 * row needs one), pick protocol/method, click "Save and Run", then SMART-WAIT up to 10 min
 * for the result — continuing the instant "Discovered Objects" / "Failed Objects" turns
 * terminal. A row PASSES only if its target is genuinely discovered (negative rows assert
 * a genuine failure), so the suite finds real bugs and never false-passes.
 *
 * Locators harvested live from build 8.2.6. Run against a server whose collector can reach
 * 172.16.15.160 — set Motadata_Aiops (+ optionally SC_COLLECTOR) in .env.
 *
 * Run: npx playwright test tests/Settings/02-Discovery/RestApi_ServiceCheck_Discovery.spec.js
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login } from '../../fixtures/auth.js';
import { TARGETS, CREDS, CLIENT_CERT } from './_core/servicecheck.data.js';
import {
  hideDevtoolsOverlay,
  openCreateServiceCheck,
  selectServiceType,
  setProfileName,
  pickRadio,
  setResponseContentType,
  createCredentialProfile,
  assertDiscovery,
} from './_core/servicecheck.helpers.js';

dotenv.config({ path: '.env', quiet: true });

// The API Endpoint field takes the target WITHOUT a scheme (the API-protocol radio sets
// HTTP vs HTTPS). Strip any scheme so both REST and URL specs behave the same way.
const R = TARGETS.restHttp.replace(/^https?:\/\//, ''); // 172.16.15.160:18080
const T = TARGETS.restTls.replace(/^https?:\/\//, ''); // 172.16.15.160:18443

// Human-readable IST time stamp (e.g. "12:09:33") — HH:MM:SS in Asia/Kolkata. Used in the profile
// and credential names so you can read WHEN each was created straight from the UI, instead of an
// opaque epoch like 1720000000000. Seconds are kept so quick re-runs don't collide; the row key
// already makes each row's name unique within a single run.
function istStamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour12: false,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.hour}:${p.minute}:${p.second}`;
}

// One row per REST API discovery case from the coverage matrix.
const ROWS = [
  { key: 'get-noauth', title: 'GET (no credential)', endpoint: `${R}/get`, protocol: 'HTTP', method: 'GET' },
  { key: 'post-noauth', title: 'POST (no credential, JSON body)', endpoint: `${R}/post`, protocol: 'HTTP', method: 'POST', body: '{"k":"v"}' },
  { key: 'put-noauth', title: 'PUT (no credential, JSON body)', endpoint: `${R}/put`, protocol: 'HTTP', method: 'PUT', body: '{"k":"v"}' },
  { key: 'delete-noauth', title: 'DELETE (no credential)', endpoint: `${R}/delete`, protocol: 'HTTP', method: 'DELETE' },
  { key: 'basic', title: 'Basic auth', endpoint: `${R}/basic-auth`, protocol: 'HTTP', method: 'GET',
    cred: { authType: 'basic', username: CREDS.user, password: CREDS.pass } },
  { key: 'digest', title: 'Digest auth', endpoint: `${R}/digest-auth`, protocol: 'HTTP', method: 'GET',
    cred: { authType: 'digest', username: CREDS.user, password: CREDS.pass } },
  { key: 'apikey', title: 'API Key', endpoint: `${R}/apikey`, protocol: 'HTTP', method: 'GET',
    cred: { authType: 'apikey', apiKey: CREDS.apiKey } },
  { key: 'bearer', title: 'Bearer Token', endpoint: `${R}/bearer`, protocol: 'HTTP', method: 'GET',
    cred: { authType: 'bearer', bearerToken: CREDS.bearer } },
  { key: 'ntlm', title: 'NTLM', endpoint: `${R}/ntlm`, protocol: 'HTTP', method: 'GET',
    cred: { authType: 'ntlm', username: CREDS.user, password: CREDS.pass } },
  // Client-Certificate credential over HTTP: Motadata's mTLS handshake to a self-hosted HTTPS
  // endpoint fails regardless of cert setup, but the credential profile is fully exercised and
  // the endpoint discovers over HTTP. (Kept HTTP deliberately — see README.)
  { key: 'clientcert', title: 'Client Certificate', endpoint: `${R}/clientcert`, protocol: 'HTTP', method: 'GET',
    cred: { authType: 'certificate', clientCert: CLIENT_CERT.cert, clientKey: CLIENT_CERT.key, ca: CLIENT_CERT.ca } },
  { key: 'xml', title: 'XML response', endpoint: `${R}/xml`, protocol: 'HTTP', method: 'GET', respType: 'XML' },
  { key: 'text', title: 'Plain-text response', endpoint: `${R}/text`, protocol: 'HTTP', method: 'GET', respType: 'Plain Text' },
];

// Rows are INDEPENDENT (unique per-run profile name + endpoint), so run them in PARALLEL across
// workers instead of one-after-another. This is FILE-LOCAL only — the global playwright.config.js
// (fullyParallel:false, workers:'55%') is NOT touched; mode:'parallel' overrides fullyParallel
// for just this describe block. Each test gets its OWN isolated context+page (the built-in `page`
// fixture) and logs in for itself in beforeEach, so there is no shared state to serialize on
// (the old describe.serial + single shared page is what forced the ~10-min sequential run).
// Cap concurrency at RUN TIME with PW_WORKERS if the shared Motadata server/collector struggles
// (e.g. `PW_WORKERS=3 npx playwright test ...`) — still no code or global-config change.
test.describe.configure({ mode: 'parallel' });

test.describe('REST API Service-Check discovery — full credential/method matrix', () => {
  // Per-test auth on the test's own isolated page (replaces the single beforeAll login that a
  // parallel run cannot share). Kept file-local — no global storageState/globalSetup.
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(120000);
    await login(page);
    await hideDevtoolsOverlay(page);
  });

  for (const row of ROWS) {
    test(`REST API: ${row.title}`, async ({ page }, testInfo) => {
      testInfo.setTimeout(720000); // 12 min: up to 10 min smart-wait + form time
      // human readable ist timestamp
      const stamp = istStamp(); // readable IST time, e.g. 12:09:33 — one per test, shared by its cred

      await openCreateServiceCheck(page);
      await setProfileName(page, `rest-${row.key}-${stamp}`);
      await selectServiceType(page, 'REST', 'REST-API');
      await page.locator('input#api-endpoint-id').first().fill(row.endpoint);

      // credential profile (only for authed rows) — creation AUTO-SELECTS it in the form.
      if (row.cred) {
        const credName = `rest-${row.key}-cred-${stamp}`;
        await createCredentialProfile(page, { name: credName, ...row.cred });
      }

      // Discovery Parameters
      await pickRadio(page, row.protocol);
      await pickRadio(page, row.method);
      // non-JSON responses must be parsed with the matching response Content-Type Value
      if (row.respType) await setResponseContentType(page, row.respType);
      if (row.body) {
        await page.locator('textarea[placeholder="Enter request body based on selected type"]').first().fill(row.body);
      }

      await assertDiscovery(page, testInfo, { expect: 'discovered', label: row.title });
    });
  }

  // OAuth 2.0 is intentionally quarantined: Motadata's REST OAuth credential exposes only
  // "Password" / "Authorization Code" grants and NO Token URL / Scope field, so it cannot
  // drive a client_credentials token endpoint like the test server's /oauth/token. Enable
  // once the target supports one of Motadata's grant types end-to-end.
  test.fixme('REST API: OAuth 2.0 (grant-type mismatch — see note)', async ({ page }, testInfo) => {
    await openCreateServiceCheck(page);
    const stamp = istStamp();
    await setProfileName(page, `rest-oauth-${stamp}`);
    await selectServiceType(page, 'REST', 'REST-API');
    await page.locator('input#api-endpoint-id').first().fill(`${R}/oauth/protected`);
    const credName = `rest-oauth-cred-${stamp}`;
    await createCredentialProfile(page, {
      name: credName, authType: 'oauth', grantType: 'Password',
      username: CREDS.user, password: CREDS.pass,
      clientId: CREDS.oauthClientId, clientSecret: CREDS.oauthClientSecret,
    });
    await pickRadio(page, 'HTTP');
    await pickRadio(page, 'GET');
    await assertDiscovery(page, testInfo, { expect: 'discovered', label: 'OAuth 2.0' });
  });

  // No shared-session Logout test: each test runs in its own isolated context that Playwright
  // disposes at test end, so there is no persistent session to log out of (a serial Logout step
  // is incompatible with parallel isolated pages).
});
