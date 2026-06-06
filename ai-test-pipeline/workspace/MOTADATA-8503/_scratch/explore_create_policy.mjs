// Read-only live exploration of the unified Create Policy screen (MOTADATA-8503).
// Logs in, navigates to Policy Settings > Create Policy, screenshots + dumps the
// accessibility tree so we can SEE the real new UI and harvest verified locators.
// Does NOT create/save any policy.
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env', quiet: true });

const OUT = 'ai-test-pipeline/workspace/MOTADATA-8503';
const shot = async (page, name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
page.setDefaultTimeout(120000);

try {
  await page.goto(process.env.Motadata_Aiops, { timeout: 120000 });
  await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
  await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
  await page.locator("//button[@type='submit']").click();
  await page.locator("//img[@alt='Avatar']").waitFor({ state: 'visible' });
  console.log('LOGIN_OK');

  // Navigate to Policy Settings
  await page.locator("//a[@href='/settings/']").click();
  await page.locator("//input[@id='phone-number']").click();
  await page.locator("//input[@placeholder='Search']").fill('policy');
  await page.locator('a[href="/settings/policy-settings/"]').click();
  await page.waitForTimeout(2500);
  await shot(page, '01-policy-list');
  console.log('POLICY_LIST_URL', page.url());

  // Open Create Policy
  await page.getByRole('button', { name: 'Create Policy' }).click();
  await page.waitForTimeout(3000);
  await shot(page, '02-create-policy');
  console.log('CREATE_URL', page.url());

  // Dump accessibility tree (interesting nodes only)
  const tree = await page.accessibility.snapshot({ interestingOnly: true });
  fs.writeFileSync(`${OUT}/create-policy-a11y.json`, JSON.stringify(tree, null, 2));

  // List candidate signals: tabs, buttons, comboboxes, module names
  const texts = await page.locator('button, [role="tab"], [role="combobox"], a').allInnerTexts();
  fs.writeFileSync(`${OUT}/create-policy-controls.txt`,
    texts.map(t => t.trim()).filter(Boolean).join('\n'));
  console.log('SNAPSHOT_DONE');
} catch (e) {
  console.log('ERROR', e.message);
  await shot(page, 'ZZ-error').catch(() => {});
} finally {
  await browser.close();
}
