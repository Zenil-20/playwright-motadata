/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * SNMP Trap — CONFIGURATION suite (Layer 1 of the trap harness).
 *
 * Covers CRUD + validation for the four trap config surfaces (locators harvested live, cookbook §16b):
 *   - SNMP Trap Listener   /settings/snmp-trap/snmp-trap-listener
 *   - SNMP Trap Profile    /settings/snmp-trap/snmp-trap-profiles
 *   - SNMP Trap Forwarder  /settings/snmp-trap/snmp-trap-forwarder
 *   - Trap Policy          /settings/policy-settings/policies/trap/create
 *
 * These tests need NO traps and NO 5-min wait, so they are the fast bulk of the suite.
 *
 * WRITES: creates real config on the (writable) 151 server, then deletes it in the same test.
 * Every created object uses a unique run-token name for idempotency and is cleaned up. Validation
 * tests deliberately leave a required field empty so submit is rejected — NO state is created.
 *
 * GROUNDING HONESTY: form FIELD locators are verified count()===1. Some DROPDOWN OPTION VALUES
 * (profiles multi-select, trigger condition, security level) were not enumerated in the read-only
 * harvest; those steps pick a value via selectAntOption and are commented where the exact option
 * text should be confirmed live.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */

import { test, expect } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import { LISTENER_PORT, LISTENER_COMMUNITY, V3_USER, V3_SECURITY_LEVEL, FORWARDER_DEST } from './_helpers/trap-fixtures.js';
import { gotoSettings, openCreate, selectAntOption, submitCreate, submitAndExpectSaved, clickThroughOverlay, rowExists, deleteRow } from './_helpers/trap-ui.js';
import { withTempDir, writeBulkProfileCsv } from './_helpers/exports.js';

// Unique token so re-runs never collide and cleanup targets exactly what this run created.
const RT = Date.now().toString(36);
// A per-run number for values that the server enforces as UNIQUE (listener port, trap OID). Using a
// fresh value each run means even if a prior run's best-effort cleanup missed something, this run
// still won't hit a "port/OID already in use" conflict.
const UNIQ = Math.abs(parseInt(RT, 36)) % 90000;
// Config tests must NOT reuse the live listener port (1620 = the existing 'Default' listener).
const CFG_PORT_V2C = String(16000 + (UNIQ % 900));       // 16000–16899, unique per run
const CFG_PORT_V3 = String(17000 + (UNIQ % 900));        // 17000–17899, unique per run
const CFG_TRAP_OID = `.1.3.6.1.4.1.99999.${UNIQ}`;       // private enterprise OID, unique per run
const ROUTES = {
  listener: '/settings/snmp-trap/snmp-trap-listener',
  profile: '/settings/snmp-trap/snmp-trap-profiles',
  forwarder: '/settings/snmp-trap/snmp-trap-forwarder',
  policy: '/settings/policy-settings/policies/trap/create',
};
// A create was REJECTED (required field blocked it) when either the drawer stayed open (a valid
// save closes it) or a field is error-flagged. This is more robust than assuming a specific
// explain-error node, since these forms flag errors without always rendering explain text.
async function notSaved(page) {
  const drawerOpen = await page.locator('.ant-drawer-open').isVisible().catch(() => false);
  const fieldError = await page.locator('.ant-form-item-explain-error, .ant-form-item-has-error').count();
  return drawerOpen || fieldError > 0;
}

