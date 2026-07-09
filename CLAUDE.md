# Project Guidance for Claude

## Motadata Playwright tests — locator workflow (standing rule)

When writing, fixing, or extending any `.spec.js` for the Motadata AIOps app:

1. **Cookbook-first.** Resolve every locator from `knowledge/locators/selector-cookbook.md`. Grep the single screen you need — do not load the whole file.
2. **Explore misses.** For any control not in the cookbook (or when a test failed on a wrong/ambiguous locator), use the `motadata-explorer` skill: drive the live app, read the **accessibility tree** (never raw HTML), rank by role, and scope duplicates to the open drawer/popover/row.
3. **Verify before use.** Never emit a locator without confirming `count() === 1` on the correct screen state. If the control isn't present in the required state, say so — never fabricate a plausible-looking locator.
4. **No positional XPath.** Banned: `//div[13]//span[1]`, nth-by-index, anything order-dependent. Re-scope to role / label / `data-cy` / row text instead.
5. **Feed the cookbook.** After resolving any new locator, append it back to the cookbook (with `confidence`, optional `fallback`, `conditional` + `trigger`, and a `# verified YYYY-MM-DD` tag).
6. **Smart waits only.** No `waitForLoadState('networkidle')`, no blind `waitForTimeout`. Use the avatar-visible login check, `expect(...).toBeVisible()`, `waitForURL`, or `expect.poll` for status flips.

The pipeline lives under `pipeline/` (10 stages: `01-requirement` … `10-learn`). See `pipeline/README.md` and `governance/policy/POLICY.md`. **Agents and skills are versioned SOURCES** in `agents/<name>/prompt.md` and `skills/<name>/SKILL.md`; the loadable `.claude/agents` + `.claude/skills` are **generated** by `npm run sync:claude` (gitignored — edit the source, then re-sync). Toolkit **reference** personas live in `agents/quality-assurance/` + `agents/orchestration/`, reference skills in `skills/reference/` — clearly separate from the 16 real agents, NOT synced, nothing runs them.

## Data-driven suite & tooling (merged from observeops-qa)

- **Structure map:** see `docs/STRUCTURE.md`. Four layers — **AI Assets** (`knowledge/ prompts/ templates/ agents/ skills/ rules/`), **AI Runtime** (`pipeline/ framework/ tests/ plugins/ workspace/ memory/`), **Platform** (`governance/ configs/ reports/ .github/`), **DX** (`.claude/ scripts/ docs/`). Several folders are documented stubs (breadth-first); internals are depth work.
- **Max coverage, min automation.** New device/UI coverage = a **row** in `tests/data/*.csv`, not a new spec. Reusable flow: `framework/playwright/flow.js`; single driver: `tests/scenarios/Discovery_DataDriven.spec.js`. See `docs/COVERAGE.md`. The 30 legacy per-device specs still run and are retired one-by-one as each row goes green.
- **Locators live in one place.** `framework/playwright/selectors.js` is the runtime catalog (mirrors the cookbook); `framework/playwright/flow.js` and specs import from it and contain **no literal selectors**. `framework/playwright/resolver.js` is the self-heal mechanism (`resolve()` primary→fallback, `unique()` enforces `count()===1`). Use `discoveredRowCheckbox(page, ip)` instead of the fragile `.nth(1)`.
- **Test-case store.** `framework/core/testcase-store/` normalizes any TFS/Jira/Excel CSV to 13 canonical fields (`tests/regression/` = source of truth, `tests/generated/` = pending promotion).
- **Integrations.** `framework/integrations/{jira,tfs,vcs}.js` (env-driven; see `.env.example`).
- **Failure evidence.** `framework/core/reporters/failure-reporter.js` writes `reports/failures.json` → feed to `failure-triager` via `/analyze-failures`.
- **Orchestration.** `node framework/core/orchestration/daily-pipeline.mjs [--dry]` runs the 14-stage defensive pipeline (read → automate → execute → report → detect-changes → … → promote).
- **Validation gates (anti-hallucination).** `governance/validation/` turns `governance/policy/POLICY.md` into executable validators; `runGate(stage, ctx)` blocks a stage transition on any failure, and provenance is required (no fact without a cited source). Run `npm run test:gates` (self-tests) or `npm run gate <stage> <ctx.json>`. CI runs the gates as a required job that blocks the test job.
- **Commands/skills.** `/coverage-audit` (TFS↔scenario gap report), `/analyze-failures` (route failures to triage), `seed-data` skill (verify preconditions before a live run).
- **Toolkit reference** (from [awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit)) — promoted into the hierarchy but clearly marked reference (not synced, nothing runs): `agents/quality-assurance/` (9) + `agents/orchestration/` (8), `skills/reference/` (7), and the 15 rules in `rules/`. To use one, copy it into `.claude/`.
- **Service docs.** Every `framework/` service has a `README.md` with API + Rules & Regulations (`framework/README.md` is the index).

Always copy `.env.example` → `.env` before a live run.
