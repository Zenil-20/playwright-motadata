/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-13
 *
 * Generates ONE Playwright test per default/system dashboard from a
 * declarative config — every dashboard under tests/Dashboard/NN-* is a small
 * config object passed to createDefaultDashboardSuite/createDashboardCategorySuite.
 * See tests/Dashboard/12-APM/APM_Statistics_Dashboard.spec.js for a worked
 * example and tests/Dashboard/_core/dashboard.template.js for a blank
 * starting point.
 *
 * IMPORTANT: every widget title / column name in a config MUST be verified live
 * against the actual dashboard (motadata-explorer skill / cookbook workflow —
 * see CLAUDE.md) before it lands here. This factory only generates test SHAPE;
 * it has no way to catch a wrong or fabricated widget title on its own.
 */

import { test, expect } from '@playwright/test';
import { login, logout } from '../../fixtures/auth.js';
import { MENU_ITEMS_TILE_OR_PIE, MENU_ITEMS_CHART_OR_GRID } from './dashboardSuite.constants.js';
import {
  widgetByTitle,
  expectTileValueOrEmpty,
  expectChartOrEmpty,
  expectGridOrEmpty,
  expectChartGridConsistency,
  expectActionMenu,
  expectFullScreenWorks,
  expectExportCsvNotifies,
  expectPieHoverTooltip,
  expectWidgetPresent,
  expectGroupTileValues,
  expectChartHoverValue,
  waitForAllWidgetsLoaded,
  validateAllWidgetsLoaded,
} from './dashboard.widgetAssertions.js';

/**
 * @param {object} config
 * @param {string} config.dashboardId - stable system dashboard id (from the URL after navigating to it live)
 * @param {string} config.dashboardTitle - exact <h3> title text
 * @param {RegExp} [config.titlePattern] - page <title> match, defaults to new RegExp(dashboardTitle)
 * @param {string[]} [config.widgetPresence] - EVERY unique widget title on the dashboard, checked kind-agnostically (panel mounted + visible). Use for full-coverage smoke plus dashboards whose widgets are all empty on the current env (structure unverifiable). Exclude duplicate titles.
 * @param {string[]} [config.metricTiles] - metro-tile widget titles, e.g. ['Service Count']
 * @param {string[]} [config.trendCharts] - standalone Highcharts trend/pie widget titles
 * @param {{chart: string, grid: string, columns: string[]}[]} [config.chartGridPairs] - paired chart+grid widgets checked together, incl. cross-consistency + hover tooltip
 * @param {{title: string, columns: string[]}[]} [config.grids] - standalone grid widgets (no paired chart)
 * @param {{title: string, unit?: string|RegExp}[]} [config.groupTiles] - "by Group" list widgets (e.g. "System CPU Percent by Group"); asserts each row shows a metric value (with `unit` if given) AND the group name beside it
 * @param {{title: string, unit?: string|RegExp}[]} [config.chartHovers] - chart/sparkline widgets to hover; asserts the tooltip reveals a value in the expected `unit` ('%', 'ms', 'bps', …)
 * @param {{title: string, kind: 'tile'|'pie'|'chart'|'grid', fullScreen?: boolean, exportCsv?: boolean}[]} [config.actionMenuChecks] - one representative widget per menu-item-set is enough; don't loop every widget
 * @param {(page: import('@playwright/test').Page) => Promise<void>} [config.afterNavigate] - optional per-dashboard hook (e.g. closing an env-specific overlay)
 * @param {(ctx: { page: import('@playwright/test').Page, emptyWidgets: string[], goToDashboard: (page: import('@playwright/test').Page) => Promise<void> }) => Promise<void>} [config.extraChecks] - awaited once, inside the SAME single test, for dashboard-specific checks that don't fit the generic shapes above (e.g. APM's per-row TYPE-icon check). Call `await ctx.goToDashboard(ctx.page)` first if the check needs a freshly-mounted widget grid.
 */
export function createDefaultDashboardSuite(config) {
  test.describe(`Dashboard | ${config.dashboardTitle}`, () => {
    let page;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
      page = await context.newPage();
      page.setDefaultTimeout(60000);
      await login(page);
    });

    test.afterAll(async () => {
      if (page && !page.isClosed()) {
        await logout(page).catch(() => {});
        await page.close();
      }
    });

    registerDashboardTest(config, () => page);
  });
}

