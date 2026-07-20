# Workflow — who calls whom, and when

The runtime choreography of the platform: for each pipeline stage, **which agent runs, which
skills it invokes, which services/knowledge activate, and which gate must pass** before advancing.

> Status note: this is the designed contract. The **orchestrator** owns it and, once the stage-runner
> is built (depth), executes it unattended. Today the agents are invoked stage-by-stage; the gates
> (`governance/validation`) and services (`framework/*`) are real and runnable now.

## Two tracks: Flow A (regression, live) vs Flow B (new-Jira, in construction)

The platform runs on **two parallel tracks** that share one knowledge/governance layer.

**Flow A — regression suite enhancement (live today).** Improve the coverage that already *runs*:
- Assets: `tests/regression/**` + `tests/scenarios/**` specs, `tests/data/*.csv` matrices,
  `framework/playwright/` (flow · selectors · resolver), the selector **cookbook**
  (`knowledge/locators/selector-cookbook.md`), and the canonical **testcase-store**
  (`framework/core/testcase-store/`).
- Driven interactively via the Chrome extension + skills; audited with **`/coverage-audit`** and
  **`/change-impact`** (VCS merge-check). New coverage lands as **CSV rows / data**, not ad-hoc specs.
- **Promote-gated:** validated generated suites reach `tests/regression/` only through the promotion
  gate (release-readiness / promotion contract) — never by direct write.

**Flow B — new-Jira pipeline (in construction).** A fresh Jira ticket → the **10-stage pipeline**
(01→10) with the **human coverage gate** (`04_coverage_approval`) between plan and generate. This is
the autonomous authoring path; the automatic **stage-runner** that executes it unattended is still
being built (see status note below).

**The safety line.** Flow B writes generated artifacts to **`tests/generated/`** ONLY. It reaches
**`tests/regression/`** *exclusively* via the **promotion gate** — so in-construction automation can
never silently mutate the live regression suite.

**Shared layer (both flows).** `knowledge/` (product screens · locators · known issues), the
**cookbook**, the **governance gates** (`governance/validation/`), the **framework** services, and
the **skills**.

**Built vs pending.**
- **Built & runnable now:** the governance gates incl. the human **`04_coverage_approval`** coverage
  gate, data-driven execution (side flow A), and the VCS merge-check (side flow B).
- **Pending:** the automatic **stage-runner** that drives Flow B end-to-end unattended (today the
  Flow B agents are invoked stage-by-stage by hand).

## One-glance sequence
```
REQUEST (Jira/Figma/intent)
   │  orchestrator  →  writes workspace/<TICKET>/<run-id>/run-manifest.json
   ▼
01 requirement ─[gate 01_requirement]→ 02 context → 03 analysis → 04 plan ─[gate plan]→
─[HUMAN GATE #1: 04_coverage_approval — Allow / Other]→
05 generate ─[gate 05_testcases]→ 06 review ─[gate 07_automation]→ 07 execute →
08 analyze → 09 report → 10 learn ─[human sign-off]→ (knowledge updated)
```
The orchestrator calls each agent, passes **pointers not payloads**, records status in the manifest,
and **refuses to advance on a failed gate** (`governance/validation/index.js → runGate`).

## Stage-by-stage runtime map

