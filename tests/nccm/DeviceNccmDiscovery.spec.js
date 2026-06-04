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
 * Created : 26 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const NCCM_DEVICE_IP = '172.16.12.3';
const PROFILE_NAME = 'nccm discovery 172.16.12.3';

const NCCM_DEVICE_IP_2 = '172.16.14.8';
const PROFILE_NAME_2 = 'nccm discovery 172.16.14.8';
const CRED_PROFILE_NAME_2 = '172.16.14.8-ssh-ospf3';

const NCCM_DEVICE_IP_3 = '172.16.14.6';
const PROFILE_NAME_3 = 'nccm discovery 172.16.14.6';
const CRED_PROFILE_NAME_3 = '172.16.14.6-ssh-ospf1';

test.describe.serial('Motadata AIOps NCCM Device Discovery for 172.16.12.3', () => {
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
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await expect(page.locator("//img[@alt='Avatar']")).toBeVisible();
  });

  test('Navigate to Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
  });

  test('Discover Network device 172.16.12.3 using existing default SNMP credential', async () => {
    await page.getByText('Network', { exact: true }).click();
    await page.locator('input[name="profile-name"]').fill(PROFILE_NAME);
    await page.locator("//input[@id='ip-address-id']").fill(NCCM_DEVICE_IP);

    // Open credential profile picker — default SNMP credential already exists in the list,
    // just tick its checkbox.
    await page.locator("//div[@id='credential-profile-picker-id']").click();

    const popover = page.locator('.ant-popover:visible, .ant-dropdown:visible').last();
    const defaultSnmpRow = popover.locator('li, div[role="option"], tr', { hasText: /default\s*snmp/i }).first();
    await expect(defaultSnmpRow).toBeVisible({ timeout: 60000 });
    const checkbox = defaultSnmpRow.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // Dismiss the picker popover so it doesn't overlay the Save and Run button.
    await page.locator('input[name="profile-name"]').click();

    await page.locator('#save-run-btn-id').click();

    // Wait for the discovered device to appear in the results table.
    await expect(page.getByText(NCCM_DEVICE_IP, { exact: true }).first())
      .toBeVisible({ timeout: 480000 });

    // Tick the discovered row and add it for monitoring.
    const discoveredRow = page.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP }).first();
    await discoveredRow.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();

    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await page.locator('svg[data-icon="times"]').click();
  });

  test('change the cretemdials attacthed from device inventory screen', async () => {
    await page.locator("//input[@placeholder='Search']").first().fill("device inventory");
    await page.getByRole('link', { name: 'Device Inventory' }).click();
    await page.locator("//input[@name='search']").first().fill(NCCM_DEVICE_IP);
      // Locate all cells containing the IP
  const ipElements = page.locator('td', {
    hasText: '172.16.12.3'
  });

  // Assertion: only one element should exist
  await expect(ipElements).toHaveCount(1);

  // Optional exact text validation
  await expect(ipElements.first()).toHaveText('172.16.12.3');

  // Scope every row-specific action to the 172.16.12.3 row so we never act on
  // another device's controls (e.g. the firewall row's "Add Credential").
  const deviceRow = page.getByRole('row', { name: '172.16.12.3' });
  const toggle = deviceRow.getByRole('switch');

  // If toggle is OFF → click it
  if ((await toggle.textContent())?.trim() === 'OFF') {
    await toggle.click();

    await deviceRow.getByRole('button', { name: 'Add Credential' }).click();
    await page.getByRole('button', { name: 'Create Credential Profile' }).click();
     await page.locator('input[placeholder="Must be unique"]').click();
    // step 7 [Write] Write text in Must be unique
    await page.locator('input[placeholder="Must be unique"]').fill("172.16.12.3");
    // step 8 [Click] Click on username
    await page.locator('input[type="text"][name="username"]').first().click();
    // step 9 [Write] Write text in username
    await page.locator('input[type="text"][name="username"]').first().fill("cisco");
    // step 10 [Click] Click on password
    await page.locator('input[type="password"]').first().click();
    // step 11 [Write] Write text in password
    await page.locator('input[type="password"]').first().fill("cisco");
    // step 13 [Click] Click on Select
    await page.locator("//div[9]//div[1]//div[1]//div[2]//div[1]//span[1]//span[1]//div[1]//div[1]//div[1]//div[1]//span[1]//input[1]").click();
    // step 14 [Click] Click on TFTP
    await page.locator("//li[@class='undefined-item scroll-dropdown-menu-item ant-dropdown-menu-item ant-menu-item ant-dropdown-menu-item-selected']").click();
    // step 16 [Write] Write text in password
    await page.locator("//div[13]//div[1]//div[1]//div[2]//div[1]//span[1]//span[1]//input[1]").fill("Mind@123");
    // step 18 [Write] Write text in input
    await page.locator("//div[15]//div[1]//div[1]//div[2]//div[1]//span[1]//input[1]").fill("#");
    // step 20 [Write] Write text in input
    await page.locator("//div[11]//div[1]//div[1]//div[2]//div[1]//span[1]//input[1]").fill("en");
    // step 21 [Click] Click on Test
    await page.locator("//button[@id='test-btn']").click();
    // step 22 [Write] Write text in e.g. 192.168.1....
    await page.locator('input[type="text"][name="hostname-ip"]').fill(NCCM_DEVICE_IP);
    // step 23 [Click] Click on Test
    await page.locator("//button[@id='run-test-btn']").click();
    // step 24 [Assert] assertion
    await expect(page.locator("//i[@class='anticon mr-1 text-secondary-green']//*[name()='svg']")).toBeVisible({ timeout: 400000 });
    // step 25 [Click] Click on Close
    await page.locator("#close-btn-id").click();
    await page.getByRole('button', { name: 'Create Credentials Profile' }).click();
    await page.getByRole('button', { name: 'Run Discovery' }).click();
      // Locator for the success status cell
  const successStatus = page.locator('td', {
    hasText: 'Successful'
  });

  // Wait up to 4 minutes for it to appear
  await expect(successStatus).toContainText('Successful', {
    timeout: 240000 // 4 minutes
  });
  }

  // Assertion that toggle is ON
  await expect(toggle).toContainText('ON');
  });

  test('Discover NCCM-enabled device 172.16.14.8 with default SNMP + new SSH credential', async () => {
    // Re-enter the Create Discovery Profile screen from Settings.
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();

    await page.getByText('Network', { exact: true }).click();
    await page.locator('input[name="profile-name"]').fill(PROFILE_NAME_2);
    await page.locator("//input[@id='ip-address-id']").fill(NCCM_DEVICE_IP_2);

    // Enable the "Network Config Management" toggle BEFORE attaching credentials.
    const nccmToggle = page.locator("//label[normalize-space()='Network Config Management']/ancestor::div[contains(@class,'ant-form-item')]//button[@role='switch']").first();
    await expect(nccmToggle).toBeVisible();
    if ((await nccmToggle.getAttribute('aria-checked')) !== 'true') {
      await nccmToggle.click();
    }
    await expect(nccmToggle).toHaveAttribute('aria-checked', 'true');

    // Open credential profile picker — tick existing "default snmp".
    await page.locator("//div[@id='credential-profile-picker-id']").click();
    const popover = page.locator('.ant-popover:visible, .ant-dropdown:visible').last();
    const defaultSnmpRow = popover.locator('li, div[role="option"], tr', { hasText: /default\s*snmp/i }).first();
    await expect(defaultSnmpRow).toBeVisible({ timeout: 60000 });
    await defaultSnmpRow.locator('input[type="checkbox"]').first().check();
    // Dismiss popover before creating a new credential.
    await page.locator('input[name="profile-name"]').click();

    // Create a new SSH credential via the picker's "+" button.
    await page.locator("//button[@id='create-credential-btn-id']").click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(CRED_PROFILE_NAME_2);

    // Change Protocol from default SNMP V1/V2c to SSH.
    await page.locator("//div[@title='SNMP V1/V2c']//input[@placeholder='Select']").click();
    await page.locator("//span[@title='SSH']").click();

    const drawer = page.locator('.ant-drawer-open').last();
    await drawer.locator('input[name="username"]').first().fill('ospf3');
    await drawer.locator('input[type="password"]').first().fill('ospf3');

    // Enable Password and Enable Prompt
    await drawer.locator("//label[normalize-space()='Enable Password']/ancestor::div[contains(@class,'ant-form-item')]//input").first().fill('ospf3');
    await drawer.locator("//label[normalize-space()='Enable Prompt']/ancestor::div[contains(@class,'ant-form-item')]//input").first().fill('#');
    await page.locator("//div[@class='ant-form-item-control']//div[@id='protocol']//input[@placeholder='Select']").click();
    await page.locator("//span[@title='No Protocol']").click();

    // Test the credential against the device.
    await page.locator("//button[@id='test-btn']").click();
    await page.locator('input[name="hostname-ip"]').fill(NCCM_DEVICE_IP_2);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful', { timeout: 480000 });
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();

    // Save and Run discovery.
    await page.locator('#save-run-btn-id').click();

    // Wait for the discovered device to appear and provision it.
    await expect(page.getByText(NCCM_DEVICE_IP_2, { exact: true }).first())
      .toBeVisible({ timeout: 480000 });

    const discoveredRow = page.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP_2 }).first();
    await discoveredRow.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await page.locator('svg[data-icon="times"]').click();
  });


  test('Discover NCCM-enabled device 172.16.14.6 with default SNMP + new SSH/TFTP credential', async () => {
    // Re-enter the Create Discovery Profile screen from Settings.
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('discovery profile');
    await page.locator("//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']").click();
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();

    await page.getByText('Network', { exact: true }).click();
    await page.locator('input[name="profile-name"]').fill(PROFILE_NAME_3);
    await page.locator("//input[@id='ip-address-id']").fill(NCCM_DEVICE_IP_3);

    // Enable the "Network Config Management" toggle BEFORE attaching credentials.
    const nccmToggle = page.locator("//label[normalize-space()='Network Config Management']/ancestor::div[contains(@class,'ant-form-item')]//button[@role='switch']").first();
    await expect(nccmToggle).toBeVisible();
    if ((await nccmToggle.getAttribute('aria-checked')) !== 'true') {
      await nccmToggle.click();
    }
    await expect(nccmToggle).toHaveAttribute('aria-checked', 'true');

    // Open credential profile picker — tick existing "default snmp".
    await page.locator("//div[@id='credential-profile-picker-id']").click();
    const popover = page.locator('.ant-popover:visible, .ant-dropdown:visible').last();
    const defaultSnmpRow = popover.locator('li, div[role="option"], tr', { hasText: /default\s*snmp/i }).first();
    await expect(defaultSnmpRow).toBeVisible({ timeout: 60000 });
    await defaultSnmpRow.locator('input[type="checkbox"]').first().check();
    await page.locator('input[name="profile-name"]').click();

    // Create a new SSH credential via the picker's "+" button.
    await page.locator("//button[@id='create-credential-btn-id']").click();
    await page.locator("//input[@id='credential-profile-name-id']").fill(CRED_PROFILE_NAME_3);

    // Change Protocol from default SNMP V1/V2c to SSH.
    await page.locator("//div[@title='SNMP V1/V2c']//input[@placeholder='Select']").click();
    await page.locator("//span[@title='SSH']").click();

    const drawer = page.locator('.ant-drawer-open').last();
    await drawer.locator('input[name="username"]').first().fill('ospf1');
    await drawer.locator('input[type="password"]').first().fill('ospf1');

    // Config Transfer Protocol = TFTP
    await drawer.locator("//label[normalize-space()='Config Transfer Protocol']/ancestor::div[contains(@class,'ant-form-item')]//input[@placeholder='Select']").first().click();
    await page.locator("//li[@role='menuitem']//span[normalize-space()='TFTP'] | //span[@title='TFTP']").first().click();
        // step 20 [Write] Write text in input
    await page.locator("//div[11]//div[1]//div[1]//div[2]//div[1]//span[1]//input[1]").fill("en");

    // Enable Password and Enable Prompt
    await drawer.locator("//label[normalize-space()='Enable Password']/ancestor::div[contains(@class,'ant-form-item')]//input").first().fill('ospf1');
    await drawer.locator("//label[normalize-space()='Enable Prompt']/ancestor::div[contains(@class,'ant-form-item')]//input").first().fill('#');

    // Test the credential against the device.
    await page.locator("//button[@id='test-btn']").click();
    await page.locator('input[name="hostname-ip"]').fill(NCCM_DEVICE_IP_3);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful', { timeout: 480000 });
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();

    // Save and Run discovery.
    await page.locator('#save-run-btn-id').click();

    // Wait for the discovered device to appear and provision it.
    await expect(page.getByText(NCCM_DEVICE_IP_3, { exact: true }).first())
      .toBeVisible({ timeout: 480000 });

    const discoveredRow = page.locator('tr.k-master-row', { hasText: NCCM_DEVICE_IP_3 }).first();
    await discoveredRow.locator('input[type="checkbox"]').first().check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await page.locator('svg[data-icon="times"]').click();
  });

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
