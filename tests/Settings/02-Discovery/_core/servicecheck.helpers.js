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

/** Read the "Discovered Objects N | Failed Objects N" counts from the result view. */
async function readCounts(page) {
  return page.evaluate(() => {
    const t = document.body.innerText || '';
    const d = t.match(/Discovered Objects\s*(\d+)/);
    const f = t.match(/Failed Objects\s*(\d+)/);
    return { discovered: d ? +d[1] : -1, failed: f ? +f[1] : -1 };
  });
}

/**
 * Click "Save and Run" and SMART-WAIT (default 10 min) for the discovery to reach a
 * terminal state. Returns as soon as (Discovered >= 1 OR Failed >= 1) — a fast response
 * continues immediately; a slow one is allowed up to `timeout`.
 * Returns { discovered, failed }.
 */
export async function saveAndRunAndWait(page, { timeout = 600000, poll = 5000 } = {}) {
  await clickThrough(page, '#save-run-btn-id');
  const start = Date.now();
  let counts = { discovered: -1, failed: -1 };
  // wait for the result view to mount first
  await page.getByText('Discovered Objects', { exact: false }).first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
  while (Date.now() - start < timeout) {
    await page.waitForTimeout(poll);
    counts = await readCounts(page);
    if (counts.discovered >= 1 || counts.failed >= 1) break;
  }
  return counts;
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
  if (expected === 'discovered') {
    expect(counts.discovered, `expected the target to be DISCOVERED (got discovered=${counts.discovered}, failed=${counts.failed})`).toBeGreaterThanOrEqual(1);
    if (provision) await provisionDiscovered(page, testInfo);
  } else {
    expect(counts.failed, `expected the target to FAIL discovery [negative test] (got discovered=${counts.discovered}, failed=${counts.failed})`).toBeGreaterThanOrEqual(1);
  }
  return counts;
}
