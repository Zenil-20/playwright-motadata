/*
 * TFS / Azure DevOps integration — fetch a work item and (optionally) query test
 * cases via WIQL. JS port of observeops-qa framework/services/tfs_service.py.
 *
 * Env: TFS_BASE_URL, TFS_PROJECT, TFS_PAT  (PAT is sent as the password with empty user)
 */

function auth() {
  const pat = process.env.TFS_PAT || '';
  return 'Basic ' + Buffer.from(`:${pat}`).toString('base64');
}

async function get(url) {
  const res = await fetch(url, { headers: { Authorization: auth(), Accept: 'application/json' } });
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
