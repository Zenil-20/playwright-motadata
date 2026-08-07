---
key: LICENSE-01
title: Hardware-bound license integrity — invalidate gracefully, never corrupt config, always alert on expiry
modules: [Settings]
screens: [Settings/system-settings]
status: draft
sources: [kb]
verified: 2026-08-07
related_defects: []
gate_rule: null
---

# LICENSE-01 — Hardware-bound license integrity

## Rule
The product's license is bound to hardware identity (MAC/NIC/VM identity). When that identity changes
(NIC swap, VM re-provision, bonding change), the product must:
1. Detect the mismatch and surface an explicit **"invalid license key"** state — never a generic crash.
2. Never corrupt the underlying license/config files as a side effect of the mismatch.
3. Never let a license **expiry** silently halt polling — an expiry must raise a visible alert, not a
   quiet stop.

## Why
Root-cause theme #3 in `customer-issue-kb.md`: "hardware-bound licensing — any MAC/NIC/VM change
invalidates the HW key, corrupts license/config files and kills services; expiry silently halts
polling." Both the corruption and the silent-halt failure modes were customer-visible outages, not just
inconvenience.

## Test implications
- Simulate a MAC/NIC/VM identity change and reboot; assert an explicit "invalid license key" message,
  and that config files are unchanged/uncorrupted afterward (checksum or structural diff).
- Force a license to expire in a test environment; assert an alert fires and polling status is visibly
  flagged — not merely that data stops arriving.

## Related
[[DISCOVERY-01]]
