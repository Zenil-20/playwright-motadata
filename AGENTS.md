# Repository Guidelines

Playwright test suite for the **Motadata AIOps / ObserveOps** web app. Tests are organized by product area under `tests/` and run sequentially per feature folder.

## Project Structure

```
tests/
├─ Settings/
│  ├─ 01-AgentMonitoringSettings/
│  ├─ 02-Discovery/
│  ├─ 03-NetrouteSettings/
│  ├─ 04-PolicySettings/
│  ├─ 05-Runbook/
│  ├─ 06-UserSettings/
│  ├─ 07-Integration/
│  ├─ 08-SLO/
│  ├─ 09-SystemSettings/
│  ├─ 10-Integrations/
│  ├─ 11-rediscovery/
│  ├─ 12-MetricPlugin/
│  ├─ 13-MonitorSettings/
│  └─ _data/                       # shared fixtures used by Settings specs
├─ Dashboard/
│  ├─ 01-05-*/                     # per-product dashboards
│  ├─ _core/                       # shared auth, constants, helpers
│  └─ _data/                       # data-driven dashboard inputs
└─ metricExplorer/                 # Metric Explorer screen specs
```

Generated artifacts: `playwright-report/` and `test-results/`. CI: `.github/workflows/playwright.yml`.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | install pinned dependencies |
| `npx playwright install --with-deps` | install browsers (CI parity) |
| `npx playwright test` | run the full suite |
| `npm run test:dashboard` | dashboard specs only |
| `npm run test:dashboard:list` | list dashboard tests, do not run |
| `npx playwright test tests/Settings/<folder>/<file>.spec.js` | single spec |
| `npx playwright show-report --port 9324` | view last report (use a free port if 9323 is taken) |

## Coding Style

- JavaScript `.spec.js`, CommonJS, semicolons, single quotes, 2-space indent.
- Use `test.describe.serial` with a shared `page` created in `beforeAll`. Tests inside a file are not independent — order matters.
- Constants (IPs, names, URLs) go at the top of the file in `SCREAMING_SNAKE_CASE`.
- File header: keep the existing Motadata copyright block; update `Author` and `Created` for new files.
- No formatter/linter configured — match the style of the surrounding file.

## Test Authoring Conventions

- Every spec starts with a **Login** test and ends with a **Logout** test.
- Login asserts `page.locator("//img[@alt='Avatar']")` is visible. **Do not** use `waitForLoadState('networkidle')` — Motadata streams in the background and it rarely settles.
- Settings navigation: click `/settings/`, click `#phone-number`, fill the search, click the link. The `#phone-number` click is required.
- Prefer Playwright's auto-waiting: `expect(locator).toBeVisible()`, `.click()`, `.fill()`. Avoid `waitForTimeout`.
- Long-running flows: `test.setTimeout(<ms>)` inside the test; use `expect.poll` for state that settles asynchronously.
- Resources that may already exist should be **idempotent** — pre-check the list or race the "duplicate" toast after submit.

## Claude Skill

This repo ships a project skill at [`.claude/skills/motadata-playwright/SKILL.md`](.claude/skills/motadata-playwright/SKILL.md). Claude Code auto-loads it whenever you ask to write or fix a Motadata test. It encodes the login flow, kebab actions, dropdown patterns, drawer scoping, smart waits, and the known DOM gotchas of the app. Update it whenever a new pattern or pitfall is discovered.

## Environment

- `.env` holds URLs, credentials, and device IPs. **Never commit real credentials.** **Never modify `.env` without explicit permission** (see saved memory `feedback_env_edits`).
- CI loads its own `.env` from the runner profile.

## Commit & PR Guidelines

- Imperative, focused commit subjects, e.g. `Add maintenance flow test for vCenter monitor`.
- One feature or test area per commit.
- PRs include:
  - brief summary of coverage changed
  - linked issue/task ID
  - affected test paths (e.g. `tests/Settings/13-MonitorSettings`)
  - report excerpt or screenshot if behavior changed

## Security

Do not commit `.env`, credential files, or test artifacts containing real device data. Local overrides only. CI manages its own secrets.
