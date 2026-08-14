// /*
//  * Copyright (c) 2026 Motadata. All Rights Reserved.
//  *
//  * This software and associated documentation are the confidential and
//  proprietary information of Motadata.
//  *
//  * Unauthorized use, reproduction, disclosure, or distribution of this
//  * material is strictly prohibited.
//  *
//  * You shall use this software only in accordance with the terms of the
//  * license agreement entered into with Motadata.
//  *
//  * Author  : Zenil Kapadia
//  * Created : 22 February 2026
//  */

// import { test, expect } from '@playwright/test';
// import dotenv from 'dotenv';

// dotenv.config({ path: '.env', quiet: true });

// test.describe.serial('Motadata AIOps Multi LDAP Server Sync for User Settings', async () => {
//   let page;

//   test.beforeAll(async ({ browser }) => {
//     // Create a single browser context and page shared across all tests
//     const context = await browser.newContext();
//     page = await context.newPage();
//     page.setDefaultTimeout(500000);
//   });

//   test.afterAll(async () => {
//     if (page) {
//       await page.close();
//     }
//   });

//   test('Login to Motadata AIOps', async () => {
//     await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
//      await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
//     await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
//     await page.locator("//button[@type='submit']").click();
//     await page.waitForLoadState('networkidle');
//   });

//   test('Navigate to LDAP Server Sync Settings', async () => {
//     await page.locator("//a[@href='/settings/']").click();
//     await page.locator("//input[@id='phone-number']").click();
//     await page.locator("//input[@placeholder='Search']").fill('LDAP Server Settings');
//     await page.getByRole('link', { name: 'LDAP Server Settings' }).click();
//     await page.locator('#create-user-btn').click();
//     //Primary ip
//     const primaryField = page.locator('.ant-form-item', {
//   hasText: 'Primary IP/Host'
// });

// await primaryField.locator("input[name='ip-host']")
//   .fill(process.env.LDAP_PRIMARY_IP);
//   });

//   //secondary ip
// //   const secondaryField = page.locator('.ant-form-item', {
// //   hasText: 'Secondary IP/Host'
// // });

// // await secondaryField.locator("input[name='ip-host']")
// //   .fill(process.env.LDAP_SECONDARY_IP);

// const domainInput = page.locator("input[name='fqdn']");

// await expect(domainInput).toBeVisible();
// await expect(domainInput).toBeEditable();
// await domainInput.fill(process.env.LDAP_DOMAIN);

// const usernameInput = page.locator("input[name='user-name']");

// await expect(usernameInput).toBeVisible();
// await expect(usernameInput).toBeEditable();
// await usernameInput.fill(process.env.LDAP_USERNAME);

// const passwordInput = page.locator("input[name='password']");

// await expect(passwordInput).toBeVisible();
// await expect(passwordInput).toBeEditable();
// await passwordInput.fill(process.env.LDAP_PASSWORD);

// const ldapAuthSwitch = page.locator('#btn-ldap-authentication');

// await expect(ldapAuthSwitch).toBeVisible();
// await expect(ldapAuthSwitch).toBeEnabled();

// const isEnabled =
//   (await ldapAuthSwitch.getAttribute('aria-checked')) === 'true';

// if (!isEnabled) {
//   await ldapAuthSwitch.click();
// }

// await page.locator("//input[@placeholder='ldap groups']").fill("motadata users");
// await page.locator("//input[@placeholder='ldap groups']").press('Enter');
// await page.locator("//button[@id='btn-test-credentials']").click();

// const msg = await page.locator('div[name="test-message"]').textContent();
// if (msg.includes('connection test successful')) {
//     console.log('LDAP connection test passed');
// } else {
//     throw new Error('LDAP connection test failed');
// }

// if (msg.includes('user test successful')) {
//     await page.locator("//button[@id='submit-btn']").click();
// }
// else {
//     await page.locator('button[aria-label="Close"]').click();   
// }

//   test('Logout from AIOps', async () => {
//     await page.locator("//img[@alt='Avatar']").click();
//     await page.getByText('Logout').click();
//     await page.context().clearCookies();
//     await page.context().clearPermissions();
//   });

// });
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
 * Created : 14 February 2026
 */

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
 * Created : 14 February 2026
 */



import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const ldapServers = [
  {
    name: 'LDAP Server 172.16.8.57',
    primaryIp: '172.16.8.57',
    domain: process.env.LDAP_DOMAIN,
    username: process.env.LDAP_USERNAME,
    password: process.env.LDAP_PASSWORD,
    toast: 'LDAP server: 172.16.8.57 synced successfully',
  },
  {
    name: 'LDAP Server 172.16.8.113',
    primaryIp: '172.16.8.113',
    domain: process.env.LDAP_DOMAIN_113,
    username: process.env.LDAP_USERNAME_113,
    password: process.env.LDAP_PASSWORD_113,
    toast: 'LDAP server: 172.16.8.113 synced successfully',
  },
];

