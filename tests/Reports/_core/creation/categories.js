/**
 * Category registry for the creation matrix — every report type from the
 * wizard's step-1 grid, each with a step-2 handler and 5–8 scenarios.
 *
 * Field knowledge (required fields, selectors, enums, preview/save quirks)
 * comes from `.claude/agents/report-creator.md` (the category reference built
 * from ../UI/src/modules/report/components/*). Summary of the quirks encoded
 * below:
 *   - Step-2 Next enables only after the live preview validates (isWidgetValid)
 *     EXCEPT the save-first categories (availability.flap.summary,
 *     historical.trend, nccm.compliance.policy) where it never disables.
 *   - Forecast: the range picker only renders for forecastType=percent, and
 *     switching the Forecast Type radio resets the counter — set it FIRST.
 *   - Capacity: Threshold Type radio resets the counter too — same order.
 *   - custom.script / ai: step-2 is a CounterProvider block (Report By +
 *     Source + script). The auto name must NOT contain the word "test"
 *     (`no_test` rule) — our `auto-…` names are safe.
 *
 * A scenario is a small declarative object; handlers read only the keys they
 * understand:
 *   { name, counters, counterIndex, monitors (n|'all'), sourceFilter,
 *     resultByIndex, forecastType, rangeIndex, thresholdType, threshold,
 *     policyType, severityIndices, moduleIndex, operationIndex, usersIndex,
 *     statusIndex, policyIndex, language, requirement }
 */
const fs = require('node:fs');
const path = require('node:path');
const {
  SkipScenarioError,
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
  selectMonitors,
  isNextEnabled,
} = require('./wizard.js');

const sc = (name, over = {}) => ({ name, counters: 1, counterIndex: 0, monitors: 1, ...over });

// ------------------------------ shared blocks --------------------------------

async function fillCounters(page, s, picked) {
  const n = s.counters || 1;
  for (let i = 0; i < n; i++) {
    const label = await pickCounter(page, { slot: i, index: i === 0 ? s.counterIndex || 0 : (s.counterIndex || 0) + i });
    if (i === 0) picked.counter = label;
    else picked[`counter${i + 1}`] = label;
  }
}

async function fillSource(page, s, picked, { filter = 'Monitor', required = true } = {}) {
  const wanted = s.sourceFilter || filter;
  const ok = await setSourceFilter(page, wanted);
  if (ok) picked.source_filter = wanted;
  else if (required) throw new Error(`Could not set Source Filter to "${wanted}".`);
  const opened = await openSourceTable(page);
  if (!opened) {
    if (required) throw new Error('Could not open the Source picker.');
    return;
  }
  picked.monitors = await selectMonitors(page, s.monitors ?? 1);
}

async function maybeResultBy(page, s, picked) {
  if (s.resultByIndex == null) return;
  if (await openPickerByLabel(page, 'Result By')) {
    picked.result_by = await pickOption(page, { index: s.resultByIndex });
  }
}

async function previewWait(page, picked) {
  picked.preview = await waitPreviewRendered(page);
}

// ------------------------------ handler builders -----------------------------

/** Counter(s) + Source (+ optional Result By) — metric, log, flow, APM/RUM/NetRoute, polling, config… */
function counterSourceHandler({ sourceFilter = 'Monitor', waitPreview = true, counter = true } = {}) {
  return async (page, s, picked) => {
    if (counter) await fillCounters(page, s, picked);
    await maybeResultBy(page, s, picked);
    await fillSource(page, s, picked, { filter: sourceFilter });
    if (waitPreview) await previewWait(page, picked);
  };
}

/** Source-only categories where the counter auto-selects (availability, inventory, unhealthy.monitors). */
function sourceOnlyHandler({ tryCounter = true, waitPreview = true } = {}) {
  return async (page, s, picked) => {
    if (tryCounter) {
      // Counter usually auto-fills (e.g. monitor.uptime.percent); best-effort
      // pick so an unfilled provider doesn't leave the widget invalid.
      picked.counter = (await pickCounter(page, { slot: 0, index: s.counterIndex || 0 }).catch(() => null)) || 'auto';
    }
    await fillSource(page, s, picked, { filter: s.sourceFilter || 'Monitor' });
    if (waitPreview) await previewWait(page, picked);
  };
}

