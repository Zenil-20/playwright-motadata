/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-13
 *
 * Shared, dashboard-agnostic widget helpers for every default/system dashboard
 * spec (APM Statistics, and every dashboard added later under tests/Dashboard/).
 * Nothing in this file references a specific dashboard, widget title, or column
 * name — that data lives in each dashboard's own spec file, passed into
 * dashboard.suiteFactory.js. A fix here (e.g. the kebab-menu-close race) only
 * has to happen once for every dashboard that uses it.
 *
 * Every helper here was worked out and verified live against the APM Statistics
 * dashboard (see ai-test-pipeline/cookbook/selector-cookbook.md, section 1.2) —
 * moving it here is a pure refactor, not a re-verification. A NEW dashboard using
 * these helpers still needs its OWN widget titles/columns verified live before
 * being wired into a suite (see dashboard.suiteFactory.js's usage notes).
 */

import { expect } from '@playwright/test';
import { NUMERIC_VALUE } from './dashboardSuite.constants.js';

export function widgetByTitle(page, title) {
  return page.locator('.widget-view').filter({ has: page.locator(`[title="${title}"]`) });
}

/**
 * Wait until the dashboard's widgets are ALL loaded — not just the first one mounted, which is
 * all the old `.widget-view.first()` wait proved. Verified live: the app renders a
 * `.motadata-loader` spinner in TWO places while a dashboard is settling — one page-level
 * instance during the dashboard-shell fetch, then one INSIDE each `.widget-view` while that
 * widget fetches its own data. As each widget's data arrives its spinner clears, so the live
 * loader count ticks DOWN toward zero.
 *
 * We do NOT wait for the count to strictly reach zero: verified live that some widgets can stay
 * stuck on their spinner indefinitely on a slow/degraded environment (e.g. 4 Flow Summary
 * widgets held their loader for 16s+ while the rest of the dashboard finished). Blocking for
 * zero there just burns the whole timeout on every re-navigation. Instead we wait for the loader
 * count to STABILISE — return the instant it hits zero (healthy env, ~2-3s), OR as soon as it
 * has stopped dropping for `dwellMs` (the remaining loaders are stuck, not still-arriving), so a
 * permanently-stuck widget costs ~`dwellMs`, not the full timeout. Whatever's still spinning is
 * then reported by name by validateAllWidgetsLoaded.
 *
 * @returns {Promise<number>} the number of mounted widgets once the dashboard has settled
 */
export async function waitForAllWidgetsLoaded(page, { timeout = 30000, dwellMs = 3000 } = {}) {
  await page.locator('.widget-view').first().waitFor({ state: 'visible', timeout: Math.min(timeout, 30000) });
  const loaders = page.locator('.motadata-loader');
  const deadline = Date.now() + timeout;
  let lastCount = -1;
  let stableSince = Date.now();
  while (Date.now() < deadline) {
    const n = await loaders.count().catch(() => 0);
    if (n === 0) {
      // Re-check after a short settle to skip the transient frame where widgets have mounted but
      // their per-widget spinners haven't attached yet (a false "0 loaders" a tick too early).
      await page.waitForTimeout(400);
      if ((await loaders.count().catch(() => 0)) === 0) break;
      continue;
    }
    if (n !== lastCount) {
      lastCount = n;
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= dwellMs) {
      break; // loader count stopped dropping — the rest are stuck, don't wait out the timeout
    }
    await page.waitForTimeout(300);
  }
  return page.locator('.widget-view').count();
}

/**
 * Explicit, reported validation that EVERY widget on the dashboard finished loading. Waits for
 * the settled state (above), then double-checks each mounted widget actually rendered real
 * content — a chart svg/canvas, a grid table, a tile/group numeric value, or the "No data found"
 * empty state — and soft-fails listing, by title, any widget still blank (loader gone but nothing
 * drawn). Records the widget count as a report annotation so the run shows how many loaded.
 *
 * @returns {Promise<number>} widget count, or -1 if the dashboard never reached the settled state
 */
export async function validateAllWidgetsLoaded(page, testInfo) {
  let count;
  try {
    count = await waitForAllWidgetsLoaded(page);
  } catch {
    count = -1;
  }
  const blank = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.widget-view').forEach((w) => {
      const hasLoader = !!w.querySelector('.motadata-loader');
      const hasContent =
        !!w.querySelector('svg, canvas, table, .metro-tile-value, .numeric-value, .row.py-2') ||
        /No data found/.test(w.textContent || '');
      if (hasLoader || !hasContent) {
        const t = w.querySelector('[title]');
        out.push(t ? t.getAttribute('title') : '(untitled widget)');
      }
    });
    return out;
  });
  if (testInfo) {
    testInfo.annotations.push({
      type: 'WIDGETS LOADED',
      description: count >= 0 ? `${count - blank.length}/${count} widgets loaded` : 'dashboard never settled',
    });
  }
  expect.soft(blank, 'Widgets that never finished loading (spinner stuck or blank)').toEqual([]);
  return count;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * scrollIntoViewIfNeeded() waits for the element to be stable (bounding box unchanged across
 * frames) before scrolling. A widget stuck on a loading shimmer/skeleton never stabilizes, so
 * a plain call can block for the full default action timeout. Bound it to a short timeout and
 * swallow failure — worst case the widget just isn't scrolled fully into view, which the
 * following visibility/content assertions (their own waits) will surface on their own terms.
 */
