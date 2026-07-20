---
name: test-data-factory
description: Build and maintain ObserveOps device/credential test-data matrices — the CSV rows in tests/data/*.csv keyed to .env vars — so data-driven discovery/policy specs get valid, reproducible, secret-free inputs. Use when adding a device type, credential, or policy-threshold row, or when a data-driven run fails on missing/placeholder data.
---

# Test Data Factory (ObserveOps)

In ObserveOps we do **not** build faker-style object factories. Our "factory" is the pair
`tests/data/*.csv` (the row matrix, committed) + `.env`/`.env.example` (the per-environment values,
`.env` gitignored). One data-driven scenario iterates the CSV; each row names **env vars** rather than
literal IPs/passwords. This keeps secrets out of git and lets the same suite run against any lab.
That is the "max coverage, min automation" contract: one scenario × many rows.

## When to use / When NOT
- **Use when:** onboarding a new device type or credential to `discovery-devices.csv`; adding a policy
  threshold / discovery-field row; a data-driven run skips or fails because a row points at an empty or
  placeholder env var; you need a deterministic, secret-free input set for a discovery/policy spec.
- **Do NOT use for:** inventing device IPs/passwords (a blank env var is a *precondition gap* for
  `seed-data`, not something to fabricate); resolving locators (that is `motadata-explorer`); writing the
  spec (that is `motadata-spec-writer`). Never commit a real credential to a CSV or `.env.example`.

## The two matrices (cite these)
- **`tests/data/discovery-devices.csv`** — the device × credential matrix. Columns:
  `key, category, subtype, profile_name, ip_env, cred_type, community_env, user_env, pass_env, port_env,
  instance_env, test, verify_text, run`. Every `*_env` cell is the **name of a variable in `.env`**, never
  a literal. `cred_type` ∈ `{snmp_v2c, ssh, userpass}` drives which credential columns apply
  (SNMP → `community_env`; SSH/userpass → `user_env`+`pass_env`; DB → +`port_env`/`instance_env`).
  `run=yes/no` gates whether the row executes; `verify_text` is the post-provision assertion.
- **`tests/data/discovery-form-structure.csv`** — the field/locator contract for the create-profile form
  (`check, kind, target, locator, expected`): profile name, IP/Host, DB service name, Port, Create
  Credential, Save and Run. This is the schema a device row is filled into.
- **`.env.example`** — the committed template. Every `*_env` referenced by a CSV row MUST exist here
  (with a safe/blank default) so a fresh clone documents exactly what the lab must supply. App creds live
  under `Motadata_Aiops` / `Motadata_Username` / `Motadata_Password`.

## Procedure (adding a factory row)
1. **Pick the screen contract.** Read the target screen doc in `knowledge/product/...`, e.g.
   `Settings/network-discovery/network-discovery-profiles-create.md` §4 Components + §8 Validations —
   it tells you which fields the device type renders (Linux → Port only; AWS → Regions; Database →
   Type/Service/Port). The row's columns must match that type's required (`*`) fields.
2. **Add the CSV row**, one per device/credential/threshold variant. Name each value column `<Thing>_env`
   and choose `cred_type` from the observed protocol. Set `test`/`run`/`verify_text` deliberately.
3. **Declare every env var** in `.env.example` with a blank or non-secret default, grouped by category
   (Wireless/Databases/Virtualization/Network) as the file already is. Real values go only in local `.env`.
4. **Keep it deterministic & minimal** — one row overrides only the columns that differ from the type's
   defaults (default ports SNMP 161 / SSH 22 / Oracle 1521 come from the screen doc, not the row).
5. **Hand off** — `seed-data` verifies the env vars resolve and the precondition state exists before a run;
   it fails loudly on a blank var rather than masking it.

## Rules & anti-patterns
- **No literal secrets or IPs in CSVs** — every value is an env-var name; the CSV is committed, `.env` is not.
- **Every `*_env` must be documented in `.env.example`** — an undeclared var is an unreproducible test.
- **Row ↔ screen-doc parity** — the columns a row fills must satisfy that device type's `*` validations in
  the screen's §8; don't add a Port column to a type that has no Port.
- **`run`/`test` are the gate, not code edits** — disable a variant by `run=no`, never by deleting the row
  (keeps the matrix as living documentation).
- **A blank env var is a precondition gap** — surface it to `seed-data`; never invent a value to make a row pass.
- **Provenance** — when a new device type comes from a screen doc, cite the screen in the PR/commit.

Adapted from qaskills/seed-skills/test-data-factory
