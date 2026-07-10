# Pipeline Policy — Token Economy & Anti-Hallucination

Cross-cutting rules every agent obeys. The orchestrator enforces them; each agent's system prompt restates the ones it owns.

---

## A. Anti-Hallucination (where the system can lie, and the guardrail)

| Risk point | How it hallucinates | Hard guardrail |
|---|---|---|
| **Requirement invention** (jira/figma → spec) | thin ACs get "filled in" with plausible-but-wrong behavior | `completeness.score`; thin tickets GATE for human input; every AC keeps `source_text`; manual-author emits `open_questions` instead of inventing |
| **Locator fabrication on conditional UI** | resolver emits a confident locator for a control that isn't present | `count()===1` probe against the SEEDED state; absent control → `not-found`, never synthesized from expected shape |
| **Positional-XPath rot** | `//div[13]//span[1]` passes today, breaks on layout change | `confidence: reject` — banned from emit and from cookbook; must re-scope |
| **Flow inference** (figma) | missing prototype links → invented transitions | inferred edges tagged `source: figma:inferred`; never treated as fact |
| **Expected-string drift** | toast/label authored from memory ≠ live text | `expected.source` tag; `inferred` strings verified against live app / figma copy |
| **Triage misclassification** | flaky called "bug" or bug called "flaky" | each verdict REQUIRES cited trace evidence; `product-bug` forbidden without error-toast/non-2xx/wrong-state |
| **Green-washing** | weakening an assertion to force pass | forbidden; exhausted heals → `quarantined`, never deleted/loosened |

**Golden rule:** every factual claim traces to a source — a Jira line, a Figma node, a verified probe, or a trace artifact. No source → flag, don't fabricate.

---

## B. Token Economy (maximize useful AI per token)

1. **Pointers, not payloads.** Agents exchange file paths + ids. Only the consumer reads. Never relay artifact bodies through the orchestrator.
2. **a11y tree, never raw HTML.** ~10x smaller, role-accurate. HTML only as a last resort, scoped to one container.
3. **Cookbook as RAG.** Grep the one screen needed; never load the whole cookbook (it will grow to hundreds of screens).
4. **Discard exploration context.** The explorer's snapshots die inside its sub-agent; only `{screen,control,locator,confidence}` returns.
5. **Diff-only triage.** Feed `error-context.md` + failing action + network status — not full traces, never screenshots/video.
6. **Tiered models.** Haiku: jira/figma/spec-writer (mechanical). Sonnet: resolver/triager/state (judgment). Opus: only the single synthesis step. Target ~70% Haiku calls.
7. **Prompt-cache the static prefix.** Each agent's SKILL/system prompt is stable — cache it; chained calls inside the 5-min TTL pay the big prefix once. Biggest single lever for a multi-agent loop.
8. **Hard artifact size caps.** feature-spec ≤2KB, ticket.json ≤2KB, figma.json ≤3KB, ≤500B per manual step. Caps force compression.
9. **Batch within a stage.** One explorer login resolves all of a case's locators; one Agent message fans out independent cases.
10. **Resume, don't redo.** run-manifest skips `done` stages with matching input hashes.

---

## C. Senior-SDET invariants (quality bar)

- **Determinism over cleverness** — seeded data, no `Date.now()` in assertions, stable order.
- **Idempotency** — every create-flow survives a re-run (skip-if-exists / race-duplicate).
- **State is declared and verified** — no test runs against unknown state.
- **Traceability is unbroken** — AC → case → step → spec → result; orphan tests are deleted.
- **Smart waits only** — no `networkidle`, no blind `waitForTimeout`; poll for state.
- **Fail loud, quarantine honestly** — never mask a red to ship a green.
- **Risk-based order** — smoke first, edges last; fail fast on release-blockers.
