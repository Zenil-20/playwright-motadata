/*
 * Jira integration — fetch an issue and normalize it to a Requirement.
 * JS port of observeops-qa framework/services/jira_service.py.
 *
 * Env: JIRA_BASE_URL, JIRA_PROJECT (default MOTADATA), and ONE of:
 *   JIRA_TOKEN                      — Jira Server/DC personal access token (sent as Bearer)
 *   JIRA_USERNAME + JIRA_PASSWORD   — Basic
 *   JIRA_EMAIL + JIRA_TOKEN         — Jira Cloud Basic (set JIRA_CLOUD=1)
 */

const PROJECT = () => process.env.JIRA_PROJECT || 'MOTADATA';

/** "9201" -> "MOTADATA-9201"; pass-through if already prefixed. */
export function normalizeKey(key) {
  const k = String(key).trim();
  return /^[A-Z]+-\d+$/i.test(k) ? k.toUpperCase() : `${PROJECT()}-${k}`;
}

function auth() {
  const { JIRA_TOKEN, JIRA_EMAIL, JIRA_USERNAME, JIRA_PASSWORD, JIRA_CLOUD } = process.env;
  // Jira Cloud wants email:token as Basic; Server/DC wants the PAT as Bearer.
  if (JIRA_CLOUD === '1' && JIRA_EMAIL && JIRA_TOKEN) {
    return 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  }
  if (JIRA_TOKEN) return `Bearer ${JIRA_TOKEN}`;
  return 'Basic ' + Buffer.from(`${JIRA_USERNAME || ''}:${JIRA_PASSWORD || ''}`).toString('base64');
}

async function getIssue(key, fields) {
  const base = process.env.JIRA_BASE_URL;
  if (!base) throw new Error('JIRA_BASE_URL not set');
  const k = normalizeKey(key);
  const q = fields ? `?fields=${fields}` : '?expand=names,renderedFields';
  const res = await fetch(`${base.replace(/\/$/, '')}/rest/api/2/issue/${k}${q}`, {
    headers: { Authorization: auth(), Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Jira ${k}: HTTP ${res.status}`);
  return { key: k, data: await res.json() };
}

/**
 * Fetch an issue's reporter → { name, displayName, email } (null if the issue has none).
 * `name` is the account name ("gaurang.kalani") — the half that maps onto an AD identity.
 */
export async function fetchReporter(key) {
  const { data } = await getIssue(key, 'reporter');
  const r = data.fields?.reporter;
  if (!r) return null;
  return { name: r.name || '', displayName: r.displayName || '', email: r.emailAddress || '' };
}

/** Fetch a Jira issue → { source, key, title, text }. */
export async function fetchRequirement(key) {
  const { key: k, data } = await getIssue(key);
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
