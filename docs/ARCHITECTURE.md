# Architecture

An AI-assisted Quality Engineering platform for **Motadata ObserveOps** (AIOps). It turns a
requirement into validated test cases, automation, execution, triage, and durable knowledge —
with humans in the loop and hallucinations gated out. Four layers; the runtime engine sits behind
the pipeline.

```
motadata-ai-qa-platform/
│  ── AI ASSETS (static, versioned) ─────────────────────────────────────────
├── knowledge/            RAG corpus — product/ (176 screens) · locators/ (cookbook + catalog)
│                         known_issues/ (customer-issue KB) · screenshots/ (83) · _ROUTES.md
├── prompts/  templates/  versioned prompt registry · case/spec/report templates
├── agents/               16 platform agent SOURCES (folder-per-agent/prompt.md) + qa/orch reference
├── skills/               QA skill library (motadata-explorer, self-heal, a11y, change-impact, …)
├── rules/                curated coding/process rules
│
│  ── AI RUNTIME (executes) ──────────────────────────────────────────────────
├── pipeline/             the 10-stage flow: 01-requirement … 10-learn (+ 06-review/validators)
├── framework/            engine — playwright/ (flow·selectors·resolver) · core/ (store·reporters·
│                         orchestration+run-manifest) · integrations/ (jira·tfs·vcs) · selenium/pytest(stub)
├── tests/                the runnable suite — regression/ (44 specs) · scenarios/ (data-driven) · data/
├── workspace/            per-run isolated artifacts (<TICKET>/<run-id>/)
├── plugins/  memory/     extension point · run history + metrics store (stubs)
│
│  ── PLATFORM (cross-cutting) ───────────────────────────────────────────────
├── governance/           validation/ (executable gates) · policy/POLICY.md · rbac/secrets/audit
├── configs/  reports/    config map · run outputs (gitignored)
├── .github/              CI — gates job blocks the test job
│
│  ── DEVELOPER EXPERIENCE ────────────────────────────────────────────────────
├── .claude/              GENERATED agents+skills (via sync-claude) + commands/
├── scripts/              sync-claude.mjs · gen-screen-knowledge.mjs · daily-pipeline
└── docs/                 ARCHITECTURE.md (this) · STRUCTURE.md · COVERAGE.md
```

## Flow 1 — the AI pipeline (requirement → tests → learning)

Ten stages, each with one owning agent and an **exit gate** (executable, in `governance/validation/`).
The orchestrator runs the flow, writes the run manifest, and refuses to advance on a failed gate.

```
Requirement (Jira / Figma)
  → 01-requirement  [gate: requirement-completeness]   agents: jira-reader · figma-reader → analyst
  → 02-context                                          agent:  context-builder (+ retriever)
  → 03-analysis                                         agent:  analyst
  → 04-plan         [gate: plan-completeness]           agent:  planner (risk-based)
  → 05-generate     [gate: coverage·business-rules·dedup]  testcase-generator → automation-generator
  → 06-review       [gate: locators·assertions·automation-review]  reviewer (runs the validators)
  → 07-execute                                          agent:  executor (+ sandbox-state)
  → 08-analyze                                          agent:  debugger (classify) → self-heal (locator-resolver)
  → 09-report                                           agent:  reporter (tiered + risk score)
  → 10-learn        [provenance required]               agent:  knowledge-updater (→ knowledge + cookbook)
                                                         [gate: human sign-off]
```

**Anti-hallucination backbone:** no AI output advances without a cited source
(`cookbook | suite | explored | jira | figma | trace | knowledge`). Gates are code, not prose —
`runGate(stageKey, ctx)` returns `{pass, evidence[]}`; `pass:false` blocks the stage. Self-healing is
bounded (quarantine, never mask).

## Flow 2 — data-driven execution ("max coverage, min automation")

One reusable flow × many CSV rows, instead of one spec per case.

```
tests/data/discovery-devices.csv  (16 device rows)
        │
        ▼
tests/scenarios/Discovery_DataDriven.spec.js   ──uses──▶  framework/playwright/flow.js
        │                                                   ├─ selectors.js  (locator catalog ← cookbook)
        │                                                   └─ resolver.js   (primary→fallback, count()===1)
        ▼
one script → N grounded validations   (missing env → skip-with-reason, never a false fail)
```

Legacy per-device specs stay in `tests/regression/`; each retires as its data row goes green.

## Flow 3 — change-driven maintenance (VCS merge check)

```
merged PR / branch diff
        │  framework/integrations/vcs.js  detectChanges(since) → impactedDevices(paths, keys)
        ▼
impacted tests/regression specs + tests/data rows + knowledge/product screens
        │  skills: change-impact · regression-test-selection · test-impact-analysis
        ▼
minimal re-run scope  →  executor  →  debugger
```

## The runtime engine (`framework/`)

- **`playwright/`** — `selectors.js` = *what* the locators are (mirrors `knowledge/locators/selector-cookbook.md`);
  `resolver.js` = *how* to resolve them safely (self-heal + `count()===1`); `flow.js` = *the steps*
  (no literal selectors). AntDesign duplicate traps scoped to `.ant-drawer-open` / `.ant-popover:visible` / `tr.k-master-row`.
- **`core/`** — `testcase-store/` (13-field canonical CSV; `tests/regression` = source of truth) ·
  `reporters/failure-reporter.js` (→ `reports/failures.json`) · `orchestration/` (daily-pipeline.mjs, run-manifest.js).
- **`integrations/`** — `jira.js` · `tfs.js` (WIQL) · `vcs.js` (git diff → change impact).

## Knowledge (RAG — deterministic, cited)

`knowledge/product/<Module>/<Screen>.md` — **176 screens**, 11 sections each (Purpose, Navigation,
Actions, Components, Permissions, Entry, Exit, Validations, Business Rules, Known Bugs, Edge Cases),
grounded in the live-router sweep + screenshots + the customer-issue KB. `status: generated` →
`draft` (authored) → `verified`. Consumed by retriever → context-builder → testcase-generator so
generation is grounded, not guessed. Regenerate scaffolds with `npm run gen:screens` (skips
draft/verified).

## Agents & skills — source → generated

Claude Code only loads from `.claude/`. So `agents/<name>/prompt.md` and `skills/<name>/SKILL.md`
are the **versioned sources**; `.claude/agents` + `.claude/skills` are **generated** by
`npm run sync:claude` (gitignored). Reference personas live under `agents/quality-assurance/`,
`agents/orchestration/`, `skills/reference/` — not synced, nothing runs them.

## Commands & entry points

| Command | Does |
|---|---|
| `npm test` / `--project discovery_data_driven` | run the Playwright suite |
| `npm run test:gates` / `npm run gate <stage> <ctx.json>` | run the validation gates |
| `npm run gen:screens` | (re)generate screen-knowledge scaffolds |
| `npm run sync:claude` | generate `.claude/agents` + `.claude/skills` from sources |
| `npm run pipeline [:dry]` | 14-stage defensive ops pipeline |
| `/coverage-audit` · `/analyze-failures` · `/change-impact` | slash commands |

## Key references
- `docs/STRUCTURE.md` — the folder map + "where things belong".
- `docs/COVERAGE.md` — the max-coverage-min-automation contract + TFS traceability.
- `pipeline/README.md` + `governance/policy/POLICY.md` — the flow + anti-hallucination rules.
- `governance/validation/README.md` — the executable gates.
- `agents/_PLATFORM.md` — the 16-agent stage/gate/knowledge table.
