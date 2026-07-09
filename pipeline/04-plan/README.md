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
