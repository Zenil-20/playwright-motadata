/**
 * Creation-matrix wizard driver — shared primitives for the NEW creation
 * automation (report-creation-matrix.spec.js). Deliberately separate from
 * _core/report-creator.js (the original 3-category creator) so the existing
 * automation stays untouched.
 *
 * Drives /reports/create (the 3-step wizard):
 *   step 1  category tile — auto-advances (showReportPreview sets currentStep=2
 *           via setTimeout); NEVER click Next here, it is permanently disabled.
 *   step 2  category-specific fields — handlers in categories.js compose the
 *           building blocks below (counter picker, source filter, monitor
 *           table, radios, label-anchored dropdowns).
 *   step 3  name + Report Category + Save, capturing the backend id from the
 *           POST /visualization/reports response.
 *
 * Selector knowledge comes from .claude/agents/report-creator.md (the category
 * reference derived from ../UI/src/modules/report/components/*).
 */
const { baseUrl } = require('../env.js');
const { gotoBooted, APP_SHELL_SEL } = require('../report.helpers.js');

const OPTION_SEL = '.scroll-dropdown-menu-item:visible, .ant-select-item-option:visible, [role="option"]:visible';

/** Category tile not present on this instance's create page. */
class TileMissingError extends Error {
  constructor(label) {
    super(`Category tile "${label}" not found on /reports/create — not available on this instance.`);
    this.name = 'TileMissingError';
  }
}

/**
 * The SPA never mounted, or mounted but rendered NO tiles at all.
 *
 * Kept strictly separate from TileMissingError. Both used to collapse into "not
 * available on this instance", which silently SKIPPED whole categories when the
 * real cause was a blank page — the single biggest source of false results in this
 * suite. An empty page is a failure to report, not a category to skip.
 */
class AppShellError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'AppShellError';
  }
}

/** Scenario can't run here (missing fixture, e.g. no sample script) — skip, not fail. */
class SkipScenarioError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'SkipScenarioError';
  }
}

// ------------------------------ navigation ----------------------------------

async function gotoCreate(page) {
  // Boot-aware navigation: a fresh context means a cold SPA boot (~15s), and roughly
  // 1 in 4 concurrent boots doesn't complete — leaving a blank page with zero tiles.
  // gotoBooted re-navigates until the shell is up (a ~3s recovery, chunks cached),
  // so "no tiles" downstream can only mean the grid itself was empty.
  const boot = await gotoBooted(page, `${baseUrl()}/reports/create`);
  if (!boot.booted) {
    throw new AppShellError(
      `App shell never mounted on /reports/create (${APP_SHELL_SEL} not visible) after ` +
        `${boot.attempts} navigation attempt(s) — the SPA bundle failed to load. ` +
        `Last error: ${boot.error ? boot.error.message.split('\n')[0] : 'unknown'}`,
    );
  }
  // Small settle so the tile grid's own async render can start.
  await page.waitForTimeout(1000);
}

/**
 * Click the step-1 tile whose text matches `label`. Several tile titles are
 * substrings of each other ("Availability" / "Availability Status" /
 * "Availability Flap Summary", "Forecast" / "Capacity Forecasting"), so a
 * bare :has-text() would hit the wrong card — instead pick the matching card
 * with the SHORTEST text (the most specific one).
 * Returns false when no tile matches (category not on this instance).
 */
/** True when the step-2 "Next" button exists and is enabled (widget is valid). */
async function isNextEnabled(page) {
  return page
    .evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) =>
        /^next$/i.test((x.textContent || '').trim()),
      );
      return !!b && !b.disabled;
    })
    .catch(() => false);
}

async function tilesVisible(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.type-card, [class*="type-card"]')).some((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }),
  );
}

/**
 * Block until the step-2 criteria form is actually USABLE, not merely mounted.
 * The form mounts its labels first and populates each picker's options from
 * async calls a beat later. A handler that starts filling in that gap silently
 * gets nulls — pickers "open" with no options, setSourceFilter finds no
 * "Monitor", the source table reports 0 rows — and the run fails with a
 * misleading "field missing" instead of "not loaded yet". Observed flipping
 * between passing and failing across identical consecutive runs, which is
 * exactly the flake that shows up under multi-worker load.
 */
