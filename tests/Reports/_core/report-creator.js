/**
 * Report creation wizard driver — port of creation/create_reports.py.
 *
 * Drives `/reports/create` (the 3-step wizard). Step 1 (category tile) and
 * Step 3 (name + Report Category + Save, capturing the new id from the
 * POST /visualization/reports response) are generic. Step 2 is category-
 * specific and delegated to a handler in CATEGORY_HANDLERS.
 *
 * Auth comes from storageState (setup project), so the Python `login()` is gone.
 */
const { baseUrl } = require('./env.js');
const { gotoBooted, APP_SHELL_SEL } = require('./report.helpers.js');

function combo(name, over = {}) {
  return { name, counters: 1, monitors: 1, counterIndex: 0, rangeIndex: 0, ...over };
}

// Forecast matrix: 3 counters × 2 ranges = 6 reports.
const FORECAST_COMBOS = [0, 1, 2].flatMap((c) =>
  [0, 1].map((r) => combo(`c${c}_r${r}`, { counterIndex: c, rangeIndex: r })),
);

// Metric matrix: 5 counter indices × 2 monitor counts = 10 reports.
const METRIC_COMBOS = [
  combo('c0_1m', { counterIndex: 0, monitors: 1 }),
  combo('c1_1m', { counterIndex: 1, monitors: 1 }),
  combo('c2_1m', { counterIndex: 2, monitors: 1 }),
  combo('c3_1m', { counterIndex: 3, monitors: 1 }),
  combo('c4_1m', { counterIndex: 4, monitors: 1 }),
  combo('c0_3m', { counterIndex: 0, monitors: 3 }),
  combo('c1_3m', { counterIndex: 1, monitors: 3 }),
  combo('c2_3m', { counterIndex: 2, monitors: 3 }),
  combo('c3_3m', { counterIndex: 3, monitors: 3 }),
  combo('c4_3m', { counterIndex: 4, monitors: 3 }),
];

const DEFAULT_COMBOS = [
  combo('1c_1m', { counters: 1, monitors: 1 }),
  combo('1c_Nm', { counters: 1, monitors: 3 }),
  combo('2c_1m', { counters: 2, monitors: 1 }),
  combo('2c_Nm', { counters: 2, monitors: 3 }),
];

const CATEGORY_COMBOS = { forecast: FORECAST_COMBOS, metric: METRIC_COMBOS };

// Category key -> visible label on the ReportTypeSelector (step 1).
// Keys mirror AvailableReportCategories in src/modules/report/helpers/report.js.
const CATEGORY_DISPLAY = {
  metric: 'Performance',
  availability: 'Availability',
  forecast: 'Forecast',
  inventory: 'Inventory',
  audit: 'Audit',
  log: 'Log Analytics',
  flow: 'Flow Analytics',
  'active.alerts': 'Active Alerts',
  polling: 'Polling Data',
  'historical.trend': 'Historical Trend',
  'availability.flap.summary': 'Availability Flap Summary',
  'trace.metric': 'APM',
  'rum.metric': 'RUM',
  'netroute.metric': 'NetRoute',
  'capacity.planning': 'Capacity Planning',
  'capacity.planning.forecast': 'Capacity Forecasting',
  'unhealthy.monitors': 'Unhealthy Monitors',
  trap: 'Trap',
  'log.compliance': 'Log Compliance',
  'nccm.compliance.summary': 'Compliance (Summary)',
  'nccm.compliance.policy': 'Compliance (Policy)',
  'custom.script': 'Custom Script',
  ai: 'AI',
};

// ------------------------------ shared helpers ------------------------------

async function gotoCreate(page) {
  // Boot-aware navigation — same reasoning as creation/wizard.js gotoCreate: a fresh
  // context means a cold SPA boot (~15s), roughly 1 in 4 concurrent boots doesn't finish,
  // and /reports/create sometimes never fires DOMContentLoaded at all. gotoBooted waits on
  // the app shell and re-navigates, so "no tiles" downstream can't be a boot artefact.
  const boot = await gotoBooted(page, `${baseUrl()}/reports/create`);
  if (!boot.booted) {
    throw new Error(
      `App shell never mounted on /reports/create (${APP_SHELL_SEL} not visible) after ` +
        `${boot.attempts} navigation attempt(s) — the SPA bundle failed to load. ` +
        `Last error: ${boot.error ? boot.error.message.split('\n')[0] : 'unknown'}`,
    );
  }
  await page.waitForTimeout(1000);
}

async function clickNext(page) {
  const btn = page.locator('button:has-text("Next")').first();
  if ((await btn.count()) === 0) return false;
  await btn.click();
  await page.waitForTimeout(1500);
  return true;
}

