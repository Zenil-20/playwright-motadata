---
name: boundary-value-generator
description: Generate boundary-value rows for ObserveOps constrained inputs — discovery ports (1–65535), retry counts, CSV target limits (512/CSV), profile-name length/uniqueness, policy thresholds — and emit them into tests/data/*.csv so the data-driven suite exercises the edges. Use when a screen doc's Validations/Edge Cases section names a numeric or length limit.
---

# Boundary Value Generator (ObserveOps)

Most ObserveOps discovery/policy bugs cluster at input edges: a port of `0` or `65536`, a CSV that
approaches the **512-devices/CSV** consolidation limit, a threshold at exactly its trigger value. Boundary
Value Analysis (BVA) turns each documented limit into the informative triplet — **at, just-below,
just-above** — as CSV rows the single data-driven scenario runs. This is how we satisfy the `coverage`
gate's boundary requirement (`governance/validation/coverage.js` warns when the suite has "no obvious
boundary scenario") with minimal rows.

## When to use / When NOT
- **Use when:** a screen doc §8 Validations or §11 Edge Cases names a numeric range, a length, a count, or
  a "must be unique" rule; a policy defines a threshold/duration; you need the ±1 rows around each limit.
- **Do NOT use for:** which-values-interact coverage (that is `pairwise-test-generator`); malformed/reject
  inputs like `; DROP TABLE` or a bad IP format (that is `negative-test-generator` — though the boundary
  *reject* side, e.g. port 65536, overlaps and both may cite it).

## Where the boundaries come from (cite these)
Read the target screen doc's **§8 Validations** and **§11 Edge Cases** — that is the input, never assumed
limits. Example, `knowledge/product/Settings/network-discovery/network-discovery-profiles-create.md`:
- **Ports numeric** — SNMP 161 / SSH 22 / Telnet 23 / Oracle 1521 defaults; §8 TODO names the range
  **1–65535** → triplets `0 / 1 / 2` and `65534 / 65535 / 65536`.
- **Retry Count** — required numeric (§4) → `0` and a sane upper edge.
- **CSV targets** — §11 + Known Bugs: **512 devices/CSV** consolidation limit → `511 / 512 / 513`.
- **Discovery Profile Name** — required, **must be unique**, length TODO(§8) → empty / 1-char / max-length /
  max+1, plus a duplicate-of-existing name (uniqueness boundary).
- **IP/Host** — IPv4/IPv6 accepted (§8) → smallest/largest octet, `::`/full IPv6 as format edges.
For policy screens, take the threshold/severity/duration limits from that screen's §4/§8.

## Procedure
1. **Extract limits** from the screen doc §8/§11 (min, max, length, count, uniqueness). Record the citation.
2. **Apply the BVA triplet** per limit: boundary, boundary−1, boundary+1; mark each row's expected side
   (valid vs. invalid — invalid rows carry a `verify_text` asserting the rejection/error).
3. **Emit as CSV rows** into `tests/data/discovery-devices.csv` (or the relevant policy matrix), reusing the
   `*_env` convention; declare any new env var in `.env.example`.
4. **Include the type/uniqueness edges** the docs call out — empty required field, duplicate profile name,
   port out of range, non-numeric port, CSV at the 512 limit.
5. **Report** which §8/§11 items are now covered so the plan/`coverage` gate can trace them.

## Rules & anti-patterns
- **Test the edge, not the middle** — a port=161 (default) row proves nothing about 0 or 65536.
- **Both sides of every boundary** — pair each valid edge with its adjacent invalid one (511-valid ↔ 513-invalid).
- **Boundaries come from the docs** — cite §8/§11; do not hardcode a limit the screen doc marks TODO —
  instead flag the TODO so it gets a real value before the row is trusted.
- **Uniqueness & emptiness are boundaries too** — duplicate name and blank-required-field are first-class edges.
- **Rows, deterministic, secret-free** — same env-var convention as every other matrix row.

Adapted from qaskills/seed-skills/boundary-value-generator
