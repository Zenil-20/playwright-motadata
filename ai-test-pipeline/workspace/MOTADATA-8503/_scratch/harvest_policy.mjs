// Ground-truth harvest of the unified Create Policy UI across modules.
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env', quiet: true });
const OUT = 'ai-test-pipeline/workspace/MOTADATA-8503';
const base = process.env.Motadata_Aiops.replace(/\/$/, '');

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
page.setDefaultTimeout(120000);

const dumpForm = async (tag) => {
  // every interactive control with its identifying attributes
  const ctrls = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('input,select,textarea,[role="combobox"],[role="tab"],button').forEach(el => {
      const a = el.attributes;
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        name: a.name?.value || null,
        placeholder: a.placeholder?.value || null,
        aria: el.getAttribute('aria-label') || null,
        role: el.getAttribute('role') || null,
        text: (el.innerText || '').trim().slice(0, 40) || null,
      });
    });
    return out;
  });
  fs.writeFileSync(`${OUT}/controls-${tag}.json`, JSON.stringify(ctrls, null, 2));
};

try {
  await page.goto(base, { timeout: 120000 });
  await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
  await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
  await page.locator("//button[@type='submit']").click();
  await page.locator("//img[@alt='Avatar']").waitFor({ state: 'visible' });

  for (const mod of ['metric', 'apm', 'rum', 'netroute']) {
    try {
      await page.goto(`${base}/settings/policy-settings/policies/${mod}/create`, { timeout: 60000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${OUT}/mod-${mod}.png`, fullPage: true });
      await dumpForm(mod);
      // left-nav module links + set-conditions card labels
      const nav = await page.locator('aside a, .ant-menu a, [class*="left"] a').allInnerTexts().catch(() => []);
      const cards = await page.getByText(/Threshold Alert|Baseline Alert|Anomaly|Forecast/).allInnerTexts().catch(() => []);
      fs.writeFileSync(`${OUT}/aria-${mod}.txt`,
        'NAV:\n' + nav.join('|') + '\n\nCARDS:\n' + cards.join('|'));
      console.log('OK', mod, page.url());
    } catch (e) { console.log('MOD_ERR', mod, e.message); }
  }
} catch (e) {
  console.log('FATAL', e.message);
} finally {
  await browser.close();
}
