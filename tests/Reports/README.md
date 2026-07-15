# Report Regression

End-to-end regression for Motadata AIOps reports. Plain **JavaScript +
Playwright** (CommonJS `require`), same style as the rest of the suite's
`*.spec.js` files — no TypeScript, no Python.

It **validates** existing reports (open → export PDF → assert they actually have
data) and **creates** reports through the wizard and validates those too.
Everything runs through the normal test runner and reuses the suite's
`storageState` auth (the `setup` project), so there is no separate login,
`.venv`, or parallel-launcher to manage.

## Layout

```
tests/Reports/
  report-validation.spec.js   one test per report id (fans out across workers)
  report-creation.spec.js     create a batch via the wizard, then validate each
  _core/
    validate.js               per-report check: preview + PDF + verdict
    report.helpers.js         browser driving (wait-for-ready, preview, timeline, export)
    report-creator.js         3-step create wizard + per-category handlers
    pdf.js                    PDF text + table extraction (pdfjs-dist; replaces pdfplumber)
    compare.js                structural preview-vs-PDF row x col compare
    no-data.js                "No data" marker detection
    html-reporter.js          the run report: screenshots + reasons + row x col
    timeline.js               time-range picker options + resolver
    env.js                    base URL from .env (Motadata_Aiops)
    extract-ids.js            rebuild the catalog from exported report JSON
  _data/
    report-ids.json           the report catalog: [{ id, name }, ...]
    report-names.json         id -> display name
```

`_core`/`_data` start with `_`, so Playwright's project discovery ignores them;
only the two `*.spec.js` files are collected (project name `reports`).

## Running

```bash
npm run reports:validate           # validate every report in the catalog
npm run reports:validate:list      # list what would run (no browser)
npm run reports:create             # create + validate a batch (default: metric, minimal)
npm run reports:extract            # rebuild _data/report-ids.json from exports
```

Or directly:

```bash
npx playwright test --project=reports
npx playwright test --project=reports --workers=8        # more parallelism
npx playwright test --project=reports --last-failed      # resume: re-run only failures
npx playwright test --project=reports -g "Ping Availability"
```

Needs the usual `.env` (`Motadata_Aiops`, `Motadata_Username`, `Motadata_Password`),
same as the rest of the suite.

## Concurrency — safe by design, even inside the full framework run

The report module caps its OWN concurrency, independent of the global worker
count. Playwright has no per-project `workers` setting, so `_core/slots.js` is a
cross-process gate: at most **`REPORT_CONCURRENCY` (default 4)** report checks —
and therefore at most 4 PDF exports — run at once, whether you run the reports
alone or as part of `npx playwright test` with the whole suite on many workers.

This is what keeps the server's PDF-export queue healthy. (Verified: 8 workers
*ungated* → ~100% `no_pdf` from export overload; 8 workers with the gate at 4 →
0 `no_pdf`.) 4 is the value proven safe on the test servers; raise it only if the
server has headroom:

```bash
npx playwright test                        # full suite; reports self-limit to 4
REPORT_CONCURRENCY=6 npm run reports:validate
```

## Scaling / multiple workers

`report-validation.spec.js` opts into `mode: 'parallel'`, so its per-report tests
fan out across the worker pool (the global config is `fullyParallel: false`,
which would otherwise pin all reports to one worker). The **effective** report
concurrency is then `min(workers, REPORT_CONCURRENCY)` — extra workers just wait
on a slot, so you can never overload the export queue by turning workers up:

```bash
npx playwright test --project=reports --workers=6
```

This suite is **heavy per test** (full SPA load + server-side PDF export + PDF
parse), so treat workers as a throttle, not a "go faster" knob. `mode: 'parallel'`
is scoped to this one file — the global `fullyParallel` is left `false`, so no
other suite is affected.

- **Memory** is bounded. Each report runs in a fresh Playwright context that is
  torn down after the test, so renderer heap does not accumulate between reports
  the way it did in the Python harness. One browser process per worker; budget
  roughly 300–500 MB per worker. Locally, **2–4 workers is the sweet spot** — the
  `reports:validate` script defaults to 4. Go higher only if your machine and the
  server both have headroom.
- **Run incrementally** so you never launch 114 heavy tests at once:
  `REPORT_LIMIT=10 npm run reports:validate`, or target specific ids with
  `REPORT_IDS=...`, then widen. `--last-failed` re-runs only failures.
- **Auth** is a single login. The `setup` project logs in once and every worker
  reuses `tests/.auth/user.json` — no per-worker login storm, and all contexts
  share the same session.
- **The real ceiling is the server's PDF-export queue.** Every report triggers an
  async server-side PDF export. Too many workers exporting at once back the queue
  up and surface as `no_pdf` / per-report timeouts — that's server load, not a
  test bug. `PER_REPORT_TIMEOUT` (default 360s) is the stall cap.

## The run report (HTML)

Every run writes a self-contained HTML report — **one row per report, pass or
fail**, each with:

