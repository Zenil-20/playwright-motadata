// Precise selector harvest for the Metric Create Policy form (fully settled).
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env', quiet: true });
const OUT = 'ai-test-pipeline/workspace/MOTADATA-8503';
const base = process.env.Motadata_Aiops.replace(/\/$/, '');

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
page.setDefaultTimeout(120000);
try {
  await page.goto(base, { timeout: 120000 });
  await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
  await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
  await page.locator("//button[@type='submit']").click();
  await page.locator("//img[@alt='Avatar']").waitFor({ state: 'visible' });
  await page.locator("//a[@href='/settings/']").click();
  await page.locator("//input[@id='phone-number']").click();
  await page.locator("//input[@placeholder='Search']").fill('policy');
  await page.locator('a[href="/settings/policy-settings/"]').click();
  await page.getByRole('button', { name: 'Create Policy' }).click();

  // settle: wait until the Counter control is present
  await page.locator("//input[@placeholder='Select Metric']").waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const attrs = el => ({
      tag: el.tagName.toLowerCase(), id: el.id || null,
      name: el.getAttribute('name') || null, placeholder: el.getAttribute('placeholder') || null,
      readonly: el.hasAttribute('readonly') || null,
    });
    const inputs = [...document.querySelectorAll('input,textarea')].map(attrs);
    // module side-nav: links/menuitems inside the create-policy content (exclude global app sidebar)
    const navLinks = [...document.querySelectorAll('a,[role="menuitem"]')]
      .map(e => ({ text: e.innerText.trim(), href: e.getAttribute('href') }))
      .filter(x => /Metric|APM|NetRoute|Real User|Log|Flow|Trap|Availability|Network Config/.test(x.text));
    // create button
    const btns = [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean);
    return { inputs, navLinks, btns };
  });
  fs.writeFileSync(`${OUT}/v3-metric-form.json`, JSON.stringify(data, null, 2));
  console.log('DONE inputs=', data.inputs.length, 'nav=', data.navLinks.length);
} catch (e) { console.log('ERR', e.message); }
finally { await browser.close(); }
