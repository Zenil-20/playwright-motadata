# MOTADATA-9593 — Coverage Summary (human gate)

**Ticket:** Credential Profile UI for Microsoft Graph API Mail Server Does Not Match Figma Design
**Type:** Bug · **Component:** UI · **fixVersions:** 10.0.1, 8.2.8 · **Reporter:** ansh.garg
**Published:** plan 79797 (Sprint 8.2.8) → suite `MOTADATA-9593` (id 80229) → **77 cases / 161 steps**

## By tag
| Tag | Cases |
|---|---|
| Negative | 23 |
| Regression | 20 |
| Functional | 19 |
| UI | 16 |
| Edge | 14 |
| Security | 12 |
| API | 11 |
| Impacted | 9 |
| Non-Functional | 4 |
| Audit | 2 |
| Reports | 2 |
| Workflow | 1 |

## Grounding of the 161 step-expectations
| Source | Steps | Meaning |
|---|---|---|
| `kg` | 108 | read out of shipped source via ui-kg |
| `doc` | 20 | `knowledge/product/**` |
| `inferred` | 29 | **not verified — needs live app or Figma** |
| `figma` | 2 | **must be confirmed against node-id 2610-47977** |
| `jira` | 2 | the two defects as reported |

## What the KG gave us (hard facts, not guesses)
From `mail-server-settings.vue` / `helpers/mail-server-settings.js` / `mail-server-api.js`:
- Field order: SMTP Server → Use Proxy Server → Security Type → SMTP Server Port → Authentication Type → From Email → [Authentication Requires] → [User Name] → [Password] → [Credential Profiles]
- Security Type = `None | SSL | TLS`; Authentication Type = 2 options (`basic | oauth`) — total 5 radios, matching the locator catalog
- **Authentication Requires** is hidden when type is `oauth`; **Password** renders only when `enableAuth && basic`; **User Name** renders when `enableAuth || oauth`; **Credential Profiles** renders only when `oauth`, is required, `allow-create`, filtered to protocol `HTTP_HTTPS`
- Payload: `mail.server.{host,port,sender,protocol,authentication,username,password}`, `proxy.enabled`, `mail.server.credential.profile`
- **Sentinel `10000000000002`** means "not OAuth". Auth type is *derived* from this id on read — the basis of 6 regression cases
- Endpoints: `GET /settings/mail-server-configuration`, `PUT /settings/mail-server-configuration/{id}`

## Defects found by static review, before any execution
1. **Duplicate DOM id `security-type-id`** — on both the Security Type *and* Authentication Type radio groups (TC-010).
2. **Duplicate DOM id `smtp-server-port-id`** — on both the Use Proxy Server form item *and* the SMTP Server Port field (TC-011).
3. **From Email is not required in source** (`rules="email"` only) while the product doc marks it mandatory (TC-032) — needs a product decision.
4. **OAuth still sends `username`/`password` keys** although the Password field is hidden (TC-060) — a stale/empty secret may be written. Needs a contract decision.

## Gaps — Jira description is incomplete (gate item 1)
The ticket says the Grant Type options are wrong but **never states what the correct options are**. Blocking gaps:
- **Exact Grant Type option list + order + labels** — only Figma node-id 2610-47977 defines this. TC-005 will remain unverifiable until someone reads the design.
- **Alignment tolerance** — "UI alignments are inconsistent" has no measurable acceptance. TC-004 needs a pass/fail rule (px tolerance, or a visual-diff baseline).
- **Graph API credential field set** — Tenant ID / Client ID / Client Secret are assumed; not enumerated in the ticket and absent from the KG snapshot (it predates the feature). Affects TC-017, TC-035, TC-036.
- **Authentication Type option labels** — source uses keys `basic`/`oauth`; the display labels are unconfirmed.
- **No screenshot in the fetched payload** — the ticket references an attachment; it was not pulled.

## AI-vs-human coverage (gate item 2)
Not yet diffed. Plan 79797 holds a pre-existing `MOTADATA-9057` suite; no prior `MOTADATA-9593` cases existed, so this suite is **100% AI-authored with no human baseline to compare against**. If a tester has cases elsewhere for this screen, pull them with `tfs:import` and diff titles before treating this as complete.

## Not covered, deliberately
- Real Graph API token exchange against a live Azure tenant (needs tenant credentials).
- Actual email delivery assertions beyond "arrives" (no mailbox automation configured).
- Visual-diff baselining — needs a committed Figma export.

## Regenerate
```
node workspace/MOTADATA-9593/build_suite.mjs
```
Rewrites `manual-cases.json` + `MOTADATA-9593_testcases.csv`. Re-publishing is idempotent — existing titles are skipped.
