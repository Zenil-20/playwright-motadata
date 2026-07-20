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
 * Created : 09 July 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// Unique per-run suffix so re-runs never collide on the discovery-profile /
// credential-profile name (a duplicate name leaves the credential drawer open and
// blocks Save & Run). The discovered object names ("FREE", "<hash>:FREE") come from
// the DB service name, not these, so the provision assertions stay valid.
// Human-readable IST (Asia/Kolkata) time — e.g. "12:05:33".
const RUN_ID = new Date().toLocaleTimeString('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour12: false,
});
const PROFILE_NAME = `ORACLE RAC CLUSTER ${RUN_ID}`;
const CRED_PROFILE_NAME = `ORACLE RAC CLUSTER ${RUN_ID}`;

// Target connection details — configure these in .env (OracleRAC_*).
const SCAN_IP = process.env.OracleRAC_ip;
const DB_SERVICE_NAME = process.env.OracleRAC_service_name;
const DB_PORT = process.env.OracleRAC_port;
const DB_USERNAME = process.env.OracleRAC_username;
const DB_PASSWORD = process.env.OracleRAC_password;

test.describe.serial('Motadata AIOps Discovery Flow For Oracle RAC Cluster', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Create Discovery for Oracle RAC Cluster', async () => {
    // Discovery + provisioning can take several minutes; override the config's
    // per-test cap so the 480s discovery wait isn't cut short.
    test.setTimeout(600000);
    await page.getByText('Database', { exact: true }).click();
    // Database Type defaults to "Oracle RAC Cluster"; select it explicitly so a
    // changed default can never point the discovery at the wrong DB type.
    await page.locator("//input[@data-cy='dropdown-trigger-input']").first().click();
    await page.locator("//span[@title='Oracle RAC Cluster']").click();

    // Main discovery form
    await page.locator("//input[@id='profile-id']").fill(PROFILE_NAME);
    await page.locator("//input[@id='ip-address-id']").fill(SCAN_IP);
    await page.locator("//input[@id='db-service-name-id']").fill(DB_SERVICE_NAME);
    await page.locator("//input[@id='port-id']").fill(DB_PORT);

    // Create the credential profile (JDBC is the default protocol).
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(CRED_PROFILE_NAME);
    await page.locator("//input[@id='username-id']").fill(DB_USERNAME);
    await page.locator("//input[@id='password-id']").fill(DB_PASSWORD);

    // Test the credentials before creating the profile. The DB cred-test dialog uses
    // target/port/database-name; Port (1521) and Connection Timeout (60) default in.
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='target']").fill(SCAN_IP);
    await page.locator("//input[@name='database-name']").fill(DB_SERVICE_NAME);
    await page.locator("//button[@id='run-test-btn']").click();
    // Assert the connection test succeeded.
    await expect(page.locator('#message')).toHaveText(/Successful/i);
    // Dismiss the test dialog before creating the profile.
    await page.locator("//button[@id='close-btn-id']").click();

    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    // Wait for the credential drawer to close, otherwise its overlay intercepts the
    // Save & Run click.
    await expect(page.locator("//input[@id='credential-profile-name-id']")).toBeHidden();

    // Save & Run the discovery.
    await page.locator('#save-run-btn-id').click();

    // Two Oracle objects are discovered on the same host — select both.
    await expect(page.getByText(SCAN_IP, { exact: true }).first())
      .toBeVisible({ timeout: 480000 });
    const rows = page.locator('tr.k-master-row', { hasText: SCAN_IP });
    await expect(rows).toHaveCount(2, { timeout: 480000 });
    await rows.nth(0).locator('input[type="checkbox"]').first().check();
    await rows.nth(1).locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();

    // Provision status — assert BOTH monitors provisioned successfully.
    // The two discovered objects are the CDB (named "<dynamic-id>:FREE", from the
    // container DB service — NOT the .env service name) and the PDB (named after the
    // .env service name, e.g. "freepdb1"). So assert both list items report success,
    // and that one of them is specifically the PDB monitor.
    const provisionList = page.locator('ul.progress-list');
    await expect(provisionList.locator('li')).toHaveCount(2, { timeout: 120000 });
    // Both monitors must report success.
    await expect(provisionList.locator('li', {
      hasText: /provisioned successfully/i,
    })).toHaveCount(2);
    // The PDB monitor is named after the .env service name.
    await expect(provisionList.locator('li', {
      hasText: new RegExp(`^Monitor ${DB_SERVICE_NAME} provisioned successfully`, 'i'),
    })).toHaveCount(1);

    // Close the drawer.
    await page.locator("//i[@class='anticon text-neutral-light']//*[name()='svg']").click();
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