export async function safeScroll(locator) {
  await locator.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => {});
}

/**
 * The widget grid virtualizes/unmounts panels that scroll far from view — jumping between
 * many widget titles in a fixed (non-visual-order) sequence can catch a widget that was
 * mounted a moment ago but has since been torn down again, or one that hasn't finished
 * mounting yet after its own scrollIntoViewIfNeeded resolves. A single scroll + single
 * visibility check can flat-out fail with "element(s) not found" even though the widget is
 * genuinely on the dashboard (reproduced live: re-querying the same title moments later finds
 * it immediately). Retry the whole scroll+check a few times before giving up, instead of
 * trusting the first attempt.
 */
async function scrollAndWaitVisible(locator, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    await safeScroll(locator);
    const visible = await locator.isVisible().catch(() => false);
    if (visible) return true;
    await locator.page().waitForTimeout(500);
  }
  return false;
}

/**
 * Widgets fetch their result asynchronously after mount, so checking .count() the instant
 * scrollIntoViewIfNeeded() resolves can catch a widget mid-flight — neither its populated
 * content nor its "No data found" empty state has rendered yet. Race both outcomes (same
 * pattern as ensureListView in fixtures/auth.js) so we wait for whichever appears first
 * instead of guessing from an instantaneous count().
 */
export async function waitForEitherState(...locators) {
  await Promise.race(locators.map((l) => l.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})));
}

/**
 * Empty widgets are collected per-test into an array and asserted ONCE at the very end of the
 * dashboard's single test (see dashboard.suiteFactory.js) rather than via an individual
 * expect.soft(false, ...) call per widget. The latter reliably triggered a multi-minute stall
 * whenever it ran right after one that hit it — reproduced across different widget/test
 * combinations, so it's a property of that specific "soft-assert a bare boolean" pattern repeated
 * in a loop, not of any one widget. Collecting into an array and asserting once avoids it.
 */
export function collectEmptyWidget(label, emptyWidgets) {
  emptyWidgets.push(label);
}

/**
 * Kind-agnostic check over a single widget: the panel mounted and rendered, AND — if an
 * `emptyWidgets` array is passed — records the widget when it shows the "No data found" empty
 * state so the caller can report every empty widget by name at the end of the test.
 *
 * Works for EVERY widget kind — grid, chart, tile, hexagon heatmap, donut, treemap, live
 * alert-stream — because it only asserts the widget container (located by its unique title) is
 * visible, without needing to know what it renders inside. Because the factory runs this over
 * EVERY widget on the dashboard, it's the single place that guarantees any "No data found"
 * widget is surfaced by name — on every dashboard — regardless of which precise checks (if any)
 * also cover it.
 *
 * getByText('No data found') matches the empty state across all widget kinds (grid renders it
 * in an <h5>, tiles/charts in plain text); an <h5>-scoped match would miss the non-grid ones.
 */
export async function expectWidgetPresent(widget, label, emptyWidgets) {
  const visible = await scrollAndWaitVisible(widget);
  if (!visible) {
    await expect.soft(widget, `Widget "${label}" should be present and rendered`).toBeVisible();
  }
  if (emptyWidgets && (await widget.getByText('No data found').count()) > 0) {
    collectEmptyWidget(label, emptyWidgets);
  }
}

/** Metric tile: either a formatted numeric value, or the (reported) "No data found" empty state. */
export async function expectTileValueOrEmpty(widget, label, emptyWidgets) {
  await scrollAndWaitVisible(widget);
  const value = widget.locator('.metro-tile-value');
  const empty = widget.getByText('No data found');
  await waitForEitherState(value, empty);
  if (await value.count() > 0) {
    await expect.soft(value, `${label}: expected a formatted numeric value`).toHaveText(NUMERIC_VALUE);
  } else {
    await expect.soft(empty, `${label}: expected the empty state`).toBeVisible();
    collectEmptyWidget(label, emptyWidgets);
  }
}