async function waitStep2Ready(page, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  // 1. at least one criteria label rendered
  while (Date.now() < deadline) {
    const labels = await page
      .evaluate(() => document.querySelectorAll('label').length)
      .catch(() => 0);
    if (labels > 0) break;
    await page.waitForTimeout(250);
  }
  // 2. no spinner still resolving the pickers' option sets
  await waitNoLoader(page, Math.max(0, deadline - Date.now()));
  // 3. small settle so option lists are attached before the handler opens them
  await page.waitForTimeout(800);
}

async function selectCategoryTile(page, label) {
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const key = norm(label);
  const cards = page.locator('.type-card, [class*="type-card"]');
  // The tile grid renders asynchronously after /reports/create loads; count it
  // only once at least one tile is on screen, else we mis-report every category
  // as "not on this instance".
  await cards.first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
  const n = await cards.count();
  // ZERO tiles with a booted shell is a broken page, NOT a missing category. Measured
  // on this instance a healthy create page renders 18 tiles, so 0 can never be a real
  // "this category isn't installed" answer — raise it instead of skipping the category.
  if (n === 0) {
    throw new AppShellError(
      'The /reports/create tile grid rendered 0 tiles even though the app shell mounted — ' +
        'the create page failed to load its report types (expected ~18 tiles).',
    );
  }
  /*
   * Match on WHOLE WORDS, preferring an exact label match.
   *
   * A bare `txt.includes(key)` silently selects the WRONG tile whenever one label is a
   * substring of another word: the `ai` category (label "AI") matched "Av-AI-lability",
   * so it clicked the Availability tile and then failed with the baffling "AI requirement
   * input not found" — five scenarios blamed on a missing input when the wizard was simply
   * on the wrong report type. (Measured: this instance exposes 18 tiles and has no AI tile,
   * so the honest answer is "not available here".)
   *
   * Order: exact normalised equality first, then whole-word containment (so "Trap" still
   * finds "Trap Events" and "Availability" still prefers itself over "Availability Flap
   * Summary" via the shortest-text tie-break). Never a bare substring.
   */
  const labels = [];
  for (let i = 0; i < n; i++) labels.push(norm(await cards.nth(i).innerText().catch(() => '')));

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRe = new RegExp(`(^|\\W)${escapeRe(key)}(\\W|$)`);

  let bestIdx = labels.findIndex((t) => t === key);
  if (bestIdx < 0) {
    let bestLen = Infinity;
    labels.forEach((txt, i) => {
      if (!wordRe.test(txt)) return;
      if (txt.length < bestLen) {
        bestLen = txt.length;
        bestIdx = i;
      }
    });
  }
  if (bestIdx < 0) return false;
  const card = cards.nth(bestIdx);
  // Use a REAL element click (auto-scrolls into view) — a raw mouse.click at the
  // card's viewport coordinate silently misses tiles below the fold (Historical
  // Trend, Metric Alerts, NCCM, NetRoute), so step 1 never advances and every
  // downstream step-2 field looks "missing". Retry once if the grid doesn't
  // detach (a fast re-render can eat the first click).
  for (let attempt = 0; attempt < 2; attempt++) {
    await card.scrollIntoViewIfNeeded().catch(() => {});
    await card.click().catch(() => {});
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(250);
      if (!(await tilesVisible(page))) {
        await waitStep2Ready(page);
        return true; // advanced to step 2 AND its form is populated
      }
    }
  }
  // Clicked but never advanced — report as not-selectable so the caller fails loudly.
  return false;
}

// ------------------------------ generic waits --------------------------------

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

/**
 * Wait for the step-2 preview to paint (chart svg/canvas or grid rows).
 *
 * The previous selector list (.widget-preview / .preview-rendered / .chart-container)
 * matched NOTHING on this build — measured 0 elements for all three while a chart was
 * plainly on screen. Every scenario therefore reported preview=timeout, including all
 * the ones that passed, and each burned the full 45s budget: ~107 minutes of dead
 * wall-clock across the 143-scenario matrix.
 *
 * The real containers, verified live on step 2 (each count()===1): the widget wrapper
 * `.widget-view`, holding a Highcharts SVG (`.highcharts-container`) for chart widget
 * types, or a Kendo/ant grid for Grid and Top-N types.
 */
