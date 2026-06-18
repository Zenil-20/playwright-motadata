/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * This software and associated documentation are the confidential and
 * proprietary information of Motadata.
 *
 * Unauthorized use, reproduction, disclosure, or distribution of this
 * material is strictly prohibited.
 *
 * You shall use this software only in accordance with the terms of the
 * license agreement entered into with Motadata.
 *
 * Author  : Zenil Kapadia
 * Created : 9 June 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { syncLoadGeneratorConfig } from './loadGeneratorSync.js';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// ---------------------------------------------------------------------------
// Where the captured RUM "Steps to Register Application" configs are stored.
// One JSON per framework + a combined file — reused by later automation.
// ---------------------------------------------------------------------------
const CONFIG_DIR = path.resolve('tests/Settings/14-RealUserMonitoring/rum-configs');

// Defaults common to every app (Nginx is the default deployment).
const DEPLOYMENT = 'Nginx';
const VERSION = '1.0.0';
const ENVIRONMENT = 'dev';
const DOMAIN = 'http://localhost:6920'; // RUM test site the load generator serves
const PRIVACY_OPTION = 'All text available by default'; // => defaultPrivacyLevel 'allow'

// The five RUM services to register. `title` is the exact framework label on the
// left-rail tile picker (Application Type); `slug` is the artifact filename.
const RUM_APPS = [
  { title: 'Vue',        slug: 'vue',     name: 'Playwright Vue Application' },
  { title: 'React',      slug: 'react',   name: 'Playwright React Application' },
  { title: 'JavaScript', slug: 'js',      name: 'Playwright JS Application' },
  { title: 'Angular',    slug: 'angular', name: 'Playwright Angular Application' },
  { title: 'Next.JS',    slug: 'nextjs',  name: 'Playwright Nextjs Application' },
];

// Parse the main.js `motadataRum.init({...})` snippet into structured fields.
function parseInitSnippet(snippet) {
  const pick = (re) => (snippet.match(re) || [])[1] ?? null;
  return {
    applicationId: pick(/applicationId:\s*'([^']*)'/),
    clientToken: pick(/clientToken:\s*'([^']*)'/),
    site: pick(/site:\s*'([^']*)'/),
    service: pick(/service:\s*'([^']*)'/),
    env: pick(/env:\s*'([^']*)'/),
    version: pick(/version:\s*'([^']*)'/),
    sessionSampleRate: Number(pick(/sessionSampleRate:\s*(\d+)/)),
    defaultPrivacyLevel: pick(/defaultPrivacyLevel:\s*'([^']*)'/),
  };
}

