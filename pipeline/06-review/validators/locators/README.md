# Validator · locators

Executable validator invoked by the validation gatekeeper. Returns `{ pass, score, evidence[] }`.
The orchestrator blocks stage advance on `pass=false`. No AI output is trusted without a cited
source (Jira AC · knowledge/locators · live probe · trace signal).

**Implementation:** `governance/validation/locators.js` — registered in a gate in `governance/validation/index.js`; run via `npm run test:gates`.
