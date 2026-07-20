/**
 * "No data" detection — a report is faulty if either the UI preview OR the
 * exported PDF contains one of these markers. The exact product string is
 * "No data available in the report."; the rest cover known variants across
 * report categories (log / script / group-picker empty states).
 *
 * Ported from validate_reports.py (NO_DATA_PHRASES / contains_no_data).
 */
const NO_DATA_PHRASES = [
  'no data available in the report',
  'no data available',
  'no data found',
  'no data',
  'no record',
  'no results',
  'nothing to show',
  'please select group',
  'please write and execute script',
];

/** True if `text` is empty or contains any known "no data" marker. */
function containsNoData(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t) return true;
  return NO_DATA_PHRASES.some((p) => t.includes(p));
}

module.exports = { NO_DATA_PHRASES, containsNoData };
