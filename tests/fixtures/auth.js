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

// Guard: strip any trailing slash(es) from the base URL. If .env has
// "Motadata_Aiops=https://host/", then `${Motadata_Aiops}/settings/...` becomes
// "https://host//settings/..." which the app 404s on. Normalising here ONCE means
// every spec that imports this module gets a clean base URL via process.env — no
// per-spec edits, and it no longer matters whether .env was typed with a trailing /.
// (dotenv defaults to override:false, so a spec's later dotenv.config won't undo this.)
if (process.env.Motadata_Aiops) {
  process.env.Motadata_Aiops = process.env.Motadata_Aiops.replace(/\/+$/, '');
}

/** Normalised AIOps base URL (no trailing slash). Import this if you prefer an
 *  explicit constant over reading process.env directly. */
export const BASE_URL = process.env.Motadata_Aiops || '';

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
 * Ensure the inventory page (e.g. /inventory/Server/groups) is in the searchable LIST/table
 * view before searching. The page can load in the DASHBOARD view (donut + hexagon widgets),
 * which renders NO Search box — so a bare expect(Search).toBeVisible() hangs there for the
 * full default timeout.
 *
 * The view toggle is a SINGLE Ant circle-button whose title reflects the OTHER view:
 *   - in the dashboard/hexagon view (no search box) it reads title="Grid"  → click it to
 *     flip to the searchable table view;
 *   - in the table/list view (search box present) it reads title="Dashboard".
 * There is no title="List" button. List view ⇔ the Search box is present; if it isn't, we're
 * in the dashboard view and click button[title="Grid"] to switch over.
 *
 * We race the Search box against the Grid toggle so we don't wait the full SPA "Loading..."
 * budget, then only click when the search box is absent. Every wait is bounded so a wrong/
 * absent toggle fails fast instead of hanging 500s.
 */
export async function ensureListView(page) {
  const search = page.locator("//input[@placeholder='Search']");
  // Present only in the dashboard/hexagon view; clicking it flips to the table (search) view.
  const gridToggle = page.locator("button[title='Grid']");
  // Let the inventory SPA settle: whichever of (Search box | Grid toggle) renders first wins.
  await Promise.race([
    search.waitFor({ state: 'visible', timeout: 120000 }).catch(() => {}),
    gridToggle.waitFor({ state: 'visible', timeout: 120000 }).catch(() => {}),
  ]);
  if (await search.isVisible()) return; // already list view — leave it alone
  // Dashboard/hexagon view → flip to the table view, then wait for the Search box to render.
  await gridToggle.click({ timeout: 30000 });
  await expect(search).toBeVisible({ timeout: 120000 });
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