/** Trend/pie chart: either a rendered Highcharts SVG, or the (reported) "No data found" empty state. */
export async function expectChartOrEmpty(widget, label, emptyWidgets) {
  await scrollAndWaitVisible(widget);
  const svg = widget.locator('.highcharts-container svg');
  const empty = widget.getByText('No data found');
  await waitForEitherState(svg, empty);
  if (await svg.count() > 0) {
    await expect.soft(svg.first(), `${label}: expected the chart to render`).toBeVisible();
  } else {
    await expect.soft(empty, `${label}: expected the empty state`).toBeVisible();
    collectEmptyWidget(label, emptyWidgets);
  }
}

/**
 * Grid widget: either populated columns + rows, or the (reported) "No data found" empty state.
 * `columns` is the dashboard-specific set of expected header labels — e.g. APM Statistics passes
 * ['service.name', 'Type', 'Event Count'], a "Top Monitor by X" grid might pass ['Monitor', 'CPU
 * Percent']. Matched case-insensitively: header text is CSS text-transform:uppercase for display,
 * but the real DOM case is mixed/lower and can vary per grid (verified 'service.name'/'Type'/
 * 'Event Count' on APM — don't assume the same casing holds on an unverified dashboard's grid;
 * case-insensitive matching sidesteps that without weakening the presence check).
 */
export async function expectGridOrEmpty(widget, columns, label, emptyWidgets) {
  await scrollAndWaitVisible(widget);
  const anyRow = widget.locator('tr.k-master-row');
  const empty = widget.locator('h5', { hasText: 'No data found' });
  await waitForEitherState(anyRow, empty);
  const rowCount = await anyRow.count();
  if (rowCount > 0) {
    const header = widget.locator('.k-grid-header');
    for (const col of columns) {
      await expect.soft(
        header.getByText(new RegExp(`^${escapeRegExp(col)}$`, 'i')),
        `${label}: ${col} column`
      ).toBeVisible();
    }
  } else {
    await expect.soft(empty, `${label}: expected the empty state`).toBeVisible();
    collectEmptyWidget(label, emptyWidgets);
  }
  return rowCount;
}

/** Soft cross-check: a grid's first row value should also appear in its paired chart's legend/tooltip text. */
export async function expectChartGridConsistency(gridWidget, chartWidget, rowCount, label) {
  if (rowCount === 0) return; // nothing to cross-check against an empty grid
  const firstRow = gridWidget.locator('tr.k-master-row').first();
  const rowValue = (await firstRow.locator('td').nth(0).innerText()).trim();
  const chartText = await chartWidget.innerText();
  expect.soft(chartText, `${label}: chart should include grid's top row "${rowValue}"`).toContain(rowValue);
}

/**
 * Hover reveals the widget's kebab (⋮) action icon; click opens a dropdown menu at the end of
 * <body> (only one open at a time, so `.ant-dropdown-menu:visible` is unambiguous). The icon
 * itself is always in the DOM regardless of data state — CSS only reveals it visually on hover.
 */
export async function expectActionMenu(page, widget, label, expectedItems) {
  await scrollAndWaitVisible(widget);
  await widget.hover();
  const kebab = widget.locator('[data-cy="grid-action"]');
  await expect.soft(kebab, `${label}: action (⋮) icon should be present`).toBeVisible();
  await kebab.click();
  const menu = page.locator('.ant-dropdown-menu:visible');
  await expect.soft(menu, `${label}: action menu should open`).toBeVisible();
  for (const item of expectedItems) {
    await expect.soft(menu.getByText(item, { exact: true }), `${label}: action menu should offer "${item}"`).toBeVisible();
  }
  // Escape does NOT dismiss this dropdown (verified live) — a click outside does, and leaving
  // it open would make the NEXT widget's menu lookup double-match a stale, still-open instance.
  // Use a raw mouse click at a fixed viewport corner, NOT a locator click on the (near-top) h3
  // title — a locator click auto-scrolls its target into view, which was silently scrolling the
  // page back to the top and un-mounting the lazily-rendered widgets further down the page.
  await page.mouse.click(5, 5);
  await expect.soft(menu, `${label}: action menu should close after clicking away`).toBeHidden();
}

/**
 * "Full Screen" is verified functionally, not just as a menu label: after clicking it, the
 * widget's own exit-fullscreen icon (svg[data-icon="exit-fullscreen"]) becomes visible —
 * confirmed live to be a stable, unique hook — and clicking that exits back to the dashboard.
 */
