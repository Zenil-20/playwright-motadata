# Stage 03 · Requirement Analysis

| Field | Value |
|---|---|
| **Responsibility** | Requirement Analysis — one job, nothing else. |
| **Owner agent(s)** | analyst |
| **Input** | context bundle |
| **Output** | scenarios · risks · RBAC · data · deps |
| **Exit gate** | — |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
