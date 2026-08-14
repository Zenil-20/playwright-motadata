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
 * Created : 30 March 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const ADMIN_USERNAME = process.env.Motadata_Username;
const ADMIN_PASSWORD = process.env.Motadata_Password;
const LOCAL_AUTH_OPTION = 'Local Authentication';
const TEST_PASSWORD = 'Motadata@123';
const UPDATED_TEST_PASSWORD = 'Motadata@1234';

function buildUserData() {
  const stamp = Date.now().toString().slice(-8);
  const usernameStamp = new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, '')
  .slice(0, 14);  

  return {
    firstName: 'Zenil',
    lastName: 'Kapadia',
    email: `zenil.qa.${stamp}@example.com`,
    mobile: `9${stamp.padStart(9, '0')}`.slice(0, 10),
    username: `zenil.local.${usernameStamp}`,
    password: TEST_PASSWORD,
    newPassword: UPDATED_TEST_PASSWORD,
  };
}

// login() and logout() now come from the shared ../../fixtures/auth.js helper.

async function openUserSettings(page) {
  await page.locator("//a[@href='/settings/']").click();
  await page.waitForLoadState('networkidle');

  const settingsSearch = page.locator("//input[@placeholder='Search']").first();
  await expect(settingsSearch).toBeVisible({ timeout: 30000 });
  await settingsSearch.fill('User');

  const userLink = page.locator("a[href='/settings/users-settings/']").first();
  await expect(userLink).toBeVisible({ timeout: 30000 });
  await userLink.evaluate((node) => node.click());

  try {
    await expect(page).toHaveURL(/\/settings\/users-settings\/?$/, { timeout: 15000 });
  } catch {
    const usersSettingsUrl = new URL('/settings/users-settings/', process.env.Motadata_Aiops).toString();
    await page.goto(usersSettingsUrl, { timeout: 30000 });
    await expect(page).toHaveURL(/\/settings\/users-settings\/?$/);
  }

  await page.waitForLoadState('networkidle');
}

async function openCreateUserDrawer(page) {
  const createUserButton = page.getByRole('button', { name: 'Create User' }).first();
  await expect(createUserButton).toBeVisible({ timeout: 30000 });
  await createUserButton.click();

  const drawer = page.locator('.ant-drawer-open');
  await expect(drawer).toBeVisible({ timeout: 30000 });
  return drawer;
}

async function waitForDrawerAnimation(page) {
  await page.waitForTimeout(300);
}

async function selectDropdownOption(page, drawer, index, optionText) {
  const dropdownInput = drawer.locator('input[placeholder="Select"]').nth(index);
  await expect(dropdownInput).toBeVisible({ timeout: 10000 });
  await dropdownInput.click({ force: true });
  await waitForDrawerAnimation(page);

  const option = page.getByText(optionText, { exact: true }).last();
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click({ force: true });
}

async function selectGroup(page, drawer) {
  const groupDropdown = drawer.locator('input[placeholder="Select"]').nth(1);
  await expect(groupDropdown).toBeVisible({ timeout: 10000 });
  await groupDropdown.click({ force: true });
  await waitForDrawerAnimation(page);

  const selectAllCheckbox = page.getByRole('checkbox', { name: 'Select All' }).last();
  await expect(selectAllCheckbox).toBeVisible({ timeout: 10000 });

  if (!(await selectAllCheckbox.isChecked())) {
    await selectAllCheckbox.check({ force: true });
  }

  await page.keyboard.press('Escape').catch(() => {});
  await waitForDrawerAnimation(page);
}

async function selectRole(page, drawer) {
  const roleDropdown = drawer.locator('input[placeholder="Select"]').nth(2);
  await expect(roleDropdown).toBeVisible({ timeout: 10000 });
  await roleDropdown.click({ force: true });
  await waitForDrawerAnimation(page);

  for (const roleName of ['read-only', 'admin']) {
    const roleOption = page.getByText(roleName, { exact: true }).last();
    if (await roleOption.isVisible().catch(() => false)) {
      await roleOption.click({ force: true });
      return;
    }
  }

  const visibleRoleOption = page.locator('text=/^(read-only|admin)$/').last();
  await expect(visibleRoleOption).toBeVisible({ timeout: 10000 });
  await visibleRoleOption.click({ force: true });
}
//MOTADATA-8393 Introduce Per-User Session Timeout Support
async function selectSessionExpiry(page, drawer) {
  const options = ['10 Minutes', '20 Minutes', '30 Minutes', '45 Minutes', '60 Minutes'];
  const choice = options[Math.floor(Math.random() * options.length)];

  const sessionExpiryDropdown = drawer.locator(
    "xpath=.//*[normalize-space(text())='Session Expiry']/ancestor::div[.//input[@placeholder='Select']][1]//input[@placeholder='Select']"
  ).first();
  await expect(sessionExpiryDropdown).toBeVisible({ timeout: 10000 });
  await sessionExpiryDropdown.click({ force: true });
  await waitForDrawerAnimation(page);

  const option = page.getByText(choice, { exact: true }).last();
  await expect(option).toBeVisible({ timeout: 10000 });
  await option.click({ force: true });
  await waitForDrawerAnimation(page);
}

