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
 * "Export as CSV" is verified functionally: clicking it should raise an Ant notification
 * (top-right, class ant-notification-notice) mentioning "Export" — "Export Started / The file
 * will be downloaded once ready" when the widget has data, "Export Error / No data available to
 * export" when it doesn't. Either is a legitimate, working response; both mention "Export".
 */
export async function expectExportCsvNotifies(page, widget, label) {
  await scrollAndWaitVisible(widget);
  await widget.hover();
  await widget.locator('[data-cy="grid-action"]').click();
  await page.locator('.ant-dropdown-menu:visible').getByText('Export as CSV', { exact: true }).click();
  const notice = page.locator('.ant-notification-notice').filter({ hasText: /Export/ });
  await expect.soft(notice, `${label}: exporting as CSV should raise a notification`).toBeVisible();
  const text = (await notice.innerText().catch(() => '')).trim();
  expect.soft(text.length > 0, `${label}: export notification should have text`).toBeTruthy();
  await page.mouse.click(5, 5); // dismiss, keep the page clean for whatever runs next
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
