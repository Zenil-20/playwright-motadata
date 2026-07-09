# Stage 08 · Analyze (triage + self-heal)

| Field | Value |
|---|---|
| **Responsibility** | Analyze (triage + self-heal) — one job, nothing else. |
| **Owner agent(s)** | debugger (self-heal via locator-resolver) |
| **Input** | trace + network |
| **Output** | classified verdict; bounded heal or quarantine |
| **Exit gate** | — |

The orchestrator (`agents/orchestrator/`) runs this stage, records it in the run manifest, and
refuses to advance until the exit gate passes (gates = executable validators in
`governance/validation/`). Stages never call each other directly. See `pipeline/README.md`.
