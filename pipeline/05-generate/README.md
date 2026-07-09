# Stage 05 · Generate (cases → automation)

| Field | Value |
|---|---|
| **Responsibility** | Generate (cases → automation) — one job, nothing else. |
| **Owner agent(s)** | testcase-generator → automation-generator |
| **Input** | coverage plan |
| **Output** | structured cases, then spec.js with verified locators |
| **Exit gate** | coverage · business-rules · dedup |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