/** Alert categories — Policy Type + Severity are the interesting knobs; everything is optional. */
/**
 * Some alert categories (Metric Alerts) leave the widget invalid — and Next
 * disabled — until a Policy Type and a Source scope are chosen, while others
 * (Availability Status) validate on backend defaults. Rather than over-filling
 * every alert scenario (which would change what the passing ones actually
 * assert), fill the minimum extra fields ONLY when Next is still disabled, and
 * stop as soon as it enables.
 */
async function ensureAlertWidgetValid(page, picked) {
  if (await isNextEnabled(page)) return;
  if (!picked.policy_type && (await openPickerByLabel(page, 'Policy Type'))) {
    picked.policy_type = await pickOption(page, { index: 0 });
    await waitNoLoader(page, 10_000);
  }
  if (await isNextEnabled(page)) return;
  await setSourceFilter(page, 'Monitor').catch(() => {});
  if (await isNextEnabled(page)) return;
  // Measured on 8.2.6: Policy Type, Severity, Source Filter and Policy ALL leave
  // Next disabled — the widget only becomes valid once an actual source MONITOR
  // is selected. That is the step this handler was missing.
  try {
    await openSourceTable(page);
    picked.monitors = await selectMonitors(page, 1);
  } catch {
    /* source table empty on this instance — nothing to select, leave invalid */
  }
  if (await isNextEnabled(page)) return;
  // Last resort: let a preview round-trip settle the validity flag.
  await previewWait(page, picked);
}

function alertHandler() {
  return async (page, s, picked) => {
    if (s.policyType) {
      if (await openPickerByLabel(page, 'Policy Type')) {
        picked.policy_type = await pickOption(page, { text: s.policyType });
      }
      await waitNoLoader(page, 10_000);
    }
    if (s.severityIndices && s.severityIndices.length) {
      if (await openPickerByLabel(page, 'Severity')) {
        picked.severity = (await pickOptions(page, s.severityIndices)).join('|');
      }
    }
    await previewWait(page, picked);
    await ensureAlertWidgetValid(page, picked);
  };
}

/** Audit — CustomGroup, no counters/monitors; all pickers optional (backend defaults). */
function auditHandler() {
  return async (page, s, picked) => {
    if (s.moduleIndex != null && (await openPickerByLabel(page, 'Module Type'))) {
      picked.module = (await pickOptions(page, [s.moduleIndex])).join('|');
      await waitNoLoader(page, 8000);
    }
    if (s.operationIndex != null && (await openPickerByLabel(page, 'Operation Type'))) {
      picked.operation = (await pickOptions(page, [s.operationIndex])).join('|');
    }
    if (s.usersIndex != null && (await openPickerByLabel(page, 'Users'))) {
      picked.users = (await pickOptions(page, [s.usersIndex])).join('|');
    }
    if (s.statusIndex != null && (await openPickerByLabel(page, 'Status'))) {
      picked.status = await pickOption(page, { index: s.statusIndex });
    }
    if (s.resultByIndex != null && (await openPickerByLabel(page, 'Result By'))) {
      picked.result_by = await pickOption(page, { index: s.resultByIndex });
    }
    await previewWait(page, picked);
  };
}