/**
 * One login for an ENTIRE category (e.g. all 3 Server dashboards), instead of one login per
 * dashboard. Every `createDefaultDashboardSuite` call used to open its OWN browser context and
 * log in independently — correct, but for a category with N dashboards that's N sequential
 * logins (each a full page load + credential submit + avatar wait), which is most of the
 * category's total runtime for dashboards whose own checks run in seconds. Logging in once and
 * reusing the same `page` across every dashboard in the category (each still gets its own test)
 * cuts that to 1 login per category file.
 *
 * @param {string} categoryName - e.g. 'Server' — used only for the outer describe label
 * @param {object[]} dashboards - array of configs, same shape as createDefaultDashboardSuite's `config`
 */
export function createDashboardCategorySuite(categoryName, dashboards) {
  test.describe(`Dashboard | ${categoryName}`, () => {
    let page;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
      page = await context.newPage();
      page.setDefaultTimeout(60000);
      await login(page);
    });

    test.afterAll(async () => {
      if (page && !page.isClosed()) {
        await logout(page).catch(() => {});
        await page.close();
      }
    });

    for (const config of dashboards) {
      registerDashboardTest(config, () => page);
    }
  });
}

/**
 * Registers exactly ONE test for one dashboard — every check (widget presence, tiles, charts,
 * grids, chart+grid pairs, action menus, extraChecks) runs inside that single test body, against
 * an already-logged-in page. One dashboard = one test case in the report, instead of the 5-7
 * separate tests the factory used to split each dashboard into.
 *
 * Any widget found showing "No data found" is collected into `emptyWidgets` and surfaced TWO
 * ways so it's identifiable without opening a trace: (1) a report annotation (shows as a labeled
 * chip directly in the HTML report's test list and detail header), and (2) a single named soft
 * assertion at the end listing every empty widget by title.
 */
