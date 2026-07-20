# Screen authoring guide (for deep, grounded screen docs)

Turn a `status: generated` screen file into a deep, my-profile-quality doc — **grounded, never
fabricated.** The exemplar is `knowledge/product/Settings/my-account/my-profile.md` — match its depth,
tone, and honesty.

## Grounding sources (use in this order)
1. **The screen's own file** — Navigation + Components are already filled from the sweep; keep them.
2. **Catalog JSON** — the file's frontmatter `sources:` line cites `knowledge/locators/catalog/<slug>.json`.
   Read it for the REAL controls: `labels`, `inputs` (name/id/placeholder), `buttons`, `buttonIds`,
   `gridHeaders`, `tabs`, `selects`, `switches`, `radios`, `checkboxes`, `route`.
3. **Screenshot (if one exists)** — `knowledge/screenshots/`. Match by keyword to the screen/route
   (e.g. `alerts.png`, `linux discovery.png`, `metric explorer.png`, `topology.png`, `NCCM.png`,
   `netroute.png`, `report.png`, `SLO.png`, `log.png`, `Settings1..6.png`). `ls` it and Read the match.
   A screenshot lets you write Purpose/Actions/Validations at full depth — use it when present.
4. **Known Bugs** — `knowledge/known_issues/customer-issue-kb.md`. Search it for issues that mention
   this screen/module; cite version + issue + workaround. If none apply, write "None recorded for
   this screen." **Never invent bugs.**

## The 11 sections (exact order, like my-profile.md)
1. **Purpose** — business objective, screen description, primary use cases, who uses it, dependencies.
2. **Navigation** — menu path, breadcrumb, alternates, URL (the real `route`).
3. **Actions** — derive from the buttons/controls (CRUD, toolbar, bulk, export, filter, run…).
4. **Components** — keep/expand the captured controls (table, form, dialogs, dropdowns, tabs, charts).
5. **Permissions** — RBAC (Admin/Operator/Viewer), license/module gating. Generic-but-reasoned; mark
   specifics `TODO(source: KG/docs)`.
6. **Entry Conditions** — preconditions (logged in, module/license enabled, data seeded, collector up).
7. **Exit Conditions** — success signals (toast, row added, status change, audit entry) — good assertions.
8. **Validations** — field validations from inputs/required markers/placeholders (`Must be unique`, etc.).
9. **Business Rules** — product logic (uniqueness, dependencies, defaults, "X requires Y"). Only what
   you can justify from the UI/kb; everything else `TODO(source: KG/docs)`.
10. **Known Bugs** — from `customer-issue-kb.md` (cited) or "None recorded."
11. **Edge Cases** — boundary/negative/timing conditions worth testing (derive from the controls).

## Honesty rules (non-negotiable)
- Ground every confident statement in the catalog, screenshot, or kb. Mark anything unverifiable
  `TODO(source: KG/docs)`. **Do NOT invent business rules, permissions, or bugs.**
- Keep the real control ids (e.g. `#save-run-btn-id`) so automation can use them.

## Frontmatter
Keep `screen/module/category/route/build`, set:
- `status: draft`  ← human/agent-authored, grounded, pending final KG verification (protects it from
  `npm run gen:screens`, which skips `draft`/`verified`).
- `sources:` add `screenshot` and/or `kb` when used.
- `verified: 2026-07-09`

Write with the Write tool (overwrite the file in place).
