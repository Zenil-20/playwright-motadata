---
name: risk-based-testing
description: Prioritize ObserveOps test coverage by risk — weighting known-issue-heavy areas (discovery credentials, SNMP transport, timeouts) and mandating the positive/negative/boundary/security dimensions per in-scope area — as the input playbook for the mt-planner agent. Use at plan time to decide what to cover first and why, traceable to acceptance criteria.
---

# Risk-Based Testing (ObserveOps)

Risk-based testing in ObserveOps is not a generic strategy doc — it is the **playbook the `mt-planner`
agent runs** (`agents/planner/prompt.md`, stage `04-plan`). The planner converts the analyst's
scenarios/risks into a coverage plan that spans four **mandated dimensions** (positive, negative, boundary,
security) per in-scope area, cites product rules, and blocks if a dimension is missing. This skill tells
the planner *how to weight risk* so smoke → high → edge ordering reflects where ObserveOps actually breaks.

## When to use / When NOT
- **Use when:** you have analysis (stage 03) done and need the prioritized, AC-traced coverage plan before
  any cases exist; you're tuning what the planner front-loads for a module.
- **Do NOT use for:** decomposing the requirement (that is the analyst); authoring cases
  (`testcase-generator`); resolving locators (`motadata-explorer`). This skill plans coverage; it writes no steps.

## Risk signals (cite these)
The planner reads these; weight risk from them:
- **`knowledge/known_issues/customer-issue-kb.md`** — real PQD/MOTADATA tickets. Any area with a known-issue
  hit becomes an automatic **high-priority** item. For discovery, §10 of the create-profile doc alone lists:
  credential/permission failures (13×, the single biggest source), SSH/TLS algorithm mismatches, SNMP
  transport (NAT/timeout), slow-target internal timeouts, scheduler overload — these dominate the risk map.
- **Screen doc §9 Business Rules / §11 Edge Cases / §8 Validations** — source of concrete negative & boundary
  items (device-type-specific fields, NCM on/off, 512/CSV limit, port ranges).
- **Screen doc §5 Permissions** — the security/RBAC dimension (permission-denied on Settings screens).
- **Change/blast radius** — Settings (Discovery, Policies, RBAC) provisions monitors downstream, so a
  discovery regression cascades → weight it above a read-only Explorer view.

## Risk scoring (ObserveOps weighting)
Rank each candidate area by `impact × likelihood`:
- **Impact** — does it block monitoring onboarding (discovery/credentials/collector) or corrupt alerting
  (policy thresholds)? Those are top impact. A dashboard cosmetic is low.
- **Likelihood** — proportional to known-issue count for that area (credential/SNMP paths score highest).
Then order: **smoke** (must-pass onboarding happy path) → **high** (known-issue-adjacent negatives/RBAC) →
**edge** (rare boundaries). Record a one-line `rationale` + `source` per item, as the planner requires.

## Procedure (feeding mt-planner)
1. **Fix the mandate** — the plan must include positive + negative + boundary + security **per in-scope area**;
   a missing dimension blocks (planner's `plan` gate).
2. **Mine risk signals** — pull known issues + §8/§9/§11/§5 for each in-scope screen; cite each.
3. **Score & order** by the weighting above; front-load credential/RBAC/timeout areas for discovery.
4. **Map to AC** — every plan item sets `traces_to`; flag any AC with zero coverage for the human gate.
5. **Self-check** — each dimension present per area; each item cited; no orphan items. Block loudly on a gap.

## Rules & anti-patterns
- **All four dimensions per area** — omission is a block, not a silent pass (mirrors the planner + `coverage` gate).
- **Provenance required** — every negative/boundary/security item cites a Business Rule, Edge Case,
  Permission, or known issue; no invented behavior.
- **Known-issue hit ⇒ auto high priority** — treat any `customer-issue-kb` match as at least high, often a
  mandatory boundary/negative case (e.g. wrong-protocol credential, SNMP-NAT).
- **AC-traceable or dropped** — orphan items are removed; uncovered ACs are surfaced, not hidden.
- **Plan, don't author** — this produces priorities and rationale, not test steps or locators.

Adapted from qaskills/seed-skills/risk-based-testing
