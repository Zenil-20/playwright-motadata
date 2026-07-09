# Stage 06 · Review

| Field | Value |
|---|---|
| **Responsibility** | Review — one job, nothing else. |
| **Owner agent(s)** | reviewer |
| **Input** | cases / specs |
| **Output** | gate verdict {pass, score, evidence} |
| **Exit gate** | locators · assertions · automation-review |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
