/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Data-driven Discovery suite — consolidates the ~30 per-device specs in this folder
 * into ONE script driven by tests/data/discovery-devices.csv (observeops-qa's
 * "max coverage, min automation" pattern applied here).
 *
 *   - Provisioning: each device row runs the full discover→provision→verify flow.
 *   - Form structure: tests/data/discovery-form-structure.csv asserts each control
 *     of the discovery form exists, covering the TFS Linux/K8s form-field cases.
 *
 * A row whose required env vars are missing SKIPS with a reason (never a false fail).
 */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { parseCsv } from '../../framework/core/testcase-store/csv.js';
import * as flow from '../../framework/playwright/flow.js';

dotenv.config({ path: '.env', quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const devices = parseCsv(fs.readFileSync(path.join(DATA_DIR, 'discovery-devices.csv'), 'utf8'));
const formControls = parseCsv(fs.readFileSync(path.join(DATA_DIR, 'discovery-form-structure.csv'), 'utf8'));

const LIVE = !!process.env.Motadata_Aiops;

/** Env var names a row needs before it can run for real. */
function missingEnv(row) {
  const need = [row.ip_env];
  if (row.cred_type === 'userpass' || row.cred_type === 'ssh') need.push(row.user_env, row.pass_env);
  if (row.instance_env) need.push(row.instance_env);
  if (row.port_env) need.push(row.port_env);
  return need.filter((n) => n && !process.env[n]);
}

// --------------------------------------------------------------------------
// 1) Provisioning — one test per device row, shared login/page (serial).
// --------------------------------------------------------------------------
test.describe.serial('Discovery — provision devices (data-driven)', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    test.skip(!LIVE, 'Motadata_Aiops not set — provide .env to run against a live AIOps.');
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(120000);
    await flow.login(page);
  });

  test.afterAll(async () => { if (page) await page.close(); });

  for (const row of devices) {
    test(`Discover & provision: ${row.key} (${row.category} / ${row.subtype})`, async () => {
      const miss = missingEnv(row);
      test.skip(miss.length > 0, `missing env: ${miss.join(', ')}`);
      test.skip(row.run !== 'yes', `row marked run=${row.run}`);
      await flow.discoverDevice(page, row);
    });
  }
});

// --------------------------------------------------------------------------
// 2) Form-structure coverage — assert each control exists on the discovery form.
//    Opens the SQL Server form once (richest field set), then checks each row.
// --------------------------------------------------------------------------
test.describe.serial('Discovery — form structure coverage', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    test.skip(!LIVE, 'Motadata_Aiops not set — provide .env to run against a live AIOps.');
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(60000);
    await flow.login(page);
    await flow.openDiscoveryWizard(page);
    await flow.selectDeviceType(page, { category: 'Database', subtype: 'SQL Server' });
  });

  test.afterAll(async () => { if (page) await page.close(); });

  for (const ctrl of formControls) {
    test(`Form control present: ${ctrl.check} — ${ctrl.target}`, async () => {
      await expect(
        page.locator(ctrl.locator).first(),
        `${ctrl.target} should be ${ctrl.expected}`
      ).toBeVisible();
    });
  }
});
