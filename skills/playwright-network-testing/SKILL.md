---
name: playwright-network-testing
description: Intercept, wait on, mock, and assert the ObserveOps AIOps REST calls behind discovery, policy, and alert flows — page.route / page.waitForResponse to turn slow SNMP/SSH provisioning and polling grids into deterministic tests without networkidle. Use to stabilise a data-driven discovery run, verify a policy POST payload, or reproduce a backend error state.
---

# Network testing the ObserveOps AIOps API

ObserveOps screens are thin over a REST/AIOps backend: discovery kicks off SNMP/SSH/WMI probes and
polls a Kendo grid, policy creation POSTs a config, alerts stream in. Timing on these is exactly
where tests flake. Instead of `waitForTimeout` or the forbidden `networkidle`, subscribe to the
**specific** request/response — a smart wait tied to the call that actually gates the UI. You can
also intercept to mock slow/destructive backends and to force error states you can't produce on the
shared env (172.16.15.156).

## When to use / When NOT

Use to: wait deterministically for a discovery/provision call before asserting a grid row; assert
the payload a "Create Policy" submit actually sends; mock an AIOps endpoint to reproduce a `500` /
empty "No data found" state; speed up a data-driven run by stubbing the slow probe. Do NOT mock the
call you are actually trying to prove works end-to-end — an E2E discovery test must hit the real
backend so it fails on real bugs (our "fail loudly on real bugs" rule); reserve mocking for error
paths and for tests where the backend is a dependency, not the subject.

## Patterns

### 1 — Wait on the real call instead of networkidle
```js
// Discovery: Save & Run fires the provision request; wait for IT, not a blind sleep.
const provision = page.waitForResponse(
  (r) => /discovery|provision/i.test(r.url()) && r.request().method() === 'POST',
  { timeout: 120_000 },
);
await page.locator('#save-run-btn-id').click();
const res = await provision;
expect(res.ok()).toBeTruthy();

// Now the grid is safe to read.
const row = page.locator('tr.k-master-row').filter({ hasText: process.env.DEVICE_IP });
await expect(row).toBeVisible();
```

### 2 — Assert a Create-Policy payload
```js
let body;
await page.route(/\/policy.*settings|\/policies/i, async (route) => {
  if (route.request().method() === 'POST') body = route.request().postDataJSON();
  await route.continue();                          // let the real backend handle it
});
await page.getByRole('button', { name: 'Create Policy' }).click();
// ... fill the unified policy form ...
await page.getByRole('button', { name: /save/i }).click();
await expect.poll(() => body?.name).toBe('CPU Utilization > 90');
expect(body.type).toBe('metric');
```

### 3 — Mock an error state you can't produce on the shared env
```js
// Force the alerts grid into a backend-failure state to verify the empty/error UI.
await page.route(/\/alert.*(list|search)/i, (route) =>
  route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"backend down"}' }),
);
await page.getByRole('link', { name: /Alerts/i }).click();
await expect(page.getByText(/No data found|something went wrong/i)).toBeVisible();
```

### 4 — Stub a slow probe to keep a data-driven matrix fast
```js
// tests/scenarios data-driven rows: stub the SNMP walk for rows tagged mock=yes in
// tests/data/discovery-devices.csv so the matrix exercises UI wiring without a live device.
if (row.mock === 'yes') {
  await page.route(/\/snmp\/walk|\/probe/i, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ sysName: row.expected_name, reachable: true }) }),
  );
}
```

### 5 — Capture the raw payload behind a screen for evidence
```js
const [resp] = await Promise.all([
  page.waitForResponse((r) => /dashboard.*widget|counter/i.test(r.url())),
  page.locator("svg[data-icon='plus']").first().click(),
]);
await testInfo.attach('widgets.json', {
  body: JSON.stringify(await resp.json(), null, 2), contentType: 'application/json',
});
```

## Rules & anti-patterns

- **Match calls by URL pattern + method**, not by array index into requests — AIOps screens fire
  many parallel polls.
- **`route.continue()` for observe-only**, `route.fulfill()` only to deliberately mock. Do not
  `continue` a route you meant to stub.
- **Never `waitForLoadState('networkidle')`** — polling grids never go idle. Wait on the one
  response that gates the assertion (matches the cookbook's "smart wait; never networkidle").
- **Unroute mocks you set** (or scope them to the row) so a stub for one CSV row doesn't leak into
  the next iteration of a data-driven scenario.
- **E2E ≠ mock.** If the ticket is "discovery provisions a monitor", hit the real backend; only mock
  the surrounding noise. Keep provenance: attach the real payload as report evidence.

Adapted from qaskills/seed-skills/playwright-network-testing
