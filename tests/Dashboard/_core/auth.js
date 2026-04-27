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
  process.env.MOTADATA_USERNAME;

const DASHBOARD_PASSWORD =
  process.env.Motadata_Password ||
  process.env.MOTADATA_PASSWORD;

export function getDashboardBaseUrl() {
  if (!DASHBOARD_URL) {
    throw new Error(
      'Dashboard base URL is missing. Set Motadata_Aiops or SERVER_URL in .env.'
    );
  }

  return DASHBOARD_URL.replace(/\/+$/, '');
}

export async function loginToDashboard(page) {
  if (!DASHBOARD_USERNAME || !DASHBOARD_PASSWORD) {
    throw new Error(
      'Dashboard credentials are missing. Set Motadata_Username and Motadata_Password in .env.'
    );
  }

  await page.goto(getDashboardBaseUrl(), { waitUntil: 'domcontentloaded' });

  const usernameInput = page.locator("//input[@placeholder='Username']");
  const passwordInput = page.locator("//input[@placeholder='Password']");
  const submitButton = page.locator("//button[@type='submit']");

  await expect(usernameInput).toBeVisible({ timeout: 60000 });
  await usernameInput.fill(DASHBOARD_USERNAME);
  await passwordInput.fill(DASHBOARD_PASSWORD);
  await submitButton.click();

  await page.waitForLoadState('networkidle');

  const avatar = page.locator("//img[@alt='Avatar']").first();
  await expect(avatar).toBeVisible({ timeout: 90000 });
}

export async function logoutFromDashboard(page) {
  const avatar = page.locator("//img[@alt='Avatar']").first();

  const avatarVisible = await avatar
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  if (!avatarVisible) {
    return;
  }

  await avatar.click({ timeout: 10000 }).catch(() => {});

  const logoutItem = page.getByText('Logout', { exact: true }).first();
  const logoutVisible = await logoutItem
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  if (!logoutVisible) {
    return;
  }

  await logoutItem.click({ timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  await page
    .locator("//input[@placeholder='Username']")
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
}
