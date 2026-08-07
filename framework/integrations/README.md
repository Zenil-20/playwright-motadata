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
| `jira.js` | `fetchRequirement(key)`, `fetchReporter(key)`, `normalizeKey(key)` | `JIRA_BASE_URL`, `JIRA_PROJECT`, and `JIRA_TOKEN` (Bearer) or `JIRA_USERNAME`+`JIRA_PASSWORD` (Basic) |
| `tfs.js` | `fetchRequirement(id)`, `listTestCases(wiql)`, plan-read: `getPlan(planId)`, `listSuites(planId)`, `listSuiteTestCases(planId, suiteId)`, `importPlan(planId, { suiteFilter })` | `TFS_BASE_URL`, `TFS_PROJECT`, `TFS_PAT` |
| `azure-testplans.js` | **write**: `publishManualCases({ jiraId, cases })`, `ensureTicketSuite`, `createTestCase`, `caseToFields`, `buildStepsXml` | `AZURE_ORG_URL`, `AZURE_PROJECT`, `AZURE_PAT`, `AZURE_TEST_PLAN_ID`, `AZURE_AREA_PATH`, `AZURE_ASSIGNED_TO`, `AZURE_STATE` |
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

**Azure DevOps Test Plans write (`azure-testplans.js`).** The one adapter that writes. Given a
Jira id and the pipeline's `manual-cases.json`, it find-or-creates a static suite named
`MOTADATA-<jiraId>` under `AZURE_TEST_PLAN_ID`, creates a Test Case work item per case, and
links it into that suite. `AZURE_*` falls back to the `TFS_*` vars — same server, one PAT.

The case shape is fixed by the agreed manual-test-case CSV, whose nine columns are
`ID, Work Item Type, Title, Test Step, Step Action, Step Expected, Area Path, Assigned To, State`.
ID is server-assigned and Work Item Type is always `Test Case`, so exactly five fields are
written: `System.Title`, `Microsoft.VSTS.TCM.Steps`, `System.AreaPath`, `System.AssignedTo`,
`System.State`. Steps are stored as an XML blob with each action/expected prefixed by its
1-based number (`1. Login as admin; …`), matching the reference export. Preconditions have no
column, so they are folded into step 1 as a `Pre-requisite:` clause.

**Assigned To follows the Jira reporter.** `resolveAssignee()` picks, in order: an explicit
`--assigned-to`, then `AZURE_ASSIGNED_TO`, then the reporter of the ticket, then nothing (ADO
falls back to the PAT owner). Jira and ADO share an AD, so the Jira account name *is* the AD
account name: reporter `gaurang.kalani` → `MOTADATA\gaurang.kalani` (domain from
`AZURE_IDENTITY_DOMAIN`). Probed against this server, an **email address does not resolve** —
`DOMAIN\account` is the only form the work item tracker accepts. The candidate is checked with
a `validateOnly=true` create before use, so an unknown identity degrades to the default rather
than failing every case. Resolution happens once per publish, not once per case.

Driven by `npm run ado:publish -- MOTADATA-7506` (`scripts/ado-publish.mjs`) or by the
`publish_ado` stage of the daily pipeline (`--jira MOTADATA-7506`).

## Rules & Regulations

1. **No secrets in code.** Credentials/PATs come only from env. A missing var throws a clear
   error — it is never defaulted to a live credential.
2. **Fail soft on VCS.** `detectChanges()` returns `[]` outside a git repo (matches the
   observeops stub) — it must never crash the pipeline.
3. **Normalize at the edge.** Vendor payloads are converted to the common requirement shape
   here; downstream code never sees Jira/TFS-specific JSON.
4. **Read-only, except `azure-testplans.js`.** Every other adapter fetches and detects; none
   write to Jira/TFS or mutate git. `azure-testplans.js` is the deliberate exception, and is
   bound by rules 5–7.
5. **Idempotent writes.** Publishing a ticket twice must not duplicate. The suite is
   find-or-created and cases already in it (matched on title) are skipped.
6. **Map before you write.** Every case is mapped and validated up front, so a case missing a
   title or steps fails the run before any work item is created — never half a suite.
7. **`--dry` must reach the same code path.** The dry run maps and validates exactly what a
   live run would push; it only stops short of the HTTP writes.

## Before Completing a Task

- [ ] New calls read config from env, documented in `.env.example`.
- [ ] Errors are actionable (which var / which HTTP status), not a bare stack trace.
- [ ] `impactedDevices()` / `detectChanges()` degrade to `[]` when unconfigured.
