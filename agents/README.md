# agents/ — platform agent SOURCES (folder-per-agent)

Each `<name>/prompt.md` is the versioned source. `.claude/agents/` is GENERATED from these by
`npm run sync:claude` (Claude Code only loads from `.claude/`). **Edit the source here, then re-sync.**

All 16 agents follow one structure (`_TEMPLATE.md`) and cite shared facts (`_PLATFORM.md`).
Every prompt has two sections that are **yours to fill**:
- **"Product knowledge it reads"** — which `knowledge/product/<Module>/<Screen>.md` (and locators /
  known-issues) the agent grounds on. Scope it to the modules/screens you care about.
- **"How I want to use this"** — your playbook: how you invoke it, priorities, examples, do/don't.

Both are marked `> EDIT:` so they're easy to find.

## Roster (stage · role)
| Agent | Stage | Role |
|---|---|---|
| orchestrator | all | owns the 10-stage flow, run-manifest, gates, budget |
| jira-reader | 01 | Jira ticket → acceptance-criteria JSON |
| figma-reader | 01 | Figma frames → screen/flow graph (maps to `knowledge/product`) |
| context-builder | 02 | assembles the module context bundle (via retriever) |
| retriever | (service) | deterministic knowledge retrieval, provenance on every fact |
| analyst | 03 | requirement → scenarios · risks · RBAC · data · deps |
| planner | 04 | risk-based coverage plan (pos/neg/boundary/security) |
| testcase-generator | 05 | plan → manual-cases (YAML, traced to AC) |
| locator-resolver | 05 | resolve verified locators (cookbook → harvest) |
| automation-generator | 05 | resolved-cases → spec.js (no locator invention) |
| reviewer | 06 | runs the governance gates, blocks on fail |
| sandbox-state | 07 | reset + seed + verify sandbox state |
| executor | 07 | run specs → artifacts + `reports/failures.json` |
| debugger | 08 | classify failure with cited evidence |
| reporter | 09 | audience-tiered report + risk score |
| knowledge-updater | 10 | persist verified outcomes → knowledge + cookbook |

Edit → `npm run sync:claude`. Shared reference: `_TEMPLATE.md`, `_PLATFORM.md`.
