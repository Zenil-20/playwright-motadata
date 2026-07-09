# Stage 09 · Report

| Field | Value |
|---|---|
| **Responsibility** | Report — one job, nothing else. |
| **Owner agent(s)** | reporter |
| **Input** | run results + metrics |
| **Output** | audience-tiered reports + scores |
| **Exit gate** | — |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