function registerDashboardTest(config, getPage) {
  const {
    dashboardId,
    dashboardTitle,
    titlePattern,
    widgetPresence = [],
    metricTiles = [],
    trendCharts = [],
    chartGridPairs = [],
    grids = [],
    groupTiles = [],
    chartHovers = [],
    actionMenuChecks = [],
    afterNavigate,
    extraChecks,
  } = config;

  /**
   * Deep-link to the dashboard and wait for the widget grid to actually mount (not just the <h3>
   * shell). Called before each phase below (widgetPresence, tiles, charts, grids, action menus),
   * not just once at the top — reproduced live that reusing one continuously-open page across
   * many sequential widget interactions (scrolling, hovering, opening kebab menus) leaves the
   * dashboard in a degraded state where widgets that were visible moments earlier become
   * unfindable (0-count) or stuck mid-refresh (neither a value nor "No data found"). Re-navigating
   * between phases gives each one a freshly-mounted widget grid.
   */
  async function goToDashboard(page) {
    // 'domcontentloaded' instead of the default 'load': we don't need every image/font/chart
    // asset to finish before proceeding — the explicit waits below (h3 title, then a mounted
    // .widget-view) are the real readiness signal and already smart-wait for the widget grid.
    // Waiting on the full 'load' event just adds dead time for assets the checks below don't
    // depend on.
    await page.goto(`${process.env.Motadata_Aiops}/dashboard/${dashboardId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h3', { hasText: dashboardTitle })).toBeVisible();
    // Wait for the WHOLE widget grid to finish loading (every per-widget spinner cleared), not
    // just the first widget to mount — so each phase below runs against a fully-settled dashboard.
    // Non-fatal on timeout: fall through to the phase checks (and the explicit
    // validateAllWidgetsLoaded assertion) so a single slow widget surfaces by name rather than
    // aborting the whole navigation.
    await waitForAllWidgetsLoaded(page).catch(() => {});
    if (afterNavigate) await afterNavigate(page);
  }

  test(dashboardTitle, async ({}, testInfo) => {
    // Generous cap: one test now does everything a dashboard's whole suite used to spread across
    // several tests (navigate + presence + tiles + charts + grids + pairs + action menus).
    test.setTimeout(300000);
    const page = getPage();
    const emptyWidgets = [];

    // Stable SYSTEM dashboard id (verify this is true for each new dashboard the same way it was
    // confirmed for APM Statistics — identical id across separate live instances) — safe to
    // deep-link after login rather than driving the collapsible dashboard-tree/search panel.
    await goToDashboard(page);
    await expect(page).toHaveTitle(titlePattern ?? new RegExp(dashboardTitle));

    // Explicit, reported validation that the WHOLE dashboard loaded — every widget mounted, every
    // loading spinner cleared, and each widget actually drew content (or "No data found"). Any
    // widget still blank/stuck is soft-failed by name; the "WIDGETS LOADED" annotation records
    // the loaded/total count in the report header.
    await validateAllWidgetsLoaded(page, testInfo);

    // Runs over EVERY widget on the dashboard — so this is what guarantees any widget showing
    // "No data found" is reported by name, whether or not a precise tile/chart/grid check below
    // also covers it.
    for (const title of widgetPresence) {
      await expectWidgetPresent(widgetByTitle(page, title), title, emptyWidgets);
    }

    if (metricTiles.length) {
      await goToDashboard(page);
      for (const title of metricTiles) {
        await expectTileValueOrEmpty(widgetByTitle(page, title), title, emptyWidgets);
      }
    }

    if (trendCharts.length) {
      await goToDashboard(page);
      for (const title of trendCharts) {
        await expectChartOrEmpty(widgetByTitle(page, title), title, emptyWidgets);
      }
    }

    if (grids.length) {
      await goToDashboard(page);
      for (const { title, columns } of grids) {
        await expectGridOrEmpty(widgetByTitle(page, title), columns, title, emptyWidgets);
      }
    }

    // "by Group" list widgets: each row must show BOTH a metric value (with its unit) AND the
    // group name beside it (e.g. "67.65 % — Database > PostgreSQL").
    if (groupTiles.length) {
      await goToDashboard(page);
      for (const { title, unit } of groupTiles) {
        await expectGroupTileValues(widgetByTitle(page, title), title, unit, emptyWidgets);
      }
    }

    // Hover each chart/sparkline widget and confirm its tooltip reveals a real value in the
    // expected unit (a % chart shows "%", a latency chart "ms", …).
    if (chartHovers.length) {
      await goToDashboard(page);
      for (const { title, unit } of chartHovers) {
        await expectChartHoverValue(page, widgetByTitle(page, title), title, unit);
      }
    }

    if (chartGridPairs.length) await goToDashboard(page);
    for (const { chart, grid, columns } of chartGridPairs) {
      const gridWidget = widgetByTitle(page, grid);
      const chartWidget = widgetByTitle(page, chart);
      await expectChartOrEmpty(chartWidget, chart, emptyWidgets);
      const rowCount = await expectGridOrEmpty(gridWidget, columns, grid, emptyWidgets);
      await expectChartGridConsistency(gridWidget, chartWidget, rowCount, grid);
      await expectPieHoverTooltip(chartWidget, chart);
    }

    // One representative widget per menu-item-set is enough to prove the action menu works — the
    // item set only varies by widget TYPE (tile/pie vs chart/grid), not by which specific widget
    // it is, so looping every widget on the dashboard would just repeat the same assertion for no
    // extra signal.
    if (actionMenuChecks.length) await goToDashboard(page);
    for (const check of actionMenuChecks) {
      const widget = widgetByTitle(page, check.title);
      const items = check.kind === 'tile' || check.kind === 'pie' ? MENU_ITEMS_TILE_OR_PIE : MENU_ITEMS_CHART_OR_GRID;
      await expectActionMenu(page, widget, check.title, items);
      if (check.fullScreen) await expectFullScreenWorks(page, widget, check.title);
      if (check.exportCsv) await expectExportCsvNotifies(page, widget, check.title);
    }

    if (extraChecks) await extraChecks({ page, emptyWidgets, goToDashboard });

    // Surfaced three ways so an empty widget is identifiable without opening a trace:
    // (1) a report annotation — shows as a labeled chip in the HTML report's test list AND in the
    // failed-test detail header, visible at a glance, no click-through needed; (2) a plain-text
    // attachment — a separate, instantly-readable link in the report distinct from trace.zip,
    // one widget per line; (3) a named soft assertion, so the test still fails (the point of this
    // whole feature) with the widget names right in the error text.
    if (emptyWidgets.length) {
      testInfo.annotations.push({ type: 'NO DATA FOUND', description: emptyWidgets.join(', ') });
      await testInfo.attach('no-data-found-widgets.txt', {
        body: emptyWidgets.join('\n'),
        contentType: 'text/plain',
      });
      expect.soft(emptyWidgets, 'Widgets showing "No data found" for the selected time range').toEqual([]);
    }
  });
}
