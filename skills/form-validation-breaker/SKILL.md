---
name: form-validation-breaker
description: Break ObserveOps create forms — Discovery profile and Policy wizards, Users/RBAC — with boundary, required-field, uniqueness, and IP/port payloads, per each screen doc's Validations section. Use to negative-test a form's client and server validation.
---

# Form-validation breaking for ObserveOps

ObserveOps create/edit flows are AntDesign forms in drawers with concrete, documented validation rules
in each screen doc's **§8 Validations**. Target the highest-value forms — **Create Discovery Profile**
and the **Policy** create wizards — plus **Users/RBAC** create. The goal: prove client-side rules are
enforced AND that the server independently rejects bad input when client rules are stripped.

## When to use
- Negative-testing a create/edit form against its screen doc §8 (required fields, uniqueness, IP/port formats).
- After a change to a validation rule, or when a customer bug reports accepted-but-invalid input.

## When NOT
- Don't run destructive injection against a shared live tenant without the `seed-data` skill's cleanup plan.
- Don't assert rules the screen doc marks `TODO(source: docs)` (e.g. exact port range) as if confirmed —
  probe and record, don't invent the expected boundary.

## Target forms and their documented rules (cite the docs)

### Create Discovery Profile — `knowledge/product/Settings/network-discovery/network-discovery-profiles-create.md` §8
- **Discovery Profile Name** — required, **must be unique** (field hint literally _"Must be unique"_,
  `input[name='profile-name']` / `#profile-id`). Test: blank → blocked; duplicate of an existing profile → blocked.
- **IP/Host** — required for host/network types; format hint _"e.g. 192.168.1.1 or fd00::1"_ (IPv4 + IPv6),
  `input[name='ip-address']`. Test malformed IPv4, bad IPv6, IP Range/CIDR/CSV malformed per mode.
- **Collector Type / Groups / Credential Profiles** — required (`*`); submit with each empty.
- **SNMP Port / Retry Count / SSH Port** — required numeric (defaults 161 / 2 / 22). Test non-numeric,
  negative, out-of-range (>65535), and the port-range TODO.
- **NCM toggle interaction** — turning NCM ON reveals **SSH Port + Telnet Port**; toggling OFF must not
  leave them required (edge case §11).

### Policy create wizards — `knowledge/product/Settings/policy-settings/{availability,metric,log,apm,flow,trap,...}.md`
- Required policy name/scope/threshold fields per each policy's §8; empty and boundary threshold values.

### Users/RBAC create — `knowledge/product/Settings/users-settings/user-profiles.md`, `roles.md`
- Username uniqueness ("Must be unique"), email format, password rules per `password-settings.md`,
  required role assignment.

## Procedure (ObserveOps-specific)
1. **Open the form** via `framework/playwright/flow.js` (avatar-visible login, smart wait); the form is a
   drawer — scope locators to `.ant-drawer-open` (cookbook convention), `count()===1`.
2. **Required-field sweep.** Submit (Save and Exit `#save-exit-btn-id` on Discovery) with each required
   field empty; assert an AntDesign field error (`.ant-form-item-explain-error`) and that no row is created.
3. **Uniqueness.** Seed a profile/user, then attempt a duplicate name; assert the "Must be unique" rejection.
4. **Format payloads.** For IP/Host and ports, drive the documented and malformed values; assert accept vs
   reject matches §8. For ports, include boundary (0, 1, 65535, 65536) and non-numeric.
5. **Client-bypass → server check.** Strip client attributes (`removeAttribute('required'/'pattern')`,
   set value via the native setter) and submit; assert the **server** still rejects (stay on form / API 4xx),
   and that no SQL/stack/internal detail leaks in the response or a toast.
6. **NCM/state-dependent fields.** Toggle NCM ON→OFF and confirm SSH/Telnet aren't required when hidden.
7. **Record** confirmed defects in the screen doc §8/§11 and, if it matches a real ticket pattern, cross-ref
   `knowledge/known_issues/customer-issue-kb.md`.

## Rules & anti-patterns
- Client validation is UX, not defense — always verify the server rejects the stripped-client submission.
- Test the boundary, not just the middle: blank / min-1 / min / max / max+1 / duplicate.
- Cite the screen doc §8 for every expected result; do not assert an unconfirmed TODO boundary as pass/fail —
  probe it and log the finding. Quarantine flaky forms; never mask with a skip.

Adapted from qaskills/seed-skills/form-validation-breaker.
