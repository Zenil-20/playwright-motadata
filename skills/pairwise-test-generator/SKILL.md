---
name: pairwise-test-generator
description: Reduce ObserveOps discovery/policy combinatorial explosion to a minimal all-pairs row set that still covers every value pair, then emit it as rows into tests/data/*.csv. Use when a discovery form (IP-mode × protocol × credential-type × device-type) or a policy config has too many combinations to test exhaustively.
---

# Pairwise Test Generator (ObserveOps)

The Create Discovery Profile wizard is a combinatorial monster: addressing mode
(**IP/Host · IP Range · CSV · CIDR**) × device type (Server/Cloud/Network/Database/…) × credential type
(`snmp_v2c` / `ssh` / `userpass`) × the type-specific toggles (NCM on/off, Ping Check, Interface
Discovery). Exhaustive coverage is hundreds of runs. Pairwise (all-pairs) covers **every value pair at
least once** in ~1 dozen — the concrete expression of our "max coverage, min automation" rule. The output
is not a new test file: it is **rows appended to `tests/data/discovery-devices.csv`** that the single
data-driven discovery scenario iterates.

## When to use / When NOT
- **Use when:** a discovery/policy screen has ≥3 parameters with multiple values each and exhaustive rows
  would bloat the matrix; you need the smallest row set that still hits every pair; you're expanding
  coverage of a screen without adding automation.
- **Do NOT use when:** the total combination count is small (<~15 — just enumerate them); the interaction
  you're chasing is a known **3-way** bug (raise strength or add a targeted row); you're testing a single
  field's edges (that is `boundary-value-generator`) or its rejects (that is `negative-test-generator`).

## Parameters, from the screen docs (cite these)
Pull the parameter list and legal values from the screen doc, not from guesswork. For discovery:
`knowledge/product/Settings/network-discovery/network-discovery-profiles-create.md` §3–4 gives the axes:
- **addressing_mode** ∈ {IP/Host, IP Range, CSV, CIDR}  (§3, the 4 radios)
- **device_type** ∈ {Linux, Windows, Network, AWS, Database, VMware, Wireless, …}  (§2 left-nav catalog)
- **cred_type** ∈ {snmp_v2c, ssh, userpass}  (mirrors `discovery-devices.csv`)
- **ncm** ∈ {on, off}  (§9 — ON adds SSH+Telnet ports)
- toggles: **ping_check**, **interface_discovery**, **run_topology** (§4 defaults)

For policies, take thresholds/operators/severity from that policy screen's §4/§8.

## Constraints (model these — they come from Business Rules §9)
Real ObserveOps combinations are illegal; encode them so the generator never emits an impossible row:
- **AWS/cloud has no IP/Host** → `device_type=AWS` excludes `addressing_mode ∈ {IP/Host,IP Range,CIDR}` (uses Regions).
- **SNMP pairs with network/wireless**, not with Database (`cred_type=userpass`+port there).
- **NCM=on only where a CLI protocol exists** (SSH/Telnet) — not for cloud/DB types.
- **Linux uses Port-only** (no SNMP/SSH/Telnet split) — see §4 Linux layout.

## Procedure
1. **List axes + values** from the screen doc §3–4; **list constraints** from §9. Cite the screen.
2. **Generate all-pairs at strength 2** over the legal (constraint-satisfying) space; bump critical
   subsets (auth/credential paths) to strength 3 only where a known issue justifies it.
3. **Emit as CSV rows** — each generated combination becomes a `discovery-devices.csv` row: map
   `device_type→subtype/category`, `cred_type→cred_type` + the matching `*_env` columns, addressing mode
   into `profile_name`/`ip_env` semantics; declare any new env var in `.env.example`.
4. **Report coverage** — state pairs covered / total and the reduction vs. exhaustive in the PR, so the
   `coverage` gate and reviewers can see the trade-off.
5. **Regenerate, don't hand-edit** — when a new device type or mode is added, re-run; manual row
   additions silently break the pair guarantee.

## Rules & anti-patterns
- **Rows, not a parallel test file** — pairwise output feeds `tests/data`, iterated by the one scenario.
- **Constraints are mandatory** — an AWS-with-IP/Host or SNMP-Database row is a false failure that erodes trust.
- **Pairwise ≠ sufficient** — it finds pair interactions; still add boundary rows (`boundary-value-generator`)
  and reject rows (`negative-test-generator`) so the `coverage` gate's negative/boundary check passes.
- **Deterministic** — seed the generator; the same axes+constraints must produce the same row set.
- **Provenance** — every axis/constraint cites the screen doc §; no invented parameter values.

Adapted from qaskills/seed-skills/pairwise-test-generator
