# Stage 04 · Test Planning

| Field | Value |
|---|---|
| **Responsibility** | Test Planning — one job, nothing else. |
| **Owner agent(s)** | planner |
| **Input** | analysis |
| **Output** | risk-based coverage plan |
| **Exit gate** | plan-completeness |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.

**Human coverage-approval gate (between 04 and 05).** After plan-completeness passes, the exit to
stage `05-generate` now also requires the human **`04_coverage_approval`** gate (validator
`governance/validation/coverage-approval.js`, driven by `scripts/coverage-gate.mjs` /
`npm run coverage-gate`). The planner emits a coverage proposal
(`workspace/<TICKET>/<run>/coverage-proposal.{json,md}`); a human must **Allow** it (or **Other** to
add scope and re-propose) before any cases are generated. Approval binds to the proposal hash — a
stale approval blocks.
