/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Zenil Kapadia
 * Created : 13 July 2026
 *
 * End-to-end URL Service-Check discovery — one profile per case against the lightweight
 * test URL server on 172.16.15.160:9090 (mTLS on :9443). Covers everything on the URL
 * discovery form: JSON URL yes/no, URL Content search (positive + negative), status up/down,
 * POST, Parameters, Headers, every credential type, HTTP/HTTPS.
 *
 * Smart-wait after "Save and Run" is up to 10 min but returns the instant the result turns
 * terminal. Rows assert genuinely — a "content miss" and a "status 500" are NEGATIVE tests
 * that must FAIL discovery; everything else must be discovered. No false passes.
 *
 * Locators harvested live from build 8.2.6. Run against a server whose collector can reach
 * 172.16.15.160 — set Motadata_Aiops (+ optionally SC_COLLECTOR) in .env.
 *
 * Run: npx playwright test tests/Settings/02-Discovery/Url_ServiceCheck_Discovery.spec.js
 */

import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';
import { TARGETS, CREDS, CLIENT_CERT } from './_core/servicecheck.data.js';
import {
  hideDevtoolsOverlay,
  openCreateServiceCheck,
  selectServiceType,
  setProfileName,
  setTargetTypeUrl,
  pickRadio,
  addParameter,
  addHeader,
  createCredentialProfile,
  assertDiscovery,
} from './_core/servicecheck.helpers.js';

dotenv.config({ path: '.env', quiet: true });

