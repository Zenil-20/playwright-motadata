---
name: prd-gate
description: Requirement/PRD completeness pre-check for Motadata ObserveOps. Wraps governance/validation/requirement.js via runGate('01_requirement', ctx) to return PASS/BLOCK plus the exact missing acceptance-criteria fields BEFORE any test authoring. Use the moment a Jira/PRD lands and before writing a single case — a thin ticket the AI "fills in" produces confident, wrong tests.
---

# PRD Completeness Gate (stop-the-line)

Hard gate that runs **first**, right after requirement ingestion and before any authoring. It scores
the requirement's acceptance criteria for testability and either lets the pipeline proceed (**PASS**)
or halts it (**BLOCK**) with the precise gaps to send back to the author. It never invents the
missing detail — it demands it.

> A thin ObserveOps ticket ("Discovery should work better") that AI fleshes out yields tests that
> assert nothing real. Block it instead.

## When to use
- A Jira/PRD ticket has just been ingested and you're about to author cases for it.
- Re-running after the author edits the ticket (the gate is idempotent — gaps flip green cleanly).

## When NOT
- After the gate already returned PASS this run and nothing changed.
- To judge already-authored cases/specs — those are the `05_testcases` / `07_automation` gates.

## Procedure

1. **Build the ctx** the gate needs — a `requirement` object with cited, testable acceptance criteria:

   ```js
   import { runGate, formatGate } from '../../governance/validation/index.js';

   const ctx = {
     requirement: {
       key: 'MOTADATA-9201',
       title: 'SNMP v3 credential on Discovery provisions the monitor',
       acceptance_criteria: [
         { id: 'AC1', text: 'When a valid SNMP v3 credential is applied, a "Saved" toast appears',
           source: 'MOTADATA-9201#desc' },
         // ...
       ],
     },
   };
   const gate = runGate('01_requirement', ctx);   // → { stage, label, pass, results }
   console.log(formatGate(gate));
   ```

   Or from a file via the CLI: `node governance/validation/cli.mjs 01_requirement ctx.json`
   (exits 1 on BLOCK, so it blocks a CI job).

2. **Read the verdict.** `gate.pass === false` ⇒ **BLOCK**. The underlying
   `validateRequirement` (`governance/validation/requirement.js`) flags, with cited evidence:
   - no `title`,
   - **zero acceptance criteria** (requirement is not testable),
   - an empty AC,
   - **ambiguous/untestable wording** — it rejects `etc | and so on | tbd | somehow | as needed | appropriate | handle it | works fine`,
   - any AC missing provenance (`source`) via `checkProvenance`.

3. **For ObserveOps UI features, demand the observable outcome.** Every AC "Then" must be a visible
   ObserveOps signal, not internal state:
   - ✅ a "Saved" toast, the Kubernetes icon rendered, a discovered object appearing in Inventory,
     a "No data found" empty state clearing.
   - ❌ "the monitor is persisted", "the profile is created" (no named UI signal).
   Also require the exact navigation path (e.g. Settings → Discovery) and the named controls
   (button "Save", dropdown "Framework") so locators are resolvable later.

4. **Emit the gate report** using `formatGate(gate)`: PASS/BLOCK, per-item evidence, and one precise,
   meeting-free question per blocking gap. On **BLOCK**, halt — return the questions to the PRD author
   and do **not** invoke any authoring skill.

## Rules & anti-patterns
- **Never fabricate** the missing AC, precondition, or control — the gate only finds and names gaps.
- **One precise question per blocking gap**, answerable without a meeting.
- **Cite evidence**: every present item points at a source sentence; every gap names the absent thing.
- **Idempotent**: re-running after edits flips items green with no side effects.
- Treat a non-observable "Then" as a missing verification signal for that AC and demand it.

---
Ports the observeops-qa `prd_completeness_gate` skill (GATE.md checklist) to our JS `runGate('01_requirement')`.
