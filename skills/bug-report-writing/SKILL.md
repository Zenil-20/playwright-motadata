---
name: bug-report-writing
description: Write an ObserveOps bug report from a triaged Playwright failure — cited-evidence only, PQD/MOTADATA-shaped, with the trace link. Use after mt-debugger returns a product-bug verdict, or when turning a real defect into a Jira sub-task / known-issue KB entry.
---

# Bug Report Writing (ObserveOps)

Turn a **confirmed** ObserveOps defect into a report a Motadata engineer can act on. In our pipeline a bug report is never authored from a hunch — it is authored from the `mt-debugger` (failure-triager) verdict, which is only allowed to say `product-bug` when it has a **hard signal** (error-toast text, a non-2xx network response, or an explicit wrong-state in the trace's a11y tree). This skill takes that cited evidence and formats it to match how Motadata already tracks defects: the PQD/MOTADATA pattern in `knowledge/known_issues/customer-issue-kb.md`.

## When to use / When NOT
- **Use when:** `agents/debugger/prompt.md` emits a `class: product-bug` verdict block (steps, expected, actual, evidence, trace link) and the orchestrator's gated bug-report stage needs a written ticket; or when you promote a recurring failure into `knowledge/known_issues/customer-issue-kb.md`.
- **Do NOT use when:** the triager class is `locator-drift`, `flaky-timing`, or `wrong-assertion` — those route to `mt-locator-resolver` / a wait patch / re-harvesting the expected string, not to a bug. **Never** write a product-bug report without the debugger's hard signal; inventing a defect burns engineering trust exactly as the debugger's no-guess rule warns.

## Every claim is cited (our provenance rule)
Each factual line in the report carries its source, mirroring the debugger's `source: trace` discipline:
- **Steps** → from the resolved test case / spec (`tests/regression/**` or `tests/generated/**`), not from memory.
- **Actual result** → the literal string from the trace's `error-context.md` a11y snapshot, the failing action log, or the captured network entry in `workspace/<TICKET>/<run-id>/`.
- **Expected result** → the screen's *Validations* / *Business Rules* section in `knowledge/product/<Module>/<Screen>.md`, or the acceptance criteria of the source ticket. Cite which.
- **Prior art** → cross-reference `knowledge/known_issues/customer-issue-kb.md`; a matching pattern strengthens the verdict and links fix history.

If you cannot cite the actual value, you do not have a bug — stop and return to triage.

## Report template (ObserveOps / PQD-shaped)
```markdown
## Title
[Module > Screen]: [observable symptom]   e.g. "Settings > Discovery: provision silently succeeds with ifSpeed=0 → 100% utilization"

## Environment
- Build: ObserveOps 8.2.6 (Vue 3 + Ant Design SPA)
- Env / URL: <sandbox from mt-sandbox-state seed-report.json>
- Theme: Light | Dark | Auto (Settings > My Account > UI Preference)
- User / RBAC role: <role — RBAC-scoped bugs must state the role>
- Source ticket: MOTADATA-#### / PQD-#####

## Severity / Priority
S1 Critical | S2 High | S3 Medium | S4 Low   ·   P0–P3
(Severity = technical impact; Priority = business urgency — a demo-blocking S3 can still be P0.)

## Steps to Reproduce
1. Login (avatar-visible check)
2. Navigate: <named screen from knowledge/product/.../Navigation>
3. ...trigger condition (cite the row/data that triggers it)...

## Expected Result
<from knowledge/product/<Module>/<Screen>.md §Validations / §Business Rules — cite the line>

## Actual Result
<literal string from trace error-context.md / non-2xx response / error toast — cite: source: trace>

## Evidence (cited)
- error-context.md excerpt: "<literal a11y snapshot line with ref= id>"
- network: "<METHOD path → 500 …>"  (source: captured network)
- Trace: workspace/<TICKET>/<run-id>/trace.zip

## Known-issue cross-check
- Matches KB pattern: <section of customer-issue-kb.md, e.g. "§1 Interface speed = 0 → 100% utilization (PQD-31144)"> — OR "no prior pattern found".

## Impact / Workaround
<who is affected + any KB-documented workaround>
```

## Severity for our domain (calibrate to the KB hotspots)
- **S1** — data-loss / outage class: store corruption on abrupt shutdown, OOM datastore kills, dual-primary HA, invalid HW-key halting services (KB §2, §3).
- **S2** — a core flow broken with no workaround: discovery yields no data for a device class, alerts never fire when the occurrence math allows, report export wrong format (KB §1, §4, §5).
- **S3** — impaired but workaround exists: widget ordering/query defects, clone-shares-state (KB §10).
- **S4** — cosmetic: label/theme/empty-state ("No data found") polish.

## Rules & anti-patterns
- **Quarantine, never mask.** A failing assertion is reported, never deleted or weakened to force green (debugger guardrail). One bug = one report.
- **No fabrication.** Every actual/expected line cites trace / network / screen-doc / KB. No cited string → no report.
- **Product-bug needs a hard signal.** Absent an error toast, non-2xx, or explicit wrong-state, it is a test-side cause — route it back, do not file it.
- **Respect RBAC.** If the defect only reproduces for a role, state the role — many KB defects (report download, Query permission) are permission-scoped.
- **Link, don't attach video.** Cite the a11y snapshot and trace path; we triage from `error-context.md`, not screenshots.

Adapted from qaskills/seed-skills/bug-report-writing
