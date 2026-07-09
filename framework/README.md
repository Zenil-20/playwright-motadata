# `framework/` — execution engine

Plain ES-module code that the specs and pipeline import. Grouped by concern.

| Area | Folder | Contents |
|---|---|---|
| Driver in use | `playwright/` | `flow.js` · `selectors.js` (catalog) · `resolver.js` (self-heal) |
| Core services | `core/` | `testcase-store/` · `reporters/` · `orchestration/` (daily-pipeline, run-manifest) |
| External systems | `integrations/` | `jira.js` · `tfs.js` · `vcs.js` |
| Adapter stubs | `selenium/` `pytest/` | contract-compatible drivers (depth) |
| Shared | `fixtures/` `assertions/` `utils/` | stubs (depth) |

Validation gates moved to `governance/validation/` (they're governance, not runtime).

**Separation of concerns:** `selectors.js` = *what* the locators are · `resolver.js` = *how* to
resolve them safely · `flow.js` = *the steps*. Locators never appear in flow or spec files.
