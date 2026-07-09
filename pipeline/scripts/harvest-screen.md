# One-Time Cookbook Harvest

Procedure to pre-seed `cookbook/selector-cookbook.md` across the core Motadata screens, so future runs are mostly free lookups instead of live explorations.

Run via the `mt-locator-resolver` agent invoking the `motadata-explorer` skill. One screen per invocation keeps each context small.

## Core screens to harvest (priority order)

1. **Discovery Profile** + Create Credential drawer  ✅ seeded
2. **NCCM Explorer** (+ Conflict drawer, Compare modal)  ✅ seeded
3. **Runbook** (+ Assign Monitor drawer)  ✅ seeded
4. **Device Inventory** / Device Monitor Settings  — TODO
5. **Monitoring Settings** (hours, custom fields)  — TODO
6. **Integrations** (ServiceNow, Jira)  — TODO
7. **Dashboards** (per category)  — TODO

## Per-screen procedure

```
for screen in core_screens:
    explorer.login()
    explorer.navigate(screen)
    tree = page.accessibility.snapshot({ interestingOnly: true })
    for control in screen.expected_controls:
        candidate = rank(tree, control)           # role-first
        if count(candidate) > 1: candidate = scope(candidate)   # drawer/popover/row
        assert count(candidate) == 1               # VERIFY
        cookbook.append(screen, control, candidate, today)
```

## Acceptance

- Every harvested locator has `count()===1` proven.
- Every entry carries a `# verified YYYY-MM-DD` tag.
- Duplicated-control scopes carry a `scope_reason`.

## Cadence

- Re-harvest a screen when its Motadata build changes materially, or when the triager reports repeated locator-drift on it.
- The cookbook is append-only; supersede a stale entry by updating its locator + bumping the verified date.
