// B1 probe: with empty Policy Name, is Create Policy disabled, or does it validate on click?
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env', quiet: true });
const OUT = 'ai-test-pipeline/workspace/MOTADATA-8503';
const base = process.env.Motadata_Aiops.replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
page.setDefaultTimeout(120000);
try {
  await page.goto(base);
  await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
  await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
  await page.locator("//button[@type='submit']").click();
  await page.locator("//img[@alt='Avatar']").waitFor({ state: 'visible' });
  await page.locator("//a[@href='/settings/']").click();
  await page.locator("//input[@id='phone-number']").click();
  await page.locator("//input[@placeholder='Search']").fill('policy');
  await page.locator('a[href="/settings/policy-settings/"]').click();
  await page.getByRole('button', { name: 'Create Policy' }).click();
  await page.locator("//input[@placeholder='Select Metric']").waitFor({ state: 'visible' });

  const btn = page.getByRole('button', { name: 'Create Policy' });
  console.log('empty-name: button disabled?', await btn.isDisabled());
  // click with empty name and observe
  await btn.click().catch(e => console.log('click err', e.message));
  await page.waitForTimeout(1500);
  const errs = await page.locator('.ant-form-item-explain-error, .ant-message-error, .ant-notification-notice-message').allInnerTexts().catch(()=>[]);
  console.log('validation/error texts:', JSON.stringify(errs));
  console.log('still on create url?', page.url());
  await page.screenshot({ path: `${OUT}/probe-b1.png`, fullPage: true });
} catch (e) { console.log('ERR', e.message); }
finally { await browser.close(); }
