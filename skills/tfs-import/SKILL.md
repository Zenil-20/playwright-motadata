---
name: tfs-import
description: Flow A "GET TFS TEST CASES" — read a TFS / Azure DevOps Server test plan's suites and test cases and ingest them into the testcase-store as a generated suite. Use when pulling manual test cases out of an on-prem TFS test plan into the QA pipeline.
---

# TFS Import — Flow A "GET TFS TEST CASES"

Reads a TFS / Azure DevOps Server **test plan**, walks its suites, collects every test case,
dedups by work-item id, and writes canonical rows into the testcase-store. This is the
observeops Flow-A ingest step that feeds the pipeline's testcase-store from TFS.

## What it does

1. `getPlan(planId)` → plan name.
2. `listSuites(planId)` → the plan's suites (name + case count).
3. For each suite (optionally filtered by a case-insensitive substring on the suite name),
   `listSuiteTestCases(planId, suiteId)` → the test cases (id + title).
4. Dedups by test-case id and emits canonical 13-field rows via
   `framework/core/testcase-store/mapping.js`, tagged
   `module = <suite name>`, `type = 'Test Case'`, `source = tfs:plan<planId>/suite<suiteId>`.
5. `saveGenerated(slug, rows)` writes `tests/generated/<slug>.csv`.

## Env it needs

| Var | Example | Notes |
|---|---|---|
| `TFS_BASE_URL` | `https://ad-motadata:8443/Motadata` | collection URL |
| `TFS_PROJECT` | `Motadata` | project name |
| `TFS_PAT` | (a Personal Access Token) | read from env only — never in code |

Auth is a Personal Access Token sent as HTTP **Basic** with an empty username
(`base64(":<PAT>")`). The on-prem host uses a self-signed cert, so all requests go through a
TLS-tolerant undici dispatcher (`rejectUnauthorized: false`).

## Endpoints used

- Plan: `GET {base}/_apis/test/plans/{planId}?api-version=5.0`
- Suites: `GET {base}/_apis/test/plans/{planId}/suites?api-version=5.0`
- Cases in a suite: `GET {base}/_apis/testplan/Plans/{planId}/Suites/{suiteId}/TestCase?api-version=6.0-preview.2`

where `{base}` = `${TFS_BASE_URL}/${TFS_PROJECT}`.

## How to run

```bash
# all suites in the plan
npm run tfs:import -- <planId>

# only suites whose name contains "NCM"
npm run tfs:import -- <planId> --suite NCM

# custom output slug
npm run tfs:import -- <planId> --suite NCM --out ncm_cases
```

Output goes to `tests/generated/<slug>.csv` (default slug `plan<planId>_tfs_import`, or
`<suite>_tfs_import` when `--suite` is given). It prints the plan name, the suites matched
(name → count), the total cases written, and the output path. If `TFS_PAT` / `TFS_BASE_URL`
are unset it prints a "set these env vars" message and exits 2.

Ports the observeops-qa Flow A "GET TFS TEST CASES" step.