/*
 * Kept SERIAL because both tests reconfigure LDAP on the same shared AIOps server, so they must not
 * interleave. But each test gets its OWN context (below) — serial ordering and session isolation are
 * separate concerns, and conflating them is what broke this spec.
 */
test.describe.serial('Motadata AIOps Multi LDAP Server Sync for User Settings', () => {
  let context;
  let page;

  /*
   * FRESH CONTEXT PER TEST — this is the fix for the 120s hang on the second LDAP server.
   *
   * Previously a single page was created in beforeAll and SHARED by both tests, with each test calling
   * login() at the start and logout() at the end. That only works while every test reaches its logout:
   * if the first test fails at any point before it (a credential test that never returns, a missing
   * row, an unverified toast), the session stays authenticated. The next test then calls login(), which
   * is NOT idempotent — it navigates to the base URL and waits to fill the username field, and on an
   * already-authenticated page the app renders the dashboard instead, so that field never appears. The
   * fill auto-waits until the 120s test timeout, and the teardown then reports the misleading secondary
   * error "Target page, context or browser has been closed".
   *
   * Isolating the context makes each test start from a guaranteed clean session, so login() always has
   * a login form to fill and a failure in one test can no longer cascade into the next.
   */
  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    /*
     * 60s, not 500s. The suite's per-test timeout is 120s (playwright.config.js), so a 500s default
     * could never be reached — every stalled locator surfaced as a bare "Test timeout exceeded" with no
     * indication of WHICH locator hung, which is exactly how the original failure presented. A default
     * below the test timeout makes Playwright name the offending locator instead. The genuinely slow
     * steps here (credential test, row lookup, toast) already carry their own explicit timeouts.
     */
    page.setDefaultTimeout(60000);
  });

  test.afterEach(async () => {
    if (context) await context.close();
  });

  ldapServers.forEach((server) => {
    test(`Login, LDAP Server Sync, and Logout for ${server.name}`, async () => {
      // --- LOGIN ---
      await login(page);

      // --- NAVIGATE TO LDAP SETTINGS ---
      await page.locator("//a[@href='/settings/']").click();
      await page.locator("//input[@id='phone-number']").click();
      await page.locator("//input[@placeholder='Search']").fill('LDAP Server Settings');
      await page.getByRole('link', { name: 'LDAP Server Settings' }).click();
      await page.locator('#create-user-btn').click();

      // --- FILL LDAP FORM ---
      await page.locator("//input[@placeholder='e.g. 192.168.1.1 or fd00::1 or prod.motadata.com']").first().fill(server.primaryIp);

      const domainInput = page.locator("input[name='fqdn']");
      await expect(domainInput).toBeVisible();
      await expect(domainInput).toBeEditable();
      await domainInput.fill(server.domain);

      const usernameInput = page.locator("input[name='user-name']");
      await expect(usernameInput).toBeVisible();
      await expect(usernameInput).toBeEditable();
      await usernameInput.fill(server.username);

      const passwordInput = page.locator("input[name='password']");
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toBeEditable();
      await passwordInput.fill(server.password);

      const ldapAuthSwitch = page.locator('#btn-ldap-authentication');
      await expect(ldapAuthSwitch).toBeVisible();
      await expect(ldapAuthSwitch).toBeEnabled();
      if ((await ldapAuthSwitch.getAttribute('aria-checked')) !== 'true') {
        await ldapAuthSwitch.click();
      }

      const groupsInput = page.locator("//input[@placeholder='ldap groups']");
      await groupsInput.fill("motadata users");
      await groupsInput.press('Enter');

      // --- TEST CREDENTIALS ---
      await page.locator("//button[@id='btn-test-credentials']").click();
      const msgLocator = page.locator('div[name="test-message"]');
      await expect(msgLocator).toBeVisible({ timeout: 30000 });
      const msg = await msgLocator.textContent();
      if (msg.includes('connection test successful')) {
        const submitBtn = page.locator("//button[@id='submit-btn']");
        await expect(submitBtn).toBeVisible({ timeout: 10000 });
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        //search for the synced server in the list
        await page.locator("//input[@name='search']").fill(server.primaryIp);
        await page.waitForTimeout(1000);

        // --- CLICK START REDISCOVERY (scoped to the matching row) ---
        const serverRow = page.getByRole('row', { name: new RegExp(server.primaryIp) });
        await expect(serverRow).toBeVisible({ timeout: 30000 });
        await serverRow.getByTestId('ldap-sync-trigger').click();
        await page.locator('#confirm-yes').click();

        // --- VERIFY TOAST NOTIFICATION ---
        const toast = await page.waitForSelector('.success-notification', { timeout: 10000 });
        const toastText = await toast.textContent();
        if (!toastText?.includes(server.toast)) {
          throw new Error(`Expected toast message not found, got: ${toastText}`);
        }
        console.log('Toast notification verified successfully');
      }

      // --- LOGOUT ---
      await logout(page);
    });
  });
});