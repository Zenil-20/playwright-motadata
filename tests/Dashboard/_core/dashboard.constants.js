/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Central constants for Dashboard automation.
 */

export const EMPTY_STATE_PATTERNS = [
  /no data found/i,
  /no record found/i,
  /no records found/i,
  /no data available/i,
  /no result found/i,
  /nothing to show/i,
];

export const LOADING_STATE_PATTERNS = [
  /\bloading\b/i,
  /\bplease wait\b/i,
  /\bfetching\b/i,
];

export const DASHBOARD_LOADING_SELECTOR =
  '.ant-spin-spinning, .ant-skeleton, .ant-skeleton-active, [aria-busy="true"], .loading, .loader, .spinner';

export const VALUE_PATTERNS = {
  percent: /(\d+(?:\.\d+)?)\s*%/,
  number: /\b\d+(?:\.\d+)?\b/,
  time: /(\d+(?:\.\d+)?)\s*(ms|s|sec|seconds?|m|min|minutes?)\b/i,
  traffic: /(\d+(?:\.\d+)?)\s*(bps|kbps|mbps|gbps|tbps)\b/i,
  bytes: /(\d+(?:\.\d+)?)\s*(bytes|kb|mb|gb|tb)\b/i,
  state: /\b(up|down|online|offline|connected|disconnected|running|stopped)\b/i,
};

export const DEFAULT_TIMEOUT = 30000;
