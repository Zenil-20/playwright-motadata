/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Shared helpers for the REST API + URL Service-Check discovery specs.
 *
 * Every locator here was harvested LIVE from build 8.2.6 (172.16.15.68). Notes that
 * drove the design:
 *   - Each form field is wrapped in a <div> that COPIES the same id/name/placeholder as
 *     its <input>, so id selectors MUST be tag-qualified (input#foo / textarea#foo) or a
 *     bare "#foo" trips strict mode (2 elements).
 *   - The build ships an in-app Vue devtools overlay (.cp-empty / .dev-body) that floats
 *     over the bottom-right and INTERCEPTS clicks on Save-and-Run / Create-Credential.
 *     We dispatch those clicks directly on the element (el.click()) so they fire Vue's
 *     @click regardless of any overlay -> see clickThrough().
 *   - Service-type + auth-type + grant-type options render as <div id="..."> (hyphenated
 *     ids: #REST-API #URL #basic #digest #ntlm #apikey #bearer #oauth #certificate).
 *   - After "Save and Run" the result view shows "Discovered Objects N | Failed Objects N".
 *     waitForDiscoveryResult() smart-waits (default 10 min) and returns the moment either
 *     count becomes terminal, so a fast response continues immediately.
 */

import { expect } from '@playwright/test';

const base = () => (process.env.Motadata_Aiops || '').replace(/\/+$/, '');

/** Neutralize the in-app devtools overlay across navigations (best-effort; clickThrough is
 *  the real guarantee). Call once right after creating the page, before the first goto. */
export async function hideDevtoolsOverlay(page) {
  await page.addInitScript(() => {
    const css =
      '.cp-empty,.dev-body,.dev-wrapper,.cp-global-btn,.cp-focus-btn,.dev-tabs,.dev-header{display:none!important;pointer-events:none!important}';
    const add = () => {
      const s = document.createElement('style');
      s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    };
    add();
    document.addEventListener('DOMContentLoaded', add);
  });
}

/** Click that fires the element's own click handler, bypassing any covering overlay. */
export async function clickThrough(page, selector) {
  await page.locator(selector).first().evaluate((el) => el.click());
}

/** Open the "Create Discovery Profile" form and switch to the Service Check group. */
export async function openCreateServiceCheck(page) {
  await page.goto(`${base()}/settings/network-discovery/network-discovery-profiles`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  await page.getByText('Service Check', { exact: true }).click();
  await page.waitForTimeout(600);
}

/** Pick the service type by its option id (#REST-API or #URL). */
export async function selectServiceType(page, term, optionId) {
  await page.locator('#service-type-id').click();
  await page.locator("input[data-cy='dropdown-search-input']").fill(term);
  await page.waitForTimeout(400);
  await page.locator(`[id="${optionId}"]`).first().click();
  await page.waitForTimeout(700);
}

/** Fill the discovery profile name (tag-qualified — the wrapper div shares the name). */
export async function setProfileName(page, name) {
  await page.locator('input[name="profile-name"]').fill(name);
}

/** URL discovery only: switch Target Type from the default "Monitor" to "URL" so the
 *  "URL *" (#url-id) field becomes the required target instead of an existing monitor. */
export async function setTargetTypeUrl(page) {
  await page
    .getByText('Target Type', { exact: true })
    .locator('xpath=following::*[contains(@class,"ant-radio-button-wrapper")][1]')
    .click();
  await page.waitForTimeout(300);
}

// Collector selection intentionally omitted — both the URL and REST Service-Check specs
// leave the collector at the form default (the probe runs on whatever collector the profile
// defaults to). No selectCollector helper is exported; callers must NOT pick a collector.

/** Click a radio-button (protocol/method/JSON-URL/body-type) by its exact label text.
 *  getByText exact avoids the HTTP-vs-HTTPS substring trap and reliably hits the button. */
export async function pickRadio(page, text) {
  await page.getByText(text, { exact: true }).first().click();
}

/** REST only: set the response "Content-Type Value" (Json/Plain Text/XML) so a non-JSON
 *  response is parsed correctly. It's the LAST Json/Plain Text/XML group on the page (the
 *  first group is "Request Body Type"), so use .last(). */
export async function setResponseContentType(page, text) {
  await page.getByText(text, { exact: true }).last().click();
}

/** Add a query Parameter (key/value) row in the REST/URL form. */
export async function addParameter(page, key, value) {
  await page.getByRole('button', { name: 'Add Parameter' }).click();
  await page.waitForTimeout(300);
  await page.locator('input[name="parameter-name"]').last().fill(key);
  await page.locator('input[name="parameter-value"]').last().fill(value);
}

/** Add a Header (key/value) row in the REST/URL form. */
export async function addHeader(page, key, value) {
  await page.getByRole('button', { name: 'Add Header' }).click();
  await page.waitForTimeout(300);
  await page.locator('input[name="header-name"]').last().fill(key);
  await page.locator('input[name="header-value"]').last().fill(value);
}

/**
 * Create a Credential Profile inline (opens the right drawer, fills per auth type, submits).
 * cred = { name, authType, username, password, apiKey, bearerToken,
 *          clientCert, clientKey, ca, grantType, clientId, clientSecret }
 * authType is the option id: basic | digest | ntlm | apikey | bearer | oauth | certificate
 */
export async function createCredentialProfile(page, cred) {
  await page.getByRole('button', { name: 'Create Credential Profile' }).click();
  await page.waitForTimeout(900);
  await page.locator('input#credential-profile-name-id').fill(cred.name);

  // Authentication Type
  await page
    .getByText('Authentication Type', { exact: true })
    .locator('xpath=following::input[@data-cy="dropdown-trigger-input"][1]')
    .click();
  await page.waitForTimeout(300);
  await page.locator(`[id="${cred.authType}"]`).first().click();
  await page.waitForTimeout(500);

  if (['basic', 'digest', 'ntlm'].includes(cred.authType)) {
    await page.locator('input#username-id').fill(cred.username);
    await page.locator('input#password-id').fill(cred.password);
  } else if (cred.authType === 'apikey') {
    await page.locator('input#api-key-id').fill(cred.apiKey);
  } else if (cred.authType === 'bearer') {
    await page.locator('input#bearer-token-id').fill(cred.bearerToken);
  } else if (cred.authType === 'certificate') {
    // "Configure Manually" is the default mode -> three PEM textareas by label.
    await page
      .getByText('Client Certificate', { exact: true })
      .locator('xpath=following::textarea[1]')
      .fill(cred.clientCert);
    await page
      .getByText('Client Key', { exact: true })
      .locator('xpath=following::textarea[1]')
      .fill(cred.clientKey);
    if (cred.ca) {
      await page
        .getByText('Certificate Authority', { exact: true })
        .locator('xpath=following::textarea[1]')
        .fill(cred.ca);
    }
  } else if (cred.authType === 'oauth') {
    // Motadata offers only Password / Authorization-Code grants (no client_credentials).
    await page
      .getByText('Grant Type', { exact: true })
      .locator('xpath=following::input[@data-cy="dropdown-trigger-input"][1]')
      .click();
    await page.waitForTimeout(300);
    await page.locator(`[id="${cred.grantType || 'Password'}"]`).first().click();
    await page.waitForTimeout(400);
    if ((cred.grantType || 'Password') === 'Password') {
      await page.locator('input#username-id').fill(cred.username);
      await page.locator('input#password-id').fill(cred.password);
    }
    if (cred.clientId) {
      await page.getByText('Client ID', { exact: true }).locator('xpath=following::input[1]').fill(cred.clientId);
    }
    if (cred.clientSecret) {
      await page
        .getByText('Client Secret', { exact: true })
        .locator('xpath=following::input[1]')
        .fill(cred.clientSecret);
    }
  }

  // Submit — overlay-safe (button sits under the devtools panel).
  await clickThrough(page, '#create-credential-profile-btn-id');
  // Wait for the drawer + its mask to close, else the mask intercepts the next click
  // (notably after the large Client-Certificate textareas).
  await page.locator('.ant-drawer-mask').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

/** Select an existing/just-created credential profile by name in the main form. */
export async function selectCredentialProfile(page, name) {
  await page
    .getByText('Credential Profiles', { exact: false })
    .locator('xpath=following::input[@data-cy="dropdown-trigger-input"][1]')
    .click();
  await page.waitForTimeout(500);
  const search = page.locator("input[data-cy='dropdown-search-input']");
  if (await search.count()) await search.last().fill(name);
  await page.waitForTimeout(400);
  await page.getByText(name, { exact: true }).first().click();
  await page.waitForTimeout(300);
}

const LIST_PATH = '/settings/network-discovery/network-discovery-profiles';
// Save-and-Run routes to <LIST_PATH>/<profileId>/progress and then /<profileId>/result.
const RUN_VIEW_RE = /network-discovery-profiles\/(\d+)\/(progress|result)/;
const RESULT_RE = /network-discovery-profiles\/\d+\/result$/;
const PROGRESS_RE = /network-discovery-profiles\/\d+\/progress$/;

/**
 * Read the "Discovered Objects N | Failed Objects N" counts, plus enough page state to tell
 * the three post-save views apart (progress / result / bounced back to the profile LIST).
 *
 * The counts regex is deliberately case-SENSITIVE. The profile LIST grid carries a
 * "DISCOVERED OBJECTS" column header, so any case-insensitive test — including Playwright's
 * getByText('Discovered Objects'), which is case-insensitive by design — resolves happily on
 * the list page and makes the caller believe the run view mounted. `onList` is the honest
 * check: only the list renders the "Create Discovery Profile" button.
 */
async function readState(page) {
  return page.evaluate(() => {
    const t = document.body.innerText || '';
    const d = t.match(/Discovered Objects\s*(\d+)/);
    const f = t.match(/Failed Objects\s*(\d+)/);
    return {
      discovered: d ? +d[1] : -1,
      failed: f ? +f[1] : -1,
      onList: [...document.querySelectorAll('button')].some((b) => /Create Discovery Profile/i.test(b.innerText || '')),
      onForm: !!document.querySelector('#save-run-btn-id'),
      notices: [...document.querySelectorAll('.ant-notification-notice, .ant-message, .ant-form-item-explain-error')]
        .map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 3),
    };
  });
}

/** Pull the app's own bearer token (localStorage 'auth.token' — the stored value is either the raw
 *  JWT or a JSON object holding it) so we can ask the API for a run's verdict. The /api/v1 calls
 *  reject cookie-only requests with 401, so the token is required. Returns null if the storage
 *  shape ever changes; callers then fall back to reading the UI counts. */
async function authToken(page) {
  return page.evaluate(() => {
    const isJwt = (v) => typeof v === 'string' && /^ey[A-Za-z0-9_-]{10,}\./.test(v);
    for (const store of [localStorage, sessionStorage]) {
      for (const k of ['auth.token', 'token', 'access.token', 'access_token', ...Object.keys(store)]) {
        const v = store.getItem(k);
        if (!v) continue;
        if (isJwt(v)) return v;
        try {
          const o = JSON.parse(v);
          if (isJwt(o)) return o;
          for (const kk of Object.keys(o || {})) if (isJwt(o[kk])) return o[kk];
        } catch {
          /* not JSON — next key */
        }
      }
    }
    return null;
  });
}

/**
 * The run's verdict, STRAIGHT FROM THE SERVER — the only signal that separates a rejected run from
 * a slow one. The UI cannot be trusted here: a rejected run abandons /progress for the profile
 * list and renders an EMPTY result view, which in the DOM looks exactly like "still running".
 *
 *   "Not Run Yet"                          -> the run never started
 *   "Discovery is running, started at ..."  -> in progress
 *   "Last ran at ..."                       -> finished
 *   "Last ran failed at ..."                -> REJECTED server-side (see saveAndRunAndWait)
 */
async function runStatus(page, profileId, token) {
  if (!token) return null;
  return page
    .evaluate(async ([id, tok]) => {
      try {
        const r = await fetch(`/api/v1/settings/discoveries/${id}`, { headers: { Authorization: `Bearer ${tok}` } });
        if (!r.ok) return null;
        const j = await r.json();
        return (j && j.result && j.result['discovery.status']) || null;
      } catch {
        return null;
      }
    }, [profileId, token])
    .catch(() => null);
}

/**
 * Click "Save and Run" and SMART-WAIT (default 10 min) for the discovery to reach a terminal
 * state. Returns as soon as the server reports the run finished (a healthy run takes ~30 s); a
 * slow one is allowed up to `timeout`.
 *
 * Returns { discovered, failed, reason? }. `reason` is set ONLY when no genuine count could be
 * obtained, and explains WHICH failure it was — save rejected / run rejected by the server / run
 * never finished — so the caller fails with the truth instead of a bare "-1".
 *
 * Gated on the server's discovery.status, not on page text, because of two traps that both
 * produced "discovered=-1" for the full 10 minutes and then a misleading assertion message:
 *   - the /progress view renders NO counts (plus a transient "Discovered Objects 0" right before
 *     it flips), and the profile LIST's "DISCOVERED OBJECTS" column header satisfies a
 *     case-insensitive text wait while the case-sensitive count regex matches nothing;
 *   - a run the server REJECTED ("Last ran failed at ...") abandons the run view for the list and
 *     leaves an empty result, indistinguishable in the DOM from a run still in flight.
 *
 * The dominant cause of a REJECTED run in this suite: the target is ALREADY PROVISIONED as a
 * monitor (by an earlier row, or by an earlier run). Re-discovering a provisioned target is
 * rejected server-side — reproduced on demand 2026-08-12 on .86 (/html provisioned at 14:37 →
 * re-discovery at 14:53 rejected; the same form with a per-row-unique target discovered 1/0).
 * That is why the specs build a target that is unique per row AND per run.
 */
export async function saveAndRunAndWait(page, { timeout = 600000, poll = 3000, settle = 3 } = {}) {
  await clickThrough(page, '#save-run-btn-id');

  // The save must open the run view. If it doesn't, the form rejected the profile — surface the
  // actual message rather than polling a page that can never show counts.
  let profileId = null;
  try {
    await page.waitForURL(RUN_VIEW_RE, { timeout: 120000 });
    profileId = (page.url().match(RUN_VIEW_RE) || [])[1] || null;
  } catch {
    const s = await readState(page);
    return {
      discovered: s.discovered,
      failed: s.failed,
      reason:
        `"Save and Run" never opened the run view (still at ${page.url()}). ` +
        (s.notices.length ? `Page said: ${s.notices.join(' | ')}` : 'No error message was shown.'),
    };
  }

  const resultUrl = `${base()}${LIST_PATH}/${profileId}/result`;
  const start = Date.now();
  const token = await authToken(page).catch(() => null);
  let last = { discovered: -1, failed: -1, notices: [] };
  let status = null;
  let stable = 0;

  while (Date.now() - start < timeout) {
    status = await runStatus(page, profileId, token);

    // The server rejected the run — no amount of waiting will produce objects.
    if (status && /^Last ran failed/i.test(status)) {
      return {
        discovered: 0,
        failed: 0,
        reason:
          `the SERVER rejected this discovery run — API discovery.status = "${status}" and ` +
          `/discoveries/${profileId}/result is empty. The usual cause is that this exact target is ` +
          `ALREADY PROVISIONED as a monitor (by an earlier row or an earlier run); re-discovering a ` +
          `provisioned target is rejected. Give the row a target that is unique per row AND per run.`,
      };
    }

    // Finished. Land on the result view so the counts render and provisioning can proceed. The
    // counts still come from the UI: it is the one place that reports FAILED objects too (the
    // negative rows assert failed >= 1), which /discoveries/<id>/result does not give us.
    if (status && /^Last ran /i.test(status)) {
      if (!RESULT_RE.test(page.url())) await page.goto(resultUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      for (let i = 0; i < 5; i++) {
        last = await readState(page);
        if (last.discovered >= 0 || last.failed >= 0) break;
        await page.waitForTimeout(2000);
      }
      if (last.discovered < 0 && last.failed < 0) {
        return {
          discovered: last.discovered,
          failed: last.failed,
          reason:
            `the server reports the run finished ("${status}") but the result view never rendered ` +
            `any counts (profile ${profileId}, view ${page.url()}) — the counts could not be read.`,
        };
      }
      return { discovered: Math.max(last.discovered, 0), failed: Math.max(last.failed, 0) };
    }

    // No token / API shape changed -> fall back to the UI counts, still route-aware. NEVER navigate
    // while /progress is up: leaving that view before it flips starves the run (verified 2026-08-12).
    if (!status) {
      last = await readState(page);
      if (last.discovered >= 1 || last.failed >= 1) return { discovered: last.discovered, failed: last.failed };
      if (RESULT_RE.test(page.url()) && last.discovered === 0 && last.failed === 0) {
        if (++stable >= settle) return { discovered: 0, failed: 0 };
      } else {
        stable = 0;
      }
      if (!RESULT_RE.test(page.url()) && !PROGRESS_RE.test(page.url())) {
        await page.goto(resultUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      }
    }
    await page.waitForTimeout(poll);
  }

  return {
    discovered: last.discovered,
    failed: last.failed,
    reason:
      `discovery did not finish within ${Math.round(timeout / 1000)}s (profile ${profileId}, ` +
      `server discovery.status=${JSON.stringify(status)}, last view ${page.url()}, last UI read ` +
      `discovered=${last.discovered} failed=${last.failed}, onList=${last.onList}, onForm=${last.onForm})` +
      (last.notices.length ? ` — page said: ${last.notices.join(' | ')}` : ''),
  };
}

/** Close the "Provision Status" popover (it renders as role=document, so target the cross
 *  <a> inside the flex header that holds the "Provision Status" heading — a bare times-icon
 *  click can hit a page-header icon instead). */
async function closeProvisionStatus(page) {
  const header = page
    .locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await header.locator('a:has(svg[data-icon="times"])').click({ timeout: 15000 }).catch(() => {});
}

/**
 * PROVISION the discovered object: tick the first checkbox in the result table, click
 * "Add Selected Objects", then SOFT-check "provisioned successfully".
 *
 * The "provisioned successfully" confirmation is a SOFT (non-blocking) check — it is attempted
 * and its outcome recorded, but it NEVER fails the test. Rationale: the toast can be missed, and
 * a re-run re-provisions an already-provisioned target (which does not re-show the toast). Since
 * these specs are describe.serial, a hard/expect.soft failure here would cascade-skip the rest of
 * the block. Discovery (discovered >= 1) remains the hard gate.
 */
export async function provisionDiscovered(page, testInfo) {
  const cb = page.locator("//input[@type='checkbox']").first();
  await cb.check({ timeout: 15000 }).catch(async () => { await cb.click({ timeout: 15000 }).catch(() => {}); });
  await page.waitForTimeout(500);
  // "Add Selected Objects" — overlay-safe (dispatch on the element).
  await clickThrough(page, '#add-selected-btn-id');
  const confirmed = await page
    .getByText('provisioned successfully')
    .first()
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  await page.screenshot({ path: testInfo.outputPath('provisioned.png'), fullPage: true }).catch(() => {});
  await testInfo.attach('provisioning.txt', {
    body: confirmed
      ? '"provisioned successfully" — confirmed'
      : 'SOFT: "provisioned successfully" not shown (target may already be provisioned, or the toast was missed) — not failing the test',
    contentType: 'text/plain',
  });
  await closeProvisionStatus(page);
}

/**
 * Full assertion for a discovery row. expect = 'discovered' (target must be found — then it
 * is PROVISIONED: select + Add Selected Objects + confirm "provisioned successfully") or
 * 'failed' (negative test — target expected to fail, e.g. status/500). Genuine, no false pass.
 */
export async function assertDiscovery(page, testInfo, { expect: expected = 'discovered', label = '', provision = true } = {}) {
  const counts = await saveAndRunAndWait(page);
  await testInfo.attach('discovery-counts.json', {
    body: JSON.stringify({ label, ...counts }, null, 2),
    contentType: 'application/json',
  });
  await page.screenshot({ path: testInfo.outputPath('result.png'), fullPage: true }).catch(() => {});
  // No terminal count => the run never produced one. Fail on THAT, not on a bogus "discovered=-1",
  // so the report says whether the save was rejected or the run never finished.
  if (counts.reason) throw new Error(`[${label}] ${counts.reason}`);
  if (expected === 'discovered') {
    expect(counts.discovered, `expected the target to be DISCOVERED (got discovered=${counts.discovered}, failed=${counts.failed})`).toBeGreaterThanOrEqual(1);
    if (provision) await provisionDiscovered(page, testInfo);
  } else {
    expect(counts.failed, `expected the target to FAIL discovery [negative test] (got discovered=${counts.discovered}, failed=${counts.failed})`).toBeGreaterThanOrEqual(1);
  }
  return counts;
}
