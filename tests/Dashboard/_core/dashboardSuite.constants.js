/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Author  : Nandini Shah
 * Created : 2026-07-10
 *
 * Shared constants for the default/system dashboard suite (tests/Dashboard/NN-*).
 * Not specific to any one dashboard — APM Statistics, Performance Summary, Alert
 * Summary, and every dashboard added later all import from here.
 */

export const NUMERIC_VALUE = /^[\d,]+(\.\d+)?[A-Za-z%]*$/;

// The kebab (⋮) menu's item set depends on widget TYPE, not on which dashboard
// it lives on — verified live on both populated/empty widgets of each type
// (see ai-test-pipeline/cookbook/selector-cookbook.md, section 1.2).
export const MENU_ITEMS_TILE_OR_PIE = ['Full Screen', 'Share'];
export const MENU_ITEMS_CHART_OR_GRID = ['Full Screen', 'Share', 'Export as CSV'];