const PREVIEW_SEL =
  '.widget-view .highcharts-container, .widget-view svg, .widget-view canvas, ' +
  '.widget-view .k-grid-content tr, .widget-view .ant-table-tbody tr';

async function waitPreviewRendered(page, timeoutMs = 45_000) {
  try {
    await page.locator(PREVIEW_SEL).first().waitFor({ state: 'visible', timeout: timeoutMs });
    return 'rendered';
  } catch {
    return 'timeout';
  }
}

// ------------------------------ pickers --------------------------------------

/** Click the FlotoDropdownPicker trigger just below the exact-text label. */
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

/** Pick one visible dropdown option (by index or by exact-ish text). Returns its text. */
async function pickOption(page, { index = 0, text = null, waitMs = 8000 } = {}) {
  let opt;
  if (text) {
    opt = page.locator(`.scroll-dropdown-menu-item:has-text("${text}"):visible, .ant-select-item-option:has-text("${text}"):visible`).first();
  } else {
    // An opened picker paints its menu before the async option set lands, so a
    // single count() reads 0 and silently returns null (the field looks
    // "unfillable"). Poll briefly for options to attach instead.
    const opts = page.locator(OPTION_SEL);
    let n = 0;
    const deadline = Date.now() + waitMs;
    do {
      n = await opts.count().catch(() => 0);
      if (n) break;
      await page.waitForTimeout(250);
    } while (Date.now() < deadline);
    if (!n) return null;
    opt = opts.nth(index < n ? index : 0);
  }
  if ((await opt.count()) === 0) return null;
  const label = (await opt.innerText().catch(() => '')).trim();
  await opt.click();
  await page.waitForTimeout(400);
  return label || `#${index}`;
}

/** Multi-select dropdown: click several options, then Escape to close. */
async function pickOptions(page, indices) {
  const picked = [];
  for (const i of indices) {
    const opts = page.locator(OPTION_SEL);
    const n = await opts.count();
    if (!n) break;
    const opt = opts.nth(i < n ? i : 0);
    picked.push((await opt.innerText().catch(() => `#${i}`)).trim());
    await opt.click();
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  return picked;
}

/** Click an `as-button` radio option by its exact visible text (e.g. "Time Based"). */
async function setRadioByText(page, optionText) {
  const clicked = await page.evaluate((target) => {
    const norm = (t) => (t || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const key = norm(target);
    for (const el of Array.from(document.querySelectorAll('label, .ant-radio-button-wrapper, button'))) {
      if (norm(el.textContent) === key) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el.click();
          return true;
        }
      }
    }
    return false;
  }, optionText);
  if (clicked) await page.waitForTimeout(600);
  return clicked;
}

