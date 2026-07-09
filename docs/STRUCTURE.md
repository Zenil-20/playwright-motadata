# Project structure

Aligned to the target architecture, organized into four layers. Breadth is in place; several
folders are documented stubs whose internals are a depth task (marked _stub_).

```
motadata-ai-qa-platform/
│
│  ── AI ASSETS (static, versioned inputs) ────────────────────────────────
├── knowledge/            # RAG corpus — product/, ui/, pom/, locators/, workflows/, business_rules/,
│                         #   api/, graph/, codebase/, edge_cases/, known_issues/, versions/, glossary/ …
│                         #   (each subdir has an index.md; retrieval is deterministic + cited)
├── prompts/              # versioned prompt registry (stub)
├── templates/            # case / spec / report templates (stub)
├── agents/               # platform agent SOURCES — folder-per-agent (<name>/prompt.md)
│   ├── quality-assurance/  orchestration/   # toolkit REFERENCE personas (not synced, don't run)
├── skills/               # platform skill SOURCES (<name>/SKILL.md)
│   └── reference/          # toolkit REFERENCE skill guides (not synced)
├── rules/                # rules (curated + toolkit-imported reference)
│
│  ── AI RUNTIME (executes) ─────────────────────────────────────────────────
├── pipeline/             # THE flow — 10 stages: 01-requirement … 10-learn (+ 06-review/validators)
│   ├── schemas/  scripts/  README.md
├── framework/            # execution engine
│   ├── core/             #   testcase-store · reporters · orchestration (+ run-manifest)
│   ├── playwright/       #   flow.js · selectors.js · resolver.js  (the driver in use)
│   ├── selenium/ pytest/ #   adapter stubs (contract-compatible, depth)
│   ├── fixtures/ assertions/ utils/   # stubs
│   └── integrations/     #   jira · tfs · vcs
├── tests/                # the runnable suite — regression/ · generated/ · scenarios/ · data/
├── plugins/              # runtime extension point (stub)
├── workspace/            # per-run isolated artifacts (<TICKET>/…)
├── memory/               # run history + metrics store (stub → Phase 3)
│
│  ── PLATFORM (cross-cutting ops) ─────────────────────────────────────────
├── governance/           # validation/ (executable gates) · policy/POLICY.md · rbac/ secrets/ audit/ (stubs)
├── configs/              # config map (+ models/ for the LLM gateway, depth)
├── reports/              # run outputs (gitignored)
├── .github/              # CI — gates job blocks the test job
│
│  ── DEVELOPER EXPERIENCE ──────────────────────────────────────────────────
├── .claude/              # GENERATED agents+skills (from /agents,/skills via sync) + commands/
├── scripts/              # sync-claude.mjs + dev entrypoints
├── docs/                 # STRUCTURE.md · COVERAGE.md
└── playwright.config.js  package.json  CLAUDE.md  .env.example
```

## Agents & skills: source → generated (no hand-maintained duplication)

Claude Code only loads from `.claude/`, so agents/skills can't be canonical there and visible
assets too. Resolution: **`agents/` and `skills/` are the versioned sources; `.claude/agents`
and `.claude/skills` are generated** by `npm run sync:claude` and gitignored (like `dist/`).

| | Source (committed) | Generated (loaded by Claude Code) |
|---|---|---|
| Agents | `agents/<name>/prompt.md` | `.claude/agents/<name>.md` |
| Skills | `skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` |

Agent roster (16): **real** — orchestrator, jira-reader, figma-reader, testcase-generator,
automation-generator, locator-resolver, sandbox-state, debugger. **stubs (target roles)** —
analyst, context-builder, retriever, planner, reviewer, executor, reporter, knowledge-updater.

## Where things belong

| You want to… | Put it in… |
|---|---|
| Add a device / UI case | a **row** in `tests/data/*.csv` (not a new spec) |
| Add/fix a locator | `knowledge/locators/`, then `framework/playwright/selectors.js` |
| Add a reusable step | `framework/playwright/flow.js` (no literal selectors) |
| Add/modify a pipeline stage | `pipeline/NN-<stage>/` (+ a validator in `governance/validation/`) |
| Add/edit a platform agent | `agents/<name>/prompt.md`, then `npm run sync:claude` |
| Add an external system | `framework/integrations/` (+ env in `.env.example`) |
| Add a runnable regression spec | `tests/regression/<area>/` |
| Enforce a rule | `governance/validation/` (code) — not prose |
