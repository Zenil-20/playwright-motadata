/*
 * One-time authentication for the report-regression project.
 *
 * report-validation.spec.js runs one test PER report in `mode: 'parallel'`, so
 * every test gets a fresh browser context. Logging in inside each of the 114
 * tests would hammer the server, so instead this `setup` project logs in once
 * via the suite's shared login() helper and saves the session to
 * tests/.auth/user.json. The `reports` project loads that storageState, so all
 * workers start already authenticated (see playwright.config.js).
 */
import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { login } from '../../fixtures/auth.js';

const AUTH_FILE = path.resolve(process.cwd(), 'tests', '.auth', 'user.json');

setup('authenticate for reports', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await login(page);
  await page.context().storageState({ path: AUTH_FILE });
});
