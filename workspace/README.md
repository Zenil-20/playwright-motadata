# Workspace — standard per-Jira layout

Every Jira gets ONE folder named by its key (e.g. `MOTADATA-8503/`). Keep it clean:
**deliverables flat, transient artifacts in `_scratch/`.**

```
workspace/
  .gitignore                 # ignores */_scratch/ and ~$ lock files
  <JIRA-KEY>/
    README.md                # index of this Jira's deliverables
    ticket.json              # parsed Jira (ACs, use cases, completeness)
    feature-spec.md          # synthesized scope
    manual-cases.json        # QA-grade cases (source of truth)
    <KEY>_ManualTests.xlsx   # tester export
    <KEY>_ManualTests.pdf    # tester export
    coverage-summary.md      # counts + AC coverage + automation triage
    findings.md              # design-vs-shipped discrepancies
    resolution-gaps.md       # locators needing live harvest
    AI_REPORT.html           # AI report over the Playwright report
    build_suite.py           # generic generator (retarget CONFIG)
    _scratch/                # GITIGNORED throwaway: explore *.mjs, screenshots,
                             #   raw.json, controls-*.json, aria-*.txt, harvest vN, probes
```

## Rules (so folders never become junk drawers)
1. Anything used only to *figure things out* (exploration scripts, screenshots, raw DOM/aria dumps, harvest iterations, probes) goes in `_scratch/` — never the folder root.
2. Only reviewable deliverables live at the folder root.
3. `_scratch/` is gitignored and disposable; deleting it must not lose anything important.
4. Automation specs live in the repo `tests/` tree, not here — this folder only points to them.
5. One canonical name per export (no `_v2`, `_full` clutter); regenerate in place.
