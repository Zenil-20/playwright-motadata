# Stage 05 · Generate (cases → automation)

| Field | Value |
|---|---|
| **Responsibility** | Generate (cases → automation) — one job, nothing else. |
| **Owner agent(s)** | testcase-generator → automation-generator |
| **Input** | coverage plan |
| **Output** | structured cases, then spec.js with verified locators |
| **Exit gate** | coverage · business-rules · dedup |

**Entry gate — human coverage approval (between 04 and 05).** This stage does NOT start until the
human **`04_coverage_approval`** gate has passed (Allow) on the planner's coverage proposal
(validator `governance/validation/coverage-approval.js`; `npm run coverage-gate check <dir>` must
exit 0). No cases are generated while the proposal is pending, `Other`, or bound to a stale hash.

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
