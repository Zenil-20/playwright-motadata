---
name: validation-service
type: service
description: Executable validators that gate pipeline stage transitions — the code form of governance/policy/POLICY.md. Nothing advances until its gate passes, and no AI output is trusted without a cited source.
tools: ["Node", "node:test", "index.js (gatekeeper)", "cli.mjs"]
source: Phase 2 of the enterprise architecture review; doc format per rohitg00/awesome-claude-code-toolkit
---

# Validation Service — the anti-hallucination gates

Turns `governance/policy/POLICY.md` from prose into enforcement. Each validator returns
`{ validator, pass, score, evidence[] }`; the gatekeeper aggregates them per stage; the
orchestrator refuses to advance while `pass=false`.

## Validators

| File | Gate (stage) | Rejects |
|---|---|---|
| `requirement.js` | 01 | no/empty/ambiguous/uncited acceptance criteria |
| `coverage.js` | 05 | uncovered AC · orphan case · no negative/boundary scenario |
| `business-rules.js` | 05 | create-flow without idempotency · literal secret in data · no expected |
| `dedup.js` | 05 | two cases with identical step signatures |
| `assertions.js` | 05 | no assertion · DOM/CSS-structural assertion |
| `locators.js` | 07 | missing/unverified/uncited/positional locator · reject-tier confidence |
| `automation-review.js` | 07 | networkidle · blind timeout · `.nth(n)` · no `expect()` |
| `index.js` | — | the gatekeeper: `runGate(stageKey, ctx)` |

## Run

```
npm run test:gates                         # self-tests (proves each validator both ways)
npm run gate 05_testcases ctx.json         # run a gate on a real artifact (exit 1 on fail)
npm run gate 07_automation ctx.json --spec out.spec.js
```

## Rules & Regulations

1. **A gate is a hard stop.** `pass=false` blocks the stage transition — no override in normal flow.
2. **Provenance required.** Every AI-emitted fact/locator must carry a valid `source`
   (`cookbook | suite | explored | jira | figma | trace`). No source → automatic error.
3. **Validators are pure and cited.** No side effects; every failure carries `evidence` with a
   `ref` so the reason is auditable.
4. **Rules live as code + config, not prose.** Add a product rule to `business-rules.js` RULES;
   don't scatter checks. Every new rule ships with a self-test.
5. **Quarantine, never mask.** A gate never lowers its own bar to make a run green.

## Before Completing a Task

- [ ] `npm run test:gates` is green (8+ tests, both directions per validator).
- [ ] Any new validator is registered in a gate in `index.js` and has a self-test.
- [ ] The CLI exits non-zero on a crafted violation (proves CI will block).
