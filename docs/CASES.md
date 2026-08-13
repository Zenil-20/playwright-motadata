# `cases` — Jira ID in, TFS test cases out

```bash
npm run cases -- MOTADATA-9593
```

Fetches the ticket, grounds itself in the shipped source, authors tagged manual test cases,
validates them, writes the TFS-import CSV, and **stops at a human gate**. Publishing into
TFS is a second, explicit command.

## Prerequisites

1. `.env` filled in — `JIRA_BASE_URL`, `JIRA_TOKEN`, `AZURE_*` / `TFS_*` (see `.env.example`).
2. `npm install`.
3. **A working `claude` subprocess.** Stage 3 shells out to `claude -p`, which reads credentials
   from disk — an interactive session that works in *your* terminal is not sufficient if the
   on-disk refresh token has expired. Verify with:

   ```bash
   echo "say OK" | claude -p
   ```

   If that reports `Failed to authenticate: OAuth session expired`, run `claude` and `/login`,
   or export `ANTHROPIC_API_KEY` in the shell you run `npm run cases` from. Stage 3 detects this
   case and tells you exactly this — it does not fail with a bare exit code.

## The seven stages

| # | Stage | Deterministic? | What it does |
|---|---|---|---|
| 1 | fetch | yes | Jira REST v2 → `workspace/<KEY>/ticket.json`, plus a `completeness.gaps` list of what the ticket does *not* say |
| 2 | context | yes | Keyword-matches `knowledge/product`, `knowledge/locators/catalog`, `business_rules`, `known_issues` and `tests/**` to the ticket |
| 3 | author | **no** | One `claude -p` call with the KGs + matched files → `manual-cases.json` |
| 4 | validate | yes | Schema, taxonomy, grounding tags, duplicate titles, step byte cap. **Fails loud — nothing is emitted or published on error** |
| 5 | emit | yes | The 10-column CSV: `ID, Work Item Type, Title, Test Step, Step Action, Step Expected, Area Path, Assigned To, State, Tags` |
| 6 | gate | yes | Prints counts by tag and by grounding source, the unverified-step count, and the ticket gaps → `coverage-gate.md` |
| 7 | publish | yes | `ado-publish` → suite `MOTADATA-<id>` under `AZURE_TEST_PLAN_ID`. Idempotent |

Stage 3 is the only non-deterministic stage. It runs through the **Claude Code CLI** rather than
the raw API on purpose: the CLI already has `motadata-kg` and `ui-kg` wired up for this project
and uses the existing login, so there is no `ANTHROPIC_API_KEY` and no MCP client code to
maintain. Swap it for a direct API call without touching stages 1, 2 and 4–7.

## Flags

| Flag | Effect |
|---|---|
| *(none)* | Author → validate → emit → gate, then **stop**. Nothing reaches TFS |
| `--publish` | Also run stage 7 |
| `--dry` | Run stage 7 in dry mode — maps and validates against the live plan, writes nothing |
| `--resume` | Skip stages 2–3 and reuse the existing `manual-cases.json`. This is how you publish after reviewing |
| `--limit N` | Publish only the first N cases (smoke test against a real plan) |
| `--model <id>` | Model for the authoring call |
| `--area <path>` | Override `AZURE_AREA_PATH` |
| `--timeout <min>` | Authoring timeout, default 30 |

## The normal loop

```bash
npm run cases -- MOTADATA-9593                      # author + review
npm run cases -- MOTADATA-9593 --resume --publish    # after you've read the gate
```

## Outputs

Everything lands in `workspace/<KEY>/`:

| File | What |
|---|---|
| `ticket.json` | Normalised Jira: description, figma links, attachments, linked issues, gaps |
| `context-bundle.json` | Which knowledge/test files were matched, and the keywords used |
| `authoring-prompt.md` | The exact prompt sent to stage 3 — reproducible |
| `manual-cases.json` | The cases. Source of truth for both the CSV and the publish |
| `<KEY>_testcases.csv` | TFS-import ready |
| `authoring-report.md` | What the authoring stage reported: defects found, gaps hit |
| `coverage-gate.md` | The gate artifact — read this before publishing |

## The taxonomy

Tags are validated against [`knowledge/taxonomy/scenario-taxonomy.json`](../knowledge/taxonomy/scenario-taxonomy.json).
An unknown tag fails the run. Every case needs at least one **primary** tag —
`Functional`, `Impacted`, `Edge`, `Regression`, `Negative`, `Security`, or `Non-Functional` —
because a bare surface tag (`UI`, `API`, `Audit`, …) says *where* a case lands, not what kind of
check it is.

## Grounding — the part that matters

Every step carries a `source` telling you how far to trust its expected result:

| source | Meaning |
|---|---|
| `kg` | Read out of the shipped source via the knowledge graphs. Trust it |
| `doc` | `knowledge/product/**`, business rules, known issues |
| `catalog` | A real DOM sweep in `knowledge/locators/catalog` |
| `suite` | An existing spec under `tests/**` |
| `jira` | Stated verbatim in the ticket |
| `figma` | **Must** be confirmed against the ticket's Figma node before it can pass |
| `inferred` | Not verified anywhere |

The gate prints the `inferred + figma` step count as an explicit review queue. That number is
the honest measure of how much of the suite a human still has to confirm — a run that reports
0 unverified steps on a ticket with a Figma link is lying to you.

## Known limits

- **Attachments are not fetched.** A ticket whose real spec is a screenshot will be under-covered;
  the gate flags this.
- **Figma is not read.** Design-derived expectations come out `figma` and stay unverifiable until
  someone opens the design.
- **RBAC/API depth is bounded by what's in `knowledge/`.** Without a role×permission matrix and an
  endpoint list, those cases stay generic.
- **No AI-vs-human coverage diff yet.** If a tester already has cases for the same screen,
  pull them with `npm run tfs:import` and diff titles before treating a suite as complete.