/** Forecast — type radio FIRST (it resets the counter), then counter + source + range. */
function forecastHandler() {
  return async (page, s, picked) => {
    if (s.forecastType === 'time') {
      picked.forecast_type = (await setRadioByText(page, 'Time Based')) ? 'time' : 'percent(?)';
      await waitNoLoader(page, 5000);
    } else {
      picked.forecast_type = 'percent';
    }
    await fillCounters(page, s, picked);
    await fillSource(page, s, picked, { filter: 'Monitor' });
    // Range picker only exists for percent. Option order: 12h,1d,2d,1w,2w,1m,2m,3m (default 1w = index 3).
    if (s.forecastType !== 'time' && s.rangeIndex != null && s.rangeIndex !== 3) {
      if (await openPickerByLabel(page, 'Analyze the forecast range within the next')) {
        picked.range = await pickOption(page, { index: s.rangeIndex });
      }
    } else if (s.forecastType !== 'time') {
      picked.range = '1 Week (default)';
    }
    await previewWait(page, picked);
  };
}

/** Capacity Forecasting — Threshold Type radio FIRST (resets counter), then counter/threshold/source/range. */
function capacityHandler() {
  return async (page, s, picked) => {
    if (s.thresholdType === 'dynamic') {
      picked.threshold_type = (await setRadioByText(page, 'Dynamic')) ? 'dynamic' : 'static(?)';
      await waitNoLoader(page, 5000);
    } else {
      picked.threshold_type = 'static';
    }
    await fillCounters(page, s, picked);
    if (s.thresholdType === 'dynamic') {
      if (await openPickerByLabel(page, 'Threshold Counter')) {
        picked.threshold = await pickOption(page, { index: 0 });
      }
    } else {
      const v = s.threshold ?? 80;
      if (await fillInputByLabel(page, 'Threshold Value', v)) picked.threshold = String(v);
    }
    await fillSource(page, s, picked, { filter: 'Monitor' });
    if (s.rangeIndex != null && s.rangeIndex !== 3) {
      if (await openPickerByLabel(page, 'Analyze the forecast range within the next')) {
        picked.range = await pickOption(page, { index: s.rangeIndex });
      }
    }
    await previewWait(page, picked);
  };
}

/** nccm.compliance.policy — PolicyPicker only; save-first (no preview). */
function compliancePolicyHandler() {
  return async (page, s, picked) => {
    let opened = await openPickerByLabel(page, 'Compliance Policy');
    if (!opened) opened = await openPickerByLabel(page, 'Policy');
    if (!opened) throw new Error('Compliance Policy picker not found.');
    const label = await pickOption(page, { index: s.policyIndex || 0 });
    if (!label) throw new SkipScenarioError(`No compliance policy at index ${s.policyIndex || 0} on this instance.`);
    picked.policy = label;
  };
}

/** SLO — SLO Type + counter + source (service picker). Instance-dependent. */
function sloHandler() {
  return async (page, s, picked) => {
    if (await openPickerByLabel(page, 'SLO Type')) {
      picked.slo_type = await pickOption(page, { index: s.sloTypeIndex || 0 });
      await waitNoLoader(page, 8000);
    }
    await fillCounters(page, s, picked);
    await fillSource(page, s, picked, { filter: s.sourceFilter || 'Service', required: false });
    await previewWait(page, picked);
  };
}

// --------------------------- custom.script / ai -------------------------------

const SCRIPTS_DIR = path.join(__dirname, 'custom-scripts');
const SCRIPT_FILES = { go: 'sample.go', python: 'sample.py', node: 'sample.js' };
const LANGUAGE_RADIO = { go: 'GO', python: 'Python', node: 'Node.js' };

function loadScript(language) {
  const file = path.join(SCRIPTS_DIR, SCRIPT_FILES[language] || '');
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf-8').trim();
  return src.length ? src : null;
}

async function setCodeEditor(page, source) {
  // CodeMirror exposes its API on the wrapper element — setValue is far more
  // reliable than keyboard-typing a whole script.
  const ok = await page.evaluate((src) => {
    const cm = document.querySelector('.CodeMirror');
    if (cm && cm.CodeMirror) {
      cm.CodeMirror.setValue(src);
      return true;
    }
    return false;
  }, source);
  if (!ok) {
    const editor = page.locator('.CodeMirror').first();
    await editor.click();
    await page.keyboard.insertText(source);
  }
  await page.waitForTimeout(500);
}