test.describe.serial('Motadata AIOps — Register RUM Application for all 5 services (Nginx)', () => {
  let page;
  const captured = []; // accumulates every app's saved config for the combined file
  let allAppsExist = false; // set by the pre-check; when true, registration/save/sync are skipped

  // The grid shows each app as "<name>@<version>:<environment>".
  const gridName = (app) => `${app.name}@${VERSION}:${ENVIRONMENT}`;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Navigate to Real User Monitoring → Application', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('real user monitoring');
    await page.getByRole('link', { name: 'Application' }).click();
    await expect(page.getByRole('button', { name: 'Create Application' })).toBeVisible();
  });

  // Pre-check: if every one of the 5 apps is already registered, log it and let
  // the run fall straight through to logout (registration/save/sync are skipped).
  test('Skip registration if all 5 RUM applications already exist', async () => {
    // The grid lists every app on a single page (≤50 rows), so check the rows
    // directly — no search needed. The row's accessible name contains the full
    // "<name>@<version>:<env>"; the substring match is unique because
    // "…Application@…" is never contained in a shorter "…App@…" row.
    const results = [];
    for (const app of RUM_APPS) {
      const name = gridName(app);
      const exists = (await page.getByRole('row', { name }).count()) > 0;
      results.push({ name, exists });
    }

    allAppsExist = results.every((r) => r.exists);
    const lines = results.map((r) => `  ${r.exists ? '✓' : '✗'} ${r.name}`).join('\n');
    console.log(
      allAppsExist
        ? `[RUM] All 5 applications already registered — skipping registration:\n${lines}`
        : `[RUM] Not all applications exist — proceeding with registration:\n${lines}`,
    );
  });

  // One test per framework keeps the HTML report readable.
  for (const app of RUM_APPS) {
    test(`Register ${app.title} application and store config`, async () => {
      test.skip(allAppsExist, 'All 5 RUM applications already exist');
      test.setTimeout(180000);

      const filePath = path.join(CONFIG_DIR, `${app.slug}.json`);

      // Open the Register Application drawer. The redesigned UI presents a left-rail
      // framework tile picker — wait for it to confirm the drawer is ready (the
      // heading text itself changed, so don't assert on it).
      await page.getByRole('button', { name: 'Create Application' }).click();
      const drawer = page.locator('.ant-drawer-open');
      await expect(drawer.locator('.framework-item').first()).toBeVisible();

      // Application Type is now a left-rail tile (JavaScript / React / Vue / Angular /
      // Next.JS), not a searchable dropdown. Select it first.
      await drawer.locator('.framework-item').filter({ hasText: app.title }).click();

      // Application Name
      await page.locator('input#rum-application-name-id').fill(app.name);

      // Deployment = Nginx is the default selected radio — no action needed.
      await expect(drawer.getByText('Nginx', { exact: true })).toBeVisible();

      // Domain / IP — the local RUM test site served by the load generator.
      await page.locator('input#domain-name-id').fill(DOMAIN);

      // Version is REQUIRED — the visible "1.0.0" is only a placeholder.
      await page.locator('input#version-id').fill(VERSION);

      // Environment — still a free-text input (the "Select" is only a placeholder).
      await page.locator('input#environment-id').fill(ENVIRONMENT);

      // Session Sample Rate defaults to 60 — assert rather than re-type.
      await expect(page.locator('input#session-sample-rate-id')).toHaveValue('60');

      // Privacy — now the only data-cy="dropdown-trigger-input" in the form.
      await page.locator('[data-cy="dropdown-trigger-input"]').last().click();
      await page.locator(`.virtual-scrollable-dropdown-menu span[title="${PRIVACY_OPTION}"]`).last().click();

      // Submit. On the DEV build a "cp-empty" component-picker tool overlay can sit
      // over the drawer footer and intercept the pointer; fall back to a DOM click
      // if the normal (actionability-checked) click is blocked by it.
      const submitBtn = page.locator('#rum-application-submit-btn');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click({ timeout: 10000 }).catch(async () => {
        await submitBtn.evaluate((el) => el.click());
      });

      // On success the "Steps to Register Application" drawer carries the config.
      // If the name is a blocked duplicate, that drawer never opens — fall back to
      // the previously-captured config on disk so the suite stays re-runnable.
      const stepsTitle = page.getByText('Steps to Register Application');
      const created = await stepsTitle.waitFor({ state: 'visible', timeout: 25000 }).then(() => true).catch(() => false);

      let record;
      if (created) {
        // Scope to the LAST open drawer — a previous drawer mid-close can briefly
        // still carry the .ant-drawer-open class and double the <pre> matches.
        const stepsDrawer = page.locator('.ant-drawer-open').last();
        const pre = stepsDrawer.locator('pre');
        await expect(pre.nth(1)).toContainText('motadataRum.init', { timeout: 30000 });

        const nginxConfig = (await pre.nth(0).innerText()).trim();
        const mainJsSnippet = (await pre.nth(1).innerText()).trim();

        record = {
          applicationType: app.title,
          applicationName: app.name,
          deployment: DEPLOYMENT,
          domain: DOMAIN,
          version: VERSION,
          environment: ENVIRONMENT,
          privacyOption: PRIVACY_OPTION,
          ...parseInitSnippet(mainJsSnippet),
          nginxConfig,
          mainJsSnippet,
        };
        fs.writeFileSync(filePath, JSON.stringify(record, null, 2));

        // Close the steps drawer and wait for it to detach before the next app.
        await stepsDrawer.locator('.ant-drawer-close').first().click().catch(async () => {
          await page.keyboard.press('Escape');
        });
        await expect(stepsTitle).toBeHidden();
      } else {
        // Duplicate / validation block — reuse the cached config (must exist).
        if (!fs.existsSync(filePath)) {
          throw new Error(`No Steps drawer for "${app.name}" and no cached config at ${filePath}`);
        }
        record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        // Dismiss the still-open Register drawer.
        await page.locator('.ant-drawer-open .ant-drawer-close').first().click().catch(async () => {
          await page.keyboard.press('Escape');
        });
      }

      captured.push(record);
      await expect(page.getByRole('button', { name: 'Create Application' })).toBeVisible();
    });
  }

  test('Save combined RUM config file', async () => {
    test.skip(allAppsExist, 'All 5 RUM applications already exist');
    expect(captured.length).toBe(RUM_APPS.length);
    fs.writeFileSync(
      path.join(CONFIG_DIR, 'rum-applications.json'),
      JSON.stringify(captured, null, 2),
    );
  });

  // Push the freshly captured values into the .234 load generator's config.json
  // (collector IP derived from .env) and restart rum-ui / rum-load. Pure Node —
  // makes the whole pipeline a single `npx playwright test`.
  test('Sync config to load generator (.234) and restart rum-ui/rum-load', async () => {
    test.skip(allAppsExist, 'All 5 RUM applications already exist');
    test.setTimeout(120000);
    const res = await syncLoadGeneratorConfig();
    expect(res.services).toEqual({ 'rum-ui': 'active', 'rum-load': 'active' });
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
