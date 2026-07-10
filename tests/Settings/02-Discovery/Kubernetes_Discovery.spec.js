
/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * This software and associated documentation are the confidential and
 proprietary information of Motadata.
 *
 * Unauthorized use, reproduction, disclosure, or distribution of this
 * material is strictly prohibited.
 *
 * You shall use this software only in accordance with the terms of the
 * license agreement entered into with Motadata.
 *
 * Author  : Zenil Kapadia
 * Created : 11 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// The provision-status popup renders as a role=document popover (NOT role=dialog), so a
// dialog-scoped match is unreliable and a bare svg[data-icon="times"] click hits the wrong
// (page-level) icon. Target the cross <a> inside the flex header that holds the
// "Provision Status" heading.
async function closeProvisionStatus(page) {
  const header = page.locator('.flex.justify-between')
    .filter({ has: page.getByRole('heading', { name: 'Provision Status' }) });
  await expect(header).toBeVisible({ timeout: 30000 });
  await header.locator('a:has(svg[data-icon="times"])').click();
}

test.describe.serial('Motadata AIOps Discovery Flow For Linux Server Discovery', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // Create a single browser context and page shared across all tests
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
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

  test('Create Discovery for Kubernetes in container orchestration', async () => {
    test.setTimeout(600000);
    await page.getByText('Container Orchestration', { exact: true }).click();
    await page.getByRole('link', { name: 'Kubernetes', exact: true }).click();
    await page.locator("//input[@id='profile-id']").fill('Kubernetes Discovery');
    await page.locator("//input[@id='ip-address-id']").fill(process.env.Kubernetes_Master_Node_IP);
    await page.locator('#create-credential-btn-id').click();
    await page.locator("//input[@id='credential-profile-name-id']").fill('Kubernetes Discovery Credential');
    await page.locator("//input[@id='username-id']").fill(process.env.Kubernetes_Master_Node_Username);
    await page.locator("//input[@id='password-id']").fill(process.env.Kubernetes_Master_Node_Password);
    await page.locator("//button[@id='test-btn']").click();
    await page.locator("//input[@name='hostname-ip']").fill(process.env.Kubernetes_Master_Node_IP);
    await page.locator("//button[@id='run-test-btn']").click();
    await expect(page.locator('#message')).toHaveText('Successful');
    await page.locator("//button[@id='close-btn-id']").click();
    await page.locator("//button[@id='create-credential-profile-btn-id']").click();
    await page.getByRole('button', { name: 'Save and Exit' }).click();
    await page.locator("//input[@name='discovery-search']").fill('Kubernetes Discovery');
    await page.getByRole('row', { name: /Kubernetes Discovery/i }).locator('svg').first().click();
    // await page.locator('#save-run-btn-id').click();
    // The discovery scan runs server-side and can take minutes before the result row
    // surfaces, so the default 5s expect timeout is far too short — wait it out.
    await expect(page.getByRole('gridcell', { name: process.env.Kubernetes_Master_Node_IP, exact: true }).first()).toBeVisible({ timeout: 480000 });

    // Hostname 'motadata' is already provisioned — rename it inline before adding.
// Clicking the name span turns it into an input; do not click elsewhere in between.
const discoveredRow = page.locator('tr.k-master-row', {
  has: page.locator('td', { hasText: process.env.Kubernetes_Master_Node_IP })
}).first();
await discoveredRow.locator('span.text-ellipsis').first().click();      // ← opens the inline editor (pencil affordance)
// The first input in the row is the row checkbox; the name field is the textbox.
const nameInput = discoveredRow.getByRole('textbox').first();
await expect(nameInput).toBeVisible({ timeout: 10000 });
await nameInput.fill('kubernetes');                                        // ← new monitor name
await nameInput.press('Enter');
await expect(discoveredRow.locator('span.text-ellipsis', { hasText: 'kubernetes' }).first())
  .toBeVisible({ timeout: 10000 });                                     // ← verify rename stuck


    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator("//button[@id='add-selected-btn-id']").click();
    await expect(page.getByText('provisioned successfully').first()).toBeVisible({ timeout: 120000 });
    await closeProvisionStatus(page);
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
