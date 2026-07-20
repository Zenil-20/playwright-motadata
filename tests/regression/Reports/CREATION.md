# Report Creation Matrix

The **creation automation**: builds Custom Reports through the `/reports/create`
3-step wizard for **every report type** on the step-1 grid — **5–8 reports per
type, each a different scenario** — captures every backend-assigned report id,
and hands the ids to the **default validator** (`report-validation.spec.js`)
for preview + PDF-export validation.

It is fully separate from the original creator (`report-creation.spec.js` /
`_core/report-creator.js`) — nothing existing was modified.

## Layout

```
Reports/
  report-creation-matrix.spec.js   one test per category: create 5–8 scenarios, record ids
  _core/creation/
    wizard.js                      3-step wizard primitives (tiles, pickers, source table,
                                   Next-enabled wait, save + id capture)
    categories.js                  the registry: every category's handler + scenario matrix
    ids-store.js                   cross-worker-safe append to the created-ids file
    html-reporter.js               the creation run report: one row per scenario + screenshots
    custom-scripts/                drop sample.go/.py/.js here to enable custom.script
  _data/
    created-report-ids.local.json  output — the new report ids (gitignored via *.local.json)
```

## Running

Create everything (all categories, full matrices):

```bash
npx playwright test --project=reports report-creation-matrix.spec.js
```

Then validate the new reports with the **default validator**, pointing it at
the ids the run just wrote:

```bash
REPORT_CATALOG=tests/Reports/_data/created-report-ids.local.json \
  npx playwright test --project=reports report-validation.spec.js
```

(Adjust the `tests/Reports/` prefix to wherever this folder sits in your suite —
the path is resolved from the repo root you run from.)

Or do both in one run — each category test validates its own creations right
after creating them (same `checkReport` core the default validator uses):

```bash
CREATE_VALIDATE=1 npx playwright test --project=reports report-creation-matrix.spec.js
```

Smoke test (1 scenario per category):

```bash
CREATE_LIMIT=1 npx playwright test --project=reports report-creation-matrix.spec.js
```

One category only:

```bash
CREATE_CATEGORIES=forecast npx playwright test --project=reports report-creation-matrix.spec.js
```

Delete `_data/created-report-ids.local.json` first if you want a fresh ids
file — runs **append** to it.

## The run report (HTML)

Every creation run writes a self-contained HTML report — **one row per
scenario**, created / failed / skipped alike:

| Column | What it is |
|---|---|
| Category / Scenario | e.g. `forecast` / `time_c0` |
| Report | The created report's name + backend id (deep-links to `/reports/view/<id>`) |
| Status | `CREATED` / `FAILED` / `SKIPPED` |
| Validation | Only on `CREATE_VALIDATE=1` runs — the chained checkReport verdict |
| Wizard picks / reason | What was actually selected (counter text, monitors, range, severity…), or why it failed |
| Screenshot | Full-page shot — the filled step-2 form (preview visible) on success, the failure state on failure. Click to zoom, arrow keys to cycle. |

Filter cards (Created / Failed / Skipped), a category dropdown, and free-text
search sit on top. Written to `test-results/report-creation/index.html`
(override with `CREATE_HTML_DIR`); screenshots are copied beside it, so the
folder can be zipped and handed over as-is. Each run starts clean — only
`index.html` + `screenshots/` are replaced, and only when creation tests
actually ran.

Register the reporter (it coexists with the validation reporter — each renders
only when its own tests ran, into different folders):

```js
// playwright.config
reporter: [
  ['line'],
  ['./tests/Reports/_core/html-reporter.js'],           // validation runs
  ['./tests/Reports/_core/creation/html-reporter.js'],  // creation runs
],
```

…or on the command line, without touching the config:

```bash
npx playwright test --project=reports report-creation-matrix.spec.js \
  --reporter=line,./tests/Reports/_core/creation/html-reporter.js
```

## What gets created