/**
 * custom.script — needs a REAL Motadata reporting script. Drop working sources
 * in _core/creation/custom-scripts/ (sample.go / sample.py / sample.js);
 * scenarios whose language has no sample auto-skip.
 */
function customScriptHandler() {
  return async (page, s, picked) => {
    const language = s.language || 'go';
    const src = loadScript(language);
    if (!src) {
      throw new SkipScenarioError(
        `No sample ${language} reporting script at _core/creation/custom-scripts/${SCRIPT_FILES[language]} — drop a working script there to enable this scenario.`,
      );
    }
    if (language !== 'go') {
      await setRadioByText(page, LANGUAGE_RADIO[language]); // 'go' is the default
      await waitNoLoader(page, 5000);
    }
    picked.language = language;
    picked.report_by = await pickCounter(page, { slot: 0, index: s.counterIndex || 0 });
    await fillSource(page, s, picked, { filter: 'Monitor' });
    await setCodeEditor(page, src);
    const exec = page.locator('button:has-text("Execute")').first();
    await exec.click();
    picked.preview = await waitPreviewRendered(page, 90_000);
    if (picked.preview !== 'rendered') throw new Error('Execute produced no preview — the sample script likely failed on the server.');
  };
}

/** ai — Report By + Source, then requirement → Send → poll for the generated script → Execute. */
function aiHandler() {
  return async (page, s, picked) => {
    picked.report_by = await pickCounter(page, { slot: 0, index: s.counterIndex || 0 });
    await fillSource(page, s, picked, { filter: 'Monitor' });

    const req = page.locator('input[placeholder*="CPU and memory" i], input[placeholder*="requirement" i]').first();
    if ((await req.count()) === 0) throw new Error('AI requirement input not found.');
    await req.fill(s.requirement || 'CPU utilization per server for the last 24 hours');
    picked.requirement = s.requirement || 'CPU utilization per server for the last 24 hours';
    await page.locator('button:has-text("Send")').first().click();

    // Backend polls every 10s until the script generation completes.
    let generated = false;
    for (let left = 240_000; left > 0; left -= 2000) {
      generated = await page.evaluate(() => {
        const cm = document.querySelector('.CodeMirror');
        return !!(cm && cm.CodeMirror && cm.CodeMirror.getValue().trim().length > 0);
      });
      if (generated) break;
      const err = await page.locator('.ai-generation-error, .ant-alert-error').count();
      if (err > 0) throw new Error('AI script generation reported an error.');
      await page.waitForTimeout(2000);
    }
    if (!generated) throw new Error('AI script was not generated within 240s.');
    picked.ai_script = 'generated';

    await page.locator('button:has-text("Execute")').first().click();
    picked.preview = await waitPreviewRendered(page, 90_000);
  };
}

// ------------------------------ the registry ----------------------------------

/**
 * Every entry: label (exact step-1 tile text), handler, scenarios (≥5),
 * soft (failures reported but not fatal — instance/data-dependent categories),
 * nextTimeout (override for slow previews).
 *
 * Not registered (can't be reached from the create page):
 *   - log.event           same "Log Events" tile as event.history
 *   - capacity.planning   no tile (only capacity.planning.forecast is exposed)
 *   - nccm.compliance.summary  shares the "Compliance" tile with
 *     nccm.compliance.policy — the tile always opens the policy flavor.
 */
