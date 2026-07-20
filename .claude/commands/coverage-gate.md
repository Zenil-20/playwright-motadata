---
description: Present the coverage proposal for a ticket and record the human Allow / Other decision (Flow B Human Gate #1)
---

# Coverage gate (Human Gate #1)

The mandatory human checkpoint **before any test cases are written** (between pipeline `04-plan`
and `05-generate`). No cases are generated until the coverage plan is approved.

## Steps
1. **Find the proposal.** Read `workspace/<TICKET>/<run>/coverage-proposal.md` (+ `.json`). If none
   exists, tell the user to run the planner first (or `node scripts/coverage-gate.mjs propose <plan.json>`).
2. **Present it** to the user: the areas, categories, estimated case counts, exclusions, assumptions,
   and the total. Keep it scannable.
3. **Ask the decision** with AskUserQuestion — two options:
   - **Allow** — proceed with exactly this plan.
   - **Other** — the user names additional areas/scenarios/exclusions to add.
4. **Record it:**
   - Allow → `node scripts/coverage-gate.mjs allow <dir> --by <user>`
   - Other → `node scripts/coverage-gate.mjs other <dir> --add "<addition>" [--add "…"]`, then tell the
     planner to revise the plan and re-propose (loop back to step 1).
5. **Confirm the gate** — `node scripts/coverage-gate.mjs check <dir>` must exit 0 before stage 05.

## Rules
- **Mandatory on every ticket** — never skip to case generation without an Allow.
- Approval binds to the proposal **hash**; if the plan changes, re-approve (the gate blocks stale approvals).
- This is human-in-the-loop by design: the AI proposes, the human decides.