async function ensureUserStatusEnabled(drawer) {
  const statusSwitch = drawer.getByRole('switch').last();
  await expect(statusSwitch).toBeVisible({ timeout: 10000 });

  if ((await statusSwitch.getAttribute('aria-checked')) !== 'true') {
    await statusSwitch.click();
  }
}

async function enableFirstLoginPasswordChange(drawer) {
  const passwordChangeCheckbox = drawer.getByRole('checkbox', { name: 'Require password change at first login' });
  await expect(passwordChangeCheckbox).toBeVisible({ timeout: 10000 });

  if (!(await passwordChangeCheckbox.isChecked())) {
    await passwordChangeCheckbox.check();
  }
}

async function fillLocalAuthenticationUserForm(page, drawer, user) {
  await drawer.locator('input[name="first-name"]').fill(user.firstName);
  await drawer.locator('input[name="last-name"]').fill(user.lastName);
  await drawer.locator('input[name="email-address"]').fill(user.email);
  await drawer.locator('input[name="mobile-number"]').fill(user.mobile);
  await drawer.locator('input[name="user-name"]').fill(user.username);

  await selectDropdownOption(page, drawer, 0, LOCAL_AUTH_OPTION);

  await drawer.locator('input[name="password"]').fill(user.password);
  await drawer.locator('input[name="confirm-password"]').fill(user.password);

  await selectGroup(page, drawer);
  await selectRole(page, drawer);
  await selectSessionExpiry(page, drawer);
  await enableFirstLoginPasswordChange(drawer);
  await ensureUserStatusEnabled(drawer);
}

async function submitUserCreation(page) {
  const submitButton = page.getByRole('button', { name: 'Create User' }).last();
  await expect(submitButton).toBeVisible({ timeout: 10000 });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
}

async function assertUserCreated(page, username, email) {
  const userSearch = page.locator('input[name="search"]');
  await expect(userSearch).toBeVisible({ timeout: 30000 });
  await userSearch.fill(username);

  const userRow = page.locator('table tr').filter({ hasText: username });
  await expect(userRow).toBeVisible({ timeout: 30000 });
  await expect(userRow).toContainText('System');
  await expect(userRow).toContainText(email);
}

async function assertUserLoginSucceeded(page, username) {
  const avatar = page.locator("#user-avatar");
  await expect(avatar).toBeVisible({ timeout: 30000 });

  const usernameText = page.getByText(username, { exact: true });
  if (await usernameText.isVisible().catch(() => false)) {
    await expect(usernameText).toBeVisible();
  }
}

async function changePasswordOnFirstLogin(page, newPassword) {
  const newPasswordInput = page.locator("//input[@placeholder='New Password']");
  const confirmNewPasswordInput = page.locator("//input[@placeholder='Confirm New Password']");
  const submitButton = page.locator("//button[@type='submit']");
  const successMessage = page.getByText('Password changed successfully. Please login with your new password.', { exact: true });

  await expect(newPasswordInput).toBeVisible({ timeout: 30000 });
  await expect(confirmNewPasswordInput).toBeVisible({ timeout: 30000 });

  await newPasswordInput.fill(newPassword);
  await confirmNewPasswordInput.fill(newPassword);
  await submitButton.click();

  await expect(successMessage).toBeVisible({ timeout: 30000 });
  await expect(page.locator("input[data-testid='login-input-username']")).toBeVisible({ timeout: 30000 });
}

test.describe.serial('Motadata AIOps local authentication user creation and login', () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    /*
     * 60s, not 500s. The per-test budget here is 300s (test.setTimeout below) and the suite default is
     * 120s, so a 500s action timeout can never be reached — a stalled locator just runs out the test
     * clock and reports "Test timeout exceeded" without naming what hung. A default below the test
     * budget makes Playwright name the offending locator instead.
     */
    page.setDefaultTimeout(60000);
  });

  test.afterAll(async () => {
    /*
     * Close the CONTEXT, not just the page.
     *
     * The previous version closed only the page, leaving the browser context open for the rest of the
     * run. With `trace: 'on'` that context still owns an active trace recording, and its artifacts under
     * test-results/.playwright-artifacts-* are only finalised on context close — which is the shape of
     * the ENOENT failures seen here ("...recording3.network" / "....zip: no such file or directory").
     * Closing the context releases the page and flushes the trace deterministically.
     */
    if (context) await context.close().catch(() => {});
  });

  test('Create a local-auth user from Settings and verify login with the new user', async () => {
    test.setTimeout(300000);
    const user = buildUserData();

    await login(page, ADMIN_USERNAME, ADMIN_PASSWORD);
    await openUserSettings(page);
    const drawer = await openCreateUserDrawer(page);
    await fillLocalAuthenticationUserForm(page, drawer, user);
    await submitUserCreation(page);
    await assertUserCreated(page, user.username, user.email);

    await logout(page);

    // First login for a freshly-created local user is redirected to a forced
    // "change password" page, so there is no avatar to wait for.
    await login(page, user.username, user.password, { waitForAvatar: false });
    await changePasswordOnFirstLogin(page, user.newPassword);

    await login(page, user.username, user.newPassword);
    await assertUserLoginSucceeded(page, user.username);
    await logout(page);

    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
