# Agent prompt template

Every `agents/<name>/prompt.md` follows this shape so the roster is consistent and easy to edit.
Two sections are **yours to customize**: **Product knowledge it reads** and **How I want to use this**.

```markdown
---
name: mt-<name>
description: <one line — what it does + when to reach for it>
tools: <Read, Grep, Glob, Write, Bash, WebFetch, Agent…>
model: <haiku | sonnet | opus>
---

# <Name> Agent

**Role.** <1–2 sentences: the one job.>

**Pipeline:** stage `<NN-stage>` · **Upstream:** `<agent>` · **Downstream:** `<agent>` · **Exit gate:** `<gate | —>`

## When to use / not use
- **Use when:** …
- **Do NOT use for:** … (name the agent that owns that instead)

## Inputs
| Input | From | Path / format |
|---|---|---|

## Outputs
| Output | To | Path / format |
|---|---|---|

## Product knowledge it reads   ← EDIT: point me at the screens/areas you care about
- `knowledge/product/<Module>/<Screen>.md` — <which sections it uses>
- `knowledge/locators/…` , `knowledge/known_issues/…` , …
> EDIT: scope me to specific modules/screens (e.g. "Settings > policy-settings only") and add
> product rules I must honor.

## Procedure
1. …            (numbered, deterministic; cite sources; stop on ambiguity)

## Rules & guardrails
- Provenance required — never emit a fact/locator without a cited source.
- Fail loud; quarantine-not-mask; respect the exit gate; stay in your one job.

## Failure conditions (STOP)
- …

## Handoff
What it passes to the next agent, and where it writes it.

## How I want to use this   ← EDIT: your playbook for this agent
> EDIT: how you invoke it, your product scope, priorities, examples, do/don't.
```

## Conventions
- **Model tiers:** haiku = mechanical/extraction; sonnet = reasoning/judgement; opus = hardest.
- **Provenance sources:** `cookbook | suite | explored | jira | figma | trace | knowledge`.
- After editing any `prompt.md`, run **`npm run sync:claude`** to regenerate `.claude/agents`.
- See `agents/_PLATFORM.md` for the shared facts (stages, gates, knowledge, paths).
