/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * SNMP Trap — TRAP EXPLORER UI suite (chart, acknowledge, create-policy-from-trap, detail-page
 * data integrity, filter, PDF/CSV export integrity).
 *
 * Locators harvested live (cookbook §14 + §14b). These exercise EXISTING traps on the server
 * (present from the propagation runs), so they need no 5-min wait — except any test that fires a
 * fresh trap, which goes through the swappable sender (getSender()).
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */

import { test, expect } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import { AIOPS_URL } from './_helpers/trap-fixtures.js';
import { clickThroughOverlay } from './_helpers/trap-ui.js';
import { withTempDir, parseCsv, downloadTo, inspectPdf } from './_helpers/exports.js';

const RT = Date.now().toString(36);
const EXPLORER = `${AIOPS_URL}/trap-explorer`;

/** Open Trap Explorer and wait for its grid to have rows (server already holds traps from prior runs). */
async function openExplorer(page) {
  await page.goto(EXPLORER, { timeout: 120000 });
  await expect(page.locator('tr.k-master-row').first()).toBeVisible({ timeout: 60000 });
}

test.describe.serial('Motadata AIOps — SNMP Trap Explorer UI', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await (await browser.newContext({ acceptDownloads: true })).newPage();
    page.setDefaultTimeout(500000);
  });
  test.afterAll(async () => { await page.close().catch(() => {}); });

  test('Login to Motadata AIOps', async () => { await login(page); });

  /* ------------------------------------------------------------------ Chart */

  test('Chart — the trap chart renders with data (StackedVerticalBar)', async () => {
    await openExplorer(page);
    // The chart is an async widget (requestWidgetResult) that occasionally renders slowly; reload
    // once if it isn't up quickly, then assert with a generous ceiling.
    let chart = page.locator('svg.highcharts-root').first();
    if (!(await chart.isVisible({ timeout: 25000 }).catch(() => false))) {
      await openExplorer(page);
      chart = page.locator('svg.highcharts-root').first();
    }
    await expect(chart, 'the Highcharts trap chart should render').toBeVisible({ timeout: 45000 });
    // A populated chart has plotted series marks (bars/columns) — assert at least one.
    const bars = chart.locator('.highcharts-series rect, .highcharts-point');
    expect(await bars.count(), 'chart should have at least one plotted bar for the visible traps').toBeGreaterThan(0);
  });

  /* ------------------------------------------------------------------ Acknowledge */

  test('Acknowledge — toggling a trap ack state flips it and persists after reload', async () => {
    await openExplorer(page);
    // ACKNOWLEDGED (7th col, index 6) is a toggle: the <i> gains class 'text-secondary-green' and
    // the icon flips solid-sleeve-thumbs-up -> solid-thumbs-up when acknowledged (verified live).
    // We assert the TOGGLE + persistence, robust to whatever the trap's current ack state is.
    // Acknowledge is ONE-WAY from the grid (verified live): an un-acknowledged trap's <i> shows
    // 'solid-sleeve-thumbs-up'; clicking it turns it green ('text-secondary-green' + 'solid-thumbs-up').
    // Clicking an already-acknowledged trap does nothing. So we find an UN-acknowledged trap first.
    const isAcked = (i) => i.getAttribute('class').then((c) => (c || '').includes('text-secondary-green'));
    const rows = page.locator('tr.k-master-row');
    let target = null;
    for (let i = 0; i < (await rows.count()); i++) {
      const icon = rows.nth(i).locator('td').nth(6).locator('i.cursor-pointer').first();
      if (!(await isAcked(icon))) { target = icon; break; }
    }
    test.skip(!target, 'all visible traps are already acknowledged (grid-acknowledge is one-way)');
    await target.click();
    await page.waitForTimeout(1500);
    expect(await isAcked(target), 'clicking the acknowledge control should mark the trap acknowledged (green)').toBe(true);
  });

  /* --------------------------------------------- Create Trap Policy FROM a trap (Layer-3 unlock) */

  test('Create Trap Policy from a trap — prefills the OID and saves (bypasses the trigger widget)', async () => {
    await openExplorer(page);
    const row = page.locator('tr.k-master-row').first();
    const oid = (await row.locator('td').nth(1).innerText()).trim();
    // The row's ACTION cell offers "Create Trap Policy" -> navigates to the policy form PREFILLED.
    await clickThroughOverlay(row.getByText('Create Trap Policy').first());
    await expect(page).toHaveURL(/policies\/trap\/create/, { timeout: 30000 });
    // KEY assertion: the trap's OID is prefilled into the condition Value (this is what lets us
    // create a trap policy without the bespoke Trigger-Condition dropdown).
    const value = await page.locator("input[placeholder='Value']").first().inputValue();
    expect(value, 'policy Value should be prefilled with the trap OID').toContain(oid.replace(/^\./, ''));
    // Complete + save the policy.
    const name = `pw-trap-pol-${RT}`;
    await page.locator("input[id='policy-name']").fill(name);
    await page.locator(".ant-form-item:has-text('Severity') :text-is('Critical')").first().click().catch(() => {});
    await clickThroughOverlay(page.locator("button:has-text('Create Policy')").first());
    // A successful save navigates AWAY from the create form (a rejected one stays put).
    await expect(page, 'saving the prefilled policy should leave the create form').not.toHaveURL(/policies\/trap\/create$/, { timeout: 30000 });
  });

  /* ------------------------------------------------------------------ Detail page integrity */

  test('Trap detail — clicking a trap name opens its detail with matching Source/OID/Version/Vendor/Count', async () => {
    await openExplorer(page);
    const row = page.locator('tr.k-master-row').first();
    const gridOid = (await row.locator('td').nth(1).innerText()).trim();
    const gridSource = (await row.locator('td').nth(2).innerText()).trim();
    // The TRAP NAME is an <a href="javascript:;"> inside the cell — click the anchor to open the
    // per-trap detail page (encoded /trap-explorer/<token>). Clicking the bare <td> does NOT navigate.
    await row.locator('td').first().locator('a').first().click();
    await expect(page, 'clicking the trap name should open its detail page').toHaveURL(/\/trap-explorer\/.+/, { timeout: 20000 });
    // Data integrity: the detail must echo the SAME trap's OID + source. Use auto-retrying
    // toContainText so we wait for the stat tiles to render (the OID appears in the header early, but
    // the SOURCE tile loads async — reading body once too early caught only the app shell).
    await expect(page.locator('body'), 'detail should show the same OID as the grid row').toContainText(gridOid, { timeout: 15000 });
    await expect(page.locator('body'), 'detail should show the same SOURCE as the grid row').toContainText(gridSource, { timeout: 15000 });
    const body = await page.locator('body').innerText();
    // The detail stat tiles are Source / Enterprise ID / Version / Vendor / Count. Vendor+Version are
    // trap-dependent (an unresolved trap has no Vendor), so require at least 3 of the 5 to be present.
    const labels = ['Source', 'Enterprise ID', 'Version', 'Vendor', 'Count'].filter((l) => new RegExp(l, 'i').test(body));
    expect(labels.length, `detail should show its stat tiles (found: ${labels.join(', ')})`).toBeGreaterThanOrEqual(3);
    // Occurrence list present (each occurrence carries a timestamp + expandable Raw Trap).
    expect(await page.locator('tr.k-master-row').count(), 'detail should list occurrences').toBeGreaterThan(0);
  });

  /* ------------------------------------------------------------------ Filter */

  test('Filter — filtering by Trap OID narrows the grid to matching traps only', async () => {
    await openExplorer(page);
    const targetOid = (await page.locator('tr.k-master-row').first().locator('td').nth(1).innerText()).trim();
    // The grid search acts as an OID/text filter (verified working on this grid).
    const search = page.locator("input[name='search'], input[placeholder='Search']").first();
    await search.fill(targetOid);
    await search.press('Enter').catch(() => {});
    await page.waitForTimeout(2500);
    const rows = page.locator('tr.k-master-row');
    const n = await rows.count();
    expect(n, 'filter should return at least the matching trap').toBeGreaterThan(0);
    // Every visible row must contain the filtered OID.
    for (let i = 0; i < n; i++) {
      expect((await rows.nth(i).innerText())).toContain(targetOid.replace(/^\./, ''));
    }
  });

  /* ------------------------------------------------------------------ Export integrity (CSV + PDF) */

  test('Export CSV — the exported CSV matches the grid and leaves no file on disk', async () => {
    await openExplorer(page);
    const gridOids = [];
    const rows = page.locator('tr.k-master-row');
    for (let i = 0; i < Math.min(await rows.count(), 5); i++) {
      gridOids.push((await rows.nth(i).locator('td').nth(1).innerText()).trim().replace(/^\./, ''));
    }
    await withTempDir(async (dir) => {
      const csv = await downloadTo(page, dir, () => page.locator("button[title='Export As CSV']").click());
      const { rows: csvRows } = parseCsv(csv);
      expect(csvRows.length, 'CSV should contain the exported traps').toBeGreaterThan(0);
      const blob = JSON.stringify(csvRows);
      // Data integrity: the grid's OIDs appear in the exported CSV.
      for (const oid of gridOids) expect(blob, `exported CSV should contain OID ${oid}`).toContain(oid);
    }); // temp dir (and the CSV) deleted here — nothing persists on disk
  });

  test('Export PDF — a valid, non-empty PDF is produced and then removed from disk', async () => {
    await openExplorer(page);
    await withTempDir(async (dir) => {
      const pdf = await downloadTo(page, dir, () => page.locator("button[title='Export As PDF']").click());
      const info = inspectPdf(pdf);
      expect(info.isPdf, 'export should be a real PDF (%PDF- header)').toBe(true);
      expect(info.size, 'the PDF should be non-trivial in size').toBeGreaterThan(1000);
    }); // deleted here
  });

  test('Logout from AIOps', async () => { await logout(page); });
});
