# knowledge/product — per-screen knowledge (RAG)

One folder per **module**, one file per **screen** (11 sections: Purpose, Navigation, Actions,
Components, Permissions, Entry, Exit, Validations, Business Rules, Known Bugs, Edge Cases).

## Coverage
**176 screens** across the product. **Curated** (verified): `Global/Login.md`, `Dashboards/Dashboard.md`.
**Generated** (grounded, `status: generated`): the rest — Navigation + Components filled from the live
Vue-router sweep (`../locators/catalog/*.json`); reasoning sections marked `TODO(source: KG/docs)`.
**Settings** carries the bulk — 133 screens across 21 categories (policy-settings, system-settings,
monitoring, users-settings, integration, network-discovery, …). Full route map: `_ROUTES.md`.

## Regenerate
`npm run gen:screens` (deterministic, idempotent; never overwrites curated files). To promote a
generated screen to curated: fill its TODO sections, flip `status:` to `verified`, and it's exempt
from the sweep. Related customer issues: `../known_issues/customer-issue-kb.md`.
