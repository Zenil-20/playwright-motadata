/*
 * Azure DevOps Test Plans — WRITE side (push manual test cases up).
 *
 * Counterpart to `tfs.js`, which only READS a plan (importPlan). This module creates a
 * static suite named `MOTADATA-<jiraId>` under a configured plan, creates Test Case work
 * items with proper step tables, and links them into that suite. Idempotent: re-running a
 * ticket reuses its suite and skips cases already present (matched on title).
 *
 * Env: AZURE_ORG_URL, AZURE_PROJECT, AZURE_PAT, AZURE_TEST_PLAN_ID
 *   AZURE_ORG_URL       https://dev.azure.com/<org>   (or https://<server>/<collection> on-prem)
 *   AZURE_TEST_PLAN_ID  the plan the MOTADATA-<id> folders are created under
 *   AZURE_PARENT_SUITE_ID  optional — nest under this suite instead of the plan root
 *
 * Self-signed on-prem certs: set AZURE_INSECURE=1 (same escape hatch as TFS_INSECURE).
 */

/* Applied per request, not at import: ES imports are hoisted above the caller's
 * dotenv.config(), so reading AZURE_INSECURE at module scope always saw it unset. */
function applyTlsPolicy() {
  const insecure = process.env.AZURE_INSECURE === '1' || process.env.TFS_INSECURE === '1';
  if (insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/* On-prem Azure DevOps Server (ad-motadata:8443) is pinned to these — probed against the
 * live server, which rejects 7.x with HTTP 400. Matches the versions tfs.js reads with.
 * Override per-server via env if this ever points at dev.azure.com. */
/* Read lazily, not at module scope — an importer's dotenv.config() runs after this
 * module is evaluated, so a module-level read would always miss the overrides. */
const WIT_API = () => process.env.AZURE_WIT_API || '6.0';
const PLAN_API = () => process.env.AZURE_PLAN_API || '6.0-preview.1';
const SUITE_CASE_API = () => process.env.AZURE_SUITE_CASE_API || '6.0-preview.2';

/* This is the same server tfs.js reads from, so AZURE_* falls back to the TFS_* vars
 * already in use — one PAT, one collection URL, no duplicated config. */
export const cfg = () => ({
  org: process.env.AZURE_ORG_URL || process.env.TFS_BASE_URL || '',
  project: process.env.AZURE_PROJECT || process.env.TFS_PROJECT || '',
  pat: process.env.AZURE_PAT || process.env.TFS_PAT || '',
  planId: process.env.AZURE_TEST_PLAN_ID || '',
});

function auth() {
  const { pat } = cfg();
  if (!pat) throw new Error('AZURE_PAT (or TFS_PAT) not set — copy .env.example → .env and fill it in');
  return 'Basic ' + Buffer.from(`:${pat}`).toString('base64');
}

function projBase() {
  const { org, project } = cfg();
  if (!org || !project) throw new Error('AZURE_ORG_URL / AZURE_PROJECT not set (TFS_BASE_URL / TFS_PROJECT also accepted)');
  return `${org.replace(/\/$/, '')}/${encodeURIComponent(project)}`;
}

async function call(url, { method = 'GET', body, contentType = 'application/json' } = {}) {
  applyTlsPolicy();
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: auth(),
      Accept: 'application/json',
      ...(body ? { 'Content-Type': contentType } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ADO ${method} ${res.status} ${url}\n${detail.slice(0, 500)}`);
  }
  // A PAT with no Test Plans scope silently redirects to the sign-in page (HTML, HTTP 200).
  const text = await res.text();
  if (text.trimStart().startsWith('<')) {
    throw new Error(`ADO returned HTML, not JSON — the PAT is likely invalid or lacks scope.\nURL: ${url}`);
  }
  return text ? JSON.parse(text) : null;
}

/* ------------------------------------------------------------------ *
 * Step table — Microsoft.VSTS.TCM.Steps is an XML blob, not plain text.
 * ------------------------------------------------------------------ */

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A cell holds HTML, which is then escaped again to survive as XML text. */
const cell = (s) => esc(`<DIV><P>${esc(s)}</P></DIV>`);

/**
 * Build the Steps XML from [{ action, expected }].
 *
 * Mirrors the CSV layout: every Step Action / Step Expected is prefixed with its
 * 1-based step number ("1. Login as admin; ..."), exactly as in the sample export.
 * ADO numbers step elements from id="2", so `last` is stepCount + 1.
 */
export function buildStepsXml(steps = []) {
  if (!steps.length) return '';
  const body = steps
    .map((s, i) => {
      const n = i + 1;
      const action = cell(`${n}. ${s.action ?? s.Action ?? ''}`);
      const expected = cell(`${n}. ${s.expected ?? s.Expected ?? ''}`);
      return (
        `<step id="${i + 2}" type="ActionStep">` +
        `<parameterizedString isformatted="true">${action}</parameterizedString>` +
        `<parameterizedString isformatted="true">${expected}</parameterizedString>` +
        `<description/></step>`
      );
    })
    .join('');
  return `<steps id="0" last="${steps.length + 1}">${body}</steps>`;
}

/* ------------------------------------------------------------------ *
 * Suites — find-or-create the MOTADATA-<jiraId> folder.
 * ------------------------------------------------------------------ */

/** Fetch a plan → { id, name, rootSuiteId }. */
export async function getPlan(planId) {
  const d = await call(`${projBase()}/_apis/testplan/plans/${planId}?api-version=${PLAN_API()}`);
  return { id: d.id, name: d.name || '', rootSuiteId: d.rootSuite?.id ?? null };
}

/** List every suite in the plan → [{ id, name, parentId, suiteType }]. */
export async function listSuites(planId) {
  const d = await call(`${projBase()}/_apis/testplan/Plans/${planId}/suites?api-version=${PLAN_API()}`);
  return (d.value || []).map((s) => ({
    id: s.id,
    name: s.name || '',
    parentId: s.parentSuite?.id ?? null,
    suiteType: s.suiteType,
  }));
}

/** Create a static suite under `parentSuiteId` → { id, name }. */
export async function createStaticSuite(planId, parentSuiteId, name) {
  const d = await call(
    `${projBase()}/_apis/testplan/Plans/${planId}/suites?api-version=${PLAN_API()}`,
    { method: 'POST', body: { suiteType: 'StaticTestSuite', name, parentSuite: { id: parentSuiteId } } },
  );
  return { id: d.id, name: d.name };
}

/**
 * Find-or-create the `MOTADATA-<jiraId>` suite. Safe to call on every pipeline run —
 * an existing folder is reused, never duplicated.
 *
 * @param {number|string} planId
 * @param {string} jiraId   bare id ("7506") or full key ("MOTADATA-7506")
 * @returns {Promise<{ id:number, name:string, created:boolean }>}
 */
export async function ensureTicketSuite(planId, jiraId, { parentSuiteId } = {}) {
  const name = /^MOTADATA-/i.test(String(jiraId)) ? String(jiraId).toUpperCase() : `MOTADATA-${jiraId}`;
  const plan = await getPlan(planId);
  const parent = parentSuiteId || process.env.AZURE_PARENT_SUITE_ID || plan.rootSuiteId;
  if (!parent) throw new Error(`Plan ${planId} has no root suite and no parent suite was given`);

  const existing = (await listSuites(planId)).find(
    (s) => s.name.toLowerCase() === name.toLowerCase() && String(s.parentId) === String(parent),
  );
  if (existing) return { id: existing.id, name: existing.name, created: false };

  const made = await createStaticSuite(planId, parent, name);
  return { ...made, created: true };
}

/* ------------------------------------------------------------------ *
 * Test case work items.
 * ------------------------------------------------------------------ */

/**
 * Create a Test Case work item.
 * @param {Record<string,any>} fields  full ADO field refnames → value, e.g.
 *        { 'System.Title': '...', 'Microsoft.VSTS.TCM.Steps': '<steps .../>' }
 * @returns {Promise<{ id:number, title:string }>}
 */
export async function createTestCase(fields) {
  const patch = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([path, value]) => ({ op: 'add', path: `/fields/${path}`, value }));
  const d = await call(
    `${projBase()}/_apis/wit/workitems/$Test%20Case?api-version=${WIT_API()}`,
    { method: 'POST', body: patch, contentType: 'application/json-patch+json' },
  );
  return { id: d.id, title: d.fields?.['System.Title'] || '' };
}

/** Link existing test case work items into a suite. */
export async function addTestCasesToSuite(planId, suiteId, testCaseIds) {
  if (!testCaseIds.length) return [];
  const d = await call(
    `${projBase()}/_apis/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=${SUITE_CASE_API()}`,
    { method: 'POST', body: testCaseIds.map((id) => ({ workItem: { id } })) },
  );
  return (d.value || []).map((c) => c.workItem?.id).filter(Boolean);
}

/** Titles already present in a suite — used to make publishing idempotent. */
export async function listSuiteCaseTitles(planId, suiteId) {
  const d = await call(
    `${projBase()}/_apis/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=${SUITE_CASE_API()}`);
  return new Set((d.value || []).map((c) => (c.workItem?.name || '').trim().toLowerCase()).filter(Boolean));
}

/* ------------------------------------------------------------------ *
 * Mapping — manual-cases.json → the agreed CSV field set.
 *
 * The reference export has exactly ten columns:
 *   ID, Work Item Type, Title, Test Step, Step Action, Step Expected,
 *   Area Path, Assigned To, State, Tags
 * ID is assigned by ADO on create and Work Item Type is fixed to "Test Case",
 * so a pushed case sets only Title, Steps, Area Path, Assigned To, State and Tags.
 * Nothing else is written — no Priority, no Description.
 *
 * Tags carry the scenario taxonomy (Functional / Impacted / Edge / Regression /
 * Negative / Security / UI / API / Audit / ...). ADO stores System.Tags as a
 * semicolon-delimited string, so a case's `tags: []` is joined with "; ".
 * ------------------------------------------------------------------ */

/** ADO wants System.Tags as "A; B; C". Dedups, trims, drops empties. */
export function tagsToField(tags) {
  const list = (Array.isArray(tags) ? tags : String(tags ?? '').split(';'))
    .map((t) => String(t).trim())
    .filter(Boolean);
  return [...new Set(list)].join('; ');
}

/**
 * Map one manual case to ADO field refnames.
 *
 * Preconditions have no column in the format, so they are folded into the first
 * step's action as a "Pre-requisite:" clause — matching how the reference export
 * carries setup inline ("1. Login as admin; click 'Report' ...").
 *
 * @param {{ title:string, steps:Array<{action:string,expected:string}>, preconditions?:string[] }} mc
 * @param {{ areaPath?:string, assignedTo?:string, state?:string }} [opts]
 */
export function caseToFields(mc, opts = {}) {
  const areaPath = opts.areaPath ?? process.env.AZURE_AREA_PATH;
  const assignedTo = opts.assignedTo ?? process.env.AZURE_ASSIGNED_TO;
  const state = opts.state ?? process.env.AZURE_STATE ?? 'Design';

  const title = String(mc.title || '').trim();
  if (!title) throw new Error(`Manual case ${mc.id || '<no id>'} has no title`);

  const steps = (mc.steps || []).map((s) => ({
    action: s.action ?? s.Action ?? '',
    expected: s.expected ?? s.Expected ?? '',
  }));
  if (!steps.length) throw new Error(`Manual case "${title}" has no steps`);

  const pre = (mc.preconditions || []).filter(Boolean);
  if (pre.length) {
    steps[0] = { ...steps[0], action: `Pre-requisite: ${pre.join('; ')}. ${steps[0].action}` };
  }

  return {
    'System.Title': title,
    'Microsoft.VSTS.TCM.Steps': buildStepsXml(steps),
    'System.AreaPath': areaPath,
    'System.AssignedTo': assignedTo,
    'System.State': state,
    'System.Tags': tagsToField(opts.tags ?? mc.tags),
  };
}

/* ------------------------------------------------------------------ *
 * Identity — map a Jira reporter onto an ADO user.
 * ------------------------------------------------------------------ */

/**
 * Build the `Assigned To` value for a Jira reporter.
 *
 * Jira and ADO sit on the same AD, so the Jira account name is the AD account name:
 * reporter.name "gaurang.kalani" → "MOTADATA\gaurang.kalani". Probed against the live
 * server: this form resolves, and an email address does NOT (it comes back "unknown
 * identity"), so the account name is the only reliable key.
 */
export function reporterToIdentity(reporter, domain = process.env.AZURE_IDENTITY_DOMAIN || 'MOTADATA') {
  const name = typeof reporter === 'string' ? reporter : reporter?.name;
  if (!name) return null;
  return name.includes('\\') ? name : `${domain}\\${name}`;
}

/**
 * Ask the work item tracker whether an Assigned To value resolves, creating nothing
 * (`validateOnly=true`). Lets the publisher fall back instead of failing every case.
 */
export async function identityResolves(identity) {
  if (!identity) return false;
  const patch = [
    { op: 'add', path: '/fields/System.Title', value: 'identity probe' },
    { op: 'add', path: '/fields/Microsoft.VSTS.TCM.Steps', value: buildStepsXml([{ action: 'a', expected: 'e' }]) },
    { op: 'add', path: '/fields/System.AssignedTo', value: identity },
  ];
  try {
    await call(`${projBase()}/_apis/wit/workitems/$Test%20Case?validateOnly=true&api-version=${WIT_API()}`,
      { method: 'POST', body: patch, contentType: 'application/json-patch+json' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Decide the Assigned To for a ticket's cases. Precedence:
 *   1. explicit  (--assigned-to)
 *   2. AZURE_ASSIGNED_TO
 *   3. the Jira reporter of <jiraId>, as DOMAIN\name
 *   4. undefined — the field is omitted and ADO falls back to the PAT owner
 *
 * Never throws: Jira being down or the reporter not existing in AD degrades to the next
 * option, so publishing is not blocked by identity lookup.
 *
 * @returns {Promise<{ value:string|undefined, via:string }>} `via` explains the choice.
 */
export async function resolveAssignee({ jiraId, explicit } = {}) {
  if (explicit) return { value: explicit, via: 'explicit' };
  if (process.env.AZURE_ASSIGNED_TO) return { value: process.env.AZURE_ASSIGNED_TO, via: 'AZURE_ASSIGNED_TO' };
  if (!jiraId) return { value: undefined, via: 'default (PAT owner)' };

  let reporter;
  try {
    const { fetchReporter } = await import('./jira.js');
    reporter = await fetchReporter(jiraId);
  } catch (e) {
    return { value: undefined, via: `default (PAT owner) — Jira lookup failed: ${e.message}` };
  }
  if (!reporter?.name) return { value: undefined, via: `default (PAT owner) — ${jiraId} has no reporter` };

  const identity = reporterToIdentity(reporter);
  if (!(await identityResolves(identity))) {
    return { value: undefined, via: `default (PAT owner) — "${identity}" is not a known ADO identity` };
  }
  return { value: identity, via: `jira reporter ${reporter.displayName} (${identity})` };
}

/* ------------------------------------------------------------------ *
 * Publish — the one call the pipeline makes.
 * ------------------------------------------------------------------ */

/**
 * Create (or reuse) the `MOTADATA-<jiraId>` suite and push every manual case into it.
 * Cases whose title already exists in the suite are skipped, so a re-run of the same
 * ticket adds only what is new.
 *
 * @param {{ jiraId:string, cases:Array, planId?:number|string,
 *           areaPath?:string, assignedTo?:string, state?:string, dryRun?:boolean }} o
 * @returns {Promise<{ suite:object, created:Array, skipped:Array, planId:string }>}
 */
export async function publishManualCases({
  jiraId, cases, planId, areaPath, assignedTo, state, dryRun = false,
}) {
  const plan = planId || cfg().planId;
  if (!plan) throw new Error('AZURE_TEST_PLAN_ID not set (or pass planId)');
  if (!jiraId) throw new Error('jiraId is required — it names the suite');
  if (!cases?.length) throw new Error('no manual cases to publish');

  // Assigned To follows the ticket's Jira reporter unless overridden. Resolved once per
  // publish, not per case — one Jira call and one identity probe for the whole suite.
  const assignee = await resolveAssignee({ jiraId, explicit: assignedTo });

  // Map everything up front so a bad case fails before any work item is created.
  const mapped = cases.map((c) => ({
    mc: c,
    fields: caseToFields(c, { areaPath, assignedTo: assignee.value, state }),
  }));

  if (dryRun) {
    return {
      planId: String(plan),
      suite: { name: /^MOTADATA-/i.test(jiraId) ? jiraId.toUpperCase() : `MOTADATA-${jiraId}`, dryRun: true },
      created: mapped.map((m) => ({ title: m.fields['System.Title'], id: null })),
      skipped: [],
      assignee,
    };
  }

  const suite = await ensureTicketSuite(plan, jiraId);
  const existing = await listSuiteCaseTitles(plan, suite.id);

  const created = [];
  const skipped = [];
  for (const { fields } of mapped) {
    const title = fields['System.Title'];
    if (existing.has(title.trim().toLowerCase())) {
      skipped.push({ title });
      continue;
    }
    const wi = await createTestCase(fields);
    await addTestCasesToSuite(plan, suite.id, [wi.id]);
    created.push({ id: wi.id, title });
  }

  return { planId: String(plan), suite, created, skipped, assignee };
}
