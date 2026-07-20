---
name: integrations-service
type: service
description: Env-driven adapters that pull requirements/test cases from Jira and TFS, and detect changed files from git for change-impact analysis.
tools: ["fetch", "git", "jira.js", "tfs.js", "vcs.js"]
source: JS port of observeops-qa framework/services/{jira,tfs,vcs}_service.py; doc format per rohitg00/awesome-claude-code-toolkit
---

# Integrations Service

Adapters that connect the pipeline to external systems of record. All config is via env
vars (see `.env.example`); nothing is hardcoded.

## Files

| File | Key API | Reads |
|---|---|---|
| `jira.js` | `fetchRequirement(key)`, `normalizeKey(key)` | `JIRA_BASE_URL`, `JIRA_USERNAME`, `JIRA_PASSWORD`, `JIRA_PROJECT` |
| `tfs.js` | `fetchRequirement(id)`, `listTestCases(wiql)`, plan-read: `getPlan(planId)`, `listSuites(planId)`, `listSuiteTestCases(planId, suiteId)`, `importPlan(planId, { suiteFilter })` | `TFS_BASE_URL`, `TFS_PROJECT`, `TFS_PAT` |
| `vcs.js` | `detectChanges(since)`, `impactedDevices(paths, keys)` | local git repo |

All requirement fetches return the same shape: `{ source, key, title, text }`.

**TFS plan read (Flow A "GET TFS TEST CASES").** Beyond WIQL, `tfs.js` reads a TFS/Azure
DevOps Server test plan's suites and cases: `getPlan` / `listSuites` / `listSuiteTestCases`,
and `importPlan(planId, { suiteFilter })` which walks the suites, dedups by test-case id, and
returns canonical 13-field rows. The titles come from the testplan endpoint
`GET {base}/_apis/testplan/Plans/{planId}/Suites/{suiteId}/TestCase?api-version=6.0-preview.2`
(`workItem.id` / `workItem.name`). All TFS requests share a module-level undici dispatcher with
`rejectUnauthorized:false` to tolerate the on-prem self-signed cert. Driven by the
`tfs:import` CLI (`scripts/tfs-import.mjs`) → `tests/generated/`.

## Rules & Regulations

1. **No secrets in code.** Credentials/PATs come only from env. A missing var throws a clear
   error — it is never defaulted to a live credential.
2. **Fail soft on VCS.** `detectChanges()` returns `[]` outside a git repo (matches the
   observeops stub) — it must never crash the pipeline.
3. **Normalize at the edge.** Vendor payloads are converted to the common requirement shape
   here; downstream code never sees Jira/TFS-specific JSON.
4. **Read-only.** These adapters fetch and detect. They do not write to Jira/TFS or mutate git.

## Before Completing a Task

- [ ] New calls read config from env, documented in `.env.example`.
- [ ] Errors are actionable (which var / which HTTP status), not a bare stack trace.
- [ ] `impactedDevices()` / `detectChanges()` degrade to `[]` when unconfigured.
