---
key: AGENT-01
title: Agent lifecycle cleanup — UI uninstall and HA re-registration must not leak resources
modules: [Settings]
screens: [Settings/system-settings]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: null
---

# AGENT-01 — Agent lifecycle cleanup

## Rule
- Deleting/uninstalling an agent from the **UI** without a corresponding endpoint uninstall must not
  leave behind a stale TCP connection storm or cause server-side OOM from accumulating dead
  connections.
- Re-registering an agent that is already bound to another HA node must be **rejected** or cleanly
  **reassigned** — never silently accepted into a dual-bound, inconsistent state.
- Upgrading an agent must preserve its poller-interval configuration in `agent.json` across the
  upgrade.

## Why
QA-implication #12 in `customer-issue-kb.md`, tying back to root-cause theme #9 (resource exhaustion &
leaks — "Go plugin process storms, stale agent connections").

## Test implications
- Delete an agent from the UI only (skip endpoint uninstall); monitor server connection count/memory
  and assert no unbounded growth.
- Attempt to re-register an agent already bound to another HA node; assert rejection or a clean,
  single-owner reassignment — never a dual-bound state.
- Upgrade an agent and diff `agent.json` poller intervals before/after; assert they're unchanged.

## Related
[[HA-01]]
