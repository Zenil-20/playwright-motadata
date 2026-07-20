#!/usr/bin/env node
/*
 * harvest-locators — READ-ONLY live locator collector for ObserveOps NCCM gap screens.
 *
 * Logs in (from .env), drives to each gap screen, OPENS its drawer/modal so lazy controls
 * render, and dumps control attributes (name/id/placeholder/data-cy/role/text) via DOM queries
 * — NOT screenshots (ObserveOps never reaches network-idle). Writes knowledge/locators/harvest/*.json.
 *
 * SAFETY: read-only. It only navigates + opens drawers to read fields. It NEVER clicks
 * Save/Submit/Delete/Run. One target failing is caught and recorded; the run continues.
 *
 *   node scripts/harvest-locators.mjs [--headed] [--only <name>]
 */
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();
const OUT = 'knowledge/locators/harvest';
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const HEADED = argv.includes('--headed');
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

const URL = process.env.Motadata_Aiops;
const USER = process.env.Motadata_Username;
const PASS = process.env.Motadata_Password;
if (!URL || !USER || !PASS) { console.error('Set Motadata_Aiops/Username/Password in .env'); process.exit(2); }

// Dump control attributes within a container selector. DOM-query based.
async function dump(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s) || document.body;
    const q = (sc) => Array.from(el.querySelectorAll(sc));
    const txt = (n) => (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return {
      labels: [...new Set(q('.ant-form-item-label label, label').map(txt).filter(Boolean))].slice(0, 60),
      inputs: q('input,textarea').map((i) => ({ name: i.name || '', id: i.id || '', type: i.type || '', ph: i.placeholder || '', readonly: i.readOnly || undefined })).slice(0, 80),
      buttons: [...new Set(q('button').map(txt).filter(Boolean))].slice(0, 40),
      buttonIds: q('button[id]').map((b) => b.id).slice(0, 40),
      dataCy: [...new Set(q('[data-cy]').map((n) => n.getAttribute('data-cy')))].slice(0, 40),
      dataTestid: [...new Set(q('[data-testid]').map((n) => n.getAttribute('data-testid')))].slice(0, 40),
      selects: q('.ant-select').length,
      switches: q('.ant-switch, button[role=switch]').length,
      radios: q('input[type=radio]').length,
      checkboxes: q('input[type=checkbox]').length,
      codeMirror: q('.CodeMirror, .cm-editor').length,
      tabs: [...new Set(q('[role=tab], .ant-tabs-tab').map(txt).filter(Boolean))].slice(0, 20),
      gridHeaders: [...new Set(q('th, .k-header').map(txt).filter(Boolean))].slice(0, 30),
    };
  });
}

async function login(page) {
  await page.goto(URL, { timeout: 90000, waitUntil: 'domcontentloaded' });
  const user = page.locator("input[name='username']").first();
  await user.waitFor({ state: 'visible', timeout: 60000 });
  await user.fill(USER);
  await page.locator("input[name='password']").first().fill(PASS);
  const signin = page.getByRole('button', { name: /sign in|log ?in/i }).first();
  if (await signin.count()) await signin.click(); else await page.locator("//button[@type='submit']").click();
  await page.waitForFunction(() => !location.pathname.includes('/login'), null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(3000);
}

// Settings → search → click a result link (the app's own search-nav pattern).
async function settingsSearch(page, term, linkName) {
  await page.locator("//a[@href='/settings/']").click();
  await page.locator("//input[@id='phone-number']").click().catch(() => {});
  await page.locator("//input[@placeholder='Search']").first().fill(term);
  await page.getByRole('link', { name: linkName, exact: false }).first().click({ timeout: 30000 });
  await page.waitForTimeout(1500); // let the grid/screen render (app never idles)
}

// Try opening a drawer/modal via any of several button names; return the visible container.
async function openAndScope(page, names) {
  for (const n of names) {
    const btn = page.getByRole('button', { name: n, exact: false }).first();
    if (await btn.count().catch(() => 0)) { await btn.click({ timeout: 20000 }).catch(() => {}); break; }
  }
  await page.waitForTimeout(1800);
  if (await page.locator('.ant-drawer-open').count()) return '.ant-drawer-open';
  if (await page.locator('.ant-modal:visible').count()) return '.ant-modal';
  return 'body'; // fall back to whole page
}

const TARGETS = [
  { name: 'runbook-create', run: async (page) => { await settingsSearch(page, 'runbook', 'Runbook'); return openAndScope(page, ['Create Runbook', 'Add Runbook', 'Create']); } },
  { name: 'user-create-rbac', run: async (page) => { await settingsSearch(page, 'user', 'User'); return openAndScope(page, ['Create User', 'Add User']); } },
  { name: 'role-create-rbac', run: async (page) => { await settingsSearch(page, 'role', 'Role'); return openAndScope(page, ['Create Role', 'Add Role']); } },
  { name: 'ncm-policy-create', run: async (page) => { await settingsSearch(page, 'network config policy', 'Network Config Policy'); await page.locator('#create-policy-btn').click({ timeout: 20000 }).catch(() => {}); await page.waitForTimeout(1800); return 'body'; } },
  { name: 'device-template', run: async (page) => { await settingsSearch(page, 'device template', 'Device Template'); return openAndScope(page, ['Create Template', 'Create Device Template', 'Add Template', 'Create']); } },
  { name: 'firmware-profile', run: async (page) => { await settingsSearch(page, 'firmware', 'Firmware'); return openAndScope(page, ['Create', 'Add', 'Upgrade']); } },
  { name: 'storage-profile', run: async (page) => { await settingsSearch(page, 'storage', 'Storage'); return openAndScope(page, ['Create Storage Profile', 'Create', 'Add']); } },
  { name: 'ncm-approval', run: async (page) => { await page.goto(URL + '/#/ncm-approval', { waitUntil: 'domcontentloaded' }).catch(() => {}); await page.waitForTimeout(2500); return 'body'; } },
];

(async () => {
  const browser = await chromium.launch({ headless: !HEADED });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const report = [];
  try {
    console.log('logging in →', URL);
    await login(page);
    console.log('logged in ✓');
    for (const t of TARGETS) {
      if (ONLY && t.name !== ONLY) continue;
      try {
        const sel = await t.run(page);
        const data = await dump(page, sel);
        fs.writeFileSync(path.join(OUT, t.name + '.json'), JSON.stringify({ target: t.name, ...data }, null, 1));
        const n = (data.inputs.length) + data.buttons.length + data.dataCy.length;
        console.log(`  ✓ ${t.name.padEnd(20)} inputs:${data.inputs.length} buttons:${data.buttons.length} data-cy:${data.dataCy.length} codeMirror:${data.codeMirror} selects:${data.selects}`);
        report.push({ target: t.name, ok: true, controls: n });
      } catch (e) {
        fs.writeFileSync(path.join(OUT, t.name + '.json'), JSON.stringify({ target: t.name, error: e.message }, null, 1));
        console.log(`  ✗ ${t.name.padEnd(20)} ${e.message.split('\n')[0].slice(0, 80)}`);
        report.push({ target: t.name, ok: false, error: e.message.split('\n')[0] });
      }
      // return to a known state for the next target
      await page.goto(URL + '/#/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(800);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, '_report.json'), JSON.stringify(report, null, 1));
  console.log('\nharvest → ' + OUT);
})();