export async function expectFullScreenWorks(page, widget, label) {
  await scrollAndWaitVisible(widget);
  await widget.hover();
  await widget.locator('[data-cy="grid-action"]').click();
  await page.locator('.ant-dropdown-menu:visible').getByText('Full Screen', { exact: true }).click();
  const exitIcon = page.locator('svg[data-icon="exit-fullscreen"]');
  await expect.soft(exitIcon, `${label}: Full Screen should open (exit-fullscreen icon visible)`).toBeVisible();
  await exitIcon.locator('..').click();
  await expect.soft(exitIcon, `${label}: Full Screen should close after clicking exit`).toBeHidden();
}

/**
 * "Export as CSV" is verified functionally by BOTH signals the app raises (confirmed live):
 *   1. an in-app Ant notification (top-right) — "Export Started / The file will be downloaded
 *      once ready" on this build; earlier builds phrased it "Success / CSV file has been
 *      downloaded". We only require SOME non-empty notification text, not a literal word, so a
 *      wording change across builds doesn't cause a false failure.
 *   2. an actual file download whose name is "<widget title>_<YYYY-MM-DD>.csv" (verified live:
 *      "Top Monitor Interface by Error Packets_2026-07-17.csv"). This is the real proof the export
 *      worked — the browser's download popup in the screenshot is this event, not a second toast.
 *
 * The download listener is armed BEFORE the menu click so the event can't be missed in the gap.
 */
export async function expectExportCsvNotifies(page, widget, label) {
  await scrollAndWaitVisible(widget);
  await widget.hover();
  await widget.locator('[data-cy="grid-action"]').click();
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await page.locator('.ant-dropdown-menu:visible').getByText('Export as CSV', { exact: true }).click();

  const notice = page.locator('.ant-notification-notice').last();
  await expect.soft(notice, `${label}: exporting as CSV should raise a notification`).toBeVisible();
  const text = (await notice.innerText().catch(() => '')).trim();
  expect.soft(text.length > 0, `${label}: export notification should have text`).toBeTruthy();

  const download = await downloadPromise;
  await expect.soft(download, `${label}: exporting as CSV should download a file`).toBeTruthy();
  if (download) {
    const name = download.suggestedFilename();
    expect.soft(
      name.startsWith(label) && name.toLowerCase().endsWith('.csv'),
      `${label}: downloaded CSV should be named "${label}_<date>.csv" (got "${name}")`
    ).toBeTruthy();
  }
  await page.mouse.click(5, 5); // dismiss, keep the page clean for whatever runs next
}

/**
 * "by Group" list widget (e.g. "System CPU Percent by Group", "Memory Used Bytes by Group"):
 * each row shows a metric VALUE (with its unit) alongside the GROUP name it belongs to — verified
 * live these render as `.row.py-2` rows, value in `.numeric-value` (e.g. "67.65 %") and the group
 * label as the rest of the row text (e.g. "Database > PostgreSQL"). Asserts BOTH are present on
 * each of the first few rows: a numeric value (optionally carrying an expected `unit`) AND a
 * non-empty group name beside it. Empty widgets are reported the usual way.
 *
 * @param {string|RegExp} [unit] - expected unit in the value cell ('%' for a percent group,
 *   /[KMGT]?B\b/ for a bytes group). Omit to only require a numeric value.
 */