const CATEGORIES = {
  metric: {
    label: 'Performance',
    handler: counterSourceHandler(),
    scenarios: [
      sc('c0_1m', { counterIndex: 0, monitors: 1 }),
      sc('c1_1m', { counterIndex: 1, monitors: 1 }),
      sc('c2_1m', { counterIndex: 2, monitors: 1 }),
      sc('c0_3m', { counterIndex: 0, monitors: 3 }),
      sc('c1_3m', { counterIndex: 1, monitors: 3 }),
      sc('c0_all', { counterIndex: 0, monitors: 'all' }),
      sc('2c_1m', { counters: 2, counterIndex: 0, monitors: 1 }),
      sc('2c_3m', { counters: 2, counterIndex: 2, monitors: 3 }),
    ],
  },

  availability: {
    label: 'Availability',
    handler: sourceOnlyHandler(),
    scenarios: [
      sc('1m'),
      sc('3m', { monitors: 3 }),
      sc('5m', { monitors: 5 }),
      sc('all', { monitors: 'all' }),
      sc('group', { sourceFilter: 'Group', monitors: 1 }),
      sc('tag', { sourceFilter: 'Tag', monitors: 1 }),
    ],
  },

  inventory: {
    label: 'Inventory',
    handler: sourceOnlyHandler(),
    scenarios: [
      sc('1m'),
      sc('3m', { monitors: 3 }),
      sc('all', { monitors: 'all' }),
      sc('group', { sourceFilter: 'Group', monitors: 1 }),
      sc('tag', { sourceFilter: 'Tag', monitors: 1 }),
    ],
  },

  audit: {
    label: 'Audit',
    handler: auditHandler(),
    scenarios: [
      sc('defaults'),
      sc('module0', { moduleIndex: 0 }),
      sc('module0_op0', { moduleIndex: 0, operationIndex: 0 }),
      sc('module1_users0', { moduleIndex: 1, usersIndex: 0 }),
      sc('status1', { statusIndex: 1 }),
      sc('resultby1', { resultByIndex: 1 }),
    ],
  },

  log: {
    label: 'Log Analytics',
    handler: counterSourceHandler({ sourceFilter: 'Source Host' }),
    scenarios: [
      sc('c0_h1'),
      sc('c1_h1', { counterIndex: 1 }),
      sc('c2_h1', { counterIndex: 2 }),
      sc('c0_h3', { monitors: 3 }),
      sc('c0_all', { monitors: 'all' }),
      sc('c0_rb0', { resultByIndex: 0 }),
    ],
  },

  flow: {
    label: 'Flow Analytics',
    handler: counterSourceHandler({ sourceFilter: 'Source Host' }),
    scenarios: [
      sc('c0_h1'),
      sc('c1_h1', { counterIndex: 1 }),
      sc('c2_h1', { counterIndex: 2 }),
      sc('c0_h3', { monitors: 3 }),
      sc('c0_all', { monitors: 'all' }),
    ],
  },

  forecast: {
    label: 'Forecast',
    handler: forecastHandler(),
    scenarios: [
      sc('pct_c0_1w', { monitors: 'all' }),
      sc('pct_c1_1w', { counterIndex: 1, monitors: 'all' }),
      sc('pct_c2_1w', { counterIndex: 2, monitors: 'all' }),
      sc('pct_c0_12h', { rangeIndex: 0, monitors: 'all' }),
      sc('pct_c0_2w', { rangeIndex: 4, monitors: 'all' }),
      sc('pct_c1_1mo', { counterIndex: 1, rangeIndex: 5, monitors: 'all' }),
      sc('time_c0', { forecastType: 'time', monitors: 'all' }),
      sc('time_c1', { forecastType: 'time', counterIndex: 1, monitors: 'all' }),
    ],
  },

  'active.alerts': {
    label: 'Active Alerts',
    handler: alertHandler(),
    scenarios: [
      sc('defaults'),
      sc('metric_all_sev', { policyType: 'metric' }),
      sc('metric_sev01', { policyType: 'metric', severityIndices: [0, 1] }),
      sc('metric_sev2', { policyType: 'metric', severityIndices: [2] }),
      sc('apm', { policyType: 'apm.trace.metric' }),
      sc('rum', { policyType: 'rum.metric' }),
    ],
  },

  'metric.alert': {
    label: 'Metric Alerts',
    handler: alertHandler(),
    scenarios: [
      sc('defaults'),
      sc('sev0', { severityIndices: [0] }),
      sc('sev01', { severityIndices: [0, 1] }),
      sc('sev12', { severityIndices: [1, 2] }),
      sc('sev012', { severityIndices: [0, 1, 2] }),
    ],
  },

  'availability.alerts': {
    label: 'Availability Status',
    handler: alertHandler(),
    scenarios: [
      sc('defaults'),
      sc('sev0', { severityIndices: [0] }),
      sc('sev01', { severityIndices: [0, 1] }),
      sc('sev2', { severityIndices: [2] }),
      sc('sev012', { severityIndices: [0, 1, 2] }),
    ],
  },

  'event.history': {
    label: 'Log Events',
    handler: counterSourceHandler({ sourceFilter: 'Source Host' }),
    scenarios: [
      sc('c0_h1'),
      sc('c1_h1', { counterIndex: 1 }),
      sc('c0_h3', { monitors: 3 }),
      sc('c0_all', { monitors: 'all' }),
      sc('c2_h1', { counterIndex: 2 }),
    ],
  },

  trap: {
    label: 'Trap',
    handler: counterSourceHandler({ sourceFilter: 'Source Host' }),
    scenarios: [
      sc('c0_h1'),
      sc('c1_h1', { counterIndex: 1 }),
      sc('c0_h3', { monitors: 3 }),
      sc('c0_all', { monitors: 'all' }),
      sc('c2_h1', { counterIndex: 2 }),
    ],
  },

  'log.compliance': {
    label: 'Log Compliance',
    handler: counterSourceHandler({ sourceFilter: 'Source Host' }),
    scenarios: [
      sc('c0_h1'),
      sc('c1_h1', { counterIndex: 1 }),
      sc('c0_h3', { monitors: 3 }),
      sc('c0_all', { monitors: 'all' }),
      sc('c2_h1', { counterIndex: 2 }),
    ],
  },

  'availability.flap.summary': {
    // Save-first: no preview ever, Next never disables. Counter is fixed to
    // 'monitor' — don't touch it. Tag is excluded from the source options.
    label: 'Availability Flap Summary',
    handler: sourceOnlyHandler({ tryCounter: false, waitPreview: false }),
    scenarios: [
      sc('1m'),
      sc('2m', { monitors: 2 }),
      sc('3m', { monitors: 3 }),
      sc('5m', { monitors: 5 }),
      sc('all', { monitors: 'all' }),
      sc('group', { sourceFilter: 'Group', monitors: 1 }),
    ],
  },

  'historical.trend': {
    // Save-first, no preview ever; scalar-only counters, monitors picked once.
    label: 'Historical Trend',
    handler: counterSourceHandler({ waitPreview: false }),
    scenarios: [
      sc('c0_1m'),
      sc('c1_1m', { counterIndex: 1 }),
      sc('c0_3m', { monitors: 3 }),
      sc('c0_all', { monitors: 'all' }),
      sc('2c_1m', { counters: 2 }),
      sc('2c_3m', { counters: 2, counterIndex: 1, monitors: 3 }),
    ],
  },

  polling: {
    label: 'Polling Data',
    handler: counterSourceHandler(),
    scenarios: [
      sc('c0_1m'),
      sc('c1_1m', { counterIndex: 1 }),
      sc('c2_1m', { counterIndex: 2 }),
      sc('c0_3m', { monitors: 3 }),
      sc('c0_all', { monitors: 'all' }),
    ],
  },

  'unhealthy.monitors': {
    label: 'Unhealthy Monitors',
    handler: sourceOnlyHandler({ tryCounter: false }),
    scenarios: [
      sc('1m'),
      sc('3m', { monitors: 3 }),
      sc('5m', { monitors: 5 }),
      sc('all', { monitors: 'all' }),
      sc('group', { sourceFilter: 'Group', monitors: 1 }),
    ],
  },

  'capacity.planning.forecast': {
    label: 'Capacity Forecasting',
    handler: capacityHandler(),
    scenarios: [
      sc('static80_c0', { threshold: 80 }),
      sc('static90_c0', { threshold: 90 }),
      sc('static80_c1', { counterIndex: 1, threshold: 80 }),
      sc('static80_12h', { threshold: 80, rangeIndex: 0 }),
      sc('static95_all', { threshold: 95, monitors: 'all' }),
      sc('dynamic_c0', { thresholdType: 'dynamic' }),
    ],
  },

  'trace.metric': {
    label: 'APM',
    soft: true,
    handler: counterSourceHandler(),
    scenarios: [
      sc('c0_1m'),
      sc('c1_1m', { counterIndex: 1 }),
      sc('c2_1m', { counterIndex: 2 }),
      sc('c0_all', { monitors: 'all' }),
      sc('c1_all', { counterIndex: 1, monitors: 'all' }),
    ],
  },

  'rum.metric': {
    label: 'RUM',
    soft: true,
    handler: counterSourceHandler({ sourceFilter: 'Application' }),
    scenarios: [
      sc('c0_1m'),
      sc('c1_1m', { counterIndex: 1 }),
      sc('c2_1m', { counterIndex: 2 }),
      sc('c0_all', { monitors: 'all' }),
      sc('c1_all', { counterIndex: 1, monitors: 'all' }),
    ],
  },

  'netroute.metric': {
    label: 'NetRoute',
    soft: true,
    handler: counterSourceHandler({ sourceFilter: 'Netroute' }),
    scenarios: [
      sc('c0_1m'),
      sc('c1_1m', { counterIndex: 1 }),
      sc('c2_1m', { counterIndex: 2 }),
      sc('c0_all', { monitors: 'all' }),
      sc('c1_all', { counterIndex: 1, monitors: 'all' }),
    ],
  },

  SLO: {
    label: 'SLO',
    soft: true,
    handler: sloHandler(),
    scenarios: [
      sc('t0_c0'),
      sc('t0_c1', { counterIndex: 1 }),
      sc('t1_c0', { sloTypeIndex: 1 }),
      sc('t0_all', { monitors: 'all' }),
      sc('t1_c1', { sloTypeIndex: 1, counterIndex: 1 }),
    ],
  },

  config: {
    label: 'NCCM',
    soft: true,
    handler: counterSourceHandler(),
    scenarios: [
      sc('c0_1m'),
      sc('c1_1m', { counterIndex: 1 }),
      sc('c2_1m', { counterIndex: 2 }),
      sc('c0_3m', { monitors: 3 }),
      sc('c0_all', { monitors: 'all' }),
    ],
  },

  'nccm.compliance.policy': {
    label: 'Compliance',
    soft: true,
    handler: compliancePolicyHandler(),
    // One per policy index — instances usually have single-digit policies;
    // out-of-range indices skip rather than fail.
    scenarios: [
      sc('policy0', { policyIndex: 0 }),
      sc('policy1', { policyIndex: 1 }),
      sc('policy2', { policyIndex: 2 }),
      sc('policy3', { policyIndex: 3 }),
      sc('policy4', { policyIndex: 4 }),
    ],
  },

  'custom.script': {
    label: 'Custom Script',
    soft: true,
    nextTimeout: 120_000,
    handler: customScriptHandler(),
    scenarios: [
      sc('go_c0', { language: 'go' }),
      sc('go_c1', { language: 'go', counterIndex: 1 }),
      sc('go_all', { language: 'go', monitors: 'all' }),
      sc('python_c0', { language: 'python' }),
      sc('node_c0', { language: 'node' }),
    ],
  },

  ai: {
    label: 'AI',
    soft: true,
    nextTimeout: 120_000,
    handler: aiHandler(),
    scenarios: [
      sc('cpu24h', { requirement: 'CPU utilization per server for the last 24 hours' }),
      sc('mem24h', { requirement: 'Memory utilization per server for the last 24 hours' }),
      sc('disk7d', { requirement: 'Disk usage per server for the last 7 days' }),
      sc('cpu_mem', { requirement: 'CPU and memory per server for last 24h' }),
      sc('uptime', { requirement: 'Uptime percentage per monitor for the last week' }),
    ],
  },
};

module.exports = { CATEGORIES };
