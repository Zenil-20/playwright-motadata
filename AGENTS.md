# Repository Guidelines

## Project Structure & Module Organization
This repository is a Playwright test suite for Motadata workflows. Primary test coverage lives under `tests/`, split by product area:

- `tests/Settings/01-06-*`: sequential settings and discovery flows
- `tests/Dashboard/01-05-*`: dashboard validation suites
- `tests/Dashboard/_core`: shared auth, constants, and helper utilities
- `tests/Dashboard/_data`: data-driven dashboard inputs

Generated artifacts are written to `playwright-report/` and `test-results/`. CI configuration lives in `.github/workflows/playwright.yml`.

## Build, Test, and Development Commands
- `npm ci`: install pinned dependencies from `package-lock.json`
- `npx playwright install --with-deps`: install Playwright browsers used by CI
- `npx playwright test`: run the full suite across all configured projects
- `npm run test:dashboard`: run only dashboard specs
- `npm run test:dashboard:list`: list dashboard tests without executing them
- `npx playwright test tests/Settings/02-Discovery/Linux_Discovery.spec.js`: run a single spec while developing

## Coding Style & Naming Conventions
Write tests in CommonJS-based project conventions already used here: JavaScript `.spec.js` files, semicolons, single quotes, and mostly 2-space indentation. Prefer descriptive Playwright `test()` names that state the user action or expected result. Keep shared logic in `_core` or helper modules instead of duplicating selectors across specs. No formatter or linter is currently configured, so match the surrounding file style closely.

## Testing Guidelines
The suite uses `@playwright/test` with Chromium projects defined in `playwright.config.js`. Name new tests `*.spec.js` and place them in the matching feature folder. Keep specs folder-scoped and independent where possible; settings and dashboard projects are grouped for targeted execution. Use `.env` for environment-specific URLs, credentials, and device names. Review `playwright-report/` after failures before pushing.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects such as `Added folder structure support with sequential test execution`. Keep commits focused on one feature or test area. For pull requests, include:

- a brief summary of changed coverage
- linked issue or task ID, if applicable
- affected test paths, for example `tests/Dashboard/03-Virtualization`
- screenshots or report excerpts when UI behavior or failures changed

## Security & Configuration Tips
Do not commit real credentials or environment-specific secrets. Store local overrides in `.env`; CI copies its own secure `.env` from the runner profile.
