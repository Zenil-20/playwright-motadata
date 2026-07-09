# Stage 10 · Knowledge Update

| Field | Value |
|---|---|
| **Responsibility** | Knowledge Update — one job, nothing else. |
| **Owner agent(s)** | knowledge-updater |
| **Input** | verified outcomes |
| **Output** | versioned knowledge delta |
| **Exit gate** | provenance required |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
