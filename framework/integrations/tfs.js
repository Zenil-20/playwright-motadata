/*
 * TFS / Azure DevOps integration — fetch a work item, query test cases via WIQL, and
 * READ a test plan's suites + cases (Flow A "GET TFS TEST CASES").
 * JS port of observeops-qa framework/services/tfs_service.py.
 *
 * Env: TFS_BASE_URL, TFS_PROJECT, TFS_PAT  (PAT is sent as the password with empty user)
 *
 * On-prem TFS (Azure DevOps Server) commonly uses a self-signed cert. The `tfs-import` CLI
 * relaxes TLS for its own process (NODE_TLS_REJECT_UNAUTHORIZED=0) — set `TFS_INSECURE=1` to have
 * this module do the same when imported directly.
 */

import { emptyCase } from '../core/testcase-store/mapping.js';

// On-prem TFS is typically self-signed; opt in to relaxed TLS via TFS_INSECURE=1.
if (process.env.TFS_INSECURE === '1') process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function auth() {
  const pat = process.env.TFS_PAT || '';
  return 'Basic ' + Buffer.from(`:${pat}`).toString('base64');
}

async function get(url) {
  const res = await fetch(url, {
    headers: { Authorization: auth(), Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`TFS: HTTP ${res.status} for ${url}`);
  return res.json();
}

const projBase = () => {
  const base = process.env.TFS_BASE_URL;
  const proj = process.env.TFS_PROJECT;
  if (!base || !proj) throw new Error('TFS_BASE_URL / TFS_PROJECT not set');
  return `${base.replace(/\/$/, '')}/${encodeURIComponent(proj)}`;
};

/** Fetch a work item → { source, key, title, text }. */
export async function fetchRequirement(workItemId) {
  const data = await get(`${projBase()}/_apis/wit/workitems/${workItemId}?api-version=6.0`);
  const f = data.fields || {};
  return {
    source: `tfs:${workItemId}`,
    key: String(workItemId),
    title: f['System.Title'] || '',
    text: [f['System.Description'], f['Microsoft.VSTS.TCM.Steps']].filter(Boolean).join('\n\n'),
  };
}

/**
 * List test cases via WIQL, returning [{ id, title }]. Defaults to all Test Case
 * work items in the project. Ported to be live (observeops left this as a stub).
 */
export async function listTestCases(wiql) {
  const query = wiql ||
    `SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.WorkItemType] = 'Test Case'`;
  const q = await fetch(`${projBase()}/_apis/wit/wiql?api-version=6.0`, {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!q.ok) throw new Error(`TFS WIQL: HTTP ${q.status}`);
  const { workItems = [] } = await q.json();
  const ids = workItems.map((w) => w.id).slice(0, 200);
  if (!ids.length) return [];
  const batch = await get(`${projBase()}/_apis/wit/workitems?ids=${ids.join(',')}&fields=System.Id,System.Title&api-version=6.0`);
  return (batch.value || []).map((w) => ({ id: w.id, title: w.fields['System.Title'] }));
}

/* ------------------------------------------------------------------ *
 * Flow A — GET TFS TEST CASES: read a test plan's suites and cases.
 * ------------------------------------------------------------------ */

/** Fetch a test plan → { id, name }. */
export async function getPlan(planId) {
  const data = await get(`${projBase()}/_apis/test/plans/${planId}?api-version=5.0`);
  return { id: data.id, name: data.name || '' };
}

/** List the suites of a plan → [{ id, name, testCaseCount, parent }]. The `test` API returns
 *  a flat list where each suite carries its `parent` ({id,name}) — that's how we rebuild the tree. */
export async function listSuites(planId) {
  const data = await get(`${projBase()}/_apis/test/plans/${planId}/suites?api-version=5.0`);
  return (data.value || []).map((s) => ({
    id: s.id,
    name: s.name || '',
    testCaseCount: s.testCaseCount ?? 0,
    parent: s.parent ? { id: String(s.parent.id), name: s.parent.name || '' } : null,
  }));
}

/** List the test cases of a suite → [{ id, title }] (from workItem.id / workItem.name). */
export async function listSuiteTestCases(planId, suiteId) {
  const data = await get(
    `${projBase()}/_apis/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=6.0-preview.2`);
  return (data.value || [])
    .map((c) => c.workItem || {})
    .filter((w) => w.id != null)
    .map((w) => ({ id: w.id, title: w.name || '' }));
}

/**
 * Walk a plan's suites (optionally filtered by a case-insensitive substring on the suite
 * name), collect every test case, dedup by test-case id, and return canonical 13-field rows.
 *
 * @param {number|string} planId
 * @param {{ suiteFilter?: string }} [opts]
 * @returns {Promise<{ plan:{id,name}, suites:Array<{id,name,testCaseCount,matched}>, rows:Array }>}
 */
export async function importPlan(planId, { suiteFilter, subtreeOf } = {}) {
  const plan = await getPlan(planId);
  const allSuites = await listSuites(planId);

  // Rebuild the tree from each suite's `parent`.
  const childrenOf = new Map();
  for (const s of allSuites) {
    const p = s.parent && s.parent.id;
    if (p) (childrenOf.get(p) || childrenOf.set(p, []).get(p)).push(s);
  }

  const selected = new Set();
  const roots = (subtreeOf || []).map((x) => String(x).toLowerCase());
  const needle = suiteFilter ? String(suiteFilter).toLowerCase() : null;

  // Collect a suite and ALL its descendants (folders like "NCCM" have 0 direct cases —
  // their cases live in child suites such as explorer/overview/Approval).
  const addSubtree = (id) => {
    const key = String(id);
    if (selected.has(key)) return;
    selected.add(key);
    (childrenOf.get(key) || []).forEach((c) => addSubtree(c.id));
  };

  if (roots.length) {
    for (const s of allSuites) if (roots.includes(s.name.toLowerCase())) addSubtree(s.id);
  }
  if (needle) {
    for (const s of allSuites) if (s.name.toLowerCase().includes(needle)) selected.add(String(s.id));
  }
  if (!roots.length && !needle) {
    for (const s of allSuites) selected.add(String(s.id)); // whole plan
  }

  const seen = new Set();
  const rows = [];
  const suites = [];
  for (const suite of allSuites) {
    const matched = selected.has(String(suite.id));
    suites.push({ ...suite, matched });
    if (!matched) continue;

    const cases = await listSuiteTestCases(planId, suite.id);
    for (const tc of cases) {
      if (seen.has(tc.id)) continue;
      seen.add(tc.id);
      rows.push({
        ...emptyCase(),
        id: tc.id,
        title: tc.title,
        module: suite.name,
        type: 'Test Case',
        source: `tfs:plan${planId}/suite${suite.id}`,
      });
    }
  }

  return { plan, suites, rows };
}
