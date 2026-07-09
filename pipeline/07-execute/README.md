# Stage 07 · Execute

| Field | Value |
|---|---|
| **Responsibility** | Execute — one job, nothing else. |
| **Owner agent(s)** | executor (+ sandbox-state) |
| **Input** | spec + seeded state |
| **Output** | results + artifacts (trace/video) |
| **Exit gate** | — |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