| Category | Scenarios | What varies |
|---|---|---|
| `metric` (Performance) | 8 | counter index ×5, monitors 1/3/all, 1–2 counters |
| `availability` | 6 | monitors 1/3/5/all, source = Group / Tag |
| `inventory` | 5 | monitors 1/3/all, source = Group / Tag |
| `audit` | 6 | defaults, Module, Module+Operation, Users, Status, Result By |
| `log` (Log Analytics) | 6 | counter ×3, hosts 1/3/all, Result By |
| `flow` (Flow Analytics) | 5 | counter ×3, hosts 1/3/all |
| `forecast` | 8 | percent × counters ×3 × ranges (12h/1w/2w/1mo), time-based ×2 |
| `active.alerts` | 6 | policy type metric/APM/RUM, severity subsets |
| `metric.alert` | 5 | severity subsets |
| `availability.alerts` | 5 | severity subsets |
| `event.history` (Log Events) | 5 | counter, hosts 1/3/all |
| `trap` | 5 | counter, hosts 1/3/all |
| `log.compliance` | 5 | counter, hosts 1/3/all |
| `availability.flap.summary` | 6 | monitors 1/2/3/5/all, Group (save-first, no preview) |
| `historical.trend` | 6 | 1–2 scalar counters, monitors 1/3/all (save-first, no preview) |
| `polling` | 5 | counter ×3, monitors 1/3/all |
| `unhealthy.monitors` | 5 | monitors 1/3/5/all, Group |
| `capacity.planning.forecast` | 6 | static 80/90/95, dynamic, ranges, monitors all |
| `trace.metric` (APM) † | 5 | counter ×3, sources 1/all |
| `rum.metric` (RUM) † | 5 | counter ×3, applications 1/all |
| `netroute.metric` † | 5 | counter ×3, netroutes 1/all |
| `SLO` † | 5 | SLO type ×2, counter ×2, services all |
| `config` (NCCM) † | 5 | counter ×3, monitors 1/3/all |
| `nccm.compliance.policy` † | ≤5 | one per compliance policy (extra indices skip) |
| `custom.script` † | 5 | GO/Python/Node — needs sample scripts, see `_core/creation/custom-scripts/` |
| `ai` † | 5 | requirement prompts (waits for AI script generation, up to 4 min) |

† = **soft** category (see below). Not registered: `log.event` (same tile as
`event.history`), `capacity.planning` (no tile), `nccm.compliance.summary`
(shares the Compliance tile — the tile always opens the policy flavor).

## Soft vs hard categories

Some categories only work when the instance has the matching data source
(APM traces, RUM apps, NetRoute, SLOs, NCCM devices, compliance policies) or a
fixture you provide (custom.script sources). Those are **soft** by default:
their failures are reported as annotations, but the test only fails when the
category produced *nothing at all*. Everything else is **hard** — every
scenario must produce an id or the category's test fails, listing exactly
which scenarios broke (with a full-page screenshot attached per failure).

A category whose **tile isn't on the create page** at all is skipped, not
failed. `custom.script` scenarios with no sample script are skipped with the
reason in the annotations.

Override the soft list with `CREATE_SOFT` (comma list, or `none` to make
everything strict).

## Env knobs

| Var | Default | Effect |
|---|---|---|
| `CREATE_CATEGORIES` | `all` | Comma list of category keys to run |
| `CREATE_LIMIT` | (all) | Cap scenarios per category (1 = smoke) |
| `CREATE_SOFT` | per-registry | Categories whose failures don't fail the test; `none` = all strict |
| `CREATE_OUT` | `_data/created-report-ids.local.json` | Where the ids are appended |
| `CREATE_HTML_DIR` | `test-results/report-creation` | Where the creation HTML report is written |
| `CREATE_STAMP` | run stamp | Name suffix — reports are named `auto-<category>-<scenario>-<stamp>` |
| `CREATE_VALIDATE` | off | `1` → validate each created report in the same test |

Plus the usual suite env: `.env` with `Motadata_Aiops` / `Motadata_Username` /
`Motadata_Password`, and auth via the `setup` project's storageState.

## Concurrency

One test per category, fanned out across workers (`mode: 'parallel'`), but
gated by the same cross-process slot gate as validation
(`_core/slots.js`, `REPORT_CONCURRENCY`, default 4) — so a big `--workers N`
can never stampede the server, and a chained `CREATE_VALIDATE=1` run can never
overload the PDF-export queue.

## Output format

`_data/created-report-ids.local.json` — a JSON array the default validator
accepts as-is via `REPORT_CATALOG` (it needs `id` + `name`; the rest is for
humans):

```json
[
  {
    "id": 100000000000123,
    "name": "auto-forecast-pct_c0_1w-483920",
    "category": "forecast",
    "scenario": "pct_c0_1w",
    "picked": { "forecast_type": "percent", "counter": "CPU Utilization (%)", "monitors": "all (12+ visible)", "range": "1 Week (default)", "preview": "rendered" }
  }
]
```

`picked` records what each scenario actually selected (counter text, monitor
count, range, severity, …) so a failing validation can be traced back to the
exact wizard inputs.

## Debugging a failed scenario

- The test lists every failed scenario by name with the reason, and attaches a
  full-page screenshot per failure (`create-fail-<category>-<scenario>.png`).
- `no id captured` → the Save POST never returned an id; almost always a
  step-3 validation error — open the screenshot.
- `Next button still disabled after Ns` → a required step-2 field was missed
  (check the category's block in `.claude/agents/report-creator.md`) or the
  preview never validated (often: the picked counter has no data).
- `Source table rendered 0 rows` → the chosen Source Filter kind (Group/Tag/
  Application/…) has no entities on this instance — that scenario's filter
  needs data to exist.