| Column               | What it is                                                              |
|----------------------|-------------------------------------------------------------------------|
| Status               | `PASS` / `FAIL` / `TIMEOUT` / `NO PDF` / `ERROR`                        |
| Reason               | Why it failed, in words — not a stack trace                             |
| Preview rows x cols  | What the UI grid rendered                                              |
| Export rows x cols   | What came back in the exported PDF                                     |
| Load                 | How long the data actually took to render                              |
| Screenshot           | Full-page shot of the report, click to zoom                            |

Passes carry a screenshot and both row/col counts too — a pass you can *look at*
is worth more than a green tick, and the counts are how you catch a report that
"passes" while silently exporting 24 of its 25 rows. A shape mismatch is flagged
in the row (`mismatch`) even when it isn't being enforced as a failure.

The report is written to `test-results/report-regression/index.html` (override
with `REPORT_HTML_DIR`); screenshots sit beside it in `screenshots/`, so the
folder can be zipped and handed to someone as-is. The run prints the path when
it finishes.

**Each run starts clean** — the previous `index.html` and `screenshots/` are
deleted when the run begins, so the report always describes exactly the run you
just did, with no leftovers from a bigger earlier one. Only those two entries are
removed; anything else you keep in that folder is left alone. Copy the folder
elsewhere if you want to keep a run around.

Register the reporter in `playwright.config.ts`:

```ts
reporter: [
  ['line'],
  ['./tests/Reports/_core/html-reporter.js', { outputDir: 'test-results/report-regression' }],
],
```

…or ask for it on the command line, without touching the config:

```bash
npx playwright test --project=reports --reporter=line,./tests/Reports/_core/html-reporter.js
```

If you use the npm scripts, put the same `--reporter=...` in `reports:validate`.

### Reasons you'll see

| Reason                                                | What actually happened                                        |
|-------------------------------------------------------|---------------------------------------------------------------|
| `Timed out after 10.0s — report data never rendered`  | The report never painted a grid/chart inside its budget       |
| `No data — preview and exported PDF are both empty`   | The report genuinely has nothing to show                      |
| `No data in the UI preview, but the PDF has rows`     | UI-side bug — the data exists, the screen doesn't show it     |
| `No data in the exported PDF, but the preview has rows` | Export-side bug — the screen has it, the PDF lost it        |
| `Preview vs export mismatch — row counts differ: …`   | Shape drift between what you see and what you export          |
| `Export As PDF produced no download`                  | Button missing, or the server's export queue never delivered  |

## Footprint

- The exported PDF is read **into memory and the download is deleted immediately** —
  it never lingers in a temp dir. `pdfjs` parses in-process and writes nothing.
- What a run *does* write: the HTML report + one screenshot per report, both
  under `test-results/` (git-ignored). Set `REPORT_SCREENSHOTS=fail` to keep only
  failures' screenshots, or `=off` for none (the HTML report still renders, just
  without images).
- The failing report's **preview text and the PDF itself** are still opt-in —
  `REPORT_SAVE_ARTIFACTS=1` writes them under `test-results/.../faulty/`.
- Secrets and artifacts are already git-ignored at the repo root
  (`.env*`, `/tests/.auth/`, `/test-results/`), so nothing sensitive is committed.

## Generic / portable

No hardcoded server, credentials, or paths — the base URL and login come from
`.env` (`Motadata_Aiops` / `Motadata_Username` / `Motadata_Password`), same as
the rest of the suite, so it runs against any Motadata AIOps instance.
`_data/report-ids.json` is the product's **default report catalog** (default
report ids/names, not user data); regenerate it for a different build with
`npm run reports:extract`, or bypass it entirely with `REPORT_CATALOG=...`.

## The Python harness -> Playwright mapping

The original Python stack hand-rolled parallelism, memory watchdogs, and resume
logic. Playwright provides all of that natively, so those files were **not**
ported — they were replaced by runner features:

| Python harness            | Here                                                        |
|---------------------------|-------------------------------------------------------------|
| `run_parallel.py` workers | `workers` in `playwright.config.ts` (or `--workers N`)      |
| `PER_REPORT_TIMEOUT`      | `test.setTimeout()` per report (env `PER_REPORT_TIMEOUT`)   |
| `watchdog.py` OOM kills   | Playwright per-test timeout + worker isolation              |
| `--resume` / merge dirs   | `npx playwright test --last-failed`                         |
| `login()` in every script | `setup` project storageState (`tests/.auth/user.json`)      |
| `compare_batch.py`        | `_core/compare.js` (opt-in via `REPORT_COMPARE_SHAPE=1`)    |
| `pdfplumber`              | `_core/pdf.js` on `pdfjs-dist`                              |
| `extract_report_ids.py`   | `_core/extract-ids.js`                                      |

**Check semantics.** A report fails if any of these is true:

1. **Timeout** — its data did not render within `REPORT_READY_TIMEOUT` (10s).
2. **No data** — the UI preview or the exported PDF shows a "No data" marker.
3. **Shape** — preview and PDF disagree on row x col (**opt-in**:
   `REPORT_COMPARE_SHAPE=1`; otherwise the counts are still measured and shown in
   the HTML report, just not asserted — matching the Python default, which forced
   `DISABLE_ROW_COL_COMPARE=1`).

