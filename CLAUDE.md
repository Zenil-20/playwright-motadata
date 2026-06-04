# Project Guidance for Claude

## Motadata Playwright tests — locator workflow (standing rule)

When writing, fixing, or extending any `.spec.js` for the Motadata AIOps app:

1. **Cookbook-first.** Resolve every locator from `ai-test-pipeline/cookbook/selector-cookbook.md`. Grep the single screen you need — do not load the whole file.
2. **Explore misses.** For any control not in the cookbook (or when a test failed on a wrong/ambiguous locator), use the `motadata-explorer` skill: drive the live app, read the **accessibility tree** (never raw HTML), rank by role, and scope duplicates to the open drawer/popover/row.
3. **Verify before use.** Never emit a locator without confirming `count() === 1` on the correct screen state. If the control isn't present in the required state, say so — never fabricate a plausible-looking locator.
4. **No positional XPath.** Banned: `//div[13]//span[1]`, nth-by-index, anything order-dependent. Re-scope to role / label / `data-cy` / row text instead.
5. **Feed the cookbook.** After resolving any new locator, append it back to the cookbook (with `confidence`, optional `fallback`, `conditional` + `trigger`, and a `# verified YYYY-MM-DD` tag).
6. **Smart waits only.** No `waitForLoadState('networkidle')`, no blind `waitForTimeout`. Use the avatar-visible login check, `expect(...).toBeVisible()`, `waitForURL`, or `expect.poll` for status flips.

The full multi-agent pipeline (ingest → manual cases → state seeding → resolve → write → triage) lives under `ai-test-pipeline/`. See `ai-test-pipeline/README.md` and `ai-test-pipeline/POLICY.md`. Active agents: `locator-resolver`, `spec-writer`, `failure-triager`.
