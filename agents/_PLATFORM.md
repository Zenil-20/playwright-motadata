# Platform facts for agents (shared reference — do not invent paths)

## The 10-stage flow (`pipeline/`)
`01-requirement → 02-context → 03-analysis → 04-plan → 05-generate → 06-review → 07-execute →
08-analyze → 09-report → 10-learn`. The orchestrator runs it; stages never call each other.

## Gates (executable, `governance/validation/`)
`runGate(stageKey, ctx)` returns `{pass, results[]}`; `pass:false` blocks the stage.
Keys: `01_requirement` (requirement-completeness) · `05_testcases` (coverage · business-rules ·
dedup · assertions) · `07_automation` (locators · automation-review). CLI: `npm run gate`.

## Knowledge (RAG — read, cite, never fabricate)
- `knowledge/product/<Module>/<Screen>.md` — **176 screens** (Settings=133). 11 sections:
  Purpose, Navigation, Actions, Components, Permissions, Entry, Exit, Validations, Business Rules,
  Known Bugs, Edge Cases. Verified: Global/Login, Dashboards/Dashboard. Rest = `status: generated`
  (Navigation+Components real; reasoning = `TODO(source: KG/docs)`).
- `knowledge/locators/selector-cookbook.md` — verified locators. `knowledge/locators/catalog/*.json`
  — raw sweep (175 screens: title/labels/inputs/buttons/selects/switches/grid/route).
- `knowledge/known_issues/customer-issue-kb.md` — customer issues.
- `knowledge/product/_ROUTES.md` — full route map.

## Runtime paths
- Specs → `tests/regression/**` (existing) + `tests/scenarios/**` (data-driven). Matrices `tests/data/*.csv`.
- Engine → `framework/playwright/` (flow/selectors/resolver) · `framework/core/` (testcase-store,
  reporters, orchestration+run-manifest) · `framework/integrations/` (jira/tfs/vcs).
- Artifacts → `workspace/<TICKET>/<run-id>/` (run-manifest.json, traces, reports).
- Failures → `reports/failures.json` (written by the failure reporter).
- Cases store → `framework/core/testcase-store/` (13 canonical fields; `tests/regression` = truth).
- Skills the agents can invoke → `motadata-explorer` (harvest locators), `seed-data`, `motadata-spec-writer`.

## Artifact contracts (`pipeline/schemas/`)
`feature-spec` → `manual-cases` (from testcase-generator) → `resolved-cases` (locators added) → spec.js.

## The 16 agents (stage · upstream → downstream · gate · knowledge · model)
| Agent | Stage | Upstream → Downstream | Gate | Reads knowledge | Model |
|---|---|---|---|---|---|
| orchestrator | (all) | user → every agent | enforces all | run-manifest | sonnet |
| jira-reader | 01 | orchestrator → analyst | 01_requirement | — (reads Jira) | haiku |
| figma-reader | 01 | orchestrator → analyst/context | — | product screens (map frames) | haiku |
| analyst | 03 | 01+context → planner | — | product: Business Rules, Validations, Edge, Permissions | sonnet |
| context-builder | 02 | requirement → analyst | — | via retriever | sonnet |
| retriever | (service) | context-builder | — | product, locators/catalog, known_issues | sonnet |
| planner | 04 | analyst → testcase-generator | plan | product Edge/Business + rules/testing.md | sonnet |
| testcase-generator | 05 | planner+context → automation-generator | 05_testcases | product Actions/Components/Validations/Edge + cookbook keys | sonnet |
| automation-generator | 05 | resolved-cases → reviewer/executor | 07_automation | locators/cookbook | haiku |
| locator-resolver | (05 support) | manual-cases → automation-generator | — | locators/catalog + cookbook (+ motadata-explorer) | sonnet |
| reviewer | 06 | cases/specs → executor | 05_/07_ | governance/validation | sonnet |
| sandbox-state | (07 support) | manual-case data → executor | — | product Entry/required_state | sonnet |
| executor | 07 | spec+state → debugger | — | — | sonnet |
| debugger | 08 | trace/failures.json → self-heal/knowledge-updater | — | known_issues | sonnet |
| reporter | 09 | run+memory → humans | — | memory/ | sonnet |
| knowledge-updater | 10 | verified outcomes → knowledge/ + cookbook | provenance | writes product/locators | sonnet |
