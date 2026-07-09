# Stage 01 · Requirement Ingestion

| Field | Value |
|---|---|
| **Responsibility** | Requirement Ingestion — one job, nothing else. |
| **Owner agent(s)** | jira-reader · figma-reader → analyst |
| **Input** | Jira / Figma / docs |
| **Output** | normalized requirement + provenance |
| **Exit gate** | requirement-completeness |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
