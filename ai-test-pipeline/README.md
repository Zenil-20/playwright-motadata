# Motadata AI Test Pipeline

A self-contained, multi-agent system that turns Jira PRDs + Figma designs into **verified, passing Playwright tests** — with locators grounded against the live app, not guessed.

> **Isolation contract:** Everything lives under `ai-test-pipeline/`. This folder does **not** modify the existing test suite, `playwright.config.js`, or the `motadata-playwright` skill. To activate the agents/skills in Claude Code, copy (or symlink) `agents/` → `.claude/agents/` and `skills/*` → `.claude/skills/`. Until you do that, this folder is inert reference material.

---

## The problem this solves

Hand-written tests fail on **wrong locators** and **strict-mode multi-match** errors. The human ends up being the DOM inspector. This pipeline removes the human from that loop:

1. Locators are **harvested from the live accessibility tree**, never described from memory.
2. Every locator is **verified `count() === 1`** before it reaches a spec.
3. Verified locators are **cached** in a cookbook, so the second touch of a screen is a free lookup.
4. Specs are **self-run and self-healed** before being reported complete.

---

## Stages

```
Jira ─┐
      ├─► [1] Ingest ─► feature-spec.md ─► [2] Manual Author ─► manual-cases.yaml
Figma ┘   (completeness gate)                (traced, risk-tagged, required_state)
                                                                     │
                                            [3] Sandbox State ◄──────┘   reset + seed + VERIFY
                                                     │  seed-report.json (ready? conditional controls present?)
                                                     ▼
                                            [4] Locator Resolver ◄── cookbook hit? (grep one screen)
                                                     │  miss → motadata-explorer (live a11y tree, seeded state)
                                                     │  → count()===1, confidence, fallback, conditional
                                                     ▼
                                            resolved-cases.yaml (every step verified)
                                                     │
                                                     ▼
                                            [5] Spec Writer ─► *.spec.js  (dry-compile --list gate)
                                                     │
                                                     ▼
                                            [6] Runner + Failure Triager (evidence-cited, self-heal ≤3x, else quarantine)
                                                     │
                                                     ▼
                                            HTML report + updated cookbook + run-manifest
```

Governed end-to-end by `run-manifest.json` (resume), a budget ceiling, and human gates on thin requirements + product-bugs.

## Agents (`agents/`)

| Agent | Role | Model |
|---|---|---|
| `orchestrator` | Routes artifacts (pointers only); run-manifest resume, budget governor, gates, risk order | small |
| `jira-reader` | Jira ticket → structured AC JSON + completeness check | small |
| `figma-reader` | Figma file → screen/flow graph JSON + provenance | small |
| `manual-test-author` | feature-spec → `manual-cases.yaml` (traced, risk-tagged, state-declared) | medium |
| `sandbox-state` | reset + seed + verify the declared state before resolve/run | medium |
| `locator-resolver` | manual case → verified locators (cookbook-first, conditional-aware, confidence+fallback) | medium |
| `spec-writer` | resolved case → `.spec.js` (templated, raw escape hatch, dry-compile gate) | small |
| `failure-triager` | trace → evidence-cited verdict → re-resolve / patch / bug / quarantine | medium |

See **`POLICY.md`** for the cross-cutting token-economy and anti-hallucination rules every agent obeys.

## Skills (`skills/`)

- **`motadata-explorer`** — the live locator-harvesting procedure (login → navigate → a11y snapshot → rank → verify `count()===1` → emit + cache).
- **`motadata-spec-writer`** — the deterministic spec-templating contract (consumes only verified locators).

## Data (`cookbook/`)

- **`selector-cookbook.md`** — append-only store of verified locators per screen. Seeded from real locators discovered in the NCCM/Discovery work. This is the compounding asset.

## Schemas (`schemas/`)

Contracts every agent reads/writes. Keeps inter-agent payloads tiny and parseable.

## Scripts (`scripts/`)

- **`harvest-screen.md`** — the one-time procedure to seed the cookbook across the core screens.

---

## Token-optimization rules (enforced by every agent's system prompt)

1. **Pass artifact paths, not contents.** Only the consuming agent reads a file.
2. **a11y tree, never raw HTML.** ~10x smaller, role-accurate.
3. **Cookbook-first retrieval.** Never re-explore a known screen.
4. **Hard size caps** on every artifact (feature-spec ≤2KB, ≤500B per manual step).
5. **Sub-agent isolation.** Noisy exploration happens in a throwaway context; only the verified locator returns.
6. **Prompt-cache the skill prefix** (5-min TTL aligns with chained runs).

---

## How to run (once activated)

Intent-level prompts replace locator-level ones:

> "Write a test that backs up 172.16.14.6 and verifies Conflict Detected."

The orchestrator resolves screens → checks cookbook → explores misses → writes spec → self-runs → hands back a passing test plus any new cookbook entries.
