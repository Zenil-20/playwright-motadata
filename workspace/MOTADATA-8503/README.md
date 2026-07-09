# MOTADATA-8503 — QA workspace

Unified Create Policy UI (Metric/APM/RUM/NetRoute · Set Conditions).
Jira: http://172.16.10.6:8080/browse/MOTADATA-8503

## Deliverables (this folder)
| File | What |
|---|---|
| `ticket.json` | Parsed Jira: ACs, use cases, completeness check |
| `feature-spec.md` | Synthesized scope/journeys/edge cases |
| `manual-cases.json` | 39 QA-grade cases (matrix-driven) — source of truth |
| `MOTADATA-8503_ManualTests.xlsx` / `.pdf` | Tester-facing exports (Jira-linked) |
| `coverage-summary.md` | Counts by family + AC coverage + automation triage |
| `findings.md` | Live design-vs-shipped discrepancies to flag |
| `resolution-gaps.md` | Locators still needing live harvest |
| `AI_REPORT.html` | AI report layered on the Playwright HTML report |
| `build_suite.py` | Generic generator — retarget CONFIG for any policy Jira |

Automation spec lives in the repo: `tests/Settings/04-PolicySettings/MOTADATA_8503_Metric_Threshold_UnifiedPolicy.spec.js`.
Playwright report: `playwright-report/index.html`.

## `_scratch/`
Throwaway grounding artifacts (exploration scripts, screenshots, raw DOM/aria dumps, harvest iterations). Gitignored. Delete anytime — nothing here is a deliverable.

## Regenerate
`python build_suite.py`  → rewrites manual-cases.json + xlsx + pdf + coverage-summary.
(Close the xlsx in Excel first, or it stays locked.)