async function selectCategory(page, displayLabel) {
  // The tile auto-advances to step 2 (showReportPreview sets currentStep='2'
  // via setTimeout) — no Next click needed here.
  let tile = page.locator(`.type-card:has-text("${displayLabel}")`).first();
  if ((await tile.count()) === 0) tile = page.locator(`text="${displayLabel}"`).first();
  await tile.click();
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(300);
    if ((await page.locator('.report-type-container').count()) === 0) break;
  }
  await page.waitForTimeout(800);
}

async function waitNoLoader(page, timeoutMs = 10_000) {
  const sel = '.ant-spin-spinning, .v-spinner, .m-loader, .floto-loader, .k-loading-mask, svg.fa-spinner';
  let left = timeoutMs;
  while (left > 0) {
    const visible = await page.evaluate((s) => {
      return Array.from(document.querySelectorAll(s)).some((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
    }, sel);
    if (!visible) return;
    await page.waitForTimeout(250);
    left -= 250;
  }
}

/** Click the FlotoDropdownPicker trigger positioned just below the given label. */
async function openPickerByLabel(page, labelText) {
  const box = await page.evaluate((target) => {
    const norm = (t) => (t || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const key = norm(target);
    for (const l of Array.from(document.querySelectorAll('label'))) {
      if (norm(l.textContent) === key) {
        const r = l.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
    }
    return null;
  }, labelText);
  if (!box) return false;
  await page.mouse.click(box.x + box.width / 2, box.y + 40);
  await page.waitForTimeout(500);
  return true;
}

async function pickFirstOption(page) {
  const opt = page.locator('.scroll-dropdown-menu-item:visible').first();
  if ((await opt.count()) === 0) return false;
  await opt.click();
  await page.waitForTimeout(400);
  return true;
}

async function fillNameAndSave(page, reportName) {
  const name = page.locator('input[placeholder*="Name" i], input[name="name"]').first();
  await name.fill(reportName);
  await page.waitForTimeout(300);

  // Report Category is a FlotoDropdownPicker; anchor off its label's bbox.
  const label = page.locator('label:has-text("Report Category")').first();
  if ((await label.count()) > 0) {
    const box = await label.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + 40);
      await page.waitForTimeout(600);
      const opt = page.locator('.scroll-dropdown-menu-item:visible').first();
      if ((await opt.count()) > 0) {
        await opt.click();
      } else {
        await page.keyboard.type('auto-tests');
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(500);
    }
  }
  await page.locator('button:has-text("Save & Exit"), button:has-text("Save")').first().click();
}

// ------------------------------ id capture ----------------------------------

async function createOneReport(page, categoryKey, c, reportName) {
  const handler = CATEGORY_HANDLERS[categoryKey];
  if (!handler) throw new Error(`No handler registered for category '${categoryKey}'.`);
  const display = CATEGORY_DISPLAY[categoryKey];

  await gotoCreate(page);
  await selectCategory(page, display);

  const picked = {};
  await handler(page, c, picked);

  await clickNext(page); // step 2 → step 3

  // Capture the id from the POST /visualization/reports response.
  const captured = { value: null };
  const onResponse = async (resp) => {
    try {
      if (resp.request().method() !== 'POST') return;
      const url = resp.url();
      if (!url.includes('/visualization/reports')) return;
      if (url.includes('update-category') || url.includes('/schedulers')) return;
      const data = await resp.json().catch(() => null);
      const rid = data && typeof data === 'object' ? data.id ?? (data.result && data.result.id) ?? null : null;
      if (rid && !captured.value) captured.value = rid;
    } catch {
      /* ignore non-JSON / racing responses */
    }
  };
  page.on('response', onResponse);
  try {
    await fillNameAndSave(page, reportName);
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(500);
      if (captured.value) break;
    }
  } finally {
    page.off('response', onResponse);
  }
  return { id: captured.value, picked };
}

// ------------------------------ handlers ------------------------------------

async function metricHandler(page, c, picked) {
  // --- counters ---
  for (let i = 0; i < c.counters; i++) {
    if (i > 0) {
      const add = page.locator('button:has-text("Add Counter"), [title*="Add Counter"]').first();
      if ((await add.count()) > 0) {
        await add.click();
        await page.waitForTimeout(400);
      }
    }
    const counterInput = page.locator('.first-dropdown-div input, [placeholder*="counter" i]').nth(i);
    await counterInput.click();
    await page.waitForTimeout(600);
    const opts = page.locator('.scroll-dropdown-menu-item:visible, .ant-select-item-option:visible, [role="option"]:visible');
    const total = await opts.count();
    if (total) {
      const idx = i === 0 && c.counterIndex < total ? c.counterIndex : 0;
      const target = opts.nth(idx);
      if (i === 0) picked.counter = (await target.innerText().catch(() => `#${idx}`)).trim();
      await target.click();
      await page.waitForTimeout(400);
    }
  }

  // --- Source Filter = Monitor (makes the Source picker render) ---
  let opened = false;
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    const ent = page.locator('[id="entity"]').first();
    if ((await ent.count()) > 0) {
      await ent.click().then(() => (opened = true)).catch(() => {});
    }
    if (!opened) {
      await openPickerByLabel(page, 'Source Filter');
      opened = true;
    }
    try {
      const monitorOpt = page.locator('.scroll-dropdown-menu-item:has-text("Monitor"):visible').first();
      await monitorOpt.waitFor({ state: 'visible', timeout: 3000 });
      await monitorOpt.click();
      picked.source_filter = 'Monitor';
      ok = true;
    } catch {
      opened = false;
      await page.waitForTimeout(400);
    }
  }
  if (!ok) throw new Error('Could not open Source Filter and select Monitor.');
  await page.waitForTimeout(800);
  await waitNoLoader(page, 15_000);

  // --- Source (monitor table popover) ---
  const sourceClicked = await page.evaluate(() => {
    const norm = (t) => (t || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    for (const l of Array.from(document.querySelectorAll('label'))) {
      if (norm(l.textContent) !== 'source') continue;
      let wrap = l.closest('.ant-form-item') || l.parentElement;
      for (let i = 0; i < 6 && wrap; i++) {
        const trig = wrap.querySelector('.ant-select-selector, .floto-dropdown-trigger, .dropdown-trigger, [role="combobox"], input');
        if (trig) {
          const r = trig.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            trig.click();
            return true;
          }
        }
        wrap = wrap.parentElement;
      }
    }
    return false;
  });
  if (!sourceClicked) throw new Error('Could not find Source field dropdown trigger.');
  await page.waitForTimeout(1500);

  /*
   * SCOPE TO THE OPEN POPOVER, and support BOTH picker shapes — identical reasoning to
   * creation/wizard.js selectMonitors():
   *   - the page-wide selectors below used to read the step-2 preview grid BEHIND the picker
   *     (measured: 24 matches with the popover CLOSED), producing a bogus "has rows but 0
   *     checkboxes";
   *   - GRID shape (Monitor/Source Host) puts rows in tbody; LIST shape (Group/Tag) uses <li>
   *     checkboxes with a select-all outside the <li>s.
   */
  const overlays = page.locator('.picker-overlay:visible');
  const gridPop = overlays.filter({ has: page.locator('tbody .ant-checkbox-input') }).last();
  const listPop = overlays.filter({ has: page.locator('li .ant-checkbox-input') }).last();

  let rowCbs = null;
  let selAll = null;
  let cbTotal = 0;
  for (let left = 20_000; left > 0; left -= 300) {
    const gridN = await gridPop.locator('tbody .ant-checkbox-input').count().catch(() => 0);
    if (gridN > 0) {
      cbTotal = gridN;
      rowCbs = gridPop.locator('tbody .ant-checkbox-input');
      selAll = gridPop.locator('thead .ant-checkbox-input, thead input[type="checkbox"]').first();
      break;
    }
    const listN = await listPop.locator('li .ant-checkbox-input').count().catch(() => 0);
    if (listN > 0) {
      cbTotal = listN;
      rowCbs = listPop.locator('li .ant-checkbox-input');
      selAll = listPop.locator('.ant-checkbox-input:not(li .ant-checkbox-input)').first();
      break;
    }
    await page.waitForTimeout(300);
  }
  if (!cbTotal) {
    const text = (await overlays.last().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    throw new Error(
      `Source picker exposed no selectable rows/items within 20s (neither tbody rows nor li items). ` +
        `Overlay text: "${text.slice(0, 200)}"`,
    );
  }
  await waitNoLoader(page, 5000);

  if (c.monitors >= cbTotal) {
    if ((await selAll.count()) > 0) {
      await selAll.click({ force: true });
      await page.waitForTimeout(500);
      picked.monitors = `all (${cbTotal}+ visible)`;
    } else {
      for (let i = 0; i < cbTotal; i++) {
        await rowCbs.nth(i).click({ force: true }).catch(() => {});
        await page.waitForTimeout(80);
      }
      picked.monitors = `${cbTotal} row(s)`;
    }
  } else {
    const want = Math.min(c.monitors, cbTotal);
    for (let i = 0; i < want; i++) {
      await rowCbs.nth(i).click({ force: true }).catch(() => {});
      await page.waitForTimeout(150);
    }
    picked.monitors = `${want} row(s)`;
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // --- wait for preview to render (Next becomes clickable once valid) ---
  // Same drift as creation/wizard.js: .widget-preview / .preview-rendered / .chart-container
  // do not exist on this build (measured 0 matches with a chart on screen), so this always
  // reported 'timeout' after burning the full budget. Real containers verified live:
  // .widget-view wrapping a Highcharts SVG, or a Kendo/ant grid for Grid/Top-N widgets.
  try {
    await page
      .locator(
        '.widget-view .highcharts-container, .widget-view svg, .widget-view canvas, ' +
          '.widget-view .k-grid-content tr, .widget-view .ant-table-tbody tr',
      )
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
    picked.preview = 'rendered';
  } catch {
    picked.preview = 'timeout';
  }
}

async function activeAlertsHandler(page) {
  // No counter/monitor picker — step 2 is empty and the widget is immediately
  // valid after category selection. Let async load settle.
  await page.waitForTimeout(800);
}

async function forecastHandler(page, c, picked) {
  // --- Counter (pick by index) ---
  const counterInput = page.locator('.first-dropdown-div input, [placeholder*="Select Counter" i]').first();
  await counterInput.click();
  await page.waitForTimeout(600);
  const opts = page.locator('.scroll-dropdown-menu-item:visible');
  const total = await opts.count();
  if (total) {
    const idx = c.counterIndex < total ? c.counterIndex : 0;
    const target = opts.nth(idx);
    picked.counter = (await target.innerText().catch(() => `#${idx}`)).trim();
    await target.click();
    await page.waitForTimeout(500);
  }

  // --- Source Filter (first option) ---
  if (await openPickerByLabel(page, 'Source Filter')) await pickFirstOption(page);
  await waitNoLoader(page, 15_000);
  await page.waitForTimeout(500);

  // --- Source (Select All in the monitor table) ---
  if (await openPickerByLabel(page, 'Source')) {
    for (let i = 0; i < 30; i++) {
      const rows = await page.locator('.ant-table-tbody tr:visible, tbody tr:visible').count();
      if (rows > 0) break;
      await page.waitForTimeout(300);
    }
    await waitNoLoader(page, 5000);
    const selAll = page.locator('.ant-table-thead input[type="checkbox"]:visible, thead input[type="checkbox"]:visible').first();
    if ((await selAll.count()) > 0) {
      await selAll.click();
      await page.waitForTimeout(500);
    } else {
      const firstCb = page.locator('.ant-table-tbody input[type="checkbox"]:visible, tbody input[type="checkbox"]:visible').first();
      if ((await firstCb.count()) > 0) {
        await firstCb.click();
        await page.waitForTimeout(400);
      }
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // --- Analyze range (pick by index; 0 = default 1 Week) ---
  if (c.rangeIndex !== 0) {
    if (await openPickerByLabel(page, 'Analyze the forecast range within the next')) {
      const rangeOpts = page.locator('.scroll-dropdown-menu-item:visible');
      const n = await rangeOpts.count();
      if (n) {
        const idx = c.rangeIndex < n ? c.rangeIndex : 0;
        const target = rangeOpts.nth(idx);
        picked.range = (await target.innerText().catch(() => `#${idx}`)).trim();
        await target.click();
        await page.waitForTimeout(400);
      }
    }
  } else {
    picked.range = '1 Week (default)';
  }
}

const CATEGORY_HANDLERS = {
  metric: metricHandler,
  'active.alerts': activeAlertsHandler,
  forecast: forecastHandler,
};

/** Resolve the combo list for a category, sliced to minimal (1) or full. */
function combosFor(category, mode) {
  const all = CATEGORY_COMBOS[category] || DEFAULT_COMBOS;
  return mode === 'minimal' ? all.slice(0, 1) : all;
}

/**
 * Create every combo for a category. Returns the reports that got an id back
 * (skips + logs combos that error, matching the Python's continue-on-error).
 */
async function createReports(page, category, combos, stamp, onLog = () => {}) {
  if (!CATEGORY_DISPLAY[category]) throw new Error(`Unknown category key '${category}'.`);
  const out = [];
  for (const c of combos) {
    const name = `auto-${category}-${c.name}-${stamp}`;
    onLog(`creating: ${name}`);
    try {
      const { id, picked } = await createOneReport(page, category, c, name);
      if (id) {
        out.push({ id, category, name, combo: c.name, picked });
        onLog(`  id=${id}  ${Object.entries(picked).map(([k, v]) => `${k}=${v}`).join(', ')}`);
      } else {
        onLog('  no id captured');
      }
    } catch (e) {
      onLog(`  error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return out;
}

module.exports = {
  combo,
  FORECAST_COMBOS,
  METRIC_COMBOS,
  DEFAULT_COMBOS,
  CATEGORY_COMBOS,
  CATEGORY_DISPLAY,
  CATEGORY_HANDLERS,
  combosFor,
  createReports,
};
