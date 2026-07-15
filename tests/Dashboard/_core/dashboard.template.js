/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-10
 *
 * BLANK STARTING POINT for a new default/system dashboard spec — not a runnable
 * spec itself (hence no .spec.js extension; no project's testMatch will collect it).
 *
 * To add dashboard NN:
 *   1. Copy this file to tests/Dashboard/NN-<Name>/<Name>_Dashboard.spec.js
 *   2. Log in and navigate to the dashboard live; read its URL for dashboardId.
 *   3. For every widget you intend to check, confirm its [title="..."] resolves
 *      count()===1 via widgetByTitle(page, title) — same rigor as APM Statistics
 *      (see ai-test-pipeline/cookbook/selector-cookbook.md, section 1.2). Grid
 *      column names: read the REAL DOM case (not the CSS-uppercased display
 *      text) — expectGridOrEmpty matches case-insensitively, but the column
 *      must still exist under that exact text.
 *   4. Fill in the config below with only what you've verified. Leave arrays
 *      empty rather than guess — an empty array just skips that test category.
 *   5. Add a project entry to playwright.config.js: { name: 'dashboard_NN_x',
 *      testMatch: ['tests/Dashboard/NN-<Name>/*.spec.js'] }.
 *   6. Run `npx playwright test tests/Dashboard/NN-<Name> --list` to dry-compile,
 *      then run it live and confirm the result before considering it done.
 */

import { createDefaultDashboardSuite } from '../_core/dashboard.suiteFactory.js';

createDefaultDashboardSuite({
  dashboardId: '', // e.g. '10000000001100' — from the URL after navigating to it live
  dashboardTitle: '', // exact <h3> title text

  // Metro-tile widgets (a single big number, e.g. "Service Count"):
  metricTiles: [],

  // Standalone Highcharts trend/pie widgets with no paired grid:
  trendCharts: [],

  // Grid widgets paired with a chart — cross-checked against each other,
  // plus a hover-tooltip check on the chart:
  // chartGridPairs: [{ chart: '<Top N chart title>', grid: '<grid title>', columns: ['<Col1>', '<Col2>'] }],
  chartGridPairs: [],

  // Standalone grid widgets with no paired chart:
  // grids: [{ title: '<grid title>', columns: ['<Col1>', '<Col2>'] }],
  grids: [],

  // One representative widget per menu-item-set (tile/pie vs chart/grid) is
  // enough — don't loop every widget on the dashboard:
  // actionMenuChecks: [
  //   { title: '<a metric tile or pie title>', kind: 'tile' },
  //   { title: '<a chart or grid title>', kind: 'chart', fullScreen: true, exportCsv: true },
  // ],
  actionMenuChecks: [],

  // Optional: dismiss an environment-specific overlay right after navigating,
  // same pattern as APM Statistics' DEV-panel close.
  // afterNavigate: async (page) => { ... },

  // Optional: dashboard-specific checks that don't fit the generic shapes above
  // but still need the shared page/login session (see APM's TYPE-icon check
  // for a worked example). Called once, inline, inside the dashboard's single
  // test — call `await goToDashboard(page)` first if it needs a fresh mount.
  // extraChecks: async ({ page, emptyWidgets, goToDashboard }) => { ... },
});
