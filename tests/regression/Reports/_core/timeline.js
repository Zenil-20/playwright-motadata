/**
 * Time-range picker options — mirrors AVAILABLE_RANGE_OPTIONS in
 * UI/src/components/widgets/constants.js. Used by the REPORT_TIMELINE env
 * override: the user enters a key / display text / shortcut, we resolve it to
 * the matching option and click the corresponding row in the report's
 * `.timerange-dropdown-overlay`.
 *
 * Ported from validate_reports.py (TIMELINE_OPTIONS / resolve_timeline).
 */
const TIMELINE_OPTIONS = [
  { key: '-5m', text: 'Last 5 Mins', shortcut: '5m' },
  { key: '-15m', text: 'Last 15 Mins', shortcut: '15m' },
  { key: '-30m', text: 'Last 30 Mins', shortcut: '30m' },
  { key: '-1h', text: 'Last 1 Hour', shortcut: '1h' },
  { key: '-6h', text: 'Last 6 Hours', shortcut: '6h' },
  { key: '-12h', text: 'Last 12 Hours', shortcut: '12h' },
  { key: '-24h', text: 'Last 24 Hours', shortcut: '24h' },
  { key: '-48h', text: 'Last 48 Hours', shortcut: '48h' },
  { key: 'today', text: 'Today', shortcut: 'today' },
  { key: 'yesterday', text: 'Last Day', shortcut: '1d' },
  { key: 'last.week', text: 'Last Week', shortcut: '1w' },
  { key: 'last.month', text: 'Last Month', shortcut: '1mo' },
  { key: 'this.week', text: 'This Week', shortcut: 'week' },
  { key: 'this.month', text: 'This Month', shortcut: 'month' },
];

/** Resolve a raw REPORT_TIMELINE value to a picker option, or null if unknown. */
function resolveTimeline(raw) {
  const v = (raw || '').trim().toLowerCase();
  if (!v) return null;
  for (const opt of TIMELINE_OPTIONS) {
    if (v === opt.key.toLowerCase() || v === opt.text.toLowerCase() || v === opt.shortcut.toLowerCase()) {
      return opt;
    }
  }
  return null;
}

/** Human-readable list of valid keys/shortcuts, for warning messages. */
function timelineChoices() {
  return TIMELINE_OPTIONS.map((o) => `${o.key}|${o.shortcut}`).join(', ');
}

module.exports = { TIMELINE_OPTIONS, resolveTimeline, timelineChoices };