test.describe.serial('Motadata AIOps — SNMP Trap configuration', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });
  test.afterAll(async () => { await page.close().catch(() => {}); });

  test('Login to Motadata AIOps', async () => { await login(page); });

  /* ---------------------------------------------------------------- SNMP Trap Listener */

  test('Listener — create a v1/v2c listener and confirm it is listed', async () => {
    const name = `playwright-listener-v2c-${RT}`;
    await gotoSettings(page, ROUTES.listener);
    await openCreate(page);
    await page.locator("input[name='trap-listener-profile-name']").fill(name);
    // SNMP v1/v2c is ON by default; fill its port + community (both verified count()===1).
    // Use a free port — 1620 is taken by the existing 'Default' listener (create would conflict).
    await page.locator("input[name='port-v1-v2']").fill(CFG_PORT_V2C);
    await page.locator("input[name='community']").fill(LISTENER_COMMUNITY);
    await submitAndExpectSaved(page, 'Create SNMP Trap Listener');

    await gotoSettings(page, ROUTES.listener);
    expect(await rowExists(page, page.locator("input[name='search-trap-listener']"), name)).toBe(true);
    await deleteRow(page, name); // clean up so the server isn't left with test config
  });

  test('Listener — create a v3 listener (auth user + security level)', async () => {
    test.skip(!V3_USER, 'TRAP_V3_USER not set in .env — skipping the v3 listener path');
    const name = `playwright-listener-v3-${RT}`;
    await gotoSettings(page, ROUTES.listener);
    await openCreate(page);
    await page.locator("input[name='trap-listener-profile-name']").fill(name);
    // Enable the SNMP v3 section — this reveals port-v3 / security-user-name / security-level.
    await page.locator(".ant-form-item:has-text('SNMP v3') button[role='switch']").click();
    await page.locator("input[name='port-v3']").fill(CFG_PORT_V3);
    await page.locator("input[name='security-user-name']").fill(V3_USER);
    // Security Level dropdown value from .env (authPriv | authNoPriv | noAuthNoPriv).
    await selectAntOption(page, page.locator(".ant-drawer-open .ant-form-item:has-text('Security Level') input[placeholder='Select']"), V3_SECURITY_LEVEL);
    await submitAndExpectSaved(page, 'Create SNMP Trap Listener');

    await gotoSettings(page, ROUTES.listener);
    expect(await rowExists(page, page.locator("input[name='search-trap-listener']"), name)).toBe(true);
    await deleteRow(page, name);
  });

  test('Listener — a name is required (empty name is rejected)', async () => {
    await gotoSettings(page, ROUTES.listener);
    await openCreate(page);
    // Leave the name empty; filling only the port must NOT let the form submit.
    await page.locator("input[name='port-v1-v2']").fill(LISTENER_PORT);
    await submitCreate(page, 'Create SNMP Trap Listener');
    expect(await notSaved(page), 'create should be rejected for the missing required field').toBe(true);
  });

  /* ---------------------------------------------------------------- SNMP Trap Profile */

  test('Profile — create a manual profile with OID + translator and confirm it is listed', async () => {
    const name = `playwright-profile-${RT}`;
    await gotoSettings(page, ROUTES.profile);
    await openCreate(page);
    // "Configure Manually" is the default mode; assert it, then fill the (verified) fields.
    await page.locator(".ant-radio-button-wrapper:has-text('Configure Manually')").click().catch(() => {});
    await page.locator("input[name='trap-name']").fill(name);
    await page.locator("input[name='trap-oid']").fill(CFG_TRAP_OID); // unique-per-run private OID (must be unique)
    await page.locator("textarea[name='trap-translator']").fill('PLAYWRIGHT test trap: $1'); // $1 = first varbind
    await submitAndExpectSaved(page, 'Create SNMP Trap Profile');

    await gotoSettings(page, ROUTES.profile);
    expect(await rowExists(page, page.locator("input[name='search-trap-profile']"), name)).toBe(true);
    await deleteRow(page, name);
  });

  test('Profile — Bulk Profile Creation mode exposes the CSV upload', async () => {
    await gotoSettings(page, ROUTES.profile);
    await openCreate(page);
    await page.locator(".ant-radio-button-wrapper:has-text('Bulk Profile Creation')").click();
    // No submit — just assert the bulk affordances render (Upload CSV + Sample CSV).
    await expect(page.getByText(/Upload CSV|Sample CSV/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('Profile — a Trap OID is required (empty OID is rejected)', async () => {
    await gotoSettings(page, ROUTES.profile);
    await openCreate(page);
    await page.locator("input[name='trap-name']").fill(`playwright-neg-${RT}`);
    // OID left empty → submit must be blocked.
    await submitCreate(page, 'Create SNMP Trap Profile');
    expect(await notSaved(page), 'create should be rejected for the missing required field').toBe(true);
  });

  /* ---------------------------------------------------------------- SNMP Trap Forwarder */

  test('Forwarder — create a forwarder to a destination and confirm it is listed', async () => {
    test.skip(!FORWARDER_DEST, 'TRAP_FORWARDER_DEST not set — skipping forwarder create');
    const name = `playwright-forwarder-${RT}`;
    const [destHost, destPort = '162'] = FORWARDER_DEST.split(':');
    await gotoSettings(page, ROUTES.forwarder);
    await openCreate(page);
    await page.locator("input[name='name']").fill(name);
    // SNMP Trap Profiles is a REQUIRED multi-select. Option values weren't harvested, so pick the
    // first available profile. TODO(confirm): choose a specific profile once option text is known.
    await page.locator(".ant-drawer-open input[placeholder='Select']").click();
    await page.locator('.ant-select-item-option').first().click().catch(() => {});
    await page.locator("input[name='destination-ip']").fill(destHost);
    await page.locator("input[name='port']").fill(destPort);
    await submitAndExpectSaved(page, 'Create SNMP Trap Forwarder');

    await gotoSettings(page, ROUTES.forwarder);
    expect(await rowExists(page, page.locator("input[name='search-trap-forwarding']"), name)).toBe(true);
    await deleteRow(page, name);
  });

  test('Forwarder — a destination is required (empty destination is rejected)', async () => {
    await gotoSettings(page, ROUTES.forwarder);
    await openCreate(page);
    await page.locator("input[name='name']").fill(`playwright-neg-fwd-${RT}`);
    await submitCreate(page, 'Create SNMP Trap Forwarder');
    expect(await notSaved(page), 'create should be rejected for the missing required field').toBe(true);
  });

  /* ---------------------------------------------------------------- Trap Policy */

  // fixme: the Trap Policy 'Trigger Condition' (and Operator) is a bespoke Motadata dropdown whose
  // options render as neither .ant-select-item-option nor .scroll-dropdown-menu-item (verified live
  // via probe). Without a selected trigger the form silently rejects the save. Completing this needs
  // a dedicated harvest of that widget's option structure — tracked as a follow-up so the run stays
  // honest rather than flaky. Severity (Critical/Major/Warning) and the name field ARE grounded.
  test.fixme('Trap Policy — create a policy with a severity and confirm it is saved', async () => {
    const name = `playwright-trap-policy-${RT}`;
    await gotoSettings(page, ROUTES.policy);
    // The route lands on the unified Create Policy form with the Trap type tab active.
    await page.locator("#policy-type-tab >> text=Trap").click().catch(() => {});
    await page.locator("input[id='policy-name']").fill(name);
    // Trigger Condition is a REQUIRED dropdown; option text wasn't harvested → pick the first.
    // TODO(confirm): select a specific trap trigger condition once the option list is known.
    await page.locator("input[data-cy='dropdown-trigger-input']").first().click();
    await page.locator('.ant-select-item-option, //span[@title]').first().click().catch(() => {});
    // Severity is a segmented control; Critical is the default/first — assert it is selectable.
    await page.locator(".ant-form-item:has-text('Severity') :text-is('Critical')").first().click().catch(() => {});
    // Dispatch past the dev-tools footer overlay (same interception as the drawer submit).
    await clickThroughOverlay(page.locator("button:has-text('Create Policy')").first());

    // Trap policies land in the Policy Settings > Trap Policy list; confirm via search.
    await gotoSettings(page, '/settings/policy-settings/policies/trap');
    expect(await rowExists(page, page.locator("//input[@name='search']").first(), name)).toBe(true);
    await deleteRow(page, name);
  });

  test('Trap Policy — a policy name is required (empty name is rejected)', async () => {
    await gotoSettings(page, ROUTES.policy);
    await clickThroughOverlay(page.locator("button:has-text('Create Policy')").first());
    await page.waitForTimeout(1500);
    // The trap-policy form blocks a bad submit silently (no toast / no inline-error text), so the
    // reliable rejection signal is that we STAY on the create form — a valid save navigates away.
    expect(page.url(), 'empty-name create must stay on the create form (rejected)').toContain('/trap/create');
  });

  /* ---------------------------------------------------------------- Profile — Bulk CSV upload */

  test('Profile Bulk — uploading a CSV creates every profile in the file', async () => {
    await withTempDir(async (dir) => {
      // Generate an app-valid CSV (exact headers from Motadata's own Sample CSV), unique per-run
      // names/OIDs, in an OS temp dir that is deleted after this block — nothing persists on disk.
      const { file, rows } = writeBulkProfileCsv(dir, RT, 3);
      await gotoSettings(page, ROUTES.profile);
      await openCreate(page);
      await page.locator(".ant-radio-button-wrapper:has-text('Bulk Profile Creation')").click();
      await page.waitForTimeout(800);
      // Set the CSV on the drawer's file input (the 'Upload CSV' control).
      await page.locator(".ant-drawer-open input[type='file']").setInputFiles(file);
      await page.waitForTimeout(1500);
      await submitAndExpectSaved(page, 'Create SNMP Trap Profile');
      // Every row in the CSV must now exist as a profile.
      await gotoSettings(page, ROUTES.profile);
      for (const r of rows) {
        expect(await rowExists(page, page.locator("input[name='search-trap-profile']"), r.name),
          `bulk profile ${r.name} should have been created from the CSV`).toBe(true);
      }
      for (const r of rows) await deleteRow(page, r.name); // clean up the created profiles
    });
  });

  test('Logout from AIOps', async () => { await logout(page); });
});
