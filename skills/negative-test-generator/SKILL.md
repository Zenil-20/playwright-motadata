---
name: negative-test-generator
description: Generate ObserveOps negative test cases — invalid inputs, missing required fields, wrong-protocol credentials, RBAC permission-denied, injection in name/notify fields — so the coverage gate (governance/validation/coverage.js requires a negative scenario) passes and the suite proves the app rejects cleanly. Use for any discovery/policy/RBAC screen whose Validations/Edge Cases list rejections.
---

# Negative Test Generator (ObserveOps)

The `coverage` gate is explicit: `governance/validation/coverage.js` **errors** if the suite has "no
negative scenario" (matched by `/invalid|negative|error|reject|fail|unauthor|forbidden|denied|missing|
empty|wrong/i`). So every generated suite must carry negative cases — and in ObserveOps they are rich:
discovery rejects malformed IPs and out-of-range ports, Settings screens enforce RBAC (permission-denied),
credential profiles must match the target protocol, and free-text fields (profile name, Notify) are
injection surfaces. This skill turns each documented rejection into a negative case/row.

## When to use / When NOT
- **Use when:** authoring cases for any discovery/policy/RBAC screen; the `coverage` gate flagged a missing
  negative scenario; a screen doc §8/§11 lists reject conditions; you're covering Settings permissions.
- **Do NOT use for:** valid-edge coverage (that is `boundary-value-generator`); which-combinations coverage
  (`pairwise-test-generator`). The invalid side of a boundary (port 65536) is shared — cite it in both.

## The negative families (from the screen docs — cite these)
Read the target screen's **§5 Permissions**, **§8 Validations**, **§10 Known Bugs**, **§11 Edge Cases**.
For `Settings/network-discovery/network-discovery-profiles-create.md` these yield:
- **Missing required** — blank Profile Name / IP-Host / Collector / Credential Profile → save blocked (§11).
- **Format violations** — invalid IP, malformed IP Range/CIDR, malformed CSV (§11); non-numeric port.
- **Wrong-protocol / bad credential** — credential profile of the wrong protocol; read-only vs admin creds
  (§10 Known Bugs, PQD-30159/32697 — the single biggest ticket source) → discovery fails, asserted via `verify_text`.
- **Uniqueness** — duplicate profile name → rejected (§8/§11).
- **State-dependent** — NCM toggled ON→OFF: SSH/Telnet must NOT be required when OFF (§11).
- **RBAC / permission-denied** — non-admin/operator attempting create/run (§5) → forbidden. This is the
  security dimension the planner mandates for Settings screens.
- **Injection** — SQLi/XSS in Profile Name and the Notify free-text field → must be rejected or safely
  handled, never reflected. Pull the payload list from a maintained source, don't inline a stale one.

## Procedure
1. **Establish the valid baseline row** first (a passing `discovery-devices.csv` row for the device type).
2. **Vary one field to invalid at a time**, keeping the rest valid — so the failure is attributable.
3. **Emit each negative as a row/case**: invalid value + a `verify_text`/assertion for the *specific*
   rejection (error text / blocked save / permission-denied), not a generic "it failed".
4. **Cover the RBAC dimension** — at least one permission-denied case per Settings screen (§5), using a
   non-privileged login from `.env`.
5. **Assert no leak & no state mutation** — error must not echo the injection or expose internals, and a
   rejected save must leave no orphan profile (re-query the grid).
6. **Confirm the gate** — the suite blob must match the `coverage.js` NEG regex; verify before handoff.

## Rules & anti-patterns
- **A negative scenario is mandatory** — the `coverage` gate hard-errors without one; never ship a suite that fails it.
- **Assert the specific rejection** — which field, which error; `expect(failed)` alone is worthless.
- **One invalid field at a time** — multiple invalids mask which validation fired.
- **Provenance** — every negative case cites a §8 Validation, §11 Edge Case, §5 Permission, or §10 Known Bug;
  no invented rejection behavior (the planner and gates forbid it).
- **Injection payloads from a maintained list**, not a hardcoded stale set; assert non-reflection.
- **RBAC belongs here** — permission-denied is a negative case, and the mandated security dimension for Settings.

Adapted from qaskills/seed-skills/negative-test-generator
