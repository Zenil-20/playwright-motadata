/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Shared authentication helpers for the Motadata AIOps Playwright suite.
 *
 * Centralises the login + logout flow that every spec used to inline. Use from a
 * spec's "Login"/"Logout" tests:
 *
 *     import { login, logout } from '<rel>/fixtures/auth.js';
 *     test('Login to Motadata AIOps',  async () => { await login(page); });
 *     test('Logout from AIOps',        async () => { await logout(page); });
 *
 * Locators are RESILIENT across the old and the redesigned login page (both expose
 * the same data-testid / id hooks) and deliberately target #login-btn-submit so we
 * never click the Single Sign-On button (#login-btn-sso).
 */

import { expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

/**
 * Log in to Motadata AIOps. Credentials default to the .env values; pass explicit
 * ones for multi-user flows (e.g. UserLogin).
 */
export async function login(
  page,
  username = process.env.Motadata_Username,
  password = process.env.Motadata_Password,
  { waitForAvatar = true } = {},
) {
  await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
  // Scope to the <input>: the form-item wrapper div also carries the same
  // data-testid, so an unscoped selector matches 2 elements (strict-mode violation).
  await page.locator("input[data-testid='login-input-username']").fill(username);
  await page.locator("input[data-testid='login-input-password']").fill(password);
  // Sign in — NOT #login-btn-sso (Single Sign-On).
  await page.locator('#login-btn-submit').click();
  // Smart wait — the avatar renders once the app shell is ready (never networkidle).
  // Pass { waitForAvatar: false } for flows that don't land on the dashboard, e.g. a
  // first-time login that's redirected to a forced "change password" page.
  if (waitForAvatar) await expect(page.locator('#user-avatar')).toBeVisible({ timeout: 60000 });
}

/**
 * Log out and clear the session so the next run starts clean. Defensive: if we're already
 * logged out (e.g. a prior/failed test left the page on the Sign-in screen) the avatar never
 * appears, so we bail on a bounded 10s wait instead of auto-waiting the full default timeout
 * — otherwise a bare avatar click hangs and blows the afterAll/test hook budget. Cookies and
 * permissions are cleared either way so the next run still starts clean.
 */
export async function logout(page) {
  const avatar = page.locator('#user-avatar');
  const loggedIn = await avatar
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (loggedIn) {
    await avatar.click({ timeout: 10000 }).catch(() => {});
    await page.getByText('Logout').first().click({ timeout: 10000 }).catch(() => {});
  }
  await page.context().clearCookies().catch(() => {});
  await page.context().clearPermissions().catch(() => {});
}
