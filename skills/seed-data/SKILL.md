---
name: seed-data
description: Prepare and verify the AIOps state a discovery/data-driven test needs before it runs — device rows, credentials, and env vars — so tests fail loudly on real bugs, not on missing preconditions. Use before a data-driven run or when a test skips/fails on absent setup.
---

# Seed & verify test data

Inspired by the toolkit's `test-data-generator` / `seed-generator`, aligned to
playwright-motadata's `sandbox-state-manager` (`.claude/agents/sandbox-state-manager.md`).
Goal: **declared state is present and verified before a test runs** — idempotent, skip-if-exists.

## When to use
- Before running `discovery_data_driven` against a live AIOps.
- When `reports/failures.json` shows a failure that is really a missing precondition.
- When a device row in `tests/data/discovery-devices.csv` skips for `missing env`.

## Procedure

1. **Read the matrix.** Parse `tests/data/discovery-devices.csv`. For each `run=yes` row, list the
   env vars it needs: `ip_env`, and (per `cred_type`) `user_env`/`pass_env`/`community_env`,
   plus `port_env`/`instance_env` when set.

2. **Check env.** Compare against the loaded `.env`. Report each row as `ready | missing: <vars>`.
   Never invent credentials — report the gap so the user fills `.env` (see `.env.example`).

3. **Verify reachability (optional, live).** For ready rows, confirm the target host resolves/pings
   before the UI flow wastes a 5-minute discovery timeout. Skip hosts that don't resolve and say so.

4. **Idempotency.** If a device/credential profile with the row's name already exists in AIOps,
   the flow must skip creation, not duplicate. Flag rows whose profile already exists.

5. **Report** a table: `key | category | subtype | state (ready/missing/exists) | note`. Do not
   mutate anything the user didn't authorize; propose the seed actions, then apply on confirmation.

## Rules
- Verify, don't assume. A test that runs on wrong state produces a false pass/fail.
- Seed is additive and reversible; never delete existing monitored devices to "clean" state.
