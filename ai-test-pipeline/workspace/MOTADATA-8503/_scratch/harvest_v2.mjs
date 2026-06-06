// Click-based harvest of unified Create Policy across modules (deep-links don't hydrate).
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
  const ctrls = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('input,textarea,[role="combobox"]').forEach(el => {
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null, name: el.getAttribute('name') || null,
        placeholder: el.getAttribute('placeholder') || null,
        aria: el.getAttribute('aria-label') || null, role: el.getAttribute('role') || null,
      });
    });
    // labels/section text for context
    const labels = [...document.querySelectorAll('label,.ant-form-item-label,h2,h3,[class*="tab"]')]
      .map(e => e.innerText.trim()).filter(Boolean).slice(0, 60);
    return { ctrls: out, labels };
  });
  fs.writeFileSync(`${OUT}/v2-controls-${tag}.json`, JSON.stringify(ctrls, null, 2));
};

const gotoModule = async (linkName, tag) => {
  await page.getByRole('link', { name: linkName, exact: true }).click().catch(async () => {
    await page.getByText(linkName, { exact: true }).first().click();
  });
  await page.getByText('Set Conditions', { exact: false }).first().waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/v2-${tag}.png`, fullPage: true });
  await dumpForm(tag);
  console.log('OK', tag, page.url());
};

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
  await page.getByText('Set Conditions', { exact: false }).first().waitFor({ state: 'visible', timeout: 60000 });
  await dumpForm('metric'); await page.screenshot({ path: `${OUT}/v2-metric.png`, fullPage: true });
  console.log('OK metric', page.url());

  await gotoModule('APM', 'apm');
  await gotoModule('Real User Monitoring', 'rum');
  await gotoModule('NetRoute', 'netroute');
} catch (e) {
  console.log('FATAL', e.message);
  await page.screenshot({ path: `${OUT}/v2-error.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}