| # · Stage | Agent(s) | Skills invoked | Services / knowledge activated | Exit gate |
|---|---|---|---|---|
| **01 requirement** | `jira-reader` / `figma-reader` → `analyst` | **prd-gate** | `framework/integrations/jira.js` · `tfs.js` (fetch) | `01_requirement` → `governance/validation/requirement.js` |
| **02 context** | `context-builder` (+ `retriever`) | — | reads `knowledge/product/**` · `knowledge/locators/**` · `knowledge/known_issues` | — |
| **03 analysis** | `analyst` | risk inputs | reads screen docs §Business-Rules/§Validations/§Edge/§Permissions | — |
| **04 plan** | `planner` | **risk-based-testing** | reads screen §Edge/§Business + `rules/testing.md` | `plan-completeness` |
| **04.5 coverage approval (HUMAN GATE #1)** | human (planner proposes) | **coverage-gate** (`/coverage-gate`) | `scripts/coverage-gate.mjs` → `workspace/<TICKET>/<run>/coverage-proposal.{json,md}` + `coverage-approval.json` | `04_coverage_approval` → `governance/validation/coverage-approval.js` (must **Allow**; **Other** loops back to 04; stale hash blocks) |
| **05 generate** | `testcase-generator` → `automation-generator` | **pairwise / boundary / negative / test-data-factory** (cases); **self-healing-locators-strategy / playwright-locator-filter / playwright-test-step / playwright-network-testing** (spec) | `framework/core/testcase-store` (save cases) · `pipeline/schemas` | `05_testcases` → coverage · business-rules · dedup · assertions |
| ↳ *locator resolve (in 05)* | `locator-resolver` | **motadata-explorer** | `knowledge/locators/selector-cookbook.md` + `catalog/*.json`; **writes** verified locators back to the cookbook | (feeds automation) |
| **06 review** | `reviewer` | — | `governance/validation/*` (runs every validator) | `07_automation` → locators · assertions · automation-review |
| **07 execute** | `executor` (+ `sandbox-state`) | **seed-data · smoke-test-suite · retry-resilience-testing** | `framework/playwright/` (flow·selectors·resolver) · `framework/core/reporters` → `reports/failures.json` · `workspace/<run>/` traces | — |
| **08 analyze** | `debugger` → self-heal via `locator-resolver` | **test-flakiness-detection · flaky-test-quarantine · bug-report-writing · self-healing-locators-strategy** | reads `reports/failures.json` + trace `error-context.md` · `knowledge/known_issues` | — |
| **09 report** | `reporter` | **release-readiness-checklist** | `memory/` (run history/metrics) · `reports/` | — |
| **10 learn** | `knowledge-updater` | — | **writes** `knowledge/product/**` (flip TODO→verified) + `selector-cookbook.md` | provenance required |

## Side flow A — data-driven execution (no AI needed)
```
seed-data (verify .env + sandbox state)
   ▼
tests/scenarios/Discovery_DataDriven.spec.js
   ├─ reads tests/data/discovery-devices.csv  (16 rows)
   └─ calls framework/playwright/flow.js
         ├─ selectors.js   ← knowledge/locators/selector-cookbook.md
         └─ resolver.js    (primary→fallback, count()===1)   ← self-healing-locators-strategy
   ▼
framework/core/reporters/failure-reporter.js → reports/failures.json  → (feeds stage 08)
```

## Side flow B — VCS merge-check (change-driven)
```
git diff (branch/PR)
   ▼
framework/integrations/vcs.js  detectChanges() → impactedDevices()
   ▼  skills: change-impact → test-impact-analysis / regression-test-selection
minimal re-run set: tests/regression/** specs + tests/data rows + knowledge/product screens
   ▼
executor (07) → debugger (08)
   (command: /change-impact)
```

## Who owns what (services activation, at a glance)
- **`framework/integrations/`** — activates at **01** (jira/tfs fetch) and **VCS flow** (vcs diff).
- **`framework/core/testcase-store/`** — **05** (save cases), **09/10** (query/promote), `/coverage-audit`.
- **`framework/playwright/`** — **07** (every spec run) + all data-driven runs.
- **`framework/core/reporters/`** — **07** (writes `reports/failures.json`).
- **`framework/core/orchestration/run-manifest.js`** — **every stage** (the orchestrator's state).
- **`governance/validation/`** — the **gates** at 01, 04, **04.5 (`04_coverage_approval`, human)**, 05, 06 (and `npm run gate` / CI).
- **`knowledge/`** — read at **02/03/04/05/08**, written at **10** and by `locator-resolver`.

## Try it (what runs today)
```
npm run gate 01_requirement ctx.json      # stage-01 gate (prd-gate)
npm run test:gates                         # all validators (self-test)
npm run test:discovery                     # side flow A (data-driven, needs .env)
/change-impact                             # side flow B (VCS merge-check)
npm run sync:claude                        # regenerate .claude from agents/ + skills/
```