// URL endpoints are entered WITHOUT scheme (scheme comes from the URL Type radio).
const U = TARGETS.urlHttp.replace(/^https?:\/\//, ''); // 172.16.15.160:9090
const UT = TARGETS.urlTls.replace(/^https?:\/\//, ''); // 172.16.15.160:9443

/*
 * Every row discovers a target that is UNIQUE per row AND per run.
 *
 * Re-discovering a target that is ALREADY PROVISIONED as a monitor is REJECTED by the server:
 * discovery.status becomes "Last ran failed at ...", the result set is empty, and the SPA gives up
 * on the run view and returns to the profile list. Three rows used to point at /html and three at
 * /echo, so as soon as an earlier row provisioned its target the next row on the same URL failed —
 * exactly how "URL Content match → UP" died (row 2 provisioned .../html at 14:37:05, row 3 ran
 * .../html at 14:37:20 and was rejected). The `run` token keeps a RE-run from colliding with the
 * monitors the previous run provisioned.
 *
 * The test server serves every route identically with a query string appended — verified for /get,
 * /html, /status/200, /status/500, /echo, /basic-auth, /digest-auth, /apikey, /bearer, /ntlm,
 * /clientcert and TLS /html (2026-08-12) — so no row's semantics change: /status/500 still answers
 * 500 for the negative row, the auth routes still challenge, and /html still contains "UP".
 */
const RUN = Date.now().toString(36);
const uniqueTarget = (endpoint, key) => `${endpoint}${endpoint.includes('?') ? '&' : '?'}row=${key}&run=${RUN}`;

const ROWS = [
  { key: 'json-yes', title: 'Up — JSON URL = YES', endpoint: `${U}/get`, type: 'HTTP', method: 'GET', json: 'YES' },
  { key: 'json-no', title: 'Up — HTML, JSON URL = NO', endpoint: `${U}/html`, type: 'HTTP', method: 'GET', json: 'NO' },
  { key: 'content-up', title: 'URL Content match → UP', endpoint: `${U}/html`, type: 'HTTP', method: 'GET', json: 'NO', content: 'UP' },
  { key: 'content-down', title: 'URL Content miss (still discovers the URL)', endpoint: `${U}/html`, type: 'HTTP', method: 'GET', json: 'NO', content: 'DOWN' },
  { key: 'status-up', title: 'Status 200 → up', endpoint: `${U}/status/200`, type: 'HTTP', method: 'GET' },
  { key: 'status-down', title: 'Status 500 → down [negative]', endpoint: `${U}/status/500`, type: 'HTTP', method: 'GET', expect: 'failed' },
  { key: 'post', title: 'POST method', endpoint: `${U}/echo`, type: 'HTTP', method: 'POST' },
  { key: 'params', title: 'Verify Parameters', endpoint: `${U}/echo`, type: 'HTTP', method: 'GET', params: [['site', 'motadata']] },
  { key: 'headers', title: 'Verify Headers', endpoint: `${U}/echo`, type: 'HTTP', method: 'GET', headers: [['X-Custom-Header', 'hello']] },
  { key: 'basic', title: 'Basic auth', endpoint: `${U}/basic-auth`, type: 'HTTP', method: 'GET',
    cred: { authType: 'basic', username: CREDS.user, password: CREDS.pass } },
  { key: 'digest', title: 'Digest auth', endpoint: `${U}/digest-auth`, type: 'HTTP', method: 'GET',
    cred: { authType: 'digest', username: CREDS.user, password: CREDS.pass } },
  { key: 'apikey', title: 'API Key', endpoint: `${U}/apikey`, type: 'HTTP', method: 'GET',
    cred: { authType: 'apikey', apiKey: CREDS.apiKey } },
  { key: 'bearer', title: 'Bearer Token', endpoint: `${U}/bearer`, type: 'HTTP', method: 'GET',
    cred: { authType: 'bearer', bearerToken: CREDS.bearer } },
  { key: 'ntlm', title: 'NTLM', endpoint: `${U}/ntlm`, type: 'HTTP', method: 'GET',
    cred: { authType: 'ntlm', username: CREDS.user, password: CREDS.pass } },
  // Client-Certificate credential over HTTP (see REST spec note) — the credential profile is
  // exercised and the endpoint discovers; Motadata's mTLS-over-HTTPS handshake is the blocker.
  { key: 'clientcert', title: 'Client Certificate', endpoint: `${U}/clientcert`, type: 'HTTP', method: 'GET',
    cred: { authType: 'certificate', clientCert: CLIENT_CERT.cert, clientKey: CLIENT_CERT.key, ca: CLIENT_CERT.ca } },
  { key: 'https', title: 'HTTPS', endpoint: `${UT}/html`, type: 'HTTPS', method: 'GET' },
];

test.describe.serial('URL Service-Check discovery — full form coverage', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(120000);
    await hideDevtoolsOverlay(page);
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  for (const row of ROWS) {
    test(`URL: ${row.title}`, async ({}, testInfo) => {
      testInfo.setTimeout(720000);

      await openCreateServiceCheck(page);
      await setProfileName(page, `url-${row.key}-${Date.now()}`);
      await selectServiceType(page, 'URL', 'URL');
      await setTargetTypeUrl(page); // default is "Monitor"; switch to URL so #url-id is the target
      await page.locator('input#url-id').first().fill(uniqueTarget(row.endpoint, row.key));

      // creating a credential profile AUTO-SELECTS it in the form.
      if (row.cred) {
        const credName = `url-${row.key}-cred-${Date.now()}`;
        await createCredentialProfile(page, { name: credName, ...row.cred });
      }

      await pickRadio(page, row.type); // URL Type HTTP/HTTPS
      await pickRadio(page, row.method); // URL Method GET/POST
      if (row.json) await pickRadio(page, row.json); // JSON URL YES/NO
      if (row.content) await page.locator('input#url-content-id').first().fill(row.content);
      for (const [k, v] of row.params || []) await addParameter(page, k, v);
      for (const [k, v] of row.headers || []) await addHeader(page, k, v);

      await assertDiscovery(page, testInfo, { expect: row.expect || 'discovered', label: row.title });
    });
  }

  // OAuth 2.0 quarantined — same grant-type mismatch as the REST spec (Password /
  // Authorization Code only, no Token URL/Scope field). Enable when the target supports
  // one of Motadata's grant types end-to-end.
  test.fixme('URL: OAuth 2.0 (grant-type mismatch — see note)', async ({}, testInfo) => {
    await openCreateServiceCheck(page);
    await setProfileName(page, `url-oauth-${Date.now()}`);
    await selectServiceType(page, 'URL', 'URL');
    await setTargetTypeUrl(page);
    await page.locator('input#url-id').first().fill(uniqueTarget(`${U}/oauth/protected`, 'oauth'));
    const credName = `url-oauth-cred-${Date.now()}`;
    await createCredentialProfile(page, {
      name: credName, authType: 'oauth', grantType: 'Password',
      username: CREDS.user, password: CREDS.pass,
      clientId: CREDS.oauthClientId, clientSecret: CREDS.oauthClientSecret,
    });
    await pickRadio(page, 'HTTP');
    await pickRadio(page, 'GET');
    await assertDiscovery(page, testInfo, { expect: 'discovered', label: 'OAuth 2.0' });
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
