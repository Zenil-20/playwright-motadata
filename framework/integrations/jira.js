/*
 * Jira integration — fetch an issue and normalize it to a Requirement.
 * JS port of observeops-qa framework/services/jira_service.py.
 *
 * Env: JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD, JIRA_PROJECT (default MOTADATA)
 */

const PROJECT = () => process.env.JIRA_PROJECT || 'MOTADATA';

/** "9201" -> "MOTADATA-9201"; pass-through if already prefixed. */
export function normalizeKey(key) {
  const k = String(key).trim();
  return /^[A-Z]+-\d+$/i.test(k) ? k.toUpperCase() : `${PROJECT()}-${k}`;
}

function auth() {
  const u = process.env.JIRA_USERNAME || '';
  const p = process.env.JIRA_PASSWORD || '';
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

/** Fetch a Jira issue → { source, key, title, text }. */
export async function fetchRequirement(key) {
  const base = process.env.JIRA_BASE_URL;
  if (!base) throw new Error('JIRA_BASE_URL not set');
  const k = normalizeKey(key);
  const url = `${base.replace(/\/$/, '')}/rest/api/2/issue/${k}?expand=names,renderedFields`;

  const res = await fetch(url, { headers: { Authorization: auth(), Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Jira ${k}: HTTP ${res.status}`);
  const data = await res.json();
  const f = data.fields || {};

  // Pull description + any custom fields that look like acceptance criteria / steps.
  const hints = ['accept', 'criteria', 'steps', 'reproduce', 'expected', 'scenario', 'precondition', 'test'];
  const extra = Object.entries(f)
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .filter(([name]) => hints.some((h) => name.toLowerCase().includes(h)))
    .map(([, v]) => v)
    .join('\n\n');

  return {
    source: `jira:${k}`,
    key: k,
    title: f.summary || '',
    text: [f.description || '', extra].filter(Boolean).join('\n\n'),
  };
}
