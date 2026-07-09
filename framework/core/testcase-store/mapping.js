/*
 * Canonical test-case schema + header alias map.
 * Ported from observeops-qa configs/csv_mapping.yaml (kept as JS to avoid a YAML dependency).
 *
 * Any CSV exported from Jira / TFS(ADO) / a manual Excel sheet is normalized to these
 * 13 canonical fields by matching each incoming header (case/space/underscore-insensitive)
 * against the alias lists below. Unknown columns are dropped.
 */

export const CANONICAL_FIELDS = [
  'id', 'title', 'module', 'type', 'priority', 'preconditions', 'steps',
  'test_data', 'expected_result', 'automated', 'tags', 'source', 'node',
];

export const REQUIRED_FIELDS = ['title'];

export const LIST_DELIMITER = '|';

export const ALIASES = {
  id:              ['id', 'tc_id', 'test_id', 'work_item_id', 'work item id', 'case id', 'ado id', 'jira id'],
  title:           ['title', 'test case title', 'name', 'summary', 'scenario'],
  module:          ['module', 'feature', 'area', 'component', 'screen', 'area path'],
  type:            ['type', 'test type', 'category', 'work item type'],
  priority:        ['priority', 'prio', 'severity'],
  preconditions:   ['preconditions', 'precondition', 'pre conditions', 'setup'],
  steps:           ['steps', 'test steps', 'procedure', 'actions', 'step action'],
  test_data:       ['test data', 'data', 'inputs'],
  expected_result: ['expected result', 'expected', 'expected results', 'expected output', 'step expected'],
  automated:       ['automated', 'automation', 'is automated', 'automatable'],
  tags:            ['tags', 'labels'],
  source:          ['source', 'origin'],
  node:            ['node', 'pytest node', 'script', 'spec'],
};

/** Normalize a header string: lowercase, collapse underscores/whitespace. */
export function normKey(h) {
  return String(h || '').trim().toLowerCase().replace(/[_\s]+/g, ' ').trim();
}

// Reverse lookup: normalized-alias -> canonical field
const ALIAS_INDEX = (() => {
  const idx = {};
  for (const [canon, aliases] of Object.entries(ALIASES)) {
    for (const a of aliases) idx[normKey(a)] = canon;
  }
  return idx;
})();

/** Map any incoming header to its canonical field, or null if unknown. */
export function canonicalOf(header) {
  return ALIAS_INDEX[normKey(header)] || null;
}

/** Build an empty canonical row (all fields present, empty strings). */
export function emptyCase() {
  const o = {};
  for (const f of CANONICAL_FIELDS) o[f] = '';
  return o;
}
