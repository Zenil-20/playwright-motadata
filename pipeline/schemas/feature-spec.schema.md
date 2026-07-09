# feature-spec.md — schema

Output of the Ingest/Synthesis stage. **Hard cap: 2KB.** The single broad-reasoning artifact; everything downstream reads this, not raw Jira/Figma.

```markdown
# Feature: <name>
Jira: <KEY>   Figma: <file_key>

## Goal
<1-3 sentences: what the user can do when this ships, and why.>

## In-scope screens
- <Canonical screen name>   # MUST match cookbook screen keys
- ...

## User journeys
1. <happy path, terse step list>
2. <secondary path>

## Edge cases
- <validation error, duplicate, async timeout, permission, ...>

## Data dependencies
- <device IPs, credentials, pre-existing resources — as {{placeholders}}>

## Out of scope
- <explicit non-goals>
```

Rules:
- Screen names are canonical (cookbook keys). Unknown screens → flag for harvest.
- No locator/UI detail here — that's the resolver's job.
- No secrets — placeholders only.