/** Fill a text input that sits under the exact-text label. */
async function fillInputByLabel(page, labelText, value) {
  const box = await page.evaluate((target) => {
    const norm = (t) => (t || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const key = norm(target);
    for (const l of Array.from(document.querySelectorAll('label'))) {
      if (norm(l.textContent) !== key) continue;
      let wrap = l.closest('.ant-form-item') || l.parentElement;
      for (let i = 0; i < 6 && wrap; i++) {
        const input = wrap.querySelector('input:not([type="checkbox"]):not([type="radio"]), textarea');
        if (input) {
          const r = input.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }
        wrap = wrap.parentElement;
      }
    }
    return null;
  }, labelText);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  await page.keyboard.press('Control+a');
  await page.keyboard.type(String(value));
  await page.waitForTimeout(300);
  return true;
}

// ------------------------------ counters -------------------------------------

/**
 * Pick a counter into dropdown slot `slot` (0-based). For slot > 0, clicks the
 * Add Counter button first. Returns the picked option's text.
 */
async function pickCounter(page, { slot = 0, index = 0 } = {}) {
  if (slot > 0) {
    const add = page.locator('button:has-text("Add Counter"), [title*="Add Counter"]').first();
    if ((await add.count()) > 0) {
      await add.click();
      await page.waitForTimeout(400);
    }
  }
  // Prefer the field actually LABELLED "Counters" over the first dropdown on the
  // form. Not every category puts the counter first — Availability's step 2 is
  // [Availability By, Counters, Source Filter, Source, Result By], so selecting
  // slot 0 positionally sets "Availability By" (picking a value like "monitor"
  // instead of "monitor.uptime.percent"), silently leaves Counters empty, and
  // the widget never validates. Positional stays as the fallback for categories
  // whose counter field carries no matching label.
  if (slot === 0) {
    for (const lbl of ['Counters', 'Counter']) {
      if (await openPickerByLabel(page, lbl)) {
        const picked = await pickOption(page, { index });
        if (picked) {
          await page.waitForTimeout(400);
          return picked;
        }
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(200);
      }
    }
  }
  const input = page.locator('.first-dropdown-div input, [placeholder*="counter" i]').nth(slot);
  if ((await input.count()) === 0) return null;
  await input.click();
  await page.waitForTimeout(600);
  const opts = page.locator(OPTION_SEL);
  const n = await opts.count();
  if (!n) return null;
  const target = opts.nth(index < n ? index : 0);
  const label = (await target.innerText().catch(() => `#${index}`)).trim();
  await target.click();
  await page.waitForTimeout(400);
  return label;
}

// ------------------------------ source ---------------------------------------

/**
 * Set the Source Filter / entity-type dropdown (Monitor / Group / Tag /
 * Source Host / Source Type / …). Tries the #entity trigger first, then the
 * label-anchored click. Retries — the picker can race the async counter load.
 */
async function setSourceFilter(page, optionText) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let opened = false;
    const ent = page.locator('[id="entity"]').first();
    if ((await ent.count()) > 0) {
      await ent.click().then(() => (opened = true)).catch(() => {});
    }
    if (!opened) opened = await openPickerByLabel(page, 'Source Filter');
    if (!opened) opened = await openPickerByLabel(page, 'Entity');
    try {
      const opt = page.locator(`.scroll-dropdown-menu-item:has-text("${optionText}"):visible`).first();
      await opt.waitFor({ state: 'visible', timeout: 3000 });
      await opt.click();
      await page.waitForTimeout(800);
      await waitNoLoader(page, 15_000);
      return true;
    } catch {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  return false;
}

/**
 * True when the step-2 form renders a visible field label matching any of `names`.
 * Used to tell "this category HAS a Source Filter and we failed to set it" (a real error)
 * apart from "this category has no Source Filter at all" (nothing to set).
 */
async function hasFieldLabel(page, names) {
  const wanted = names.map((s) => s.toLowerCase());
  return page
    .evaluate((keys) => {
      const norm = (t) => (t || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      return Array.from(document.querySelectorAll('label')).some((l) => {
        const r = l.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && keys.includes(norm(l.textContent));
      });
    }, wanted)
    .catch(() => false);
}

/** Open the Source picker (exact "Source" label — NOT "Source Filter") popover. */
async function openSourceTable(page) {
  const clicked = await page.evaluate(() => {
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
  if (!clicked) return false;
  await page.waitForTimeout(1500);
  return true;
}

/**
 * Tick monitor rows in the open Source table (Kendo grid or ant-table — both
 * appear in the wizard depending on the group component). `monitors` is a
 * number, or 'all' for the header Select All checkbox. Returns a description.
 */
async function selectMonitors(page, monitors = 1) {
  /*
   * SCOPE EVERYTHING TO THE OPEN POPOVER.
   *
   * The step-2 form renders its own preview grid behind the picker, so the old
   * page-wide selectors counted the BACKGROUND grid's rows. Measured: with the
   * popover shut, `.k-grid-content tr` still matches 24 rows. So when the Source
   * list came up empty, the helper found "rows" (the preview's) but no checkboxes
   * and reported "Source table has rows but 0 checkboxes" — describing a table it
   * was never supposed to be looking at. This is the project's documented
   * source-picker gotcha: scope to the visible popover or the background wins.
   *
   * `.picker-overlay` nests (an inner wrapper repeats the same box), so filtering on
   * "has row checkboxes" and taking .last() is what pins this to exactly ONE element
   * — verified count()===1 with 28 row checkboxes + 1 header checkbox.
   */
  /*
   * The Source picker has TWO shapes, and which one you get depends on Source Filter:
   *
   *   GRID  (Monitor, Source Host, …) — a Kendo/ant table: rows in `tbody`, select-all in `thead`.
   *   LIST  (Group, Tag)             — a flat <li> checkbox list with its own "Select All"
   *                                    checkbox that sits OUTSIDE the <li>s.
   *
   * Only the grid shape used to be handled, so every Group/Tag scenario found 0 rows and was
   * reported as "no sources available on this instance". That was FALSE: measured live, Group
   * offers 38 selectable groups (Server, Network, Database, …) and Tag offers its own list
   * (kpi:high cpu, os:ubuntu linux, …). Verified counts: 38 <li> items + exactly 1 select-all,
   * and clicking select-all checks all 38.
   */
  const overlays = page.locator('.picker-overlay:visible');
  const gridPop = overlays.filter({ has: page.locator('tbody .ant-checkbox-input') }).last();
  const listPop = overlays.filter({ has: page.locator('li .ant-checkbox-input') }).last();

  /** @type {'grid'|'list'|null} */
  let shape = null;
  let itemCbs = null;
  let selAll = null;
  let cbTotal = 0;

  for (let left = 20_000; left > 0; left -= 300) {
    const gridN = await gridPop.locator('tbody .ant-checkbox-input').count().catch(() => 0);
    if (gridN > 0) {
      shape = 'grid';
      cbTotal = gridN;
      itemCbs = gridPop.locator('tbody .ant-checkbox-input');
      selAll = gridPop.locator('thead .ant-checkbox-input, thead input[type="checkbox"]').first();
      break;
    }
    const listN = await listPop.locator('li .ant-checkbox-input').count().catch(() => 0);
    if (listN > 0) {
      shape = 'list';
      cbTotal = listN;
      itemCbs = listPop.locator('li .ant-checkbox-input');
      // The select-all is the one checkbox in the overlay that is NOT inside an <li>.
      selAll = listPop.locator('.ant-checkbox-input:not(li .ant-checkbox-input)').first();
      break;
    }
    await page.waitForTimeout(300);
  }

  if (!shape) {
    // Report the picker's ACTUAL contents so an unrecognised shape is diagnosable and can
    // never again be silently mislabelled "no sources on this instance".
    const seen = await page
      .locator('.picker-overlay:visible')
      .last()
      .innerText()
      .catch(() => '');
    const text = seen.replace(/\s+/g, ' ').trim();
    if ((await overlays.count().catch(() => 0)) === 0) {
      throw new Error('Source picker popover did not open (no visible .picker-overlay).');
    }
    const anyCb = await overlays.locator('.ant-checkbox-input').count().catch(() => 0);
    if (anyCb > 0) {
      // It HAS selectable things, just not in a shape we know — that is our bug, so fail loudly.
      throw new Error(
        `Source picker opened with ${anyCb} checkbox(es) but in an unrecognised layout ` +
          `(neither "tbody" rows nor "li" items). Overlay text: "${text.slice(0, 200)}"`,
      );
    }
    if (!text || /no data|no record|no results|nothing to show/i.test(text)) {
      throw new SkipScenarioError(
        `Source picker opened and is genuinely empty for this counter/filter (overlay text: "${text.slice(0, 120)}").`,
      );
    }
    throw new Error(
      `Source picker opened but exposed no selectable control. Overlay text: "${text.slice(0, 200)}"`,
    );
  }

  await waitNoLoader(page, 5000);
  const rowCbs = itemCbs;

  // Label the shape in the recorded value — a Group/Tag scenario picking "3 item(s)" from a
  // list is a different thing from a Monitor scenario picking "3 row(s)" from a grid, and the
  // creation report is much easier to audit when it says which.
  const unit = shape === 'list' ? 'item' : 'row';
  let picked;
  if (monitors === 'all' || monitors >= cbTotal) {
    if ((await selAll.count()) > 0) {
      await selAll.click({ force: true });
      await page.waitForTimeout(500);
      picked = `all (${cbTotal}+ ${unit}s visible, ${shape})`;
    } else {
      for (let i = 0; i < cbTotal; i++) {
        await rowCbs.nth(i).click({ force: true }).catch(() => {});
        await page.waitForTimeout(80);
      }
      picked = `${cbTotal} ${unit}(s)`;
    }
  } else {
    const want = Math.min(monitors, cbTotal);
    for (let i = 0; i < want; i++) {
      await rowCbs.nth(i).click({ force: true }).catch(() => {});
      await page.waitForTimeout(150);
    }
    picked = `${want} ${unit}(s)`;
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  return picked;
}

// ------------------------------ step transitions -----------------------------

/**
 * Wait for the step-2 Next button to enable (isWidgetValid after preview, or
 * canAlwaysSave categories where it never disables), then click through to
 * step 3 (name input visible).
 */
async function clickNextWhenEnabled(page, timeoutMs = 60_000) {
  const next = page.locator('button:has-text("Next")').first();
  let left = timeoutMs;
  while (left > 0) {
    if ((await next.count()) > 0) {
      const disabled = await next.evaluate((b) => b.disabled || b.classList.contains('ant-btn-disabled') || b.getAttribute('aria-disabled') === 'true').catch(() => true);
      if (!disabled) break;
    }
    await page.waitForTimeout(500);
    left -= 500;
  }
  if (left <= 0) throw new Error(`Next button still disabled after ${timeoutMs / 1000}s — a required step-2 field is missing or the preview never validated.`);

  /*
   * Click Next until step 3 actually appears.
   *
   * The old code clicked once, waited 10s, then clicked once more. That still lost the
   * save-first categories (availability.flap.summary, historical.trend,
   * nccm.compliance.policy): their Next is NEVER disabled, so the enable-wait above returns
   * instantly and the click can land while the source popover is still closing — the app
   * swallows it and step 3 never arrives. Observed on flap-summary scenario "1m" (the other
   * 5 scenarios passed), i.e. a first-click timing flake, not a missing field.
   *
   * Settling the loader before each attempt and confirming advancement by the step-3 Name
   * input makes a swallowed click a retry instead of a failed scenario.
   */
  const name = page.locator('input[placeholder*="Name" i], input[name="name"]').first();
  for (let attempt = 1; attempt <= 3; attempt++) {
    await waitNoLoader(page, 5000);
    await next.click().catch(() => {});
    try {
      await name.waitFor({ state: 'visible', timeout: 10_000 });
      await page.waitForTimeout(500);
      return;
    } catch {
      /* click was swallowed (or the step is still transitioning) — try again */
    }
  }
  throw new Error(
    'Clicked Next 3 times but step 3 never rendered (no Report Name input) — the wizard did not advance.',
  );
}

async function fillNameAndSave(page, reportName) {
  const name = page.locator('input[placeholder*="Name" i], input[name="name"]').first();
  await name.fill(reportName);
  await page.waitForTimeout(300);

  // Report Category is required — FlotoDropdownPicker anchored off its label.
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
        await page.keyboard.type('auto-created');
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(500);
    }
  }
  await page.locator('button:has-text("Save & Exit"), button:has-text("Save")').first().click();
}

// ------------------------------ create one -----------------------------------

/**
 * Full 3-step creation of one report. `catCfg` = { label, handler, nextTimeout? }
 * from categories.js. Returns { id, picked }; id is null when the POST never
 * came back (form validation error etc.).
 *
 * `ctx.shotPath` — when set, a full-page screenshot of the filled step-2 form
 * (preview on screen) is saved there; the creation HTML reporter renders it.
 */
async function createOne(page, catCfg, scenario, reportName, ctx = {}) {
  await gotoCreate(page);
  const found = await selectCategoryTile(page, catCfg.label);
  if (!found) throw new TileMissingError(catCfg.label);

  const picked = {};
  await catCfg.handler(page, scenario, picked, ctx);

  if (ctx.shotPath) {
    await page.screenshot({ path: ctx.shotPath, fullPage: true }).catch(() => {});
  }

  await clickNextWhenEnabled(page, catCfg.nextTimeout || 60_000);

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
    for (let i = 0; i < 50; i++) {
      await page.waitForTimeout(500);
      if (captured.value) break;
    }
  } finally {
    page.off('response', onResponse);
  }
  return { id: captured.value, picked };
}

module.exports = {
  TileMissingError,
  SkipScenarioError,
  AppShellError,
  gotoCreate,
  selectCategoryTile,
  waitNoLoader,
  waitPreviewRendered,
  openPickerByLabel,
  pickOption,
  pickOptions,
  setRadioByText,
  fillInputByLabel,
  pickCounter,
  setSourceFilter,
  openSourceTable,
  hasFieldLabel,
  selectMonitors,
  isNextEnabled,
  clickNextWhenEnabled,
  fillNameAndSave,
  createOne,
};