## The 10s data budget

Each report gets **10 seconds for its data to render** — but it is a *cap, not a
wait*. The check polls every 200ms and moves on the instant the grid/chart is on
screen, so a report that paints in 1.4s costs 1.4s, not 10. Only a report still
spinning at the cap fails, with reason `timeout`. Tune with
`REPORT_READY_TIMEOUT=<seconds>`.

Two things are deliberately **not** under this clock:

- **An empty state is "loaded".** A report that renders "No data available" in
  1s isn't a timeout — it's a no-data failure, and the report says so. Those are
  different bugs and conflating them wastes your time.
- **The PDF export.** It's an async server-side queue that routinely takes far
  longer than 10s; it keeps its own `PDF_DOWNLOAD_TIMEOUT_MS` (300s). Putting the
  export under a 10s cap would fail every report on server load rather than on
  anything about the report.

## Env knobs (validation)

| Var                    | Default                  | Effect                                            |
|------------------------|--------------------------|---------------------------------------------------|
| `REPORT_CATALOG`       | `_data/report-ids.json`  | Path to the ids JSON to iterate                   |
| `REPORT_IDS`           | (all)                    | Comma-separated subset of ids                     |
| `REPORT_LIMIT`         | (all)                    | Only the first N ids                              |
| `REPORT_START`         | 0                        | Skip the first N ids                              |
| `REPORT_TIMELINE`      | (each report's own)      | Override time range, e.g. `this.month`, `-24h`, `1w` |
| `REPORT_READY_TIMEOUT` | 10                       | Seconds for a report's data to render, else `timeout` |
| `REPORT_COMPARE_SHAPE` | off                      | `1` -> also *assert* preview/PDF row/col shape (always reported) |
| `REPORT_SCREENSHOTS`   | `all`                    | `all` \| `fail` \| `off`                          |
| `REPORT_HTML_DIR`      | `test-results/report-regression` | Where the HTML report is written           |
| `PER_REPORT_TIMEOUT`   | 360                      | Hard cap per test (whole check, incl. PDF export) |

Example: `REPORT_LIMIT=3 npm run reports:validate` (quick smoke of 3 reports).

## Env knobs (creation)

| Var                     | Default   | Effect                                        |
|-------------------------|-----------|-----------------------------------------------|
| `REPORT_CREATE_CATEGORY`| `metric`  | Category key (see `CATEGORY_DISPLAY`)         |
| `REPORT_CREATE_COMBOS`  | `minimal` | `minimal` (1 combo) or `full` (whole matrix)  |
| `REPORT_CREATE_STAMP`   | run stamp | Name suffix for the created reports           |

Supported creation categories today: `metric` (Performance), `forecast`,
`active.alerts`. Add a handler in `_core/report-creator.js` for others.

## Debugging a failure

Start with the HTML report — the screenshot and the reason are usually the whole
story. When you need the underlying evidence, run with `REPORT_SAVE_ARTIFACTS=1`:
the failing report's **preview text and the exported PDF itself** are written
under `test-results/.../faulty/<name>__<id>/` and attached to the test, so you
can open the PDF that the check called empty. The creation spec likewise writes
`created-report-ids.json` only under that flag (it always prints the ids to the
console regardless). Point `REPORT_CATALOG` at that file to re-validate just the
created reports.

## Integrating into another Playwright suite

This folder is self-contained. To drop it into a different Playwright project:

1. Copy the whole `Reports/` folder under your `tests/` dir.
2. Install the one runtime dep: `npm i pdfjs-dist`.
3. Register the project in `playwright.config.*` (add to your `projects` array),
   and the reporter (add to your `reporter` array):
   ```js
   {
     name: 'reports',
     testMatch: ['tests/Reports/*.spec.@(js|ts)'],
     use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/user.json' },
     dependencies: ['setup'], // your login/auth setup project
   }
   // reporter: [['line'], ['./tests/Reports/_core/html-reporter.js']]
   ```
4. Provide auth: either a `setup` project that writes `storageState`, or remove
   the `dependencies`/`storageState` and add a UI login in the specs.
5. Set `.env`: `Motadata_Aiops`, `Motadata_Username`, `Motadata_Password`.
6. (Optional) copy the npm scripts from `package.json` (`reports:validate`,
   `reports:create`, `reports:extract`).

If your suite uses `type: commonjs` under `tests/` (as this one does), the files
work as-is. Under pure ESM, convert `require`/`module.exports` to `import`/`export`.

## Rebuilding the catalog

`_data/report-ids.json` ships with the current 114 default reports. To refresh
it from a folder of exported report JSON (each a top-level array of report
objects with `id` + `report.name`):

```bash
REPORTS_SRC=/path/to/exports npm run reports:extract
# or: node tests/Reports/_core/extract-ids.js /path/to/exports
```