export async function expectGroupTileValues(widget, label, unit, emptyWidgets) {
  await scrollAndWaitVisible(widget);
  const rows = widget.locator('.row.py-2');
  const empty = widget.getByText('No data found');
  await waitForEitherState(rows, empty);
  const n = await rows.count();
  if (n === 0) {
    await expect.soft(empty, `${label}: expected the empty state`).toBeVisible();
    collectEmptyWidget(label, emptyWidgets);
    return;
  }
  const rowsToCheck = Math.min(n, 5); // a representative sample is enough — every row is the same shape
  for (let i = 0; i < rowsToCheck; i++) {
    const row = rows.nth(i);
    const valText = (await row.locator('.numeric-value').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    expect.soft(/\d/.test(valText), `${label}: row ${i + 1} should show a numeric value (got "${valText}")`).toBeTruthy();
    if (unit) {
      const ok = unit instanceof RegExp ? unit.test(valText) : valText.includes(unit);
      expect.soft(ok, `${label}: row ${i + 1} value should carry the "${unit}" unit (got "${valText}")`).toBeTruthy();
    }
    const rowText = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    const groupName = rowText.replace(valText, '').trim();
    expect.soft(groupName.length > 0, `${label}: row ${i + 1} should show a group name beside its value (row: "${rowText}")`).toBeTruthy();
  }
}

/**
 * Reads the CURRENTLY-shown Highcharts tooltip text for a hovered widget. Tooltips render in two
 * places depending on chart kind (verified live): a PIE keeps its tooltip inside the widget's own
 * SVG (`widget .highcharts-tooltip`, whose isVisible() is unreliable, so we read innerText and
 * take the first non-empty), while a SPARKLINE line-chart is configured tooltip.outside=true and
 * renders into a page-level `.highcharts-tooltip-container`. Try both and return the first
 * non-empty text.
 */
async function readChartTooltip(page, widget) {
  const sources = [widget.locator('.highcharts-tooltip'), page.locator('.highcharts-tooltip-container')];
  for (const loc of sources) {
    const count = await loc.count();
    for (let i = 0; i < count; i++) {
      const text = (await loc.nth(i).innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      if (text) return text;
    }
  }
  return '';
}

/**
 * Hover a chart widget (pie OR in-grid sparkline) and assert the tooltip reveals a real data
 * value — and, when an expected `unit` is given, that the value carries it (e.g. a CPU chart's
 * tooltip shows "%", a latency chart "ms"). Pie slices are hovered at their centre; sparklines
 * need the pointer swept across the plot width to land on a data point, so we try several x
 * positions (plus any explicit point) until a tooltip appears. Silently returns if the widget has
 * no chart at all (e.g. an all-zero grid that renders no sparkline) — nothing to hover there.
 *
 * @param {string|RegExp} [unit] - expected unit token in the tooltip ('%', 'ms', 'bps', …).
 */
export async function expectChartHoverValue(page, widget, label, unit) {
  await scrollAndWaitVisible(widget);
  const chart = widget.locator('.highcharts-container').first();
  if (await chart.count() === 0) return; // no chart rendered on this widget/env — nothing to hover
  const box = await chart.boundingBox();
  if (!box) return;

  const positions = [];
  const point = widget.locator('.highcharts-point').first();
  if (await point.count() > 0) {
    const pb = await point.boundingBox().catch(() => null);
    if (pb) positions.push([pb.x + pb.width / 2, pb.y + pb.height / 2]);
  }
  for (const f of [0.5, 0.4, 0.6, 0.3, 0.7, 0.8, 0.2, 0.9]) {
    positions.push([box.x + box.width * f, box.y + box.height / 2]);
  }

  let text = '';
  for (const [x, y] of positions) {
    await page.mouse.move(x, y, { steps: 3 });
    await page.waitForTimeout(250);
    text = await readChartTooltip(page, widget);
    if (text) break;
  }
  expect.soft(text.length > 0, `${label}: hovering the chart should reveal a tooltip value`).toBeTruthy();
  if (unit && text) {
    const ok = unit instanceof RegExp ? unit.test(text) : text.includes(unit);
    expect.soft(ok, `${label}: chart tooltip should show values in "${unit}" (got "${text}")`).toBeTruthy();
  }
  await page.mouse.move(5, 5); // move off the plot so the tooltip clears before the next widget
}

/**
 * Hovering a pie slice shows a Highcharts tooltip with its category/series and value. Skipped
 * when the chart has no data — there's no point to hover. NOTE: tooltip.isVisible() is
 * unreliable here even when the tooltip is genuinely showing (style shows opacity:1/
 * visibility:inherit) — assert on non-empty text instead.
 */
export async function expectPieHoverTooltip(widget, label) {
  const point = widget.locator('.highcharts-point').first();
  if (await point.count() === 0) return; // no data — nothing to hover
  await point.hover({ force: true });
  const tooltip = widget.locator('div.highcharts-tooltip');
  await expect.soft(tooltip, `${label}: hovering a slice should render a tooltip`).toHaveCount(1);
  const text = (await tooltip.innerText().catch(() => '')).trim();
  expect.soft(text.length > 0, `${label}: hover tooltip should show data, got empty text`).toBeTruthy();
}

/**
 * Every grid row's 2nd column (commonly a "Type" icon column) should carry an icon; report any
 * row missing one by its 1st-column value. Genuinely APM-specific in practice (its grids have a
 * Type column with a service-language icon) — dashboards without an icon column shouldn't call
 * this. Kept generic (nth(1), not "Type" by name) so any dashboard with an analogous icon column
 * can reuse it.
 */
export async function expectGridRowIcons(widget, rowCount, label) {
  const rows = widget.locator('tr.k-master-row');
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const rowValue = (await row.locator('td').nth(0).innerText()).trim();
    const icon = row.locator('td').nth(1).locator('svg');
    await expect.soft(icon, `${label}: row "${rowValue}" is missing its icon`).toHaveCount(1);
  }
}
