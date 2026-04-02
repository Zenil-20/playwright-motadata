/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Shared authentication helpers for Dashboard automation.
 */

import { expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

const DASHBOARD_URL =
  process.env.Motadata_Aiops ||
  process.env.SERVER_URL ||
  process.env.Server_url ||
  process.env.server_url;

const DASHBOARD_USERNAME =
  process.env.Motadata_Username ||
  process.env.MOTADATA_USERNAME ||
  'admin';

const DASHBOARD_PASSWORD =
  process.env.Motadata_Password ||
  process.env.MOTADATA_PASSWORD ||
  'admin';

export function getDashboardBaseUrl() {
  if (!DASHBOARD_URL) {
    throw new Error(
      'Dashboard base URL is missing. Set Motadata_Aiops or SERVER_URL in .env.'
    );
  }

  return DASHBOARD_URL.replace(/\/+$/, '');
}

export async function loginToDashboard(page) {
  await page.goto(getDashboardBaseUrl(), { waitUntil: 'domcontentloaded' });

  const usernameInput = page.locator("//input[@placeholder='Username']");
  const passwordInput = page.locator("//input[@placeholder='Password']");
  const submitButton = page.locator("//button[@type='submit']");

  await expect(usernameInput).toBeVisible({ timeout: 60000 });
  await usernameInput.fill(DASHBOARD_USERNAME);
  await passwordInput.fill(DASHBOARD_PASSWORD);
  await submitButton.click();

  await page.waitForLoadState('networkidle');

  const avatar = page.locator("//img[@alt='Avatar']");
  await expect(avatar).toBeVisible({ timeout: 60000 });
}

export async function logoutFromDashboard(page) {
  const avatar = page.locator("//img[@alt='Avatar']");

  if (!(await avatar.isVisible().catch(() => false))) {
    return;
  }

  await avatar.click();
  await page.getByText('Logout', { exact: true }).click();
  await page.waitForLoadState('networkidle');
}
