import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env', quiet: true });

const log = (...a) => { const s = a.join(' '); console.log(s); fs.appendFileSync('_scratch/rum-explore.out', s + '\n'); };
fs.writeFileSync('_scratch/rum-explore.out', '');

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
page.setDefaultTimeout(120000);

try {
  // ---- Login ----
  await page.goto(process.env.Motadata_Aiops, { timeout: 500000, waitUntil: 'domcontentloaded' });
  const userField = page.locator("//input[@placeholder='Username']");
  const avatar = page.locator("//img[@alt='Avatar']");
  await Promise.race([
    userField.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {}),
    avatar.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {}),
  ]);
  if (await userField.isVisible().catch(() => false)) {
    await userField.fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
  }
  await avatar.waitFor({ state: 'visible', timeout: 120000 });
  log('LOGIN ok');

  // ---- Navigate directly to RUM applications ----
  const base = process.env.Motadata_Aiops.replace(/\/$/, '');
  await page.goto(base + '/digital-experience-monitoring/rum-applications', { timeout: 500000 });
  await page.waitForTimeout(4000);
  log('NAV url=', page.url());

  // ---- Find the button that opens the drawer ----
  for (const name of ['Register Application', 'Create Application', 'Add Application', 'Application']) {
    const c = await page.getByRole('button', { name, exact: true }).count();
    log(`list-btn role=button name="${name}" exact -> count`, c);
  }
  // generic: list any buttons on the page
  const btns = await page.getByRole('button').allInnerTexts();
  log('ALL buttons on list page:', JSON.stringify(btns));

  // open the drawer using best guess
  let opened = false;
  for (const name of ['Register Application', 'Create Application', 'Add Application']) {
    const b = page.getByRole('button', { name, exact: true });
    if (await b.count() === 1) { await b.click(); opened = true; log('opened drawer via', name); break; }
  }
  if (!opened) { log('!! could not open drawer'); }
  await page.waitForTimeout(2500);

  // ---- Drawer field locators ----
  const checks = {
    'app-name input#rum-application-name-id': 'input#rum-application-name-id',
    'domain input#domain-name-id': 'input#domain-name-id',
    'version input#version-id': 'input#version-id',
    'environment input#environment-id': 'input#environment-id',
    'session-rate input#session-sample-rate-id': 'input#session-sample-rate-id',
    'submit #rum-application-submit-btn': '#rum-application-submit-btn',
    'reset #rum-application-reset-btn': '#rum-application-reset-btn',
    'dropdown-trigger data-cy (count all)': "[data-cy='dropdown-trigger-input']",
    'radio Nginx': "input.ant-radio-button-input[value='Nginx']",
    'radio Apache': "input.ant-radio-button-input[value='Apache']",
    'radio Other': "input.ant-radio-button-input[value='Other']",
  };
  for (const [label, sel] of Object.entries(checks)) {
    log(`COUNT ${label} ::`, await page.locator(sel).count());
  }

  // Scope the Application Type dropdown via its form-item label
  const appTypeTrigger = page.locator(".ant-form-item:has(label:has-text('Application Type')) [data-cy='dropdown-trigger-input']");
  const privacyTrigger = page.locator(".ant-form-item:has(label:has-text('Privacy')) [data-cy='dropdown-trigger-input']");
  log('COUNT appType trigger scoped ::', await appTypeTrigger.count());
  log('COUNT privacy trigger scoped ::', await privacyTrigger.count());

  // ---- Open Application Type dropdown, list options ----
  await appTypeTrigger.first().click();
  await page.waitForTimeout(1500);
  // options usually rendered in a floating popover with span[title]
  const optTitles = await page.locator(".ant-popover:visible span[title], .v-popover span[title], [data-cy='dropdown-search-input']").count();
  log('appType popover probe count:', optTitles);
  // dump visible option-ish texts
  const popText = await page.locator('.ant-popover:visible, .v-popover:visible, .dropdown-menu:visible').last().allInnerTexts().catch(() => []);
  log('APP TYPE popover text:', JSON.stringify(popText));
  // also try span[title] anywhere visible
  const titles = await page.locator('span[title]').evaluateAll(els => els.filter(e => e.offsetParent !== null && e.getAttribute('title')).map(e => e.getAttribute('title')));
  log('visible span[title] values:', JSON.stringify([...new Set(titles)]));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);

  // ---- Open Privacy dropdown, list options ----
  await privacyTrigger.first().click();
  await page.waitForTimeout(1500);
  const privText = await page.locator('.ant-popover:visible, .v-popover:visible, .dropdown-menu:visible').last().allInnerTexts().catch(() => []);
  log('PRIVACY popover text:', JSON.stringify(privText));
  const ptitles = await page.locator('span[title]').evaluateAll(els => els.filter(e => e.offsetParent !== null).map(e => e.getAttribute('title')));
  log('PRIVACY visible span[title]:', JSON.stringify([...new Set(ptitles)]));
  await page.keyboard.press('Escape');

  log('DONE drawer exploration');
} catch (e) {
  log('ERROR:', e.message);
} finally {
  await page.waitForTimeout(500);
  await browser.close();
}
