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

const IP = process.env.AppRediscover_ip;
// Compact IST (Asia/Kolkata) HHmmss stamp, so per-run credential-profile names stay unique.
const RUN_ID = new Date()
  .toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
  .replace(/:/g, '');

/*
 * Generic, data-driven onboarding of every application discovered on IP via
 * Settings > Monitor Settings > Rediscover Settings > Application. MongoDB is
 * intentionally excluded. One matrix drives all four onboarding shapes:
 *   - 'http'      : set Port, keep URL Type = HTTP, no credential   (Nginx, Apache HTTP, Light Httpd)
 *   - 'http-auth' : set Port + create an HTTP/HTTPS "Basic" credential (Apache Tomcat, WildFly)
 *   - 'jdbc'      : set Port + Instance/Database + create a JDBC credential (MySQL, MariaDB, PostgreSQL)
 *   - 'ssh'       : no fields — just Run (reuses the host SSH credential)     (HAProxy)
 * The "Endpoint" column from the onboarding sheet has NO field in this drawer,
 * so it is not entered here.
 */
const APPS = [
  { name: 'Nginx',         type: 'http',      port: '18080' },
  { name: 'Apache HTTP',   type: 'http',      port: '18081' },
  { name: 'Light Httpd',   type: 'http',      port: '18082' },
  { name: 'Apache Tomcat', type: 'http-auth', port: '18085', username: process.env.AppRediscover_tomcat_username,  password: process.env.AppRediscover_tomcat_password },
  { name: 'WildFly',       type: 'http-auth', port: '19990', username: process.env.AppRediscover_wildfly_username, password: process.env.AppRediscover_wildfly_password },
  { name: 'MySQL',         type: 'jdbc',      port: '13306', instance: process.env.AppRediscover_jdbc_instance, username: process.env.AppRediscover_jdbc_username, password: process.env.AppRediscover_jdbc_password },
  { name: 'MariaDB',       type: 'jdbc',      port: '13307', instance: process.env.AppRediscover_jdbc_instance, username: process.env.AppRediscover_jdbc_username, password: process.env.AppRediscover_jdbc_password },
  { name: 'PostgreSQL',    type: 'jdbc',      port: '15432', instance: process.env.AppRediscover_jdbc_instance, username: process.env.AppRediscover_jdbc_username, password: process.env.AppRediscover_jdbc_password },
  { name: 'HAProxy',       type: 'ssh' },
];

// A card for the target app on this host. hasText is a substring match, so the full
// app name never cross-matches a sibling ("Apache HTTP" vs "Apache Tomcat", "MySQL" vs "PostgreSQL").
const cardFor = (page, name) =>
  page.locator('.rediscover-row').filter({ hasText: name }).filter({ hasText: IP });

async function reachApplicationCards(page) {
  // Rediscover Settings opens on the Application tab. The FIRST search box filters the
  // scheduler grid; focus the "weekly" scheduler then trigger an on-demand scan, which
  // populates the application cards in the second panel.
  await page.locator("//input[@name='search']").first().fill('weekly');
  await expect(page.locator('#start-rediscovery').first()).toBeVisible();
  await page.locator('#start-rediscovery').first().click();
  // The SECOND search box filters the discovered application cards by host.
  const cardSearch = page.locator('input[name="search"]').nth(1);
  await expect(cardSearch).toBeVisible({ timeout: 60000 });
  await cardSearch.fill(IP);
  // Wait until at least one card for this host has rendered.
  await expect(page.locator('.rediscover-row').filter({ hasText: IP }).first())
    .toBeVisible({ timeout: 120000 });
}

async function onboard(page, app) {
  // Keep the host filter applied (a prior onboarding re-renders the panel).
  const cardSearch = page.locator('input[name="search"]').nth(1);
  if ((await cardSearch.inputValue().catch(() => '')) !== IP) {
    await cardSearch.fill(IP);
    await expect(page.locator('.rediscover-row').filter({ hasText: IP }).first()).toBeVisible();
  }

  const card = cardFor(page, app.name).first();
  // Idempotent: onboarding removes the card, so a re-run (or an already-monitored app)
  // simply has no card — skip instead of failing.
  if (!(await card.count())) {
    test.skip(true, `${app.name}: no discovered card on ${IP} (already onboarded?)`);
    return;
  }

  await card.scrollIntoViewIfNeeded();
  await card.click({ force: true });
  await expect(page.getByRole('heading', { name: `${app.name} - App Discovery` })).toBeVisible();

  if (app.port) await page.locator('input#port-jdbc').fill(app.port);
  if (app.type === 'jdbc') await page.locator('input#instance-jdbc').fill(app.instance);

  if (app.type === 'http-auth' || app.type === 'jdbc') {
    await page.locator('#create-credential-btn-id').click();
    await expect(page.getByRole('heading', { name: 'Create Credential Profile' })).toBeVisible();
    // Protocol is pre-selected from the app (HTTP/HTTPS or JDBC) — leave it.
    await page.locator('input#credential-profile-name-id').fill(`${app.name}-${IP}-${RUN_ID}`);
    if (app.type === 'http-auth') {
      await page.locator("//div[@id='authentication-type']").click();
      await page.locator("//span[@title='Basic']").click();
    }
    await page.locator('input#username-id').fill(app.username);
    await page.locator('input#password-id').fill(app.password);
    await page.locator('#create-credential-profile-btn-id').click();
    await expect(page.getByRole('heading', { name: 'Create Credential Profile' })).toBeHidden();
  }

  await page.locator('#run').click();
  // Confirm: "Are you sure, you want to add Instance? ... your license will be consumed."
  const addInstance = page.getByRole('button', { name: 'Add Instance' });
  const confirmYes = page.locator('#confirm-yes');
  await expect(addInstance.or(confirmYes).first()).toBeVisible({ timeout: 30000 });
  if (await addInstance.count()) await addInstance.click();
  else await confirmYes.click();

  // Success: once the instance is accepted the app-discovery form closes. (The card is
  // also eventually removed from the list, but that lags behind async provisioning, so
  // the form closing is the reliable, immediate signal.)
  await expect(page.getByRole('heading', { name: `${app.name} - App Discovery` }))
    .toBeHidden({ timeout: 90000 });
}

test.describe.serial('Motadata AIOps Application Rediscovery (onboard all apps except MongoDB)', () => {
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

  test('Navigate to Rediscover Settings and scan applications', async () => {
    test.setTimeout(600000);
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();
    await page.locator("//input[@placeholder='Search']").fill('Rediscover Settings');
    await page.getByRole('link', { name: 'Rediscover Settings' }).click();
    await reachApplicationCards(page);
  });

  for (const app of APPS) {
    test(`Rediscover & onboard ${app.name}`, async () => {
      test.setTimeout(600000);
      await onboard(page, app);
    });
  }

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});
