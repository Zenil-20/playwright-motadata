# pipeline/ — the canonical AI QA pipeline

The single source of truth for the flow. Ten numbered stages, each with one responsibility,
a defined input/output, an owning agent (`../agents/<name>/`), and an **exit gate**. The
orchestrator runs the flow; stages never call each other directly.

```
Requirement
  → 01-requirement →[gate: completeness]→ 02-context → 03-analysis
  → 04-plan →[gate: plan]→ 05-generate (cases → automation) →[gate: coverage·rules·dedup]
  → 06-review →[gate: locators·assertions·automation-review]→ 07-execute
  → 08-analyze (triage + bounded self-heal) → 09-report → 10-learn
                                              →[gate: human sign-off]
```

## Principles (see `../governance/policy/POLICY.md`)

1. **Gate between stages.** Nothing advances until its exit gate returns `pass`. Gates are
   executable validators in `../governance/validation/`, not prose.
2. **Provenance required.** No AI output is trusted without a cited source — Jira AC,
   `knowledge/locators`, a live probe, or a trace signal.
3. **Orchestrator owns the flow.** It writes the run manifest, enforces gates, honors a
   token/cost budget, and resumes from the last good checkpoint.
4. **Quarantine, never mask.** Self-healing (in `08-analyze`) is bounded; unresolved failures
   are quarantined, not silenced.

## Layout

| Path | Role |
|---|---|
| `NN-<stage>/README.md` | one stage — responsibility, I/O, owner agent, exit gate |
| `06-review/validators/<name>/` | doc for each executable validator (code in `governance/validation/`) |
| `schemas/` | inter-stage artifact contracts (feature-spec, manual-cases, resolved-cases) |
| `scripts/` | one-time procedures (e.g. harvest-screen) |

Agents (sources) live in `../agents/`, skills in `../skills/`, the runtime engine in
`../framework/`, verified locators in `../knowledge/locators/`, per-run artifacts in
`../workspace/<TICKET>/`, and the policy + gates in `../governance/`.
